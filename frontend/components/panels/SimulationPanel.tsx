"use client";
import { useEffect, useState } from "react";
import { runSimulation, fetchSimulationStats, type SimulationStats } from "@/lib/api";

const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} VND`;

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
    <div style={{ padding: 12, fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>
        Simulation
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
        <input
          type="number"
          value={n}
          min={50}
          max={10000}
          step={50}
          onChange={(e) => setN(Number(e.target.value))}
          style={{
            width: 80,
            padding: "4px 8px",
            background: "#16213e",
            border: "1px solid #2a2a4a",
            borderRadius: 4,
            color: "var(--text)",
            fontSize: 12,
          }}
        />
        <button
          onClick={onRun}
          disabled={running}
          style={{
            padding: "4px 12px",
            border: "none",
            background: "var(--accent)",
            color: "#0a0a14",
            fontWeight: 600,
            fontSize: 11,
            borderRadius: 4,
          }}
        >
          {running ? "Running..." : `Run ${n} queries`}
        </button>
      </div>
      {error && <div style={{ color: "var(--danger)", fontSize: 11 }}>{error}</div>}

      {last && (
        <div
          style={{
            background: "#0f1c2e",
            border: "1px solid #2a3a5a",
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
            fontSize: 11,
            lineHeight: 1.7,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <div>last run: {last.queries.toLocaleString()} queries</div>
          <div>impressions {last.impressions.toLocaleString()}</div>
          <div>clicks {last.clicks.toLocaleString()} ({last.ctr_pct.toFixed(2)}%)</div>
          <div>conversions {last.conversions.toLocaleString()} ({last.cvr_pct.toFixed(2)}%)</div>
          <div>spend {vnd(last.spend_vnd)}</div>
          <div>revenue {vnd(last.revenue_vnd)}</div>
          <div style={{ color: "var(--accent)" }}>ROAS {last.roas.toFixed(2)}x</div>
        </div>
      )}

      {stats && (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #2a2a4a",
            borderRadius: 6,
            padding: 8,
            fontSize: 11,
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: "var(--text-dim)", fontSize: 10, marginBottom: 4 }}>
            Lifetime totals
          </div>
          <div>impressions {Number(stats.impressions).toLocaleString()}</div>
          <div>clicks {Number(stats.clicks).toLocaleString()}</div>
          <div>conversions {Number(stats.conversions).toLocaleString()}</div>
          <div style={{ marginTop: 4 }}>
            Smart Bidding model:{" "}
            <span style={{ color: stats.model_trained ? "var(--accent)" : "var(--text-dim)" }}>
              {stats.model_trained ? "trained" : "not trained"}
            </span>
          </div>
          {!stats.model_trained && stats.impressions >= 200 && (
            <div style={{ marginTop: 4, color: "var(--accent-2)", fontSize: 10 }}>
              Run `python scripts/train_bidding_model.py` to fit pCVR model.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
