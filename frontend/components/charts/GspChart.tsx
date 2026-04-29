"use client";
import type { AdRankLine } from "@/lib/api";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

type Props = {
  lines: AdRankLine[];
};

export function GspChart({ lines }: Props) {
  const winners = lines
    .filter((l) => l.slot_position !== null && l.slot_position !== undefined)
    .sort((a, b) => (a.slot_position ?? 0) - (b.slot_position ?? 0));

  if (winners.length === 0) return null;

  const maxBid = Math.max(...winners.map((l) => l.bid));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
            Bước 2
          </div>
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            GSP Pricing · Bid vs Paid
          </h3>
        </div>
        <div className="text-[10.5px] text-[var(--text-dim)]">
          Pay only enough to beat the next ranker
        </div>
      </div>

      <div className="space-y-3">
        {winners.map((line) => {
          const bidPct = (line.bid / maxBid) * 100;
          const paidPct = ((line.paid_cpc ?? 0) / maxBid) * 100;
          const savings =
            line.paid_cpc != null && line.bid > 0 ? 1 - line.paid_cpc / line.bid : 0;

          return (
            <div
              key={line.advertiser_id}
              className="grid grid-cols-[120px_1fr_180px] items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
                >
                  Slot {(line.slot_position ?? 0) + 1}
                </span>
                <span className="text-[12px] text-[var(--text)] truncate">
                  {line.advertiser_name}
                </span>
              </div>

              <div className="relative h-7 rounded-md overflow-hidden" style={{ background: "var(--score-bar-bg)" }}>
                {/* Full bid (background, lighter) */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${bidPct}%`,
                    background: "var(--text-dim)",
                    opacity: 0.25,
                  }}
                />
                {/* Paid (foreground, accent) */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${paidPct}%`,
                    background: "var(--ok)",
                    opacity: 0.85,
                  }}
                />
                {/* Savings annotation in the gap */}
                {savings > 0.05 && (
                  <div
                    className="absolute inset-y-0 flex items-center text-[10px] uppercase tracking-wider font-semibold"
                    style={{
                      left: `${paidPct + 1}%`,
                      color: "var(--text-muted)",
                    }}
                  >
                    saved {Math.round(savings * 100)}%
                  </div>
                )}
              </div>

              <div className="text-right text-[12px]" style={{ fontFamily: "ui-monospace, monospace" }}>
                <span className="text-[var(--text-dim)]">bid {fmt(line.bid)}</span>
                <br />
                <span className="text-[var(--text)] font-semibold">pay {fmt(line.paid_cpc ?? 0)} đ</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10.5px] text-[var(--text-dim)]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ background: "var(--text-dim)", opacity: 0.25 }}
          />
          What they bid
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ background: "var(--ok)", opacity: 0.85 }}
          />
          What they pay (GSP)
        </span>
      </div>
    </div>
  );
}
