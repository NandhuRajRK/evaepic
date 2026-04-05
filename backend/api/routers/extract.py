from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from agents.config import ANTHROPIC_API_KEY, DEMO_MODE
from agents.demo_mode import parse_order_text

router = APIRouter()
logger = logging.getLogger(__name__)

class ExtractRequest(BaseModel):
    text: str

@router.post("/extract")
async def extract_order(request: ExtractRequest):
    """
    Extracts structured order data from natural language text.
    """
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text input is required")

        logger.info(f"Extracting order from text: {request.text[:50]}...")

        if DEMO_MODE or not ANTHROPIC_API_KEY:
            order = parse_order_text(request.text)
        else:
            from agents.nodes.extractor import OrderExtractorAgent
            agent = OrderExtractorAgent()
            order = agent.extract(request.text)
        
        logger.info(f"Successfully extracted order for: {order.item}")
        return order
        
    except Exception as e:
        if DEMO_MODE or not ANTHROPIC_API_KEY:
            order = parse_order_text(request.text)
            return order
        logger.error(f"Error extracting order: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
