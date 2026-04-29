"""Exact-match keyword lookup. Phase 1 implementation:
literal match plus simple normalization (lowercase, strip whitespace,
collapse repeated spaces). Phase 3 adds phrase + broad."""
from __future__ import annotations
import re

_WS_RE = re.compile(r"\s+")


def normalize(s: str) -> str:
    return _WS_RE.sub(" ", s.lower().strip())


def exact_match(query: str, keyword_text: str) -> bool:
    return normalize(query) == normalize(keyword_text)


def find_matching_keywords(conn, query: str) -> list[dict]:
    """Return all keywords (with advertiser/campaign/ad context) whose
    text matches the query. Phase 1 only does exact match: keyword
    rows with match_type 'phrase' and 'broad' are also matched if their
    text is exactly equal to the query (so seed data still produces
    results before Phase 3 lands).
    """
    norm = normalize(query)
    rows = conn.execute(
        """
        SELECT k.id AS keyword_id, k.text, k.match_type, k.max_cpc_bid,
               c.id AS campaign_id, c.bid_strategy, c.target_roas, c.target_cpa, c.daily_budget,
               a.id AS advertiser_id, a.name AS advertiser_name, a.vertical
        FROM keywords k
        JOIN campaigns c ON c.id = k.campaign_id
        JOIN advertisers a ON a.id = c.advertiser_id
        WHERE LOWER(TRIM(k.text)) = %s
        """,
        (norm,),
    ).fetchall()
    matches = []
    for r in rows:
        matches.append({
            "keyword_id": r[0],
            "keyword_text": r[1],
            "match_type": "exact",  # always treat as exact in phase 1
            "max_cpc_bid": float(r[3]),
            "campaign_id": r[4],
            "bid_strategy": r[5],
            "target_roas": float(r[6]) if r[6] is not None else None,
            "target_cpa": float(r[7]) if r[7] is not None else None,
            "daily_budget": float(r[8]),
            "advertiser_id": r[9],
            "advertiser_name": r[10],
            "vertical": r[11],
        })
    return matches
