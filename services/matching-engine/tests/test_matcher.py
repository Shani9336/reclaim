"""
Unit tests for the FoundIt Matching Engine.

Run with: pytest tests/ -v

Viva explanation:
  "We test the matcher algorithm in isolation using pytest.
   Tests cover: exact matches, partial matches, zero matches,
   color group mapping, date proximity scoring, and edge cases
   like missing fields. We use a CPU-only model for fast CI runs."
"""

import pytest
from matcher import ItemMatcher, color_similarity, date_proximity, build_text, get_color_group
from models import ItemPayload


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def matcher():
    """Load matcher once for all tests in this module."""
    return ItemMatcher()


def make_item(**kwargs) -> ItemPayload:
    """Helper to create test items with sensible defaults."""
    defaults = {
        "id": "test-id",
        "title": "Test Item",
        "description": "A test item for unit testing",
        "category": "ELECTRONICS",
        "color": None,
        "brand": None,
        "tags": [],
        "date_lost": None,
        "date_found": None,
        "distinctive_features": None,
    }
    defaults.update(kwargs)
    return ItemPayload(**defaults)


# ── Color similarity tests ────────────────────────────────────────────────────

class TestColorSimilarity:
    def test_identical_colors(self):
        assert color_similarity("black", "black") == 1.0

    def test_same_color_group(self):
        """'dark blue' and 'navy' should be in the same blue group."""
        assert color_similarity("dark blue", "navy") == 1.0

    def test_different_color_groups(self):
        score = color_similarity("red", "blue")
        assert score < 0.5

    def test_none_colors_return_neutral(self):
        """Missing color should return 0.5 (neutral) — don't penalize."""
        assert color_similarity(None, "black") == 0.5
        assert color_similarity("black", None) == 0.5
        assert color_similarity(None, None) == 0.5

    def test_grey_gray_same_group(self):
        assert color_similarity("grey", "gray") == 1.0

    def test_white_cream_same_group(self):
        assert color_similarity("white", "cream") == 1.0


# ── Date proximity tests ──────────────────────────────────────────────────────

class TestDateProximity:
    def test_same_day(self):
        assert date_proximity("2024-09-10T00:00:00Z", "2024-09-10T00:00:00Z") == 1.0

    def test_one_day_apart(self):
        score = date_proximity("2024-09-10T00:00:00Z", "2024-09-11T00:00:00Z")
        assert score >= 0.90

    def test_within_week(self):
        score = date_proximity("2024-09-10T00:00:00Z", "2024-09-14T00:00:00Z")
        assert 0.60 <= score <= 0.90

    def test_over_month_apart(self):
        score = date_proximity("2024-09-10T00:00:00Z", "2024-11-10T00:00:00Z")
        assert score <= 0.20

    def test_missing_dates_return_neutral(self):
        assert date_proximity(None, "2024-09-10T00:00:00Z") == 0.5
        assert date_proximity(None, None) == 0.5

    def test_invalid_date_format_returns_neutral(self):
        assert date_proximity("not-a-date", "2024-09-10T00:00:00Z") == 0.5


# ── Text building tests ───────────────────────────────────────────────────────

class TestBuildText:
    def test_combines_all_fields(self):
        item = make_item(
            title="iPhone",
            description="black smartphone",
            color="black",
            brand="Apple",
            category="ELECTRONICS",
            tags=["phone", "mobile"],
        )
        text = build_text(item)
        assert "iPhone" in text
        assert "black" in text
        assert "Apple" in text
        assert "phone" in text

    def test_handles_missing_fields(self):
        item = make_item(title="Keys", description="House keys")
        text = build_text(item)
        assert "Keys" in text
        assert "House keys" in text

    def test_distinctive_features_included(self):
        item = make_item(
            title="Wallet",
            description="Black leather wallet",
            distinctive_features="Initials B.S. embossed inside",
        )
        text = build_text(item)
        assert "Initials B.S." in text


# ── Full matching tests ───────────────────────────────────────────────────────

