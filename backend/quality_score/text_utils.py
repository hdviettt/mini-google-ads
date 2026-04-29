"""Lightweight text utilities used by the Quality Score components.
Vietnamese-friendly: works whether or not the user types with diacritics.
Tokens are lowercased and stripped of diacritics, so 'váy dự tiệc' and
'vay du tiec' produce identical token sets."""
from __future__ import annotations
import re
import unicodedata

_TOKEN_RE = re.compile(r"[^\w]+", re.UNICODE)


def strip_diacritics(s: str) -> str:
    """Strip Vietnamese tone marks and diacritics. Also folds đ/Đ → d/D
    which NFKD does not decompose."""
    if not s:
        return s
    nfkd = unicodedata.normalize("NFKD", s)
    out = "".join(c for c in nfkd if not unicodedata.combining(c))
    return out.replace("đ", "d").replace("Đ", "D")


def tokenize(s: str) -> list[str]:
    if not s:
        return []
    parts = _TOKEN_RE.split(strip_diacritics(s).lower())
    return [p for p in parts if p]


def token_set(s: str) -> set[str]:
    return set(tokenize(s))


def jaccard(a: str, b: str) -> float:
    """Jaccard similarity between two text snippets, in [0, 1]."""
    sa, sb = token_set(a), token_set(b)
    if not sa or not sb:
        return 0.0
    inter = sa & sb
    union = sa | sb
    return len(inter) / len(union)


def coverage(query: str, doc: str) -> float:
    """Fraction of query tokens that appear in the doc, in [0, 1].
    More directional than Jaccard; better fit for "does ad copy contain
    the query?"."""
    qs = token_set(query)
    ds = token_set(doc)
    if not qs:
        return 0.0
    return len(qs & ds) / len(qs)
