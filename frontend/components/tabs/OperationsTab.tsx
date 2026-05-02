"use client";
import { useEffect, useState } from "react";
import { runSimulation, fetchSystemStats, type SystemStats } from "@/lib/api";

type LogLine = { ts: Date; text: string; ok: boolean };

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

export function OperationsTab({ onLog }: { onLog?: (text: string, kind: "sim" | "ok" | "warn") => void }) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [history, setHistory] = useState<LogLine[]>([]);
  const [batchSize, setBatchSize] = useState(500);

  const refresh = () => fetchSystemStats().then(setStats).catch(() => {});

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const logLocal = (text: string, ok = true) => {
    setHistory((h) => [...h.slice(-9), { ts: new Date(), text, ok }]);
  };

  const opRunSim = async () => {
    if (running) return;
    setRunning("sim");
    onLog?.(`Starting simulation (${batchSize} queries)…`, "sim");
    logLocal(`▶ run_simulation(n=${batchSize})…`);
    try {
      const r = await runSimulation(batchSize);
      const msg = `${r.queries} q · ${r.impressions} impr · ${r.clicks} clk · ${r.conversions} conv · ROAS ${r.roas.toFixed(2)}×`;
      logLocal(`✓ done: ${msg}`);
      onLog?.(`Sim done: ${msg}`, "ok");
      await refresh();
    } catch (e: any) {
      logLocal(`✗ error: ${e?.message ?? e}`, false);
      onLog?.(`Sim failed: ${e?.message ?? e}`, "warn");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Simulation card */}
      <Card title="Run simulation" sub="Synthetic users hit the auction. Generates training data for Smart Bidding.">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-[11px] text-[var(--text-dim)]">Batch size</label>
          <input
            type="number"
            value={batchSize}
            min={50}
            max={10000}
            step={50}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] text-[11px]"
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
          <button
            onClick={opRunSim}
            disabled={running !== null}
            className="ml-auto px-3 py-1.5 rounded bg-[var(--text)] text-[var(--bg)] text-[11px] font-medium disabled:opacity-50"
          >
            {running === "sim" ? "Running…" : `Run ${fmt(batchSize)} queries`}
          </button>
        </div>
        <Footnote>
          {stats
            ? `Lifetime: ${fmt(stats.impressions)} impr · ${fmt(stats.clicks)} clk · ${fmt(stats.conversions)} conv`
            : "—"}
        </Footnote>
      </Card>

      {/* Train pCVR card */}
      <Card title="Train pCVR model" sub="Fit LightGBM on logged conversions. Smart Bidding uses this.">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="block w-2 h-2 rounded-full"
            style={{
              background: stats?.model_trained ? "var(--ok)" : "var(--text-dim)",
              animation: stats?.model_trained ? "ticker-pulse 2s ease-in-out infinite" : undefined,
            }}
          />
          <span className="text-[11px] text-[var(--text-muted)]">
            {stats?.model_trained ? "Model trained" : "Model not trained"}
          </span>
          <button
            disabled
            className="ml-auto px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-dim)] text-[11px]"
            title="Run from CLI: python scripts/train_bidding_model.py"
          >
            CLI only
          </button>
        </div>
        <Footnote>
          From shell:{" "}
          <code className="text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1 rounded">
            python scripts/train_bidding_model.py
          </code>
          {stats?.feature_importance_top && stats.feature_importance_top.length > 0 && (
            <span className="block mt-1.5">
              top features:{" "}
              {stats.feature_importance_top.slice(0, 3).map((f) => f.feature).join(" · ")}
            </span>
          )}
        </Footnote>
      </Card>

      {/* Re-embed keywords */}
      <Card title="Re-embed keywords" sub="Recompute broad-match vectors with sentence-transformers.">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-[var(--text-muted)]">
            {stats ? `${stats.keywords_embedded} / ${stats.keywords} embedded` : "—"}
          </span>
          <button
            disabled
            className="ml-auto px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-dim)] text-[11px]"
            title="CLI: python scripts/embed_keywords.py [--force]"
          >
            CLI only
          </button>
        </div>
        <Footnote>
          From shell:{" "}
          <code className="text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1 rounded">
            python scripts/embed_keywords.py
          </code>
        </Footnote>
      </Card>

      {/* Snapshot */}
      <Card title="System snapshot" sub="Aggregate counts updated every 4s.">
        {stats ? (
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]"
            style={{ fontFamily: "ui-monospace, monospace" }}
          >
            <Snap label="advertisers" value={fmt(stats.advertisers)} />
            <Snap label="users" value={fmt(stats.users)} />
            <Snap label="keywords" value={fmt(stats.keywords)} />
            <Snap label="ads" value={fmt(stats.ads)} />
            <Snap label="auctions" value={fmt(stats.auctions)} />
            <Snap label="impressions" value={fmt(stats.impressions)} />
            <Snap label="clicks" value={fmt(stats.clicks)} />
            <Snap label="conversions" value={fmt(stats.conversions)} />
            <Snap label="spend" value={`${fmt(stats.spend_vnd)} đ`} />
            <Snap label="revenue" value={`${fmt(stats.revenue_vnd)} đ`} />
          </div>
        ) : (
          <Footnote>loading…</Footnote>
        )}
      </Card>

      {/* Local log */}
      {history.length > 0 && (
        <div className="md:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2 font-semibold">
            Recent operations
          </div>
          <div
            className="text-[11px]"
            style={{ fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}
          >
            {history.map((h, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[var(--text-dim)]">
                  {h.ts.toLocaleTimeString()}
                </span>
                <span style={{ color: h.ok ? "var(--text-muted)" : "var(--bad)" }}>
                  {h.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="text-[12px] font-semibold text-[var(--text)] mb-0.5">{title}</div>
      <div className="text-[10.5px] text-[var(--text-dim)] mb-3 leading-snug">{sub}</div>
      {children}
    </div>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return <div className="text-[10.5px] text-[var(--text-dim)] leading-relaxed">{children}</div>;
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="text-[var(--text-muted)]">{value}</span>
    </div>
  );
}