class TestItemMatcher:
    def test_high_score_for_identical_items(self, matcher):
        """Identical descriptions should score very high."""
        query = make_item(
            id="lost-1",
            title="Black iPhone 15 Pro Max with blue case",
            description="Lost my iPhone near the university canteen. Has a cracked screen protector.",
            category="ELECTRONICS",
            color="black",
            date_lost="2024-09-10T00:00:00Z",
        )
        candidate = make_item(
            id="found-1",
            title="Found black iPhone with blue protective case",
            description="Found an iPhone near the canteen. The screen protector is cracked.",
            category="ELECTRONICS",
            color="black",
            date_found="2024-09-10T00:00:00Z",
        )
        results = matcher.match(query, [candidate], top_k=5)
        assert len(results) == 1
        assert results[0].score >= 0.75

    def test_different_categories_score_lower(self, matcher):
        """Category mismatch should significantly reduce score."""
        query = make_item(
            id="lost-2",
            title="Lost iPhone",
            description="Lost my black iPhone near the mall",
            category="ELECTRONICS",
        )
        candidate = make_item(
            id="found-2",
            title="Found black wallet",
            description="Found a black item near the mall",
            category="WALLET",
        )
        results = matcher.match(query, [candidate], threshold=0.0)
        assert len(results) == 1
        assert results[0].score < 0.8

    def test_empty_candidates_returns_empty(self, matcher):
        query = make_item(id="lost-3", title="Lost keys", description="Lost my house keys")
        results = matcher.match(query, [], top_k=5)
        assert results == []

    def test_top_k_limit_respected(self, matcher):
        """Should return at most top_k results."""
        query = make_item(
            id="lost-4",
            title="Lost black bag",
            description="Lost my black backpack near the campus",
            category="BAGS",
        )
        candidates = [
            make_item(
                id=f"found-{i}",
                title=f"Found black item {i}",
                description="Found a black bag near the university",
                category="BAGS",
            )
            for i in range(20)
        ]
        results = matcher.match(query, candidates, top_k=5)
        assert len(results) <= 5

    def test_results_sorted_by_score_descending(self, matcher):
        """Results should be in descending score order."""
        query = make_item(
            id="lost-5",
            title="Lost iPhone",
            description="Lost my iPhone 15 Pro Max with blue case near the canteen",
            category="ELECTRONICS",
            color="black",
        )
        candidates = [
            make_item(
                id="found-match",
                title="Found iPhone 15 Pro Max",
                description="Found an iPhone with blue case near the university canteen",
                category="ELECTRONICS",
                color="black",
            ),
            make_item(
                id="found-weak",
                title="Found some item",
                description="Found something near a building",
                category="OTHER",
                color="green",
            ),
        ]
        results = matcher.match(query, candidates, top_k=5, threshold=0.0)
        if len(results) >= 2:
            assert results[0].score >= results[1].score

    def test_reasoning_breakdown_present(self, matcher):
        """Each result should include a reasoning dict with all keys."""
        query = make_item(
            id="lost-6",
            title="Lost wallet",
            description="Black leather wallet lost near food court",
            category="WALLET",
        )
        candidate = make_item(
            id="found-6",
            title="Found wallet",
            description="Found a black leather wallet in the food court",
            category="WALLET",
        )
        results = matcher.match(query, [candidate])
        assert len(results) > 0
        reasoning = results[0].reasoning
        assert "text" in reasoning
        assert "category" in reasoning
        assert "color" in reasoning
        assert "date" in reasoning

    def test_threshold_filters_low_scores(self, matcher):
        """Items below threshold should not appear in results."""
        query = make_item(
            id="lost-7",
            title="Lost keys",
            description="Lost my house keys with red keychain",
            category="KEYS",
        )
        candidate = make_item(
            id="found-7",
            title="Found laptop",
            description="Found a MacBook Pro near the library",
            category="ELECTRONICS",
            color="silver",
        )
        results = matcher.match(query, [candidate], threshold=0.9)
        assert len(results) == 0


# ── Color group tests ─────────────────────────────────────────────────────────

class TestGetColorGroup:
    def test_black_group(self):
        assert get_color_group("black") == "black"
        assert get_color_group("charcoal") == "black"

    def test_blue_group(self):
        assert get_color_group("navy") == "blue"
        assert get_color_group("dark blue") == "blue"
        assert get_color_group("royal blue") == "blue"

    def test_unknown_color_returns_as_is(self):
        result = get_color_group("ultraviolet")
        assert result == "ultraviolet"
