# Mini Google Ads: Implementation Plan

## Goal

A working from-scratch mini Google Ads stack, centered on the auction, that demystifies how Google decides who wins and what they pay. Public artifact, primarily for learning. Mirrors the pedagogical approach of `/projects/search-engine`.

## Centerpiece decision

**The auction is the centerpiece.** Three reasons:

1. Everything else (Quality Score, Smart Bidding, Performance Max) is downstream of the auction. Without it, those concepts have nothing to attach to.
2. It has the highest density of wrong-intuition correction. Most marketers get GSP, Quality Score multiplication, and slot economics wrong.
3. It is the durable layer. Quality Score formulas change, bidding strategies get rebranded, ad formats die. The auction (Ad Rank + GSP) has been stable since 2002.

Smart Bidding sits on top of the auction as Layer 2. Performance Max sits on top as Layer 3 (optional).

## Phases

Each phase is independently shippable. The phase ends when the listed Demo State works on the public canvas.

### Phase 0: Scaffold (week 0 to week 1)

**Goal:** repo, schema, synthetic data, project moves.

- Repo init, project skeleton (`backend/`, `frontend/`)
- Postgres schema: `advertisers`, `campaigns`, `keywords`, `ads`, `users`, `queries`, `auctions`, `impressions`, `clicks`, `conversions`
- FastAPI scaffold with health check
- Next.js scaffold with empty React Flow canvas
- Seed script: 8 to 12 advertisers across 3 verticals (apparel, finance, travel), 50 to 100 keywords each, 3 to 5 ads per campaign
- Synthetic user generator: 500 simulated users with intent profiles

**Demo state:** advertisers visible in the database, canvas loads, API health check returns 200.

### Phase 1: Auction MVP (week 1 to week 2) — centerpiece

**Goal:** working auction. Type a query, see Ad Rank computed for matching advertisers, GSP price the winners, slots allocated.

- `matching/exact.py` — literal keyword match
- `quality_score/baseline.py` — flat 5/10 baseline (full QS depth in Phase 2)
- `auction/ad_rank.py` — Ad Rank = bid × QS × asset_score (asset score = 1.0 baseline)
- `auction/gsp.py` — Generalized Second Price: pay the minimum to beat the next ranker, with reserve price floor
- `auction/slot_allocation.py` — top N by Ad Rank, N configurable (default 4)
- `api/auction.py` — POST `/auction/run` with query, returns slot allocation + Ad Rank breakdown + GSP prices
- React Flow canvas: query node → match node → ad rank node (one per advertiser) → GSP node → slot node
- Click any node to see real numbers in detail panel
- Playground: bid slider per advertiser, watch slot reorder live
- `narration/template.py` — string-template explanations of every auction outcome ("Advertiser B won with Ad Rank 7.1 vs your 6.4. They paid 4.2k, not their 6k bid, because GSP charges them the minimum to beat the next ranker.") This ships in Phase 1 so the public hero artifact is comprehensible from day one.

**Demo state:** the auction visualization. This is the public artifact's hero moment. Type "running shoes," see four advertisers compete, see who wins and pays what, read a plain-language explanation of why, drag a bid slider, watch the order change and the explanation update.

### Phase 2: Quality Score depth (week 2 to week 3)

**Goal:** Quality Score becomes a real signal with three components, not a flat 5/10.

- `quality_score/pctr.py` — logistic regression on (advertiser, keyword) historical CTR
- `quality_score/ad_relevance.py` — text similarity (cosine) between query, keyword, ad copy headlines
- `quality_score/lp_experience.py` — simulated load time + content match against query
- `quality_score/aggregate.py` — combine into 1 to 10 score
- Detail panel: Quality Score breakdown per advertiser per keyword
- Playground: edit ad copy, watch ad relevance update, see Ad Rank shift

**Demo state:** drag QS slider, watch winner change. Edit an ad's copy, watch ad relevance update and Ad Rank recompute.

### Phase 3: Match types (week 3)

**Goal:** keywords expand to queries differently depending on match type.

- `matching/exact.py` — literal + close-variant (plurals, misspellings via Levenshtein)
- `matching/phrase.py` — subsequence match
- `matching/broad.py` — semantic similarity using pgvector + voyage-3-lite embeddings
- Visualization: query → expanded matches with type tags, eligible advertisers per type

**Demo state:** type "running shoes," see broad-match advertisers picked up by "athletic footwear" and "marathon gear" via embedding similarity.

### Phase 4: Smart Bidding ML (week 4 to week 5)

**Goal:** ML model decides per-query bid based on predicted conversion probability.

