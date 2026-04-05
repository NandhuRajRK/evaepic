"""
Deterministic fallback behavior for portfolio/demo deployments.
"""

from __future__ import annotations

import asyncio
import re
from typing import Any, AsyncIterator, Dict, List

from models.order import OrderObject, QuantityRange, Requirements

DEMO_VENDORS = [
    {
        "id": 1,
        "name": "ABC Corp",
        "description": "Reliable general supplier for office procurement.",
        "behavioral_prompt": "Competitive but straightforward. Values repeat business.",
        "is_predefined": True,
        "team_id": None,
        "documents": [],
        "category": ["general", "furniture", "office supplies"],
        "rating": 4.5,
        "relevant_product_id": "sku-office-1",
    },
    {
        "id": 2,
        "name": "Tech Solutions",
        "description": "Strong on electronics and fast commercial turnaround.",
        "behavioral_prompt": "Moves fast and responds well to benchmark pressure.",
        "is_predefined": True,
        "team_id": None,
        "documents": [],
        "category": ["electronics", "accessories"],
        "rating": 4.8,
        "relevant_product_id": "sku-tech-2",
    },
    {
        "id": 3,
        "name": "Premium Furniture",
        "description": "Higher-end furniture vendor with better delivery guarantees.",
        "behavioral_prompt": "Premium pricing, flexible on bundled value.",
        "is_predefined": True,
        "team_id": None,
        "documents": [],
        "category": ["furniture"],
        "rating": 4.9,
        "relevant_product_id": "sku-furn-3",
    },
]


def demo_mode_enabled() -> bool:
    return True


def infer_currency(text: str) -> str:
    if "€" in text or " eur" in text.lower():
        return "EUR"
    if "£" in text or " gbp" in text.lower():
        return "GBP"
    return "USD"


def extract_quantity(text: str) -> int:
    match = re.search(r"\b(\d{1,4})\b", text)
    return int(match.group(1)) if match else 10


def extract_budget(text: str, quantity: int) -> float:
    budget_match = re.search(r"[$€£]?\s?(\d+(?:[.,]\d+)?)\s*(k)?", text.lower())
    if budget_match:
        value = float(budget_match.group(1).replace(",", ""))
        if budget_match.group(2):
            value *= 1000
        if value > quantity:
            return value
    return float(quantity * 150)


