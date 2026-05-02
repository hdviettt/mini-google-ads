"use client";
import type { AuctionResponse } from "@/lib/api";
import { ChapterShell, ChapterProse, ChapterAction } from "./ChapterShell";
import { QueryBar } from "./QueryBar";
import { AdRankRace } from "@/components/charts/AdRankRace";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  auction: AuctionResponse | null;
  loading: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

export function Chapter3Winner({ query, onQueryChange, onSearch, auction, loading }: Props) {
  const lines = auction?.lines ?? [];
  const winners = lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined);
  const sorted = [...lines].sort((a, b) => b.ad_rank - a.ad_rank);
  const top = sorted[0];
  const runnerUp = sorted[1];

  // Find a bid-vs-QS contrast example
  let lowerBidWinsExample: { winner: typeof top; loser: typeof top } | null = null;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i].bid < sorted[j].bid) {
        lowerBidWinsExample = { winner: sorted[i], loser: sorted[j] };
        break;
      }
    }
    if (lowerBidWinsExample) break;
  }

  return (
    <ChapterShell
      chapterNum={3}
      title="Bid cao nhất chưa chắc thắng"
      subtitle="Google không xếp đơn thuần theo bid. Họ nhân bid với Quality Score để ra Ad Rank, rồi mới sắp xếp."
    >
      <QueryBar query={query} onQueryChange={onQueryChange} onSearch={onSearch} loading={loading} />

      {/* Hero: AdRank race */}
      <AdRankRace
        lines={lines}
        numSlots={Math.max(1, winners.length)}
        selectedAdvertiserId={null}
        onSelect={() => {}}
      />

      {/* Formula callout */}
      <div
        className="rounded-xl border border-[var(--border)] p-5 max-w-[640px]"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2 font-semibold">
          Công thức
        </div>
        <div className="text-[18px] tabular-nums" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
          <span className="text-[var(--text-muted)]">Ad Rank</span>{" "}
          <span className="text-[var(--text-dim)]">=</span>{" "}
          <span className="text-[var(--text)] font-semibold">Bid</span>{" "}
          <span className="text-[var(--text-dim)]">×</span>{" "}
          <span className="text-[var(--text)] font-semibold" style={{ color: "var(--ok)" }}>Quality Score</span>
        </div>
        <p className="text-[12px] text-[var(--text-dim)] mt-3 leading-relaxed">
          Bid cao 2× nhưng Quality Score nửa thì Ad Rank không đổi. Google muốn user click vào quảng cáo
          chất lượng cao, nên QS được nhân thẳng vào bid.
        </p>
      </div>

      <ChapterProse>
        {top && runnerUp && (
          <p>
            Trong đấu giá này, <strong>{top.advertiser_name}</strong> thắng vị trí 1 với Ad Rank{" "}
            <span className="tabular-nums">{fmt(top.ad_rank)}</span> ({fmt(top.bid)} đ × QS {top.quality_score.toFixed(1)}).
            {lowerBidWinsExample ? (
              <>
                {" "}Để ý: <strong>{lowerBidWinsExample.winner.advertiser_name}</strong> chỉ bid{" "}
                {fmt(lowerBidWinsExample.winner.bid)} đ — <em>thấp hơn</em> {lowerBidWinsExample.loser.advertiser_name}{" "}
                ({fmt(lowerBidWinsExample.loser.bid)} đ) — nhưng vẫn xếp cao hơn nhờ Quality Score{" "}
                {lowerBidWinsExample.winner.quality_score.toFixed(1)} so với {lowerBidWinsExample.loser.quality_score.toFixed(1)}.
              </>
            ) : null}
          </p>
        )}
        <p>
          Quality Score gồm 3 phần: <strong>predicted CTR</strong> (Google đoán user có click không),{" "}
          <strong>ad relevance</strong> (mẫu quảng cáo có khớp query không),{" "}
          <strong>landing page experience</strong> (trang đích load nhanh & nội dung khớp không).
          Càng cao thì càng rẻ và càng dễ thắng.
        </p>
      </ChapterProse>

      <ChapterAction>
        Hover từng bar trong race chart để thấy số chi tiết. Bar có 2 màu: phần xanh dương là{" "}
        <em>contribution của bid</em>, phần xanh lá là <em>QS boost</em> nhân lên trên đó.
      </ChapterAction>
    </ChapterShell>
  );
}
