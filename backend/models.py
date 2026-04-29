from datetime import datetime
from pydantic import BaseModel, Field


class Advertiser(BaseModel):
    id: int
    name: str
    vertical: str
    daily_budget: float
    created_at: datetime


class Campaign(BaseModel):
    id: int
    advertiser_id: int
    name: str
    bid_strategy: str
    target_roas: float | None = None
    target_cpa: float | None = None
    daily_budget: float


class Keyword(BaseModel):
    id: int
    campaign_id: int
    text: str
    match_type: str
    max_cpc_bid: float


class Ad(BaseModel):
    id: int
    campaign_id: int
    headlines: list[str]
    descriptions: list[str]
    final_url: str
    lp_load_ms: int
    lp_content_score: float


class User(BaseModel):
    id: int
    intent_level: str
    geo: str
    device: str


# Auction request / response models

class AuctionRequest(BaseModel):
    query: str
    user_id: int | None = None
    num_slots: int = 4


class AdRankLine(BaseModel):
    advertiser_id: int
    advertiser_name: str
    campaign_id: int
    keyword_id: int
    keyword_text: str
    match_type: str
    ad_id: int
    ad_headline: str
    bid: float
    quality_score: float
    pctr: float
    ad_relevance: float
    lp_experience: float
    ad_rank: float
    slot_position: int | None = None
    paid_cpc: float | None = None


class AuctionResponse(BaseModel):
    auction_id: int
    query: str
    matched_count: int
    eligible_count: int
    slot_count: int
    lines: list[AdRankLine]
    narration: str = ""
    time_ms: float = 0.0
