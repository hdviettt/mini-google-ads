"""Phrase match: keyword tokens must appear as a contiguous subsequence
of the query tokens, in order. Order matters."""
from __future__ import annotations

from quality_score.text_utils import tokenize


def phrase_match(query: str, keyword: str) -> bool:
    """True iff keyword tokens form a contiguous run inside query tokens."""
    q = tokenize(query)
    k = tokenize(keyword)
    if not k:
        return False
    if len(k) > len(q):
        return False
    for i in range(len(q) - len(k) + 1):
        if q[i:i + len(k)] == k:
            return True
    return False
