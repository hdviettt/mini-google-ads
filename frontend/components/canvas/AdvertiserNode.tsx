"use client";
import { Handle, Position, type NodeProps } from "reactflow";
import type { AdRankLine } from "@/lib/api";

export type AdvertiserNodeData = {
  line: AdRankLine;
  selected: boolean;
  onClick: (advertiserId: number) => void;
};

const vnd = (n: number) =>
  `${Math.round(n).toLocaleString("vi-VN")} VND`;

export function AdvertiserNode({ data }: NodeProps<AdvertiserNodeData>) {
  const { line, selected, onClick } = data;
  const winning = line.slot_position !== null && line.slot_position !== undefined;
  const slot = winning ? (line.slot_position ?? 0) + 1 : null;

  const slotColor = winning
    ? slot === 1
      ? "#4ade80"
      : slot === 2
      ? "#a3e635"
      : slot === 3
      ? "#facc15"
      : "#fb923c"
    : "#6b7280";

  return (
    <div
      onClick={() => onClick(line.advertiser_id)}
      style={{
        background: selected ? "#1e293b" : "#141425",
        border: `1.5px solid ${selected ? "#4ade80" : "#2a2a4a"}`,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 240,
        color: "var(--text)",
        cursor: "pointer",
        boxShadow: selected ? "0 0 0 3px rgba(74,222,128,0.15)" : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#3a3a5a" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{line.advertiser_name}</span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 8,
            background: slotColor,
            color: "#0a0a14",
            fontWeight: 700,
          }}
        >
          {winning ? `Slot ${slot}` : "Filtered"}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>
        kw: {line.keyword_text}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: 11 }}>
        <span>Bid:</span>
        <span style={{ textAlign: "right" }}>{vnd(line.bid)}</span>
        <span>QS:</span>
        <span style={{ textAlign: "right" }}>{line.quality_score.toFixed(1)} / 10</span>
        <span style={{ color: "var(--accent)" }}>Ad Rank:</span>
        <span style={{ textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>
          {Math.round(line.ad_rank).toLocaleString("vi-VN")}
        </span>
        {winning && (
          <>
            <span style={{ color: "var(--accent-2)" }}>You pay:</span>
            <span style={{ textAlign: "right", color: "var(--accent-2)", fontWeight: 600 }}>
              {vnd(line.paid_cpc ?? 0)}
            </span>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#3a3a5a" }} />
    </div>
  );
}
