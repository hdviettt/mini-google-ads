"""Read-only endpoints to peek at recent rows. Powers the Explore tab
on the frontend so the user can see the underlying DB state."""
from __future__ import annotations
from fastapi import APIRouter

from db import get_connection

router = APIRouter(prefix="/explore", tags=["explore"])


@router.get("/recent-auctions")
def recent_auctions(limit: int = 30) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT au.id, q.text AS query, au.created_at,
                   COUNT(DISTINCT ar.advertiser_id) AS n_bidders,
                   COUNT(DISTINCT ar.advertiser_id) FILTER (WHERE ar.slot_position IS NOT NULL) AS n_slots,
                   u.intent_level
            FROM auctions au
            LEFT JOIN queries q ON q.id = au.query_id
            LEFT JOIN users u ON u.id = q.user_id
            LEFT JOIN ad_rank_results ar ON ar.auction_id = au.id
            GROUP BY au.id, q.text, au.created_at, u.intent_level
            ORDER BY au.created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": r[0], "query": r[1] or "—",
            "created_at": r[2].isoformat() if r[2] else None,
            "n_bidders": r[3], "n_slots": r[4],
            "intent_level": r[5] or "—",
        }
        for r in rows
    ]


@router.get("/recent-impressions")
def recent_impressions(limit: int = 30) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT imp.id, imp.created_at, imp.slot_position, imp.paid_cpc,
                   a.name AS advertiser, q.text AS query,
                   CASE WHEN cl.id IS NOT NULL THEN 1 ELSE 0 END AS clicked,
                   CASE WHEN cv.id IS NOT NULL THEN 1 ELSE 0 END AS converted
            FROM impressions imp
            JOIN advertisers a ON a.id = imp.advertiser_id
            JOIN auctions au ON au.id = imp.auction_id
            LEFT JOIN queries q ON q.id = au.query_id
            LEFT JOIN clicks cl ON cl.impression_id = imp.id
            LEFT JOIN conversions cv ON cv.click_id = cl.id
            ORDER BY imp.created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": r[0],
            "created_at": r[1].isoformat() if r[1] else None,
            "slot": r[2], "paid_cpc": float(r[3]) if r[3] is not None else 0.0,
            "advertiser": r[4], "query": r[5] or "—",
            "clicked": bool(r[6]), "converted": bool(r[7]),
        }
        for r in rows
    ]


@router.get("/recent-conversions")
def recent_conversions(limit: int = 30) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT cv.id, cv.created_at, cv.value_vnd,
                   a.name AS advertiser, q.text AS query, imp.paid_cpc
            FROM conversions cv
            JOIN clicks cl ON cl.id = cv.click_id
            JOIN impressions imp ON imp.id = cl.impression_id
            JOIN advertisers a ON a.id = imp.advertiser_id
            JOIN auctions au ON au.id = imp.auction_id
            LEFT JOIN queries q ON q.id = au.query_id
            ORDER BY cv.created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": r[0],
            "created_at": r[1].isoformat() if r[1] else None,
            "value_vnd": float(r[2]) if r[2] is not None else 0.0,
            "advertiser": r[3], "query": r[4] or "—",
            "paid_cpc": float(r[5]) if r[5] is not None else 0.0,
        }
        for r in rows
    ]


@router.get("/system-stats")
def system_stats() -> dict:
    """Expanded stats for the StatsRibbon."""
    from bidding.pcvr_model import is_trained, feature_importance
    with get_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM advertisers"); n_adv = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM keywords"); n_kw = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM keywords WHERE embedding IS NOT NULL"); n_kw_emb = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM ads"); n_ads = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM users"); n_users = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM auctions"); n_auc = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM impressions"); n_imp = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM clicks"); n_clk = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM conversions"); n_cv = c.fetchone()[0]
        c.execute("SELECT COALESCE(SUM(value_vnd),0) FROM conversions"); revenue = float(c.fetchone()[0])
        c.execute("SELECT COALESCE(SUM(imp.paid_cpc),0) FROM impressions imp JOIN clicks cl ON cl.impression_id=imp.id"); spend = float(c.fetchone()[0])
    ctr = (100.0 * n_clk / n_imp) if n_imp else 0.0
    cvr = (100.0 * n_cv / n_clk) if n_clk else 0.0
    roas = (revenue / spend) if spend else 0.0
    return {
        "advertisers": n_adv, "keywords": n_kw, "keywords_embedded": n_kw_emb,
        "ads": n_ads, "users": n_users,
        "auctions": n_auc, "impressions": n_imp, "clicks": n_clk, "conversions": n_cv,
        "spend_vnd": spend, "revenue_vnd": revenue,
        "ctr_pct": ctr, "cvr_pct": cvr, "roas": roas,
        "model_trained": is_trained(),
        "feature_importance_top": feature_importance()[:5],
    }
