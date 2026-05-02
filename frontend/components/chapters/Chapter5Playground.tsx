"use client";
import type { AuctionResponse } from "@/lib/api";
import { ChapterShell, ChapterProse, ChapterAction } from "./ChapterShell";
import { QueryBar } from "./QueryBar";
import { AdResult } from "@/components/AdResult";
import { AdRankRace } from "@/components/charts/AdRankRace";
import { GspChart } from "@/components/charts/GspChart";
import { ControlPanel } from "@/components/ControlPanel";
import { TypewriterText } from "@/components/TypewriterText";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  auction: AuctionResponse | null;
  loading: boolean;
  simulatedUserId: number | null;
  setSimulatedUserId: (id: number | null) => void;
  numSlots: number;
  setNumSlots: (n: number) => void;
  bidOverrides: Record<number, number>;
  qsOverrides: Record<number, number>;
  onBidChange: (id: number, v: number) => void;
  onQsChange: (id: number, v: number) => void;
  onResetOverrides: () => void;
};

export function Chapter5Playground(props: Props) {
  const { query, auction, loading } = props;
  const winners = auction?.lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined) ?? [];

  return (
    <ChapterShell
      chapterNum={5}
      title="Giờ bạn nghịch"
      subtitle="Toàn bộ knobs đều mở. Đổi query, drag bid, drag QS, chọn user intent. Auction chạy lại trong 220ms mỗi khi bạn chạm."
    >
      <ChapterProse>
        <p>
          Trong panel bên phải bạn có thể: đổi query, đổi user intent (Smart Bidding sẽ thay đổi
          bid theo intent), kéo slider bid và QS từng nhãn để xem ai thắng/thua, đổi số slot từ 1 đến 6.
          Mọi output bên trái — SERP, AdRank race, GSP — re-run real-time.
        </p>
      </ChapterProse>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mt-2">
        <div className="space-y-4 min-w-0">
          {auction && auction.narration && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1.5 flex items-center gap-2">
                Narration
                <span
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
                />
              </div>
              <TypewriterText text={auction.narration} className="text-[13.5px] leading-relaxed text-[var(--text)]" />
            </div>
          )}

          {/* Mini SERP */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: "var(--g-border)", background: "var(--g-bg)" }}
          >
            <div
              className="flex items-center gap-3 px-3 py-1.5"
              style={{ background: "var(--g-chrome-bg)", borderBottom: "1px solid var(--g-border)" }}
            >
              <div className="flex items-center gap-1">
                <span className="block w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="block w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="block w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <span
                className="flex-1 text-[10.5px] truncate"
                style={{ color: "var(--g-chrome-text)", fontFamily: "ui-monospace, monospace" }}
              >
                google.com/search?q={encodeURIComponent(query)}
              </span>
            </div>
            <div
              style={{
                padding: "14px 18px 18px",
                fontFamily: "Roboto, arial, sans-serif",
                background: "var(--g-bg)",
              }}
            >
              {auction && auction.lines.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {winners.slice(0, 3).map((line) => (
                    <AdResult key={line.advertiser_id} line={line} selected={false} onSelect={() => {}} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--g-meta)", padding: "10px 0" }}>
                  Chưa có auction. Search trong panel.
                </div>
              )}
            </div>
          </div>

          {auction && auction.lines.length > 0 && (
            <>
              <AdRankRace
                lines={auction.lines}
                numSlots={Math.max(1, winners.length)}
                selectedAdvertiserId={null}
                onSelect={() => {}}
              />
              {winners.length > 0 && <GspChart lines={auction.lines} />}
            </>
          )}
        </div>

        <ControlPanel
          query={query}
          onQueryChange={props.onQueryChange}
          onSubmit={() => props.onSearch(query)}
          loading={loading}
          simulatedUserId={props.simulatedUserId}
          onUserChange={props.setSimulatedUserId}
          numSlots={props.numSlots}
          onNumSlotsChange={props.setNumSlots}
          lines={auction?.lines ?? []}
          bidOverrides={props.bidOverrides}
          qsOverrides={props.qsOverrides}
          onBidChange={props.onBidChange}
          onQsChange={props.onQsChange}
          onReset={props.onResetOverrides}
        />
      </div>

      <ChapterAction>
        Thử ngay: drag QS của 1 nhãn xếp thấp lên cao. Xem họ leo lên slot trên. Hoặc đổi User intent
        sang "High intent" — bid của các nhãn dùng Smart Bidding sẽ tăng tự động.
      </ChapterAction>
    </ChapterShell>
  );
}
