"use client";
import { useState } from "react";
import type { AdRankLine } from "@/lib/api";

const vnd = (n: number | null | undefined) =>
  n == null ? "-" : `${Math.round(n).toLocaleString("vi-VN")} đ`;
const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

type Props = {
  line: AdRankLine;
  rank: number;            // 1-indexed display rank among all lines
  selected: boolean;
  onSelect: () => void;
};

function slotPalette(slot: number | null | undefined) {
  if (slot === 0) return { bg: "var(--slot-1-bg)", fg: "var(--slot-1-fg)" };
  if (slot === 1) return { bg: "var(--slot-2-bg)", fg: "var(--slot-2-fg)" };
  if (slot === 2) return { bg: "var(--slot-3-bg)", fg: "var(--slot-3-fg)" };
  return { bg: "var(--slot-other-bg)", fg: "var(--slot-other-fg)" };
}

function urlDomain(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export function AdResult({ line, rank, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const winning = line.slot_position !== null && line.slot_position !== undefined;
  const palette = slotPalette(line.slot_position);
  const savings =
    winning && line.paid_cpc != null && line.bid > 0
      ? 1 - line.paid_cpc / line.bid
      : 0;

  return (
    <div
      onClick={onSelect}
      className={`group rounded-xl border bg-[var(--bg-card)] transition-colors cursor-pointer fade-in ${
        selected ? "border-[var(--text)]" : "border-[var(--border)] hover:border-[var(--border-hover)]"
      }`}
      style={{ animationDelay: `${rank * 30}ms` }}
    >
      <div className="px-5 py-4">
        {/* Header row: Sponsored badge, slot badge, advertiser name */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: "var(--badge-bg)", color: "var(--text-muted)" }}
          >
            Sponsored
          </span>
          {winning ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: palette.bg, color: palette.fg }}
            >
              Slot {(line.slot_position ?? 0) + 1}
            </span>
          ) : (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--badge-bg)", color: "var(--text-dim)" }}
            >
              Filtered
            </span>
          )}
          <span className="text-[12px] text-[var(--text-muted)]">
            {line.advertiser_name}
          </span>
          <span className="ml-auto text-[10px] text-[var(--text-dim)]">
            {line.match_type} match
          </span>
        </div>

        {/* Display URL */}
        <div className="text-[12px] text-[var(--text-dim)] mb-1">
          {urlDomain(`https://${line.advertiser_name.toLowerCase().replace(/\s+/g, "")}.vn`)}
        </div>

        {/* Headline (the link) */}
        <h3 className="text-[18px] leading-tight text-[var(--link-blue)] mb-1 font-medium">
          {line.ad_headline || "(no headline)"}
        </h3>

        {/* Why it won row */}
        {winning ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
            <span className="text-[var(--text-muted)]">
              Bid <span className="font-medium text-[var(--text)]">{vnd(line.bid)}</span>
            </span>
            <span className="text-[var(--text-dim)]">×</span>
            <span className="text-[var(--text-muted)]">
              QS <span className="font-medium text-[var(--text)]">{line.quality_score.toFixed(1)}</span>
            </span>
            <span className="text-[var(--text-dim)]">=</span>
            <span className="text-[var(--text-muted)]">
              Ad Rank <span className="font-medium text-[var(--text)]">{fmt(line.ad_rank)}</span>
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[var(--text-muted)]">You pay</span>
              <span className="text-[14px] font-semibold text-[var(--text)]">{vnd(line.paid_cpc)}</span>
              {savings > 0.01 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
                >
                  −{Math.round(savings * 100)}%
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-[12.5px] text-[var(--text-dim)]">
            Ad Rank {fmt(line.ad_rank)} below reserve threshold. Not shown.
          </div>
        )}

        {/* Expand toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="mt-2 text-[11px] text-[var(--text-dim)] hover:text-[var(--text-muted)]"
        >
          {open ? "Hide breakdown" : "Show breakdown"}
        </button>

        {open && <Breakdown line={line} winning={winning} />}
      </div>
    </div>
  );
}

function Breakdown({ line, winning }: { line: AdRankLine; winning: boolean }) {
  return (
    <div className="mt-3 pt-3 border-t border-[var(--separator)] grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
          Quality Score components
        </div>
        <Bar label="pCTR" value={line.pctr * 100} max={30} unit="%" digits={2} />
        <Bar label="Ad relevance" value={line.ad_relevance} max={10} />
        <Bar label="LP experience" value={line.lp_experience} max={10} />
      </div>
      <div className="space-y-1.5 font-mono">
        <Row label="Strategy" value={line.bid_strategy} />
        {line.bid_strategy !== "manual_cpc" && line.predicted_pcvr > 0 && (
          <Row label="Predicted CVR" value={`${(line.predicted_pcvr * 100).toFixed(2)}%`} />
        )}
        <Row label="Keyword" value={line.keyword_text} />
        {winning && (
          <>
            <Row label="Slot" value={`#${(line.slot_position ?? 0) + 1}`} />
            <Row label="Paid CPC" value={`${Math.round(line.paid_cpc ?? 0).toLocaleString("vi-VN")} đ`} accent />
          </>
        )}
        {!winning && <Row label="Slot" value="Filtered (below reserve)" />}
      </div>

      {winning && line.bid_strategy !== "manual_cpc" && line.strategy_reason && (
        <div className="col-span-2 mt-1 text-[11.5px] text-[var(--text-muted)] leading-relaxed">
          <span className="font-semibold text-[var(--text)]">Smart Bidding:</span> {line.strategy_reason}.
          The bid was decided by an ML model on conversion-probability signals for this query and user, not a fixed CPC the advertiser entered.
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span
        className={accent ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"}
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {value}
      </span>
    </div>
  );
}

function Bar({ label, value, max, unit, digits = 1 }: { label: string; value: number; max: number; unit?: string; digits?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 70 ? "var(--ok)" : pct >= 40 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10.5px] mb-0.5">
        <span className="text-[var(--text-dim)]">{label}</span>
        <span className="text-[var(--text-muted)]" style={{ fontFamily: "ui-monospace, monospace" }}>
          {value.toFixed(digits)}{unit || ""}
        </span>
      </div>
      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--score-bar-bg)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
