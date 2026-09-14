"""
ItemMatcher — Core Matching Logic
===================================
Computes a composite similarity score between item pairs.

Score Weights (tuned empirically):
  text       50% — Semantic similarity of title + description + features
  category   20% — Exact category match (binary)
  color      15% — Color name similarity (fuzzy)
  date       15% — Temporal proximity of lost/found dates

Viva talking points:
  - "We use cosine similarity on 384-dim sentence embeddings, not dot-product,
     because cosine is scale-invariant — it measures angle, not magnitude."
  - "We combine multiple signals because text alone is insufficient: two items
     can have identical descriptions but different colors."
  - "The weights (50/20/15/15) were chosen because text is the most informative
     signal but also the noisiest. Category and color are cheap and high-precision."
"""

import logging
import numpy as np
from datetime import datetime
from difflib import SequenceMatcher
from typing import List, Optional

from sentence_transformers import SentenceTransformer
from models import ItemPayload, MatchResult

logger = logging.getLogger(__name__)

# Pre-built color similarity groups
COLOR_GROUPS = {
    "black": ["black", "charcoal", "dark", "ebony", "onyx", "jet"],
    "white": ["white", "cream", "ivory", "pearl", "snow", "off-white"],
    "blue": ["blue", "navy", "indigo", "cobalt", "azure", "royal blue", "light blue", "dark blue", "midnight blue"],
    "red": ["red", "crimson", "scarlet", "maroon", "ruby", "wine"],
    "green": ["green", "olive", "teal", "emerald", "lime", "sage", "forest green"],
    "yellow": ["yellow", "gold", "amber", "lemon", "mustard"],
    "brown": ["brown", "tan", "beige", "khaki", "chocolate", "coffee", "bronze"],
    "grey": ["grey", "gray", "silver", "slate", "charcoal"],
    "pink": ["pink", "rose", "salmon", "fuchsia", "magenta"],
    "purple": ["purple", "violet", "lavender", "lilac", "mauve"],
    "orange": ["orange", "coral", "peach", "burnt orange"],
}


def get_color_group(color: str) -> Optional[str]:
    """Return the canonical color group for a given color name."""
    color_lower = color.lower().strip()
    for group, variants in COLOR_GROUPS.items():
        if any(v in color_lower or color_lower in v for v in variants):
            return group
    return color_lower  # Return as-is if no group found


def color_similarity(c1: Optional[str], c2: Optional[str]) -> float:
    """Compute similarity between two color descriptions."""
    if not c1 or not c2:
        return 0.5  # Neutral score — no information, can't penalize
    g1 = get_color_group(c1)
    g2 = get_color_group(c2)
    if g1 == g2:
        return 1.0
    # Partial match using sequence matcher (handles "dark blue" vs "blue")
    return SequenceMatcher(None, c1.lower(), c2.lower()).ratio() * 0.5


def date_proximity(d1: Optional[str], d2: Optional[str]) -> float:
    """
    Score based on how close the lost and found dates are.
    Items found within 7 days of being lost score highest.
    """
    if not d1 or not d2:
        return 0.5  # Neutral — no date info available

    try:
        dt1 = datetime.fromisoformat(d1.replace("Z", "+00:00")).replace(tzinfo=None)
        dt2 = datetime.fromisoformat(d2.replace("Z", "+00:00")).replace(tzinfo=None)
        days_diff = abs((dt1 - dt2).days)

        if days_diff == 0:
            return 1.0
        elif days_diff <= 1:
            return 0.95
        elif days_diff <= 3:
            return 0.85
        elif days_diff <= 7:
            return 0.70
        elif days_diff <= 14:
            return 0.50
        elif days_diff <= 30:
            return 0.25
        else:
            return 0.10
    except (ValueError, TypeError):
        return 0.5


def build_text(item: ItemPayload) -> str:
    """
    Combine all text fields into a single string for embedding.
    Order matters — title is most important, so it comes first.
    """
    parts = [
        item.title or "",
        item.description or "",
        item.distinctive_features or "",
        f"color {item.color}" if item.color else "",
        f"brand {item.brand}" if item.brand else "",
        f"category {item.category}" if item.category else "",
        " ".join(item.tags or []),
    ]
    return " ".join(p.strip() for p in parts if p.strip())


class ItemMatcher:
    """
    Loads sentence-transformer model and provides match() and embed_text() methods.

    The model is loaded once at startup (via FastAPI lifespan) and reused
    across all requests — loading takes ~3-5s on CPU but inference is ~80ms.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        logger.info(f"Loading model: {model_name}")
        self.model = SentenceTransformer(model_name)
        logger.info("Model ready.")

    def embed_text(self, text: str) -> np.ndarray:
        """Embed a single text string into a 384-dim vector."""
        return self.model.encode(text, normalize_embeddings=True)

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """Embed a list of texts in one forward pass (more efficient than loop)."""
        return self.model.encode(texts, normalize_embeddings=True, batch_size=32)

    def cosine_sim(self, a: np.ndarray, b: np.ndarray) -> float:
        """Cosine similarity between two unit-normalized vectors (just dot product)."""
        return float(np.dot(a, b))

    def match(
        self,
        query_item: ItemPayload,
        candidate_items: List[ItemPayload],
        top_k: int = 10,
        threshold: float = 0.4,
    ) -> List[MatchResult]:
        """
        Score all candidates against the query item and return top-k results.

        Steps:
          1. Build text for query and all candidates
          2. Batch-encode all texts in one pass (efficient)
          3. Compute cosine similarity for all pairs
          4. Add category, color, date signals
          5. Compute weighted composite score
          6. Filter by threshold and sort by score
        """
        if not candidate_items:
            return []

        # Build text representations
        query_text = build_text(query_item)
        candidate_texts = [build_text(c) for c in candidate_items]

        # Batch encode: [1 + N] texts in one shot
        all_texts = [query_text] + candidate_texts
        all_embeddings = self.embed_batch(all_texts)

        query_embedding = all_embeddings[0]
        candidate_embeddings = all_embeddings[1:]

        results = []
        for i, candidate in enumerate(candidate_items):
            # ── Text similarity (cosine) ──────────────────────────────────────
            text_score = self.cosine_sim(query_embedding, candidate_embeddings[i])
            # Normalize from [-1,1] to [0,1] (embeddings are normalized so range is [0,1])
            text_score = max(0.0, text_score)

            # ── Category match (exact) ────────────────────────────────────────
            cat_score = 1.0 if (
                query_item.category and
                candidate.category and
                query_item.category.upper() == candidate.category.upper()
            ) else 0.0

            # ── Color similarity ──────────────────────────────────────────────
            col_score = color_similarity(query_item.color, candidate.color)

            # ── Date proximity ────────────────────────────────────────────────
            d1 = query_item.date_lost or query_item.date_found
            d2 = candidate.date_lost or candidate.date_found
            date_score = date_proximity(d1, d2)

            # ── Composite weighted score ──────────────────────────────────────
            final_score = (
                0.50 * text_score +
                0.20 * cat_score +
                0.15 * col_score +
                0.15 * date_score
            )

            if final_score >= threshold:
                results.append(MatchResult(
                    found_item_id=candidate.id,
                    score=round(final_score, 4),
                    reasoning={
                        "text": round(text_score, 4),
                        "category": round(cat_score, 4),
                        "color": round(col_score, 4),
                        "date": round(date_score, 4),
                    }
                ))

        # Sort by score descending, return top_k
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]
