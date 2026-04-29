"use client";
import type { AdRankLine } from "@/lib/api";

const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")}`;

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
  if (lines.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--text-dim)", fontSize: 12 }}>
        Run a query to see playground controls.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--accent)" }}>Playground</span>
        <button
          onClick={onReset}
          style={{
            background: "transparent",
            color: "var(--text-dim)",
            border: "1px solid #2a2a4a",
            borderRadius: 6,
            padding: "3px 9px",
            fontSize: 11,
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {lines.map((line) => {
          const bid = bidOverrides[line.advertiser_id] ?? line.bid;
          const qs = qsOverrides[line.advertiser_id] ?? line.quality_score;
          return (
            <div
              key={line.advertiser_id}
              style={{
                background: "#16213e",
                border: "1px solid #2a2a4a",
                borderRadius: 6,
                padding: "8px 10px",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{line.advertiser_name}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ width: 36, color: "var(--text-dim)" }}>Bid</span>
                <input
                  type="range"
                  min={500}
                  max={30000}
                  step={500}
                  value={bid}
                  onChange={(e) => onBidChange(line.advertiser_id, Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ width: 70, textAlign: "right", color: "var(--accent)" }}>
                  {vnd(bid)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 36, color: "var(--text-dim)" }}>QS</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={qs}
                  onChange={(e) => onQsChange(line.advertiser_id, Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ width: 70, textAlign: "right", color: "var(--accent)" }}>
                  {qs.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
