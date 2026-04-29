"use client";
import { useState } from "react";
import type { AdRankLine } from "@/lib/api";
import { Playground } from "@/components/playground/Playground";
import { PipelineCanvas } from "@/components/canvas/PipelineCanvas";
import { SimulationPanel } from "@/components/panels/SimulationPanel";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const vnd = (n: number | null | undefined) =>
  n == null ? "-" : `${fmt(n)} đ`;

type Props = {
  lines: AdRankLine[];
  selectedAdvertiserId: number | null;
  onSelectAdvertiser: (id: number | null) => void;
  bidOverrides: Record<number, number>;
  qsOverrides: Record<number, number>;
  onBidChange: (id: number, v: number) => void;
  onQsChange: (id: number, v: number) => void;
  onResetOverrides: () => void;
};

export function AlgorithmSide({
  lines,
  selectedAdvertiserId,
  onSelectAdvertiser,
  bidOverrides,
  qsOverrides,
  onBidChange,
  onQsChange,
  onResetOverrides,
}: Props) {
  const [showCanvas, setShowCanvas] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
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
          từ khóa khớp. Đây là 4 bước quyết định ai thắng và trả bao nhiêu.
        </p>
      </div>

      {/* Step 1: Ad Rank computation table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-3">
        <div className="text-[11.5px] text-[var(--text-muted)] mb-3">
          <span className="font-semibold text-[var(--text)]">Bước 1.</span>{" "}
          Tính <code className="bg-[var(--bg-elevated)] px-1 rounded text-[var(--text)]">Ad Rank = Bid × Quality Score</code> cho từng nhãn hàng.
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[12px]" style={{ fontFamily: "ui-monospace, monospace" }}>
            <thead>
              <tr className="text-[var(--text-dim)] text-[10.5px] uppercase tracking-wider border-b border-[var(--separator)]">
                <th className="text-left py-2 px-1 font-normal">Nhãn hàng</th>
                <th className="text-right py-2 px-1 font-normal">Bid</th>
                <th className="text-center py-2 px-1 font-normal">×</th>
                <th className="text-right py-2 px-1 font-normal">QS</th>
                <th className="text-center py-2 px-1 font-normal">=</th>
                <th className="text-right py-2 px-1 font-normal">Ad Rank</th>
                <th className="text-center py-2 px-1 font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const winning = line.slot_position !== null && line.slot_position !== undefined;
                return (
                  <tr
                    key={line.advertiser_id}
                    onClick={() =>
                      onSelectAdvertiser(
                        selectedAdvertiserId === line.advertiser_id ? null : line.advertiser_id,
                      )
                    }
                    className={`border-b border-[var(--separator)] last:border-0 cursor-pointer hover:bg-[var(--bg-elevated)] ${
                      selectedAdvertiserId === line.advertiser_id ? "bg-[var(--bg-elevated)]" : ""
                    }`}
                  >
                    <td className="py-2 px-1 text-[var(--text)]">{line.advertiser_name}</td>
                    <td className="text-right py-2 px-1 text-[var(--text-muted)]">{vnd(line.bid)}</td>
                    <td className="text-center py-2 px-1 text-[var(--text-dim)]">×</td>
                    <td className="text-right py-2 px-1 text-[var(--text-muted)]">{line.quality_score.toFixed(1)}</td>
                    <td className="text-center py-2 px-1 text-[var(--text-dim)]">=</td>
                    <td className="text-right py-2 px-1 text-[var(--text)] font-semibold">{fmt(line.ad_rank)}</td>
                    <td className="text-center py-2 px-1">
                      {winning ? (
                        <span
                          className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
                        >
                          Slot {(line.slot_position ?? 0) + 1}
                        </span>
                      ) : (
                        <span className="text-[9.5px] uppercase tracking-wider text-[var(--text-dim)]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[11px] text-[var(--text-dim)] leading-relaxed">
          Sắp xếp theo Ad Rank giảm dần. Top {winners.length} thắng slot. Đây là lý do bid cao
          không đảm bảo thắng — Quality Score nhân vào bid.
        </div>
      </div>

      {/* Step 2: GSP pricing table */}
      {winners.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-3">
          <div className="text-[11.5px] text-[var(--text-muted)] mb-3">
            <span className="font-semibold text-[var(--text)]">Bước 2.</span>{" "}
            Tính giá thắng (Generalized Second-Price): mỗi winner trả mức tối thiểu cần để vượt
            người đứng sau.
            <code className="ml-1 bg-[var(--bg-elevated)] px-1 rounded text-[var(--text)]">
              price = Ad Rank của người sau ÷ QS của mình
            </code>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]" style={{ fontFamily: "ui-monospace, monospace" }}>
              <thead>
                <tr className="text-[var(--text-dim)] text-[10.5px] uppercase tracking-wider border-b border-[var(--separator)]">
                  <th className="text-left py-2 px-1 font-normal">Slot</th>
                  <th className="text-left py-2 px-1 font-normal">Nhãn hàng</th>
                  <th className="text-right py-2 px-1 font-normal">Bid</th>
                  <th className="text-right py-2 px-1 font-normal">Phải trả</th>
                  <th className="text-right py-2 px-1 font-normal">Tiết kiệm</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((line) => {
                  const savings =
                    line.paid_cpc != null && line.bid > 0 ? 1 - line.paid_cpc / line.bid : 0;
                  return (
                    <tr key={line.advertiser_id} className="border-b border-[var(--separator)] last:border-0">
                      <td className="py-2 px-1">
                        <span
                          className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
                        >
                          {(line.slot_position ?? 0) + 1}
                        </span>
                      </td>
                      <td className="py-2 px-1 text-[var(--text)]">{line.advertiser_name}</td>
                      <td className="text-right py-2 px-1 text-[var(--text-muted)]">{vnd(line.bid)}</td>
                      <td className="text-right py-2 px-1 text-[var(--text)] font-semibold">{vnd(line.paid_cpc)}</td>
                      <td className="text-right py-2 px-1">
                        {savings > 0.01 ? (
                          <span style={{ color: "var(--ok)" }}>−{Math.round(savings * 100)}%</span>
                        ) : (
                          <span className="text-[var(--text-dim)]">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-[var(--text-dim)] leading-relaxed">
            Đây là lý do bid không phải số tiền thực sự trả. Người thắng chỉ phải trả vừa đủ để
            vượt mặt nhãn xếp ngay sau, không phải toàn bộ bid của mình.
          </div>
        </div>
      )}

      {/* Playground (always visible in algorithm view) */}
      <Playground
        lines={lines}
        bidOverrides={bidOverrides}
        qsOverrides={qsOverrides}
        onBidChange={onBidChange}
        onQsChange={onQsChange}
        onReset={onResetOverrides}
      />

      {/* Pipeline canvas (collapsible) */}
      <div className="mt-4">
        <button
          onClick={() => setShowCanvas((s) => !s)}
          className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text)] py-2"
        >
          {showCanvas ? "▾" : "▸"} {showCanvas ? "Hide" : "Show"} pipeline canvas (advanced)
        </button>
        {showCanvas && (
          <div className="mt-3 rounded-xl border border-[var(--border)] overflow-hidden" style={{ height: 560 }}>
            <PipelineCanvas
              auction={{
                auction_id: 0,
                query: "",
                matched_count: lines.length,
                eligible_count: lines.length,
                slot_count: winners.length,
                lines,
                narration: "",
                time_ms: 0,
              }}
              selectedAdvertiserId={selectedAdvertiserId}
              onSelectAdvertiser={onSelectAdvertiser}
            />
          </div>
        )}
      </div>

      {/* Simulation (collapsible) */}
      <div className="mt-2">
        <button
          onClick={() => setShowSimulation((s) => !s)}
          className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text)] py-2"
        >
          {showSimulation ? "▾" : "▸"} {showSimulation ? "Hide" : "Show"} simulation panel (advanced)
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
