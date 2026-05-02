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
  ad_description: string;
  final_url: string;
  bid: number;
  quality_score: number;
  pctr: number;
  ad_relevance: number;
  lp_experience: number;
  ad_rank: number;
  slot_position: number | null;
  paid_cpc: number | null;
  bid_strategy: string;
  predicted_pcvr: number;
  strategy_reason: string;
};

export type SimulationStats = {
  queries: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend_vnd: number;
  revenue_vnd: number;
  ctr_pct: number;
  cvr_pct: number;
  roas: number;
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
  options?: {
    user_id?: number | null;
    num_slots?: number;
    bid_overrides?: Record<number, number>;
    qs_overrides?: Record<number, number>;
  },
): Promise<AuctionResponse> {
  const r = await fetch(`${API_BASE}/auction/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, ...options }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function runSimulation(n: number, seed = 42): Promise<SimulationStats> {
  const r = await fetch(`${API_BASE}/simulate/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ n, seed }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchSimulationStats() {
  const r = await fetch(`${API_BASE}/simulate/stats`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export type SystemStats = {
  advertisers: number;
  keywords: number;
  keywords_embedded: number;
  ads: number;
  users: number;
  auctions: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend_vnd: number;
  revenue_vnd: number;
  ctr_pct: number;
  cvr_pct: number;
  roas: number;
  model_trained: boolean;
  feature_importance_top: { feature: string; importance: number }[];
};

export async function fetchSystemStats(): Promise<SystemStats> {
  const r = await fetch(`${API_BASE}/explore/system-stats`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchRecentAuctions(limit = 30) {
  const r = await fetch(`${API_BASE}/explore/recent-auctions?limit=${limit}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchRecentImpressions(limit = 30) {
  const r = await fetch(`${API_BASE}/explore/recent-impressions?limit=${limit}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchRecentConversions(limit = 30) {
  const r = await fetch(`${API_BASE}/explore/recent-conversions?limit=${limit}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
