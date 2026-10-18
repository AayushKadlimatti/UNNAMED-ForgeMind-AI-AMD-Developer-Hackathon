import pytest

from backend.arena_workflow.rag_engine import search_manual


@pytest.mark.parametrize("query,section", [
    ("bearing wear", "5.3"), ("excessive vibration", "5.3"), ("torque bolts", "5.3"),
    ("winding temperature", "7.1"), ("heat issue", "7.1"), ("cooling ducts", "7.1"),
    ("ventilation blockage", "7.1"), ("BEARINGS vibrating", "5.3"), ("overheating", "7.1"),
])
def test_relevant_queries(query, section):
    result = search_manual(query)
    assert result["matched"] is True
    assert section in result["matches"][0]["citation"]
    assert result["matches"][0]["score"] > 0
    assert result["matches"][0]["content"]
    assert result["is_sample"] is True
    assert "not verified" in result["disclaimer"]


@pytest.mark.parametrize("query", ["lunch menu", "network timeout", "earthquake", "heathen", "rebearing"])
def test_no_unconditional_fallback_or_substring_matching(query):
    result = search_manual(query)
    assert result["matched"] is False
    assert result["matches"] == []
    assert "No sample excerpt" in result["message"]


def test_multiple_matches_and_distinct_concept_scores():
    result = search_manual("bearing vibration torque cooling")
    assert len(result["matches"]) == 2
    assert result["matches"][0]["score"] == 3
    assert search_manual("bearing bearings bearing")["matches"][0]["score"] == 1


@pytest.mark.parametrize("query", ["", "  ", "x" * 1001, None])
def test_invalid_library_query(query):
    with pytest.raises(ValueError):
        search_manual(query)
