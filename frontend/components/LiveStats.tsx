"use client";
import { useEffect, useRef, useState } from "react";
import { fetchSimulationStats, runSimulation } from "@/lib/api";

/**
 * Live stats ticker. Polls /simulate/stats every 5s and quietly fires
 * a small simulation batch every 20s in the background so the numbers
 * actually move. Sits in the header so the page feels alive — same
 * 'data flowing' feel as the search-engine dashboard.
 */
type Stats = {
  impressions: number;
  clicks: number;
  conversions: number;
};

const POLL_MS = 5000;
const RUN_MS = 20000;
const RUN_BATCH = 25;

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [flashing, setFlashing] = useState(false);
  const lastSeenRef = useRef<Stats | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    let stopped = false;

    const poll = async () => {
      try {
        const s = await fetchSimulationStats();
        if (stopped) return;
        const next: Stats = {
          impressions: Number(s.impressions ?? 0),
          clicks: Number(s.clicks ?? 0),
          conversions: Number(s.conversions ?? 0),
        };
        const prev = lastSeenRef.current;
        const changed =
          !prev ||
          next.impressions !== prev.impressions ||
          next.clicks !== prev.clicks ||
          next.conversions !== prev.conversions;
        if (changed) {
          setStats(next);
          lastSeenRef.current = next;
          setFlashing(true);
          setTimeout(() => setFlashing(false), 600);
        } else if (!stats) {
          setStats(next);
        }
      } catch {
        // best-effort, ignore
      }
    };

    const tick = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        // Random seed so each batch is different
        await runSimulation(RUN_BATCH, Math.floor(Math.random() * 1_000_000));
        await poll();
      } catch {
        // ignore
      } finally {
        runningRef.current = false;
      }
    };

    poll();
    const pollId = setInterval(poll, POLL_MS);
    const runId = setInterval(tick, RUN_MS);

    return () => {
      stopped = true;
      clearInterval(pollId);
      clearInterval(runId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) {
    return (
      <span className="text-[10.5px] text-[var(--text-dim)] ticker-pulse">
        loading…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 text-[10.5px]" style={{ fontFamily: "ui-monospace, monospace" }}>
      <Stat label="impr" value={stats.impressions} flashing={flashing} />
      <Stat label="clk" value={stats.clicks} flashing={flashing} />
      <Stat label="cvr" value={stats.conversions} flashing={flashing} />
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: runningRef.current ? "var(--warn)" : "var(--ok)",
          animation: "ticker-pulse 1.5s ease-in-out infinite",
        }}
        title="background simulation running every 20s"
      />
    </div>
  );
}

function Stat({ label, value, flashing }: { label: string; value: number; flashing: boolean }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className={flashing ? "text-[var(--text)] counter-flash" : "text-[var(--text-muted)]"}>
        {value.toLocaleString("vi-VN")}
      </span>
    </span>
  );
}
