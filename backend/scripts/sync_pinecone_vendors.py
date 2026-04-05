"""
Populate the Pinecone vendor index from the existing vendor API.
"""

from agents.config import (
    NEGOTIATION_API_BASE,
    NEGOTIATION_TEAM_ID,
    PINECONE_API_KEY,
    PINECONE_CLOUD,
    PINECONE_EMBED_FIELD,
    PINECONE_EMBED_MODEL,
    PINECONE_INDEX_NAME,
    PINECONE_REGION,
)
from agents.utils.pinecone_vendor_index import PineconeVendorIndex
from agents.utils.vendor_api import VendorAPIClient
from pinecone import Pinecone


def ensure_index() -> None:
    if not PINECONE_API_KEY or not PINECONE_INDEX_NAME:
        raise RuntimeError("PINECONE_API_KEY and PINECONE_INDEX_NAME are required")

    client = Pinecone(api_key=PINECONE_API_KEY)

    if client.has_index(PINECONE_INDEX_NAME):
        return

    client.create_index_for_model(
        name=PINECONE_INDEX_NAME,
        cloud=PINECONE_CLOUD,
        region=PINECONE_REGION,
        embed={
            "model": PINECONE_EMBED_MODEL,
            "field_map": {
                "text": PINECONE_EMBED_FIELD,
            },
        },
    )


def main() -> None:
    ensure_index()

    team_id = int(NEGOTIATION_TEAM_ID) if NEGOTIATION_TEAM_ID else None
    vendors = VendorAPIClient(api_base_url=NEGOTIATION_API_BASE).get_all_vendors(team_id=team_id)
    upserted = PineconeVendorIndex().upsert_vendors(vendors)

    print(f"Upserted {upserted} vendors into Pinecone")


if __name__ == "__main__":
    main()
