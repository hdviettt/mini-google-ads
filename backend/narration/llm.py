"""LLM-driven auction narration. Wraps Groq + Llama 3.3 70B.

Uses the template narration as both the primary fallback and the
prompt skeleton: the LLM gets the template plus structured auction
facts and is asked to produce a polished Vietnamese paragraph.

If GROQ_API_KEY is unset or the request fails, returns the template
narration unchanged. The auction never depends on the LLM working."""
from __future__ import annotations
import json
from typing import Iterable

from config import GROQ_API_KEY
from models import AdRankLine
from .template import narrate_auction


GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MAX_TOKENS = 240
TEMPERATURE = 0.4


def _summarize_lines(lines: list[AdRankLine]) -> list[dict]:
    out = []
    for line in lines:
        out.append({
            "advertiser": line.advertiser_name,
            "match_type": line.match_type,
            "bid_vnd": int(round(line.bid)),
            "quality_score": round(line.quality_score, 1),
            "ad_rank": int(round(line.ad_rank)),
            "slot_position": (line.slot_position + 1) if line.slot_position is not None else None,
            "paid_cpc_vnd": int(round(line.paid_cpc)) if line.paid_cpc is not None else None,
            "bid_strategy": line.bid_strategy,
        })
    return out


def narrate_auction_llm(query: str, lines: Iterable[AdRankLine]) -> str:
    lines = list(lines)
    template_narration = narrate_auction(query, lines)
    if not GROQ_API_KEY:
        return template_narration
    if not lines:
        return template_narration

    facts = _summarize_lines(lines)

    system = (
        "Bạn là chuyên gia Google Ads. Giải thích kết quả đấu giá Google Ads bằng tiếng Việt "
        "có dấu đầy đủ, không dùng emoji, không dùng em-dash. 2 đến 4 câu. Tập trung vào: "
        "tại sao ai đó thắng (thường nhờ Quality Score), tại sao họ trả ít hơn bid (GSP), "
        "và Smart Bidding nếu có. Không dịch từ khóa và tên thương hiệu sang ngôn ngữ khác."
    )
    user = (
        f"Truy vấn: {query}\n"
        f"Kết quả đấu giá (sắp xếp theo Ad Rank giảm dần):\n"
        f"{json.dumps(facts, ensure_ascii=False, indent=2)}\n\n"
        f"Phong cách mẫu:\n{template_narration}\n\n"
        f"Hãy viết lại gợi mở và dễ hiểu hơn."
    )

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
    }

    try:
        import httpx
        with httpx.Client(timeout=15.0) as client:
            r = client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if r.status_code != 200:
                return template_narration
            data = r.json()
            content = data["choices"][0]["message"]["content"].strip()
            return content or template_narration
    except Exception:
        return template_narration
