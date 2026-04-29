"""Ad Relevance: how well the ad copy matches the query intent.
Looks at headlines (mostly) and descriptions (lightly), plus a bonus
when the keyword text itself is contained in the headline."""
from __future__ import annotations

from .text_utils import coverage, token_set


def compute_ad_relevance(
    query: str,
    keyword_text: str,
    headlines: list[str],
    descriptions: list[str],
) -> float:
    """Return ad relevance in [1, 10]."""
    if not headlines and not descriptions:
        return 3.0  # below average

    head_cov = max((coverage(query, h) for h in headlines if h), default=0.0)
    desc_cov = max((coverage(query, d) for d in descriptions if d), default=0.0)

    # Keyword echo: does any headline contain the keyword tokens?
    kw_tokens = token_set(keyword_text)
    kw_in_head = 0.0
    if kw_tokens:
        for h in headlines:
            ht = token_set(h)
            if kw_tokens.issubset(ht):
                kw_in_head = 1.0
                break
            elif ht & kw_tokens:
                kw_in_head = max(kw_in_head, len(ht & kw_tokens) / len(kw_tokens))

    # Weighted combination
    raw = 0.55 * head_cov + 0.20 * desc_cov + 0.25 * kw_in_head
    score = 1.0 + 9.0 * raw  # 0..1 -> 1..10
    return max(1.0, min(10.0, score))
