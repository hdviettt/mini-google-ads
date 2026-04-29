"""Simulation + training endpoints. Useful as a button on the UI:
"run 500 queries", "train Smart Bidding model"."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import get_connection
from simulation.runner import run_simulation
from bidding.pcvr_model import is_trained, feature_importance


router = APIRouter(prefix="/simulate", tags=["simulation"])


class SimulationRequest(BaseModel):
    n: int = 500
    seed: int = 42


class SimulationStats(BaseModel):
    queries: int
    impressions: int
    clicks: int
    conversions: int
    spend_vnd: float
    revenue_vnd: float
    ctr_pct: float
    cvr_pct: float
    roas: float


@router.post("/run", response_model=SimulationStats)
def run(req: SimulationRequest) -> SimulationStats:
    if req.n < 1 or req.n > 50_000:
        raise HTTPException(status_code=400, detail="n must be 1..50000")
    with get_connection() as conn:
        result = run_simulation(conn, n_queries=req.n, seed=req.seed)
    ctr = (100.0 * result.clicks / result.impressions) if result.impressions else 0.0
    cvr = (100.0 * result.conversions / result.clicks) if result.clicks else 0.0
    roas = (result.total_revenue_vnd / result.total_spend_vnd) if result.total_spend_vnd else 0.0
    return SimulationStats(
        queries=result.queries,
        impressions=result.impressions,
        clicks=result.clicks,
        conversions=result.conversions,
        spend_vnd=result.total_spend_vnd,
        revenue_vnd=result.total_revenue_vnd,
        ctr_pct=ctr,
        cvr_pct=cvr,
        roas=roas,
    )


@router.get("/stats")
def stats() -> dict:
    with get_connection() as conn:
        impressions = conn.execute("SELECT COUNT(*) FROM impressions").fetchone()[0]
        clicks = conn.execute("SELECT COUNT(*) FROM clicks").fetchone()[0]
        conversions = conn.execute("SELECT COUNT(*) FROM conversions").fetchone()[0]
        revenue = conn.execute("SELECT COALESCE(SUM(value_vnd), 0) FROM conversions").fetchone()[0]
        spend = conn.execute("SELECT COALESCE(SUM(paid_cpc), 0) FROM impressions imp "
                              "JOIN clicks cl ON cl.impression_id = imp.id").fetchone()[0]
    return {
        "impressions": impressions,
        "clicks": clicks,
        "conversions": conversions,
        "revenue_vnd": float(revenue),
        "spend_vnd": float(spend),
        "model_trained": is_trained(),
        "feature_importance": [
            {"feature": f, "importance": v}
            for f, v in feature_importance()
        ],
    }
