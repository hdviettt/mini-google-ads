from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import get_connection
from auction.engine import run_auction
from models import AuctionResponse

router = APIRouter(prefix="/auction", tags=["auction"])


class AuctionRunRequest(BaseModel):
    query: str
    user_id: int | None = None
    num_slots: int = 4
    bid_overrides: dict[int, float] | None = None
    qs_overrides: dict[int, float] | None = None
    persist: bool = True


@router.post("/run", response_model=AuctionResponse)
def run(req: AuctionRunRequest) -> AuctionResponse:
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is empty")
    if req.num_slots < 1 or req.num_slots > 10:
        raise HTTPException(status_code=400, detail="num_slots must be 1..10")
    with get_connection() as conn:
        return run_auction(
            conn,
            query=req.query,
            user_id=req.user_id,
            num_slots=req.num_slots,
            bid_overrides=req.bid_overrides or {},
            qs_overrides=req.qs_overrides or {},
            persist=req.persist,
        )
