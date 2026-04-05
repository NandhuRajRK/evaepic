from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any
import logging
import json
import asyncio

from agents.config import ANTHROPIC_API_KEY, DEMO_MODE
from agents.demo_mode import stream_demo_negotiation

router = APIRouter()
logger = logging.getLogger(__name__)

class NegotiateRequest(BaseModel):
    user_input: str
    order_object: Dict[str, Any] | None = None
    max_rounds: int = Field(default=3, ge=1, le=6)


def build_initial_state(payload: NegotiateRequest) -> Dict[str, Any]:
    return {
        "user_input": payload.user_input,
        "webhook_url": None,
        "order_object": payload.order_object,
        "all_vendors": [],
        "relevant_vendors": [],
        "vendor_strategies": {},
        "negotiation_history": {},
        "leaderboard": {},
        "conversation_ids": {},
        "rounds_completed": 0,
        "max_rounds": payload.max_rounds,
        "market_analysis": None,
        "final_comparison_report": None,
        "phase": "starting",
        "error": None,
    }


def update_final_state(final_state: Dict[str, Any], state_update: Dict[str, Any]) -> None:
    merge_keys = {"vendor_strategies", "negotiation_history", "leaderboard", "conversation_ids"}
    append_keys = {"relevant_vendors"}

    for key, value in state_update.items():
        if key in merge_keys and isinstance(value, dict):
            final_state[key] = {**final_state.get(key, {}), **value}
        elif key in append_keys and isinstance(value, list):
            existing = final_state.get(key, [])
            seen = {str(item.get("id")) for item in existing if isinstance(item, dict)}

            for item in value:
                item_id = str(item.get("id")) if isinstance(item, dict) else None
                if item_id and item_id not in seen:
                    existing.append(item)
                    seen.add(item_id)

            final_state[key] = existing
        else:
            final_state[key] = value


def serialize(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def build_progress_message(node_name: str, state_update: Dict[str, Any]) -> str:
    if node_name == "extract_order":
        return "Order details extracted successfully."
    if node_name == "fetch_vendors":
        count = len(state_update.get("all_vendors", []))
        return f"Found {count} potential vendors in the database."
    if node_name == "evaluate_vendor":
        return "Evaluated vendor suitability."
    if node_name == "generate_strategy":
        return "Generated negotiation strategy."
    if node_name == "negotiate":
        return "Negotiation round completed."
    if node_name == "aggregator":
        return "Finalizing market analysis and reports."
    return f"Completed step: {node_name}"


def build_progress_events(event: Dict[str, Any], final_state: Dict[str, Any]) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []

    for node_name, raw_update in event.items():
        state_update = serialize(raw_update) if hasattr(raw_update, "model_dump") else raw_update
        update_final_state(final_state, state_update)
        messages.append(
            {
                "type": "progress",
                "message": build_progress_message(node_name, state_update),
                "payload": {
                    "node": node_name,
                    "state_update": state_update,
                },
            }
        )

    return messages


@router.post("/stream")
async def stream_negotiation(request: NegotiateRequest):
    if not request.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input is required")

    async def event_generator():
        if DEMO_MODE or not ANTHROPIC_API_KEY:
            async for message in stream_demo_negotiation(
                request.user_input,
                request.order_object,
            ):
                yield f"{json.dumps(message, default=serialize)}\n"
            return

        from agents.graph import app as graph_app
        initial_state = build_initial_state(request)
        final_state = dict(initial_state)

        try:
            logger.info("Starting graph execution stream over HTTP")

            if hasattr(graph_app, "astream"):
                async for event in graph_app.astream(initial_state):
                    for message in build_progress_events(event, final_state):
                        yield f"{json.dumps(message, default=serialize)}\n"
            else:
                for event in graph_app.stream(initial_state):
                    for message in build_progress_events(event, final_state):
                        yield f"{json.dumps(message, default=serialize)}\n"
                    await asyncio.sleep(0)

            yield f"{json.dumps({'type': 'complete', 'payload': {'final_state': final_state}}, default=serialize)}\n"
            logger.info("Graph execution stream completed")
        except Exception as exc:
            logger.error("Error in negotiation stream: %s", exc, exc_info=True)
            yield f"{json.dumps({'type': 'error', 'payload': {'message': str(exc)}})}\n"

    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
