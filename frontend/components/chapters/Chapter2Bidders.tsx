"use client";
import type { AuctionResponse, AdRankLine } from "@/lib/api";
import { ChapterShell, ChapterProse, ChapterAction } from "./ChapterShell";
import { QueryBar } from "./QueryBar";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  auction: AuctionResponse | null;
  loading: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

export function Chapter2Bidders({ query, onQueryChange, onSearch, auction, loading }: Props) {
  const lines = auction?.lines ?? [];
  const sorted = [...lines].sort((a, b) => b.ad_rank - a.ad_rank);

  return (
    <ChapterShell
      chapterNum={2}
      title="Đằng sau cái SERP, có một cuộc đấu giá"
      subtitle={`Cho query "${query}", có ${lines.length} nhãn hàng đang đấu giá. Mỗi nhãn đăng ký từ trước: từ khóa họ muốn nhắm, mức bid, mẫu quảng cáo.`}
    >
      <QueryBar query={query} onQueryChange={onQueryChange} onSearch={onSearch} loading={loading} />

      {/* Hero: bidder list */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--separator)] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--text)]">
            {lines.length} nhãn hàng đang đấu giá
          </span>
          <span className="text-[10.5px] text-[var(--text-dim)]" style={{ fontFamily: "ui-monospace, monospace" }}>
            sorted by ad rank ↓
          </span>
        </div>
        <div className="divide-y divide-[var(--separator)]">
          {sorted.map((line, idx) => (
            <BidderRow key={line.advertiser_id} line={line} rank={idx + 1} />
          ))}
        </div>
      </div>

      <ChapterProse>
        <p>
          Mỗi nhãn đăng ký <strong>từ khóa</strong> họ muốn xuất hiện cho, một <strong>mức bid tối đa</strong>{" "}
          mỗi click, và <strong>mẫu quảng cáo</strong> (headline + landing page). Họ làm việc này
          từ trước, không phải lúc bạn search.
        </p>
        <p>
          Khi user gõ một query khớp, Google chộp lấy danh sách nhãn nào đang đăng ký từ khóa đó,
          rồi chạy đấu giá giữa họ. <em>Bid cao nhất chưa chắc thắng</em> — đó là chương sau.
        </p>
      </ChapterProse>

      <ChapterAction>
        Để ý Quality Score (QS) bên phải mỗi nhãn — Google chấm điểm từ 1 đến 10 dựa trên độ chất
        lượng quảng cáo và landing page. <strong>Bid × QS = Ad Rank.</strong> Đó là cách Google
        chọn người thắng.
      </ChapterAction>
    </ChapterShell>
  );
}

function BidderRow({ line, rank }: { line: AdRankLine; rank: number }) {
  const winning = line.slot_position !== null && line.slot_position !== undefined;
  const qsColor = line.quality_score >= 7 ? "var(--ok)" : line.quality_score >= 4 ? "var(--warn)" : "var(--bad)";

  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--bg-elevated)]">
      <span
        className="text-[10px] font-bold tabular-nums w-6 text-right text-[var(--text-dim)]"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        #{rank}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium text-[var(--text)] truncate">
            {line.advertiser_name}
          </span>
          <span
            className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: "var(--badge-bg)", color: "var(--text-dim)" }}
          >
            {line.match_type}
          </span>
          {winning && (
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
            >
              Slot {(line.slot_position ?? 0) + 1}
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-[var(--text-muted)] truncate">
          từ khóa: <span className="text-[var(--text)]">"{line.keyword_text}"</span> · ad: <em>{line.ad_headline}</em>
        </div>
      </div>

      <div
        className="text-right text-[11.5px] tabular-nums"
        style={{ fontFamily: "ui-monospace, monospace", minWidth: 200 }}
      >
        <div className="text-[var(--text)]">
          <span className="text-[var(--text-dim)]">Bid </span>
          <span className="font-medium">{fmt(line.bid)} đ</span>
          <span className="text-[var(--text-dim)] mx-1.5">×</span>
          <span className="text-[var(--text-dim)]">QS </span>
          <span className="font-medium" style={{ color: qsColor }}>
            {line.quality_score.toFixed(1)}
          </span>
        </div>
        <div className="text-[var(--text-muted)] text-[10.5px] mt-0.5">
          = Ad Rank <span className="text-[var(--text)] font-medium">{fmt(line.ad_rank)}</span>
        </div>
      </div>
    </div>
  );
}
