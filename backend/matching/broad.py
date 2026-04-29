"""Broad match: semantic similarity using sentence-transformer embeddings
indexed in pgvector. Embeddings live on keywords.embedding."""
from __future__ import annotations

from .embedder import embed_text


# Cosine-similarity threshold. all-MiniLM-L6-v2 returns normalized vectors
# so cosine == dot product. 0.55 picks up reasonable semantic neighbors
# without flooding unrelated terms.
DEFAULT_BROAD_THRESHOLD = 0.55


def find_broad_matches(
    conn,
    query: str,
    threshold: float = DEFAULT_BROAD_THRESHOLD,
    top_k: int = 200,
) -> list[dict]:
    """Return broad-match keyword rows (only those flagged 'broad') whose
    embedding is similar enough to the query embedding.

    Output rows match the schema of matching.exact.find_matching_keywords
    so the dispatcher can merge them uniformly."""
    qvec = embed_text(query)

    # pgvector's <=> is cosine distance (1 - cosine_similarity).
    # similarity threshold 0.55 -> distance threshold 0.45
    distance_threshold = 1.0 - threshold

    rows = conn.execute(
        f"""
        SELECT k.id AS keyword_id, k.text, k.match_type, k.max_cpc_bid,
               c.id AS campaign_id, c.bid_strategy, c.target_roas, c.target_cpa, c.daily_budget,
               a.id AS advertiser_id, a.name AS advertiser_name, a.vertical,
               1 - (k.embedding <=> %s::vector) AS similarity
        FROM keywords k
        JOIN campaigns c ON c.id = k.campaign_id
        JOIN advertisers a ON a.id = c.advertiser_id
        WHERE k.match_type = 'broad'
          AND k.embedding IS NOT NULL
          AND (k.embedding <=> %s::vector) <= %s
        ORDER BY similarity DESC
        LIMIT %s
        """,
        (qvec, qvec, distance_threshold, top_k),
    ).fetchall()

    out = []
    for r in rows:
        out.append({
            "keyword_id": r[0],
            "keyword_text": r[1],
            "match_type": "broad",
            "max_cpc_bid": float(r[3]),
            "campaign_id": r[4],
            "bid_strategy": r[5],
            "target_roas": float(r[6]) if r[6] is not None else None,
            "target_cpa": float(r[7]) if r[7] is not None else None,
            "daily_budget": float(r[8]),
            "advertiser_id": r[9],
            "advertiser_name": r[10],
            "vertical": r[11],
            "similarity": float(r[12]),
        })
    return out
