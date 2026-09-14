"""
FoundIt Matching Engine — FastAPI Service
==========================================
Computes semantic similarity between lost and found item reports.

Algorithm:
  Final Score = 0.50 × text_similarity
              + 0.20 × category_match
              + 0.15 × color_similarity
              + 0.15 × date_proximity

Text similarity uses sentence-transformers (all-MiniLM-L6-v2).
All-MiniLM-L6-v2 is a 22M parameter model that produces 384-dim embeddings.
It runs well on CPU with ~80ms inference per pair.

Viva explanation:
  "We chose sentence-transformers because traditional keyword search (TF-IDF)
   fails when users describe the same item differently. For example, 'mobile phone'
   vs 'smartphone' have zero lexical overlap but high semantic similarity.
   Sentence-transformers encode both into dense vectors in a shared embedding space,
   so cosine similarity captures meaning, not just words."
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import MatchRequest, MatchResponse, HealthResponse, EmbedRequest, EmbedResponse
from matcher import ItemMatcher

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Global matcher instance (loaded once at startup)
matcher: ItemMatcher = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, release on shutdown."""
    global matcher
    logger.info("Loading sentence-transformer model...")
    matcher = ItemMatcher()
    logger.info(f"Model loaded: {matcher.model_name}")
    yield
    logger.info("Shutting down matching engine.")


app = FastAPI(
    title="FoundIt Matching Engine",
    description="AI-powered lost-and-found item matching using sentence-transformers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY", "dev-secret-key")


def verify_api_key(x_api_key: str = Header(default=None)):
    """Simple API key auth to prevent unauthorized access."""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health endpoint for Railway / Render monitoring."""
    return HealthResponse(
        status="ok",
        model=matcher.model_name if matcher else "not_loaded",
        model_loaded=matcher is not None,
    )


@app.post("/match", response_model=MatchResponse, dependencies=[Depends(verify_api_key)])
async def match_items(request: MatchRequest):
    """
    Given a lost/found item, find and score the top matching items
    from the provided candidates list.

    Returns ranked matches with score (0-1) and reasoning breakdown.
    """
    if not matcher:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        matches = matcher.match(
            query_item=request.lost_item,
            candidate_items=request.found_items,
            top_k=request.top_k,
        )
        return MatchResponse(matches=matches)
    except Exception as e:
        logger.error(f"Matching error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed", dependencies=[Depends(verify_api_key)])
async def embed_text(request: EmbedRequest):
    """
    Compute and return a text embedding vector.
    Used to pre-cache embeddings for items in the DB.
    """
    if not matcher:
        raise HTTPException(status_code=503, detail="Model not loaded")
    try:
        embedding = matcher.embed_text(request.text)
        return {"embedding": embedding.tolist(), "dimensions": len(embedding)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        log_level="info",
    )
