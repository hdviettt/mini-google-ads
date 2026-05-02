"use client";
import type { AuctionResponse } from "@/lib/api";
import { ChapterShell, ChapterProse, ChapterAction } from "./ChapterShell";
import { QueryBar } from "./QueryBar";
import { GspChart } from "@/components/charts/GspChart";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  auction: AuctionResponse | null;
  loading: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

export function Chapter4GSP({ query, onQueryChange, onSearch, auction, loading }: Props) {
  const lines = auction?.lines ?? [];
  const winners = lines
    .filter((l) => l.slot_position !== null && l.slot_position !== undefined)
    .sort((a, b) => (a.slot_position ?? 0) - (b.slot_position ?? 0));

  const top = winners[0];
  const savingsPct =
    top && top.paid_cpc != null && top.bid > 0
      ? Math.round((1 - top.paid_cpc / top.bid) * 100)
      : 0;

  return (
    <ChapterShell
      chapterNum={4}
      title="Bid 10k, có khi chỉ trả 6k"
      subtitle="Google dùng Generalized Second-Price (GSP) auction. Người thắng chỉ phải trả vừa đủ để vượt người xếp ngay sau, không phải toàn bộ bid của mình."
    >
      <QueryBar query={query} onQueryChange={onQueryChange} onSearch={onSearch} loading={loading} />

      {/* Hero: GSP chart */}
      {winners.length > 0 ? <GspChart lines={lines} /> : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[13px] text-[var(--text-muted)]">
          Auction này không có người thắng. Hãy thử query khác ở trên.
        </div>
      )}

      {/* Formula callout */}
      <div
        className="rounded-xl border border-[var(--border)] p-5 max-w-[640px]"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2 font-semibold">
          Công thức GSP
        </div>
        <div className="text-[15px] leading-relaxed" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
          <span className="text-[var(--text-muted)]">price_i</span>{" "}
          <span className="text-[var(--text-dim)]">=</span>{" "}
          <span className="text-[var(--text)] font-semibold">AdRank của người ngay sau</span>{" "}
          <span className="text-[var(--text-dim)]">÷</span>{" "}
          <span className="text-[var(--text)] font-semibold">QS của bạn</span>
        </div>
        <p className="text-[12px] text-[var(--text-dim)] mt-3 leading-relaxed">
          Bạn không trả full bid của mình. Bạn chỉ trả mức tối thiểu cần để Ad Rank của bạn vẫn cao
          hơn người ngay sau. Nếu QS của bạn cao thì giá trả còn thấp hơn nữa.
        </p>
      </div>

      <ChapterProse>
        {top && top.paid_cpc != null && (
          <p>
            Trong auction này, <strong>{top.advertiser_name}</strong> thắng slot 1 với bid{" "}
            <span className="tabular-nums">{fmt(top.bid)} đ</span> — nhưng chỉ thật sự trả{" "}
            <strong className="tabular-nums" style={{ color: "var(--ok)" }}>{fmt(top.paid_cpc)} đ</strong>{" "}
            mỗi click. <em>Tiết kiệm {savingsPct}%.</em> Phần chênh là phần "đáng lẽ phải trả" mà GSP
            không bắt họ trả.
          </p>
        )}
        <p>
          Đây là lý do nhiều marketer hiểu sai: <strong>bid không phải số tiền thực sự trả</strong>.
          Bid là mức tối đa bạn willing pay. GSP tính giá thực sự thấp hơn. Quality Score càng cao
          thì khoảng tiết kiệm càng lớn.
        </p>
      </ChapterProse>

      <ChapterAction>
        Slot 1 thường tiết kiệm ít nhất, slot dưới tiết kiệm nhiều hơn vì khoảng cách Ad Rank với
        người sau xa hơn. Đếm ngược các slot trong chart trên để thấy.
      </ChapterAction>
    </ChapterShell>
  );
}
