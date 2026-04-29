"""Tests for match expansion. Broad-match tests are skipped when the
embedding model isn't readily available; exact and phrase logic is
deterministic and always tested."""
from matching.exact import normalize, exact_match
from matching.phrase import phrase_match
from quality_score.text_utils import strip_diacritics


def test_normalize_strips_and_lowercases():
    assert normalize(" Vay  Du Tiec ") == "vay du tiec"


def test_strip_diacritics_handles_vietnamese():
    assert strip_diacritics("Váy Dự Tiệc") == "Vay Du Tiec"
    assert strip_diacritics("đầm dạ hội") == "dam da hoi"
    assert strip_diacritics("tiền vay nhanh") == "tien vay nhanh"


def test_normalize_folds_diacritics():
    """User can type with or without diacritics; both produce same key."""
    assert normalize("váy dự tiệc") == normalize("vay du tiec")
    assert normalize("đặt phòng khách sạn") == normalize("dat phong khach san")


def test_exact_match_simple():
    assert exact_match("vay du tiec", "VAY DU TIEC")
    assert not exact_match("vay du tiec", "vay du tiec gia re")


def test_exact_match_handles_diacritics_either_way():
    """A user typing without diacritics should still match a keyword
    stored with proper Vietnamese diacritics."""
    assert exact_match("vay du tiec", "váy dự tiệc")
    assert exact_match("VÁY DỰ TIỆC", "vay du tiec")


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
