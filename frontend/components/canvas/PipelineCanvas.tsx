"use client";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

const PLACEHOLDER_NODES: Node[] = [
  { id: "query", position: { x: 0, y: 200 }, data: { label: "Query" }, type: "input" },
  { id: "match", position: { x: 200, y: 200 }, data: { label: "Match Lookup" } },
  { id: "qs", position: { x: 400, y: 100 }, data: { label: "Quality Score" } },
  { id: "ad-rank", position: { x: 400, y: 300 }, data: { label: "Ad Rank" } },
  { id: "gsp", position: { x: 600, y: 200 }, data: { label: "GSP Auction" } },
  { id: "slots", position: { x: 800, y: 200 }, data: { label: "Slot Allocation" }, type: "output" },
];

const PLACEHOLDER_EDGES: Edge[] = [
  { id: "e1", source: "query", target: "match" },
  { id: "e2", source: "match", target: "qs" },
  { id: "e3", source: "match", target: "ad-rank" },
  { id: "e4", source: "qs", target: "ad-rank" },
  { id: "e5", source: "ad-rank", target: "gsp" },
  { id: "e6", source: "gsp", target: "slots" },
];

export function PipelineCanvas() {
  // Phase 0 placeholder. Phase 1 will replace with live auction data.
  const [nodes] = useState<Node[]>(PLACEHOLDER_NODES);
  const [edges] = useState<Edge[]>(PLACEHOLDER_EDGES);

  const defaultEdgeOptions = useMemo(
    () => ({ animated: false, style: { stroke: "#3a3a5a" } }),
    [],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      style={{ background: "var(--bg)" }}
    >
      <Background gap={16} color="#1a1a2e" />
      <Controls />
    </ReactFlow>
  );
}
