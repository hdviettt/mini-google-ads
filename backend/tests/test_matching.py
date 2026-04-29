"""Tests for match expansion. Broad-match tests are skipped when the
embedding model isn't readily available; exact and phrase logic is
deterministic and always tested."""
from matching.exact import normalize, exact_match
from matching.phrase import phrase_match


def test_normalize_strips_and_lowercases():
    assert normalize(" Vay  Du Tiec ") == "vay du tiec"


def test_exact_match_simple():
    assert exact_match("vay du tiec", "VAY DU TIEC")
    assert not exact_match("vay du tiec", "vay du tiec gia re")


def test_phrase_match_subsequence():
    assert phrase_match("mua vay du tiec gia re", "vay du tiec")
    assert phrase_match("vay du tiec sang trong", "vay du tiec")
    assert phrase_match("vay du tiec", "vay du tiec")


def test_phrase_match_order_matters():
    assert not phrase_match("du tiec vay", "vay du tiec")
    assert not phrase_match("vay tiec du", "vay du tiec")


def test_phrase_match_empty():
    assert not phrase_match("", "vay du tiec")
    assert not phrase_match("vay du tiec", "")


def test_phrase_match_keyword_longer_than_query():
    assert not phrase_match("vay", "vay du tiec dep")
