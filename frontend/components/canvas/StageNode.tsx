"use client";
import { Handle, Position, type NodeProps } from "reactflow";

export type StageNodeData = {
  label: string;
  subtitle?: string;
  accent?: boolean;
};

export function StageNode({ data }: NodeProps<StageNodeData>) {
  return (
    <div
      style={{
        background: data.accent ? "#0f3924" : "#0f172a",
        border: `1.5px solid ${data.accent ? "#4ade80" : "#2a2a4a"}`,
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 160,
        color: "var(--text)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#3a3a5a" }} />
      <div style={{ fontSize: 12, fontWeight: 600 }}>{data.label}</div>
      {data.subtitle && (
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>{data.subtitle}</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: "#3a3a5a" }} />
    </div>
  );
}
