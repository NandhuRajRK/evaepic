"""
Configuration constants for the LangGraph negotiation system.

Centralizes model configuration and other shared settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# This ensures config works even when imported directly (not just through main.py)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# ========== LLM Configuration ==========

# Default Claude model for all nodes
DEFAULT_MODEL = "claude-sonnet-4-5-20250929"

# Default temperature for deterministic outputs
DEFAULT_TEMPERATURE = 0

# Anthropic API Key (required for Claude)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in {"1", "true", "yes", "on"}

# ========== Vendor API Configuration ==========

# Vendor API base URL
NEGOTIATION_API_BASE = os.getenv(
    "NEGOTIATION_API_BASE",
    "https://negbot-backend-ajdxh9axb0ddb0e9.westeurope-01.azurewebsites.net/api"
)

# Team ID for vendor API (optional)
NEGOTIATION_TEAM_ID = os.getenv("NEGOTIATION_TEAM_ID")

# ========== Negotiation Configuration ==========

# Maximum negotiation rounds
MAX_NEGOTIATION_ROUNDS = int(os.getenv("MAX_NEGOTIATION_ROUNDS", "2"))

# Maximum vendors to process for now (temporary limit)
MAX_VENDORS_LIMIT = int(os.getenv("MAX_VENDORS_LIMIT", "2"))

# ========== Observability ==========

SENTRY_DSN = os.getenv("SENTRY_DSN")
SENTRY_ENVIRONMENT = os.getenv(
    "SENTRY_ENVIRONMENT",
    os.getenv("VERCEL_ENV", "development")
)

# ========== Pinecone Configuration ==========

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "vendors")
PINECONE_TOP_K = int(os.getenv("PINECONE_TOP_K", "5"))
PINECONE_EMBED_FIELD = os.getenv("PINECONE_EMBED_FIELD", "text")
PINECONE_EMBED_MODEL = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
