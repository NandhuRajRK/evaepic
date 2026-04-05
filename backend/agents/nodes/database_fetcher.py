"""
Database Fetcher Node

Fetches vendors from external API.
"""

import logging
from typing import Dict, Any, List
from agents.utils.vendor_api import VendorAPIClient
from agents.config import NEGOTIATION_API_BASE, NEGOTIATION_TEAM_ID, MAX_VENDORS_LIMIT
from agents.utils.pinecone_vendor_index import (
    PineconeVendorIndex,
    build_order_search_text,
)

logger = logging.getLogger(__name__)


def validate_vendors(vendors: List[Dict[str, Any]]) -> bool:
    """
    Validates the fetched vendor list.
    
    Args:
        vendors: List of vendor dictionaries
        
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(vendors, list):
        logger.warning(f"Validation failed: vendors is not a list (got {type(vendors)})")
        return False
    
    # Check that we have at least some vendors
    if len(vendors) == 0:
        logger.warning("Validation warning: Empty vendor list")
        # Not a hard failure - might be legitimate
        return True
    
    # Validate that each vendor has required fields
    required_fields = ['id', 'name', 'description', 'behavioral_prompt']
    for vendor in vendors:
        if not isinstance(vendor, dict):
            logger.warning(f"Validation failed: vendor is not a dict (got {type(vendor)})")
            return False
        
        for field in required_fields:
            if field not in vendor:
                logger.warning(f"Validation failed: vendor missing required field '{field}'")
                return False
    
    return True


def fetch_vendors_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function that fetches vendors from external API.
    
    Reads NEGOTIATION_TEAM_ID from centralized config (optional) and calls
    the vendor API to retrieve all available vendors.
    
    Args:
        state: GraphState
        
    Returns:
        Dict with updated fields: all_vendors, phase
    """
    logger.info("[DATABASE_FETCHER] Starting vendor fetch")
    
    # Read team_id from centralized config (optional)
    team_id = None
    if NEGOTIATION_TEAM_ID:
        try:
            team_id = int(NEGOTIATION_TEAM_ID)
            logger.info(f"[DATABASE_FETCHER] Using team_id from config: {team_id}")
        except ValueError:
            logger.warning(f"[DATABASE_FETCHER] Invalid NEGOTIATION_TEAM_ID in config: {NEGOTIATION_TEAM_ID}, ignoring")
    else:
        logger.info("[DATABASE_FETCHER] No NEGOTIATION_TEAM_ID in config, fetching all vendors")
    
    try:
        # Initialize API client with centralized config
        client = VendorAPIClient(api_base_url=NEGOTIATION_API_BASE)
        
        # Fetch vendors from API
        vendors = client.get_all_vendors(team_id=team_id)

        order = state.get("order_object") or {}
        pinecone_index = PineconeVendorIndex()
        ranked_vendor_ids = pinecone_index.search_vendor_ids(build_order_search_text(order))

        if ranked_vendor_ids:
            vendor_lookup = {str(vendor["id"]): vendor for vendor in vendors}
            ranked_vendors = [
                vendor_lookup[vendor_id]
                for vendor_id in ranked_vendor_ids
                if vendor_id in vendor_lookup
            ]

            if ranked_vendors:
                vendors = ranked_vendors
                logger.info(
                    "[DATABASE_FETCHER] Ranked %s vendors with Pinecone before limiting",
                    len(vendors),
                )
        
        if MAX_VENDORS_LIMIT > 0:
            vendors = vendors[:MAX_VENDORS_LIMIT]
            logger.info(f"[DATABASE_FETCHER] Limited to {len(vendors)} vendors (MAX_VENDORS_LIMIT={MAX_VENDORS_LIMIT})")
        
        logger.info(f"[DATABASE_FETCHER] Retrieved {len(vendors)} vendors from API")
        
        # Validate the vendor data
        if not validate_vendors(vendors):
            logger.error(f"[DATABASE_FETCHER] Validation failed for vendor data")
            return {
                "phase": "filtering",
                "error": "Vendor data validation failed"
            }
        
        if len(vendors) == 0:
            logger.warning("[DATABASE_FETCHER] No vendors found - negotiation may not be possible")
        
        # Return updated state
        logger.info(f"[DATABASE_FETCHER] Successfully fetched and validated {len(vendors)} vendors")
        print(f"[DATABASE_FETCHER] ✓ Fetched {len(vendors)} vendors", flush=True)
        return {
            "all_vendors": vendors,
            "phase": "filtering"
        }
        
    except Exception as e:
        logger.error(f"[DATABASE_FETCHER] Error during vendor fetch: {e}")
        return {
            "phase": "filtering",
            "error": f"Vendor fetch failed: {str(e)}"
        }
