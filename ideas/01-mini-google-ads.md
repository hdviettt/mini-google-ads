# Mini Google Ads with Smart Bidding ML

## Concept

Build a Google Ads stack from scratch — the auction, Quality Score, match types, Smart Bidding ML, and an optional Performance Max wrapper. Type a query, watch competing advertisers bid, see Ad Rank computed, GSP price the winners, slots allocated. The auction is the centerpiece; Smart Bidding and PMax sit on top.

## Ratings

| Ads depth | AI fit | Brand value | Scope | Business potential |
|:-:|:-:|:-:|:-:|:-:|
| ★★★★★ | ★★★★ | ★★★★★ | ★★★ | ★★ |

## What you'd build

- **Auction engine:** Ad Rank computation (bid × Quality Score × asset score), GSP pricing (pay minimum to beat next ranker), slot allocation
- **Quality Score:** predicted CTR (logistic regression on history) + ad relevance (text similarity) + landing page experience (simulated)
- **Match expansion:** exact (literal + close-variant), phrase (subsequence), broad (semantic via embeddings)
- **Smart Bidding ML:** LightGBM model predicting P(conversion | query, user signals), bid strategies for Manual CPC, Maximize Conversions, Target ROAS, Target CPA
- **Performance Max wrapper (optional):** multi-inventory budget allocation across simulated Search, Shopping, Display, YouTube buckets
- **React Flow canvas:** interactive node graph showing the auction running in real time, with detail panels on every node and live-tune playground sliders

## What you'd learn (Ads)

- How the GSP auction actually decides who wins and what they pay (bid is not what you pay)
- Why Quality Score directly cuts your CPC, not a vanity number
- Why a competitor with a lower bid can outrank you (Quality Score multiplies bid in Ad Rank)
- Why slot 1 is not always best ROI (slot 3 is often cheaper per conversion)
- How match types expand a query differently and where broad match's semantic risk comes from
- How Smart Bidding ML eats the daily-optimization labor that justifies agency % media fees
- Why Performance Max is a black box (and why Google pushes it: signal-volume game)

## Why it's strong

- The auction layer of Google Ads is what every Vietnamese marketer waves their hands at. Building it forces you to actually understand it.
- A working auction visualization does not exist anywhere on the public internet that lets you drag bid and Quality Score sliders and watch the winner change live. Strong shareable artifact.
- Direct strategic relevance to AI Leader scope at SEONGON: makes the agency-disruption story concrete. Smart Bidding ML disrupting daily-optimization labor is no longer abstract once you see the model deciding bids in real time.
- Foundation knowledge that makes every Performance/Ads conversation downstream more productive.

## Risks

- Scope creep around Performance Max realism. Mitigated by making Phase 5 explicitly optional.
- Smart Bidding model needs enough conversion data to be useful. Mitigated by synthetic data with controlled conversion rates per (advertiser, query) pair.
- React Flow canvas can lag with 8 to 12 advertisers. Mitigated by debounced sliders and virtualized off-screen nodes.

## Suggested scope

Ship Phase 1 (Auction MVP) within 2 weeks. That is the public hero artifact already. Phases 2 to 4 add depth across 3 to 5 more weeks. Phases 5 to 6 are upside if energy holds.

The personal-learning goal is met when four wrong-intuition demos all work on the canvas:

1. Bid 10k, pay 6k (GSP charges minimum to beat next ranker)
2. Lower bid wins via Quality Score multiplier
3. Quality Score 10 vs 5 cuts CPC meaningfully for the same slot
4. Slot 3 is cheaper per conversion than slot 1

Once those four work, the project has paid for itself even if later phases never ship.
