"""
Pinecone-backed vendor search helpers.

Keeps Pinecone optional so local development still works without a vector index.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Iterable, List

from pinecone import Pinecone

from agents.config import (
    PINECONE_API_KEY,
    PINECONE_EMBED_FIELD,
    PINECONE_INDEX_NAME,
    PINECONE_NAMESPACE,
    PINECONE_TOP_K,
)

logger = logging.getLogger(__name__)


def build_vendor_search_text(vendor: Dict[str, Any]) -> str:
    parts = [
        vendor.get("name"),
        vendor.get("description"),
        vendor.get("category"),
        vendor.get("behavioral_prompt"),
    ]
    return " | ".join(part for part in parts if part)


def build_order_search_text(order: Dict[str, Any]) -> str:
    quantity = order.get("quantity", {}).get("preferred")
    mandatory = ", ".join(order.get("requirements", {}).get("mandatory", []))
    optional = ", ".join(order.get("requirements", {}).get("optional", []))

    parts = [
        order.get("item"),
        f"quantity {quantity}" if quantity else None,
        f"budget {order.get('budget')}" if order.get("budget") else None,
        f"mandatory: {mandatory}" if mandatory else None,
        f"optional: {optional}" if optional else None,
        f"urgency {order.get('urgency')}" if order.get("urgency") else None,
    ]
    return " | ".join(part for part in parts if part)


class PineconeVendorIndex:
    def __init__(self) -> None:
        self.enabled = bool(PINECONE_API_KEY and PINECONE_INDEX_NAME)
        self.namespace = PINECONE_NAMESPACE
        self._index = None

        if not self.enabled:
            return

        try:
            client = Pinecone(api_key=PINECONE_API_KEY)
            self._index = client.Index(PINECONE_INDEX_NAME)
        except Exception as exc:
            logger.warning("[PINECONE] Failed to initialize vendor index: %s", exc)
            self.enabled = False

    def search_vendor_ids(self, query_text: str, top_k: int | None = None) -> List[str]:
        if not self.enabled or not self._index or not query_text.strip():
            return []

        try:
            results = self._index.search(
                namespace=self.namespace,
                query={
                    "top_k": top_k or PINECONE_TOP_K,
                    "inputs": {
                        PINECONE_EMBED_FIELD: query_text,
                    },
                },
            )
        except Exception as exc:
            logger.warning("[PINECONE] Vendor search failed, falling back to API list: %s", exc)
            return []

        hits = results.get("result", {}).get("hits", [])
        vendor_ids: List[str] = []

        for hit in hits:
            fields = hit.get("fields", {})
            vendor_id = fields.get("vendor_id") or hit.get("_id", "").replace("vendor:", "")
            if vendor_id:
                vendor_ids.append(str(vendor_id))

        return vendor_ids

    def upsert_vendors(self, vendors: Iterable[Dict[str, Any]]) -> int:
        if not self.enabled or not self._index:
            raise RuntimeError("Pinecone is not configured")

        records = []
        for vendor in vendors:
            vendor_id = vendor.get("id")
            if vendor_id is None:
                continue

            records.append(
                {
                    "_id": f"vendor:{vendor_id}",
                    PINECONE_EMBED_FIELD: build_vendor_search_text(vendor),
                    "vendor_id": str(vendor_id),
                    "name": vendor.get("name", ""),
                    "category": vendor.get("category", ""),
                }
            )

        if not records:
            return 0

        self._index.upsert_records(self.namespace, records)
        return len(records)