def extract_item(text: str) -> str:
    cleaned = text.lower()
    cleaned = re.sub(r"[$€£]\s?\d+(?:[.,]\d+)?\s*k?", " ", cleaned)
    cleaned = re.sub(r"\b\d+\b", " ", cleaned)
    cleaned = re.sub(
        r"\b(need|find|source|get|buy|order|for|our|office|under|with|within|budget|please|quotes?|warranty|delivery|support)\b",
        " ",
        cleaned,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.")
    return cleaned.title() or "Office Equipment"


def extract_requirements(text: str) -> Requirements:
    requirement_keywords = [
        "warranty",
        "delivery",
        "ergonomic",
        "wireless",
        "standing",
        "monitor",
        "support",
    ]
    mandatory = [
        keyword
        for keyword in requirement_keywords
        if keyword in text.lower()
    ]
    return Requirements(mandatory=mandatory, optional=[])


def parse_order_text(text: str) -> OrderObject:
    quantity = extract_quantity(text)
    budget = extract_budget(text, quantity)

    return OrderObject(
        item=extract_item(text),
        quantity=QuantityRange(min=quantity, max=quantity, preferred=quantity),
        budget=budget,
        currency=infer_currency(text),
        requirements=extract_requirements(text),
        urgency=(
            "high"
            if any(token in text.lower() for token in ["asap", "urgent", "fast"])
            else "medium"
        ),
    )


def select_demo_vendors(order: Dict[str, Any]) -> List[Dict[str, Any]]:
    item = str(order.get("item", "")).lower()
    if any(keyword in item for keyword in ["desk", "chair", "furniture"]):
      return [DEMO_VENDORS[0], DEMO_VENDORS[2]]
    if any(keyword in item for keyword in ["keyboard", "webcam", "headphone", "cable"]):
      return [DEMO_VENDORS[0], DEMO_VENDORS[1]]
    return DEMO_VENDORS[:2]


def build_demo_final_report(order: Dict[str, Any], vendors: List[Dict[str, Any]]) -> Dict[str, Any]:
    quantity = order.get("quantity", {}).get("preferred", 1)
    budget = float(order.get("budget", 0) or 0)

    comparisons = []
    base_prices = {
        1: 132.0,
        2: 128.0,
        3: 146.0,
    }

    for rank, vendor in enumerate(vendors, start=1):
        unit_price = base_prices.get(vendor["id"], 140.0) - (rank * 2)
        total = round(unit_price * quantity, 2)
        comparisons.append(
            {
                "vendor_id": str(vendor["id"]),
                "vendor_name": vendor["name"],
                "final_offer": {
                    "vendor_name": vendor["name"],
                    "price_total": total,
                    "delivery_days": 10 + rank,
                    "payment_terms": "Net 30",
                    "status": "completed",
                    "final_offer_summary": f"{order.get('currency', 'USD')} {total} total with delivery in {10 + rank} days",
                },
                "rank": rank,
                "score": round(92 - rank * 4.5, 2),
                "delta_to_best": 0 if rank == 1 else round(total - comparisons[0]["final_offer"]["price_total"], 2),
                "status": "completed",
            }
        )

    best = comparisons[0]
    return {
        "recommended_vendor_id": best["vendor_id"],
        "recommended_vendor_name": best["vendor_name"],
        "recommendation_reason": (
            f"Best value option for {order.get('item')}. "
            f"Estimated total {best['final_offer']['price_total']} {order.get('currency', 'USD')}."
        ),
        "vendors": comparisons,
        "human_action": (
            "Use this shortlist to discuss real supplier quotes or enable live integrations for production data."
        ),
        "market_summary": (
            f"Demo mode compared {len(comparisons)} vendors against a budget of {budget} {order.get('currency', 'USD')}."
        ),
    }


async def stream_demo_negotiation(
    user_input: str,
    order_object: Dict[str, Any] | None,
) -> AsyncIterator[Dict[str, Any]]:
    order = order_object or parse_order_text(user_input).model_dump()
    vendors = select_demo_vendors(order)

    await asyncio.sleep(0.05)
    yield {
        "type": "progress",
        "message": f"Found {len(vendors)} portfolio demo vendors.",
        "payload": {
            "node": "fetch_vendors",
            "state_update": {
                "all_vendors": vendors,
                "phase": "filtering",
            },
        },
    }

    relevant_vendors = []
    for vendor in vendors:
        relevant_vendors.append(vendor)
        await asyncio.sleep(0.05)
        yield {
            "type": "progress",
            "message": "Evaluated vendor suitability.",
            "payload": {
                "node": "evaluate_vendor",
                "state_update": {
                    "relevant_vendors": [vendor],
                    "_evaluated_vendor_id": [vendor["id"]],
                },
            },
        }

    strategies = {
        str(vendor["id"]): {
            "vendor_name": vendor["name"],
            "strategy_name": "Benchmark-led negotiation",
        }
        for vendor in relevant_vendors
    }

    await asyncio.sleep(0.05)
    yield {
        "type": "progress",
        "message": "Generated negotiation strategy.",
        "payload": {
            "node": "generate_strategy",
            "state_update": {
                "vendor_strategies": strategies,
            },
        },
    }

    leaderboard = {}
    quantity = order.get("quantity", {}).get("preferred", 1)
    unit_prices = {
        str(vendor["id"]): 132 - (index * 4)
        for index, vendor in enumerate(relevant_vendors)
    }
    for vendor in relevant_vendors:
        vendor_id = str(vendor["id"])
        leaderboard[vendor_id] = {
            "vendor_name": vendor["name"],
            "price_total": round(unit_prices[vendor_id] * quantity, 2),
            "delivery_days": 9 + vendor["id"],
            "payment_terms": "Net 30",
            "status": "completed",
        }

    await asyncio.sleep(0.05)
    yield {
        "type": "progress",
        "message": "Negotiation round completed.",
        "payload": {
            "node": "negotiate",
            "state_update": {
                "leaderboard": leaderboard,
            },
        },
    }

    final_report = build_demo_final_report(order, relevant_vendors)
    best_price = final_report["vendors"][0]["final_offer"]["price_total"]
    prices = [vendor["final_offer"]["price_total"] for vendor in final_report["vendors"]]
    median_price = sorted(prices)[len(prices) // 2]

    await asyncio.sleep(0.05)
    yield {
        "type": "progress",
        "message": "Finalizing market analysis and reports.",
        "payload": {
            "node": "aggregator",
            "state_update": {
                "market_analysis": {
                    "round_index": 1,
                    "benchmarks": {
                        "best_price": best_price,
                        "median_price": median_price,
                        "spread_percent": round(((max(prices) - best_price) / best_price) * 100, 2) if best_price else 0,
                        "total_vendors": len(prices),
                    },
                    "rankings": [
                        {
                            "vendor_id": vendor["vendor_id"],
                            "vendor_name": vendor["vendor_name"],
                            "rank": vendor["rank"],
                            "score": vendor["score"],
                            "price": vendor["final_offer"]["price_total"],
                            "reason": vendor["recommendation_reason"] if "recommendation_reason" in vendor else "Competitive offer",
                        }
                        for vendor in final_report["vendors"]
                    ],
                    "vendor_overrides": {},
                    "summary": "Demo market scan complete.",
                },
                "final_comparison_report": final_report,
            },
        },
    }

    yield {
        "type": "complete",
        "payload": {
            "final_state": {
                "order_object": order,
                "all_vendors": vendors,
                "relevant_vendors": relevant_vendors,
                "vendor_strategies": strategies,
                "leaderboard": leaderboard,
                "final_comparison_report": final_report,
            }
        },
    }