- `tracking/conversion_logger.py` — log conversions during simulation runs
- `bidding/features.py` — extract query features (intent, keyword cluster, user signal) into a feature row
- `bidding/pcvr_model.py` — LightGBM model predicting P(conversion | features)
- `bidding/strategy.py` — bid strategies: Manual CPC, Maximize Conversions, Target ROAS, Target CPA
- Train script: replay logged conversions, fit pCVR model, persist
- API: same auction endpoint, but advertisers using Smart Bidding now have bid computed at auction time
- Visualization: bid trace per query showing how the model decided this bid (top features that pushed it up or down)

**Demo state:** same query repeated across three different users with different signal strength, watch the same advertiser bid 8k VND, 12k VND, 22k VND. Click the bid node to see which features drove the difference.

This phase is the AI Leader payoff. It makes the agency-disruption story concrete.

### Phase 5: Performance Max (week 6) — optional

**Goal:** multi-inventory wrapper showing why PMax is a black box.

- Inventory buckets: Search, Shopping, Display, YouTube (each with synthetic CPM, CTR, CVR characteristics)
- Asset-based ads: advertiser provides headline pool + description pool + image pool, system assembles
- Channel allocation: Smart Bidding decides budget split based on predicted conversion value per inventory
- Visualization: budget flowing across channels in real time, showing how more conversion data tightens the allocation

**Demo state:** PMax campaign with 100k VND budget, 4 channels, watch ML reroute spend toward Search when Search conversions outperform Display.

### Phase 6: Public polish (week 6 to week 7)

**Goal:** ship as a public artifact people will share.

- `narration/llm.py` — upgrade narration from string-template to Groq + Llama 3.3 70B. Generates richer, more natural Vietnamese and English explanations. Falls back to template narration on Groq failure.
- Landing page with guided demo flow ("type this query, watch this happen")
- Documentation pages for each pipeline stage
- One-page write-up: "How Google Ads actually decides who wins"
- Performance pass on the canvas (debounce sliders, lazy-load detail panels)
- Deploy to Railway, custom domain
- README polish + demo gif

**Demo state:** shareable URL, one-click guided tour that hits the four wrong-intuition demos in 90 seconds, with LLM-generated narration that reads naturally in Vietnamese.

## Tech stack rationale

Mirroring `/projects/search-engine` so there is no new tooling to learn:

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js + React Flow + Tailwind | Same as search-engine, canvas is the visualization spine |
| Backend | FastAPI + Python | Same as search-engine, ML libraries live in Python |
| Database | Postgres + pgvector | Same as search-engine, pgvector for broad-match keyword embeddings |
| ML | scikit-learn + LightGBM | LightGBM is what real ad-tech uses for tabular pCVR prediction. scikit-learn handles the simpler logistic regression for pCTR |
| Embeddings | Local sentence-transformers (`all-MiniLM-L6-v2`) | Only ~1k to 5k short keyword strings to embed. Local CPU is faster, no API key, lower friction for run-it-yourself |
| LLM Narration | Groq + Llama 3.3 70B | Translates auction math into plain-language explanations. Same Groq integration as search-engine, can be lifted directly |
| Hosting | Railway | Same as search-engine, deploy script can be cloned |

## What is explicitly out of scope

- Real ad inventory or real money. Everything is simulated.
- Mobile apps and YouTube TrueView. Display and YouTube only as PMax buckets in Phase 5.
- Real-time bidding (RTB) for the broader programmatic ecosystem. This is Google Ads only.
- Brand safety, fraud detection, click fraud heuristics. Mention only.
- Compliance, policy enforcement, ad disapproval flows. Mention only.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Scope creep around Performance Max black-box realism | Phase 5 is optional. Ship Phase 1 to 4 first. |
| Smart Bidding model needs lots of conversion data to be useful | Synthetic data with controlled conversion rates per (advertiser, query) pair, generated at scale |
| React Flow canvas becomes laggy at 8 to 12 advertisers | Debounce playground sliders, batch node updates, virtualize off-screen nodes |
| Auction logic mixes Generalized First Price vs Generalized Second Price confusion | Document the GSP math in `auction/gsp.py` as the source of truth, link from README |

## Definition of done

The project is "done enough to share publicly" after Phase 4. Phase 5 (Performance Max) and Phase 6 (polish) are upside.

The personal-learning goal is met when the four wrong-intuition demos all work on the canvas:

- Bid 10k, pay 6k (GSP)
- Lower bid wins via Quality Score multiplier
- Quality Score 10 vs 5 cuts CPC for the same slot
- Slot 3 is cheaper per conversion than Slot 1

Once those four demos work, the project has paid for itself even if Phase 5 and Phase 6 never ship.
