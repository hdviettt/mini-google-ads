"use client";
import type { AdRankLine } from "@/lib/api";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

type Props = {
  lines: AdRankLine[];
  numSlots: number;
  selectedAdvertiserId: number | null;
  onSelect: (id: number | null) => void;
};

export function AdRankRace({ lines, numSlots, selectedAdvertiserId, onSelect }: Props) {
  if (lines.length === 0) return null;

  const sorted = [...lines].sort((a, b) => b.ad_rank - a.ad_rank);
  const max = sorted[0]?.ad_rank ?? 1;

  // The slot cutoff is the Ad Rank of the (numSlots+1)-th bidder, or 0
  const cutoff = sorted[numSlots]?.ad_rank ?? 0;
  const cutoffPct = (cutoff / max) * 100;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
            Bước 1
          </div>
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Ad Rank Race · Bid × QS
          </h3>
        </div>
        <div className="text-[10.5px] text-[var(--text-dim)]">
          Top {numSlots} cross the cutoff line
        </div>
      </div>

      <div className="space-y-2.5 relative">
        {/* Slot cutoff line */}
        {cutoffPct > 0 && cutoffPct < 100 && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `calc(${100 - cutoffPct}% + 0px)`,
              borderLeft: "1.5px dashed var(--border-hover)",
              zIndex: 1,
            }}
          >
            <div
              className="absolute -top-3 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-wider text-[var(--text-dim)]"
              style={{ left: 0 }}
            >
              cutoff
            </div>
          </div>
        )}

        {sorted.map((line) => {
          const winning = line.slot_position !== null && line.slot_position !== undefined;
          const pct = (line.ad_rank / max) * 100;
          const bidPortion = line.bid * 1; // raw bid contribution
          const qsBoost = line.ad_rank - line.bid; // contribution from QS multiplier
          const bidPct = (bidPortion / max) * 100;
          const qsPct = (qsBoost / max) * 100;
          const selected = selectedAdvertiserId === line.advertiser_id;

          return (
            <button
              key={line.advertiser_id}
              onClick={() => onSelect(selected ? null : line.advertiser_id)}
              className={`w-full text-left grid grid-cols-[140px_1fr_140px] items-center gap-3 p-2 rounded-lg transition-colors ${
                selected ? "bg-[var(--bg-elevated)]" : "hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <div className="text-[12px] font-medium text-[var(--text)] truncate">
                {line.advertiser_name}
              </div>

              <div className="relative h-7 rounded-md overflow-hidden" style={{ background: "var(--score-bar-bg)" }}>
                {/* Bid portion */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${bidPct}%`,
                    background: winning ? "var(--slot-2-fg)" : "var(--text-dim)",
                    opacity: winning ? 0.55 : 0.35,
                  }}
                />
                {/* QS boost */}
                <div
                  className="absolute inset-y-0 transition-all duration-500"
                  style={{
                    left: `${bidPct}%`,
                    width: `${qsPct}%`,
                    background: winning ? "var(--ok)" : "var(--text-dim)",
                    opacity: winning ? 0.85 : 0.5,
                  }}
                />
                {/* Slot label */}
                {winning && (
                  <div
                    className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--bg)" }}
                  >
                    Slot {(line.slot_position ?? 0) + 1}
                  </div>
                )}
              </div>

              <div
                className="text-right text-[12px]"
                style={{ fontFamily: "ui-monospace, monospace", color: "var(--text)" }}
              >
                <span className="text-[var(--text-dim)]">{fmt(line.bid)}</span>
                <span className="mx-1 text-[var(--text-dim)]">×</span>
                <span className="text-[var(--text-muted)]">{line.quality_score.toFixed(1)}</span>
                <span className="mx-1 text-[var(--text-dim)]">=</span>
                <span className="font-semibold">{fmt(line.ad_rank)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10.5px] text-[var(--text-dim)]">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ background: "var(--slot-2-fg)", opacity: 0.55 }}
          />
          Bid contribution
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-2 rounded-sm"
            style={{ background: "var(--ok)", opacity: 0.85 }}
          />
          Quality Score boost
        </span>
        <span className="ml-auto">
          Total bar length = Ad Rank
        </span>
      </div>
    </div>
  );
}
