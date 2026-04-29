"""Exact-match keyword lookup. Phase 3 implementation.

Phase 3: returns keywords with match_type='exact' that match the query
literally (after normalization). Phrase and broad live in their own
modules and are dispatched together by matching/dispatcher.py."""
from __future__ import annotations
import re

_WS_RE = re.compile(r"\s+")


def normalize(s: str) -> str:
    return _WS_RE.sub(" ", s.lower().strip())


def exact_match(query: str, keyword_text: str) -> bool:
    return normalize(query) == normalize(keyword_text)


def find_exact_matches(conn, query: str) -> list[dict]:
    """Return all keywords with match_type='exact' whose text equals the
    normalized query."""
    norm = normalize(query)
    rows = conn.execute(
        """
        SELECT k.id AS keyword_id, k.text, k.match_type, k.max_cpc_bid,
               c.id AS campaign_id, c.bid_strategy, c.target_roas, c.target_cpa, c.daily_budget,
               a.id AS advertiser_id, a.name AS advertiser_name, a.vertical
        FROM keywords k
        JOIN campaigns c ON c.id = k.campaign_id
        JOIN advertisers a ON a.id = c.advertiser_id
        WHERE k.match_type = 'exact' AND LOWER(TRIM(k.text)) = %s
        """,
        (norm,),
    ).fetchall()
    return [_row_to_match(r, "exact") for r in rows]


def _row_to_match(r, match_type: str) -> dict:
    return {
        "keyword_id": r[0],
        "keyword_text": r[1],
        "match_type": match_type,
        "max_cpc_bid": float(r[3]),
        "campaign_id": r[4],
        "bid_strategy": r[5],
        "target_roas": float(r[6]) if r[6] is not None else None,
        "target_cpa": float(r[7]) if r[7] is not None else None,
        "daily_budget": float(r[8]),
        "advertiser_id": r[9],
        "advertiser_name": r[10],
        "vertical": r[11],
    }


# Backward-compat alias used by Phase 1 callers. Keep matching code that
# referenced find_matching_keywords still working without churn.
def find_matching_keywords(conn, query: str) -> list[dict]:
    return find_exact_matches(conn, query)
