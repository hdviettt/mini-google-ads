"use client";
import type { AuctionResponse } from "@/lib/api";
import { AdResult } from "@/components/AdResult";
import { ChapterShell, ChapterProse, ChapterAction } from "./ChapterShell";
import { QueryBar } from "./QueryBar";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  auction: AuctionResponse | null;
  loading: boolean;
};

export function Chapter1Search({ query, onQueryChange, onSearch, auction, loading }: Props) {
  const winners = auction?.lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined) ?? [];

  return (
    <ChapterShell
      chapterNum={1}
      title="Bạn search một thứ gì đó trên Google"
      subtitle="Đây là cái bạn thấy mỗi ngày. Mấy kết quả 'Sponsored' ở trên cùng là quảng cáo. Bạn click hay scroll qua?"
    >
      <QueryBar
        query={query}
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        loading={loading}
      />

      {/* Hero: Google SERP */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: "var(--g-border)", background: "var(--g-bg)" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ background: "var(--g-chrome-bg)", borderBottom: "1px solid var(--g-border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="block w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="block w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="block w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] truncate"
            style={{
              background: "var(--g-bg)",
              border: "1px solid var(--g-border)",
              color: "var(--g-chrome-text)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="truncate">google.com/search?q={encodeURIComponent(query)}</span>
          </div>
        </div>

        <div
          style={{
            padding: "20px 24px 24px",
            fontFamily: "Roboto, arial, sans-serif",
            color: "var(--g-text)",
            background: "var(--g-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 1, fontSize: 20, fontWeight: 500 }}>
              <span style={{ color: "#4285f4" }}>G</span>
              <span style={{ color: "#ea4335" }}>o</span>
              <span style={{ color: "#fbbc04" }}>o</span>
              <span style={{ color: "#4285f4" }}>g</span>
              <span style={{ color: "#34a853" }}>l</span>
              <span style={{ color: "#ea4335" }}>e</span>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 22,
                border: "1px solid var(--g-search-border)",
                background: "var(--g-card-bg)",
                boxShadow: "var(--g-search-shadow)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g-meta)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ flex: 1, fontSize: 14, color: "var(--g-text)" }}>{query}</span>
            </div>
          </div>

          {auction && (
            <div style={{ fontSize: 11, color: "var(--g-meta)", marginBottom: 12 }}>
              Khoảng {auction.lines.length.toLocaleString("vi-VN")} kết quả · {auction.time_ms.toFixed(0)} ms
            </div>
          )}

          {auction && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {winners.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--g-meta)", padding: "16px 0" }}>
                  Không có nhãn hàng nào thắng slot.
                </div>
              ) : (
                winners.map((line) => (
                  <AdResult key={line.advertiser_id} line={line} selected={false} onSelect={() => {}} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ChapterProse>
        <p>
          Mấy cái có nhãn <strong>Sponsored</strong> kia không phải tự nhiên xuất hiện ở trên đầu.
          Có {winners.length} nhãn hàng vừa thắng một cuộc đấu giá real-time, chỉ kéo dài vài
          mili-giây, để được hiển thị cho bạn.
        </p>
        <p>
          Câu hỏi tiếp theo: <em>tại sao chính những nhãn này thắng, mà không phải nhãn khác?</em>
        </p>
      </ChapterProse>

      <ChapterAction>
        Hãy thử search một query khác ở trên (ví dụ <code className="bg-[var(--bg-elevated)] px-1 rounded text-[var(--text)]">tour phú quốc</code>) để thấy kết quả thay đổi. Khi xong, bấm <strong>Next</strong> để xem ai đã đấu giá đằng sau.
      </ChapterAction>
    </ChapterShell>
  );
}
