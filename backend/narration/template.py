"""String-template narration of an auction outcome (Vietnamese with
proper diacritics). Highlights the most pedagogically interesting
dynamic in this auction: lower bid winning via QS, GSP saving on the
top winner, no eligible advertisers, etc.

Phase 6 swaps the LLM in front of this and falls back here on failure."""
from __future__ import annotations
from typing import Iterable

from models import AdRankLine


def _vnd(amount: float | None) -> str:
    if amount is None:
        return "0 đ"
    return f"{int(round(amount)):,} đ".replace(",", ".")


def narrate_auction(query: str, lines: Iterable[AdRankLine]) -> str:
    lines = list(lines)
    if not lines:
        return f'Không có quảng cáo nào khớp với truy vấn "{query}". Không có đấu giá.'

    winners = [l for l in lines if l.slot_position is not None]
    winners.sort(key=lambda l: l.slot_position or 0)

    if not winners:
        return (f'{len(lines)} quảng cáo khớp với truy vấn "{query}" '
                f'nhưng không ai vượt qua ngưỡng giá tối thiểu.')

    parts: list[str] = []
    parts.append(
        f'{len(lines)} quảng cáo tham gia đấu giá cho "{query}", '
        f'{len(winners)} thắng slot hiển thị.'
    )

    top = winners[0]
    runner_up = winners[1] if len(winners) > 1 else None

    # Why the top won
    if runner_up and top.bid < runner_up.bid:
        parts.append((
            f'{top.advertiser_name} thắng vị trí 1 với giá bid chỉ {_vnd(top.bid)} '
            f'(thấp hơn {runner_up.advertiser_name} bid {_vnd(runner_up.bid)}) '
            f'nhờ Quality Score {top.quality_score:.1f} cao hơn {runner_up.quality_score:.1f}. '
            f'Ad Rank của họ {int(top.ad_rank):,} > {int(runner_up.ad_rank):,}.'
        ).replace(",", "."))
    else:
        parts.append((
            f'{top.advertiser_name} thắng vị trí 1 với Ad Rank {int(top.ad_rank):,} '
            f'(bid {_vnd(top.bid)} × QS {top.quality_score:.1f}).'
        ).replace(",", "."))

    # GSP savings for top winner
    if top.paid_cpc is not None and top.paid_cpc < top.bid:
        savings_pct = (1 - (top.paid_cpc / top.bid)) * 100 if top.bid else 0
        parts.append(
            f'Họ chỉ phải trả {_vnd(top.paid_cpc)} cho mỗi click, không phải {_vnd(top.bid)} bid '
            f'(tiết kiệm {savings_pct:.0f}%) vì GSP chỉ tính phí đủ để vượt quảng cáo xếp sau.'
        )

    return " ".join(parts)
