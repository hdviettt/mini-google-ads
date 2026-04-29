"""String-template narration of an auction outcome. Phase 1.

Generates 2-4 sentences in Vietnamese (with English fallback) that
explain the most pedagogically interesting dynamic in this auction:

- Did a lower-bid advertiser win via Quality Score?
- Did the winner pay less than they bid (GSP)?
- Quality Score effect on CPC.

Phase 6 swaps the implementation for an LLM call (with this as fallback)."""
from __future__ import annotations
from typing import Iterable

from models import AdRankLine


def _vnd(amount: float | None) -> str:
    if amount is None:
        return "0 VND"
    return f"{int(round(amount)):,} VND".replace(",", ".")


def narrate_auction(query: str, lines: Iterable[AdRankLine]) -> str:
    lines = list(lines)
    if not lines:
        return f'Khong co quang cao nao khop voi truy van "{query}". Khong co dau gia.'

    winners = [l for l in lines if l.slot_position is not None]
    winners.sort(key=lambda l: l.slot_position or 0)

    if not winners:
        return (f'{len(lines)} quang cao khop voi truy van "{query}" '
                f'nhung khong ai vuot qua sang ngach gia toi thieu.')

    parts: list[str] = []
    parts.append(f'{len(lines)} quang cao tham gia dau gia cho "{query}", '
                 f'{len(winners)} thang slot hien thi.')

    top = winners[0]
    runner_up = winners[1] if len(winners) > 1 else None

    # Why the top won
    if runner_up and top.bid < runner_up.bid:
        parts.append(
            f'{top.advertiser_name} thang vi tri 1 voi gia bid chi {_vnd(top.bid)} '
            f'(thap hon {runner_up.advertiser_name} bid {_vnd(runner_up.bid)}) '
            f'nho Quality Score {top.quality_score:.1f} cao hon {runner_up.quality_score:.1f}. '
            f'Ad Rank cua ho {int(top.ad_rank):,} > {int(runner_up.ad_rank):,}.'
        ).replace(",", ".")
    else:
        parts.append(
            f'{top.advertiser_name} thang vi tri 1 voi Ad Rank {int(top.ad_rank):,} '
            f'(bid {_vnd(top.bid)} x QS {top.quality_score:.1f}).'.replace(",", ".")
        )

    # GSP savings for top winner
    if top.paid_cpc is not None and top.paid_cpc < top.bid:
        savings_pct = (1 - (top.paid_cpc / top.bid)) * 100 if top.bid else 0
        parts.append(
            f'Ho chi phai tra {_vnd(top.paid_cpc)} cho moi click, khong phai {_vnd(top.bid)} bid '
            f'(tiet kiem {savings_pct:.0f}%) vi GSP chi tinh phi du de vuot quang cao xep sau.'
        )

    return " ".join(parts)
