"""Combine exact + phrase + broad match results into a single list of
matches per query. Deduplicates per advertiser (one keyword per
advertiser per query) using priority: exact > phrase > broad."""
from __future__ import annotations

from .exact import find_exact_matches, normalize
from .phrase import phrase_match
from .broad import find_broad_matches


PRIORITY = {"exact": 3, "phrase": 2, "broad": 1}


def find_phrase_matches(conn, query: str) -> list[dict]:
    """Phrase match runs in Python over all phrase keywords. The
    keyword set is small so this is fine; for scale you'd index n-grams."""
    rows = conn.execute(
        """
        SELECT k.id AS keyword_id, k.text, k.match_type, k.max_cpc_bid,
               c.id AS campaign_id, c.bid_strategy, c.target_roas, c.target_cpa, c.daily_budget,
               a.id AS advertiser_id, a.name AS advertiser_name, a.vertical
        FROM keywords k
        JOIN campaigns c ON c.id = k.campaign_id
        JOIN advertisers a ON a.id = c.advertiser_id
        WHERE k.match_type = 'phrase'
        """,
    ).fetchall()
    out = []
    for r in rows:
        if phrase_match(query, r[1]):
            out.append({
                "keyword_id": r[0],
                "keyword_text": r[1],
                "match_type": "phrase",
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
    return out


def find_all_matches(conn, query: str, include_broad: bool = True) -> list[dict]:
    """Run all enabled match types. Dedupe by advertiser, keeping the
    highest-priority match (exact > phrase > broad). For ties within
    broad, keep the highest similarity."""
    candidates: list[dict] = []
    candidates.extend(find_exact_matches(conn, query))
    candidates.extend(find_phrase_matches(conn, query))
    if include_broad:
        try:
            candidates.extend(find_broad_matches(conn, query))
        except Exception:
            # If embeddings haven't been populated yet, broad is just empty
            pass

    by_advertiser: dict[int, dict] = {}
    for c in candidates:
        adv_id = c["advertiser_id"]
        existing = by_advertiser.get(adv_id)
        if existing is None:
            by_advertiser[adv_id] = c
            continue
        # Prefer higher priority match type
        if PRIORITY[c["match_type"]] > PRIORITY[existing["match_type"]]:
            by_advertiser[adv_id] = c
        elif PRIORITY[c["match_type"]] == PRIORITY[existing["match_type"]]:
            # Same priority: prefer higher similarity (broad) or first one (exact/phrase)
            if c["match_type"] == "broad":
                if c.get("similarity", 0) > existing.get("similarity", 0):
                    by_advertiser[adv_id] = c

    return list(by_advertiser.values())
