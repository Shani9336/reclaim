"""
Pydantic models for the FoundIt Matching Engine API.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ItemPayload(BaseModel):
    """Represents a lost or found item sent from the Next.js backend."""
    id: str
    title: str
    description: str
    category: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    tags: Optional[List[str]] = []
    date_lost: Optional[str] = None      # ISO 8601 string
    date_found: Optional[str] = None     # ISO 8601 string
    distinctive_features: Optional[str] = None

    class Config:
        str_strip_whitespace = True


class MatchRequest(BaseModel):
    """Request body for POST /match."""
    lost_item: ItemPayload = Field(..., description="The item to find matches for")
    found_items: List[ItemPayload] = Field(..., description="Candidate items to match against", max_length=200)
    top_k: int = Field(default=10, ge=1, le=50, description="Maximum number of results to return")
    threshold: float = Field(default=0.4, ge=0.0, le=1.0, description="Minimum score to include in results")


class MatchResult(BaseModel):
    """A single match result with score and reasoning breakdown."""
    found_item_id: str
    score: float = Field(..., ge=0.0, le=1.0, description="Composite similarity score")
    reasoning: Dict[str, float] = Field(..., description="Score breakdown: {text, category, color, date}")


class MatchResponse(BaseModel):
    """Response body for POST /match."""
    matches: List[MatchResult]
    total: int = 0

    def __init__(self, **data):
        super().__init__(**data)
        self.total = len(self.matches)


class HealthResponse(BaseModel):
    """Response body for GET /health."""
    status: str
    model: str
    model_loaded: bool


class EmbedRequest(BaseModel):
    """Request body for POST /embed."""
    text: str = Field(..., min_length=1, max_length=5000)
