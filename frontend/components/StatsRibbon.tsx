"use client";
import { useEffect, useState } from "react";
import { fetchSystemStats, type SystemStats } from "@/lib/api";

const fmtN = (n: number) => n.toLocaleString("vi-VN");
const fmtVnd = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M đ` : `${Math.round(n).toLocaleString("vi-VN")} đ`;

export function StatsRibbon() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    let stopped = false;
    const tick = () =>
      fetchSystemStats()
        .then((s) => {
          if (!stopped) setStats(s);
        })
        .catch(() => {});
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      className="border-b border-[var(--border)] px-5 py-1.5 flex items-center gap-5 overflow-x-auto"
      style={{
        background: "color-mix(in srgb, var(--bg-card) 80%, transparent)",
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {!stats ? (
        <span className="text-[var(--text-dim)] ticker-pulse">connecting…</span>
      ) : (
        <>
          <Stat label="advertisers" value={fmtN(stats.advertisers)} />
          <Stat label="keywords" value={`${fmtN(stats.keywords)}/${fmtN(stats.keywords_embedded)} emb`} />
          <Stat label="ads" value={fmtN(stats.ads)} />
          <span className="text-[var(--border-hover)]">|</span>
          <Stat label="auctions" value={fmtN(stats.auctions)} />
          <Stat label="impr" value={fmtN(stats.impressions)} />
          <Stat label="clk" value={`${fmtN(stats.clicks)} (${stats.ctr_pct.toFixed(1)}%)`} />
          <Stat label="conv" value={`${fmtN(stats.conversions)} (${stats.cvr_pct.toFixed(1)}%)`} />
          <span className="text-[var(--border-hover)]">|</span>
          <Stat label="spend" value={fmtVnd(stats.spend_vnd)} />
          <Stat label="revenue" value={fmtVnd(stats.revenue_vnd)} />
          <Stat label="roas" value={`${stats.roas.toFixed(2)}×`} />
          <span className="text-[var(--border-hover)]">|</span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: stats.model_trained ? "var(--ok)" : "var(--text-dim)",
                animation: stats.model_trained ? "ticker-pulse 2s ease-in-out infinite" : undefined,
              }}
            />
            <span className="text-[var(--text-dim)]">pCVR</span>
            <span className={stats.model_trained ? "text-[var(--text)]" : "text-[var(--text-dim)]"}>
              {stats.model_trained ? "trained" : "untrained"}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-[var(--text-dim)]">{label} </span>
      <span className="text-[var(--text-muted)]">{value}</span>
    </span>
  );
}
