from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from agents.config import SENTRY_DSN, SENTRY_ENVIRONMENT, DEMO_MODE, ANTHROPIC_API_KEY

# Load environment variables
load_dotenv()

if SENTRY_DSN:
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=SENTRY_ENVIRONMENT,
            traces_sample_rate=1.0 if SENTRY_ENVIRONMENT == "development" else 0.2,
            send_default_pii=True,
        )
    except ModuleNotFoundError:
        pass

app = FastAPI(title="EvaEpic API")

from api.routers import negotiation, extract
app.include_router(negotiation.router, prefix="/negotiate", tags=["negotiation"])
app.include_router(extract.router, tags=["extract"])


# Configure CORS
configured_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=os.getenv(
        "CORS_ALLOW_ORIGIN_REGEX",
        r"https://.*\.vercel\.app",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to EvaEpic API",
        "mode": "demo" if DEMO_MODE or not ANTHROPIC_API_KEY else "live"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Backend is running successfully",
        "mode": "demo" if DEMO_MODE or not ANTHROPIC_API_KEY else "live"
    }


@app.get("/hello")
async def hello(name: str = "World"):
    """Sample endpoint with query parameter"""
    return {
        "message": f"Hello, {name}!",
        "from": "FastAPI Backend"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
