"use client";
import type { AdRankLine } from "@/lib/api";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

type Props = {
  lines: AdRankLine[];
  bidOverrides: Record<number, number>;
  qsOverrides: Record<number, number>;
  onBidChange: (advertiserId: number, value: number) => void;
  onQsChange: (advertiserId: number, value: number) => void;
  onReset: () => void;
};

export function Playground({
  lines,
  bidOverrides,
  qsOverrides,
  onBidChange,
  onQsChange,
  onReset,
}: Props) {
  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[12px] font-semibold text-[var(--text)]">Playground</div>
          <div className="text-[11px] text-[var(--text-dim)]">
            Drag bid or QS to re-run the auction live.
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)]"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lines.map((line) => {
          const bid = bidOverrides[line.advertiser_id] ?? line.bid;
          const qs = qsOverrides[line.advertiser_id] ?? line.quality_score;
          const winning = line.slot_position !== null && line.slot_position !== undefined;

          return (
            <div
              key={line.advertiser_id}
              className="rounded-lg border border-[var(--border)] p-3"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-[var(--text)] truncate">
                  {line.advertiser_name}
                </span>
                {winning && (
                  <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded text-[var(--text-dim)] border border-[var(--border)]">
                    Slot {(line.slot_position ?? 0) + 1}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Slider
                  label="Bid"
                  value={bid}
                  min={500}
                  max={30000}
                  step={500}
                  display={`${fmt(bid)} đ`}
                  onChange={(v) => onBidChange(line.advertiser_id, v)}
                />
                <Slider
                  label="QS"
                  value={qs}
                  min={1}
                  max={10}
                  step={0.1}
                  display={qs.toFixed(1)}
                  onChange={(v) => onQsChange(line.advertiser_id, v)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10.5px] mb-0.5">
        <span className="text-[var(--text-dim)]">{label}</span>
        <span className="text-[var(--text-muted)]" style={{ fontFamily: "ui-monospace, monospace" }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--text)" }}
      />
    </div>
  );
}
