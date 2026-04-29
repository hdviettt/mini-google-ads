export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type Advertiser = {
  id: number;
  name: string;
  vertical: string;
  daily_budget: number;
  campaign: {
    id: number;
    name: string;
    bid_strategy: string;
    target_roas: number | null;
    target_cpa: number | null;
    daily_budget: number | null;
  } | null;
  keyword_count: number;
  ad_count: number;
};

export type AdRankLine = {
  advertiser_id: number;
  advertiser_name: string;
  campaign_id: number;
  keyword_id: number;
  keyword_text: string;
  match_type: string;
  ad_id: number;
  ad_headline: string;
  bid: number;
  quality_score: number;
  pctr: number;
  ad_relevance: number;
  lp_experience: number;
  ad_rank: number;
  slot_position: number | null;
  paid_cpc: number | null;
};

export type AuctionResponse = {
  auction_id: number;
  query: string;
  matched_count: number;
  eligible_count: number;
  slot_count: number;
  lines: AdRankLine[];
  narration: string;
  time_ms: number;
};

export async function fetchAdvertisers(): Promise<Advertiser[]> {
  const r = await fetch(`${API_BASE}/advertisers`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function runAuction(
  query: string,
  options?: { user_id?: number; num_slots?: number; bid_overrides?: Record<number, number>; qs_overrides?: Record<number, number> },
): Promise<AuctionResponse> {
  const r = await fetch(`${API_BASE}/auction/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, ...options }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
