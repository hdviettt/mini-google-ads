"use client";
import { useState } from "react";
import type { AdRankLine } from "@/lib/api";
import { SimulationPanel } from "@/components/panels/SimulationPanel";
import { AdRankRace } from "@/components/charts/AdRankRace";
import { GspChart } from "@/components/charts/GspChart";
import { AuctionPipelineSVG } from "@/components/canvas/AuctionPipelineSVG";

type Props = {
  lines: AdRankLine[];
  selectedAdvertiserId: number | null;
  onSelectAdvertiser: (id: number | null) => void;
  auctionId: number;
};

export function AlgorithmSide({
  lines,
  selectedAdvertiserId,
  onSelectAdvertiser,
  auctionId,
}: Props) {
  const [showSimulation, setShowSimulation] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const winners = lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined);

  if (lines.length === 0) return null;

  return (
    <section id="algorithm" className="pt-12 pb-6 fade-in">
      <div className="mb-5">
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
          3 · Phía thuật toán
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--text)] mb-2">
          Đấu giá Google chạy trong vài mili-giây
        </h2>
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
          Khi user search, Google chạy một cuộc đấu giá real-time giữa các nhãn hàng đã đăng ký
          từ khóa khớp. Particles chạy dọc edges theo đúng thứ tự thời gian thật.
        </p>
      </div>

      {/* PIPELINE CANVAS — the centerpiece */}
      <div className="mb-4">
        <AuctionPipelineSVG
          auctionId={auctionId}
          lines={lines}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </div>

      {/* Ad Rank race chart */}
      <div className="mb-3">
        <AdRankRace
          lines={lines}
          numSlots={Math.max(1, winners.length)}
          selectedAdvertiserId={selectedAdvertiserId}
          onSelect={onSelectAdvertiser}
        />
        <div className="mt-2 text-[11px] text-[var(--text-dim)] leading-relaxed px-1">
          Sắp xếp theo Ad Rank giảm dần. Top {winners.length} thắng slot. Bid cao không đảm bảo
          thắng vì Quality Score nhân vào bid.
        </div>
      </div>

      {/* GSP chart */}
      {winners.length > 0 && (
        <div className="mb-3">
          <GspChart lines={lines} />
          <div className="mt-2 text-[11px] text-[var(--text-dim)] leading-relaxed px-1">
            <code className="bg-[var(--bg-elevated)] px-1 rounded text-[var(--text-muted)]">
              price = Ad Rank của người sau ÷ QS của mình
            </code>
            . Người thắng chỉ trả vừa đủ để vượt mặt nhãn xếp ngay sau, không phải toàn bộ bid.
          </div>
        </div>
      )}

      {/* Simulation (collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowSimulation((s) => !s)}
          className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text)] py-2"
        >
          {showSimulation ? "▾" : "▸"} {showSimulation ? "Hide" : "Show"} simulation panel
        </button>
        {showSimulation && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <SimulationPanel />
          </div>
        )}
      </div>
    </section>
  );
}
