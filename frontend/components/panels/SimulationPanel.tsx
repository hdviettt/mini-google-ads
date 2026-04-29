"use client";
import { useEffect, useState } from "react";
import { runSimulation, fetchSimulationStats, type SimulationStats } from "@/lib/api";

const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`;

export function SimulationPanel() {
  const [stats, setStats] = useState<any | null>(null);
  const [n, setN] = useState(500);
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<SimulationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () =>
    fetchSimulationStats()
      .then(setStats)
      .catch((e) => setError(String(e)));

  useEffect(() => {
    refresh();
  }, []);

  const onRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await runSimulation(n);
      setLast(r);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 text-[13px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[13px] font-semibold text-[var(--text)]">Simulation</div>
          <div className="text-[11.5px] text-[var(--text-dim)]">
            Synthetic users hitting the auction. Drives Smart Bidding training data.
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={n}
            min={50}
            max={10000}
            step={50}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] text-[12px] outline-none"
          />
          <button
            onClick={onRun}
            disabled={running}
            className="px-3 py-1.5 rounded bg-[var(--text)] text-[var(--bg)] text-[12px] font-medium disabled:opacity-50"
          >
            {running ? "Running…" : `Run ${n}`}
          </button>
        </div>
      </div>
      {error && <div className="text-[11px] text-[var(--bad)] mb-2">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        {last && (
          <div className="rounded-lg border border-[var(--border)] p-3" style={{ background: "var(--bg-elevated)" }}>
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
              Last batch
            </div>
            <Stat label="Queries" value={last.queries.toLocaleString()} />
            <Stat label="Impressions" value={last.impressions.toLocaleString()} />
            <Stat label="Clicks" value={`${last.clicks.toLocaleString()} (${last.ctr_pct.toFixed(2)}%)`} />
            <Stat label="Conversions" value={`${last.conversions.toLocaleString()} (${last.cvr_pct.toFixed(2)}%)`} />
            <Stat label="Spend" value={vnd(last.spend_vnd)} />
            <Stat label="Revenue" value={vnd(last.revenue_vnd)} />
            <Stat label="ROAS" value={`${last.roas.toFixed(2)}×`} accent />
          </div>
        )}

        {stats && (
          <div className="rounded-lg border border-[var(--border)] p-3" style={{ background: "var(--bg-elevated)" }}>
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
              Lifetime totals
            </div>
            <Stat label="Impressions" value={Number(stats.impressions).toLocaleString()} />
            <Stat label="Clicks" value={Number(stats.clicks).toLocaleString()} />
            <Stat label="Conversions" value={Number(stats.conversions).toLocaleString()} />
            <Stat label="Revenue" value={vnd(Number(stats.revenue_vnd ?? 0))} />
            <Stat label="Spend" value={vnd(Number(stats.spend_vnd ?? 0))} />
            <Stat
              label="Smart Bidding model"
              value={stats.model_trained ? "trained" : "not trained"}
              accent={stats.model_trained}
            />
            {!stats.model_trained && Number(stats.impressions) >= 200 && (
              <div className="mt-2 text-[10.5px] text-[var(--warn)]">
                Run <code className="text-[var(--text)] bg-[var(--bg)] px-1 rounded">python scripts/train_bidding_model.py</code> to fit pCVR.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-[11.5px] text-[var(--text-dim)]">{label}</span>
      <span
        className={`text-[12px] ${accent ? "text-[var(--text)] font-semibold" : "text-[var(--text-muted)]"}`}
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {value}
      </span>
    </div>
  );
}
