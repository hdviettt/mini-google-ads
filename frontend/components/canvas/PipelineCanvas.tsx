"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import type { AuctionResponse, AdRankLine } from "@/lib/api";
import { AdvertiserNode, type AdvertiserNodeData } from "./AdvertiserNode";
import { StageNode } from "./StageNode";

const nodeTypes = {
  advertiser: AdvertiserNode,
  stage: StageNode,
};

type Props = {
  auction: AuctionResponse | null;
  selectedAdvertiserId: number | null;
  onSelectAdvertiser: (id: number | null) => void;
};

export function PipelineCanvas({ auction, selectedAdvertiserId, onSelectAdvertiser }: Props) {
  const handleClick = useCallback(
    (id: number) => {
      onSelectAdvertiser(id === selectedAdvertiserId ? null : id);
    },
    [selectedAdvertiserId, onSelectAdvertiser],
  );

  const { nodes, edges } = useMemo(() => buildGraph(auction, selectedAdvertiserId, handleClick), [auction, selectedAdvertiserId, handleClick]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      style={{ background: "var(--bg)" }}
      minZoom={0.4}
      maxZoom={1.8}
    >
      <Background gap={16} color="#1a1a2e" />
      <Controls position="bottom-right" />
      <MiniMap
        position="top-right"
        nodeColor={(n) => {
          if (n.type === "advertiser") {
            const data = n.data as AdvertiserNodeData;
            return data.line.slot_position !== null && data.line.slot_position !== undefined
              ? "#4ade80"
              : "#3a3a5a";
          }
          return "#1e293b";
        }}
        style={{ background: "#0f172a", border: "1px solid #2a2a4a" }}
      />
    </ReactFlow>
  );
}

function buildGraph(
  auction: AuctionResponse | null,
  selectedAdvertiserId: number | null,
  onClick: (id: number) => void,
): { nodes: Node[]; edges: Edge[] } {
  if (!auction || auction.lines.length === 0) {
    return {
      nodes: [
        {
          id: "query",
          type: "stage",
          position: { x: 0, y: 200 },
          data: { label: "Query", subtitle: "Type a search query" },
        },
        {
          id: "match",
          type: "stage",
          position: { x: 220, y: 200 },
          data: { label: "Match Lookup", subtitle: "(no match yet)" },
        },
        {
          id: "auction",
          type: "stage",
          position: { x: 440, y: 200 },
          data: { label: "Auction", subtitle: "Run a query to start" },
        },
      ],
      edges: [
        { id: "e1", source: "query", target: "match" },
        { id: "e2", source: "match", target: "auction" },
      ],
    };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "query",
    type: "stage",
    position: { x: 0, y: 220 },
    data: { label: "Query", subtitle: `"${auction.query}"` },
  });

  nodes.push({
    id: "match",
    type: "stage",
    position: { x: 220, y: 220 },
    data: { label: "Match Lookup", subtitle: `${auction.matched_count} match${auction.matched_count === 1 ? "" : "es"}` },
  });

  // Sort lines by ad_rank desc (already sorted from backend)
  const lines = [...auction.lines];
  const baseY = 60;
  const rowH = 130;

  lines.forEach((line, idx) => {
    nodes.push({
      id: `adv-${line.advertiser_id}`,
      type: "advertiser",
      position: { x: 480, y: baseY + idx * rowH },
      data: {
        line,
        selected: line.advertiser_id === selectedAdvertiserId,
        onClick,
      } as AdvertiserNodeData,
    });
    edges.push({
      id: `e-match-${line.advertiser_id}`,
      source: "match",
      target: `adv-${line.advertiser_id}`,
      animated: line.slot_position !== null && line.slot_position !== undefined,
      style: {
        stroke: line.slot_position !== null && line.slot_position !== undefined ? "#4ade80" : "#3a3a5a",
        strokeWidth: 1.5,
      },
    });
  });

  // Slots column
  const winners = lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined);
  winners.forEach((w) => {
    nodes.push({
      id: `slot-${w.slot_position}`,
      type: "stage",
      position: { x: 880, y: baseY + ((w.slot_position ?? 0) * rowH) + 20 },
      data: {
        label: `Slot ${(w.slot_position ?? 0) + 1}`,
        subtitle: w.advertiser_name,
        accent: true,
      },
    });
    edges.push({
      id: `e-slot-${w.advertiser_id}`,
      source: `adv-${w.advertiser_id}`,
      target: `slot-${w.slot_position}`,
      style: { stroke: "#4ade80", strokeWidth: 2 },
      animated: true,
    });
  });

  return { nodes, edges };
}
