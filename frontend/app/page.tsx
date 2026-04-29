"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdvertisers,
  runAuction,
  type AuctionResponse,
  type Advertiser,
} from "@/lib/api";
import { AdResult } from "@/components/AdResult";
import { Explainer } from "@/components/Explainer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PipelineCanvas } from "@/components/canvas/PipelineCanvas";
import { Playground } from "@/components/playground/Playground";
import { SimulationPanel } from "@/components/panels/SimulationPanel";

const SAMPLE_QUERIES = [
  "vay du tiec",
  "vay tien online",
  "ve may bay gia re",
  "tour phu quoc",
  "dat phong khach san",
];

const USER_PRESETS: { label: string; id: number | null; hint: string }[] = [
  { label: "Anonymous", id: null, hint: "default features" },
  { label: "High intent", id: 1, hint: "ready to buy" },
  { label: "Medium", id: 200, hint: "browsing" },
  { label: "Low intent", id: 400, hint: "comparison shopper" },
];

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [advertisersError, setAdvertisersError] = useState<string | null>(null);

  const [query, setQuery] = useState("vay tien online");
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bidOverrides, setBidOverrides] = useState<Record<number, number>>({});
  const [qsOverrides, setQsOverrides] = useState<Record<number, number>>({});

  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<number | null>(null);
  const [simulatedUserId, setSimulatedUserId] = useState<number | null>(null);

  const [showCanvas, setShowCanvas] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdvertisers().then(setAdvertisers).catch((e) => setAdvertisersError(String(e)));
  }, []);

  const doRun = useCallback(
    async (q: string, bids: Record<number, number>, qs: Record<number, number>, userId: number | null) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await runAuction(q, {
          num_slots: 4,
          bid_overrides: bids,
          qs_overrides: qs,
          user_id: userId,
        });
        setAuction(resp);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Auto-run once on mount
  useEffect(() => {
    doRun(query, {}, {}, simulatedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced re-run when sliders / user changes
  useEffect(() => {
    if (!auction) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doRun(query, bidOverrides, qsOverrides, simulatedUserId);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidOverrides, qsOverrides, simulatedUserId]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidOverrides({});
    setQsOverrides({});
    doRun(query, {}, {}, simulatedUserId);
  };

  const selectedLine = useMemo(() => {
    if (!auction || selectedAdvertiserId === null) return null;
    return auction.lines.find((l) => l.advertiser_id === selectedAdvertiserId) ?? null;
  }, [auction, selectedAdvertiserId]);

  const winners = useMemo(
    () => auction?.lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined) ?? [],
    [auction],
  );
  const filtered = useMemo(
    () => auction?.lines.filter((l) => l.slot_position === null || l.slot_position === undefined) ?? [],
    [auction],
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}>
        <div className="max-w-[920px] mx-auto px-5 py-3 flex items-center gap-4">
          <h1 className="text-[15px] font-semibold tracking-tight">
            Mini Google Ads
          </h1>
          <span className="text-[11px] text-[var(--text-dim)]">
            auction sandbox
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Explainer />
            <a
              href="https://github.com/hdviettt/mini-google-ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[920px] mx-auto px-5 pb-24">
        {/* Search */}
        <section className="pt-8 pb-4 fade-in">
          <p className="text-[13px] text-[var(--text-muted)] mb-2">
            Type a search query. Watch advertisers compete for slots in a real-time auction.
          </p>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="vay du tiec"
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-[15px] outline-none focus:border-[var(--text)] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] text-[14px] font-medium disabled:opacity-50"
            >
              {loading ? "Running…" : "Run auction"}
            </button>
          </form>

          {/* Sample queries */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-[var(--text-dim)]">Try:</span>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q);
                  setBidOverrides({});
                  setQsOverrides({});
                  doRun(q, {}, {}, simulatedUserId);
                }}
                className={`text-[11.5px] px-2.5 py-1 rounded-full border transition-colors ${
                  q === query
                    ? "border-[var(--text)] bg-[var(--bg-elevated)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* User signal */}
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-[var(--text-dim)]">User signal:</span>
            {USER_PRESETS.map((u) => (
              <button
                key={u.label}
                onClick={() => setSimulatedUserId(u.id)}
                title={u.hint}
                className={`text-[11.5px] px-2.5 py-1 rounded-full border transition-colors ${
                  simulatedUserId === u.id
                    ? "border-[var(--text)] bg-[var(--bg-elevated)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 text-[12px] text-[var(--bad)]">error: {error}</div>
          )}
        </section>

        {/* Narration callout */}
        {auction && auction.narration && (
          <section className="pb-5 fade-in">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                What happened
              </div>
              <p className="text-[14.5px] leading-relaxed text-[var(--text)]">
                {auction.narration}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--text-dim)]">
                <span>matched: {auction.matched_count}</span>
                <span>eligible: {auction.eligible_count}</span>
                <span>slots filled: {auction.slot_count}</span>
                <span>{auction.time_ms.toFixed(0)} ms</span>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {auction && (
          <section className="space-y-3 pb-8">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">
              Sponsored results
            </div>
            {winners.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-[var(--text-muted)] text-[13px]">
                No advertisers won a slot for this query.
              </div>
            ) : (
              winners.map((line, idx) => (
                <AdResult
                  key={line.advertiser_id}
                  line={line}
                  rank={idx + 1}
                  selected={selectedAdvertiserId === line.advertiser_id}
                  onSelect={() =>
                    setSelectedAdvertiserId(
                      selectedAdvertiserId === line.advertiser_id ? null : line.advertiser_id,
                    )
                  }
                />
              ))
            )}

            {filtered.length > 0 && (
              <div className="pt-3">
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                  Filtered ({filtered.length}) — eligible but did not clear reserve
                </div>
                <div className="space-y-2 opacity-70">
                  {filtered.map((line, idx) => (
                    <AdResult
                      key={line.advertiser_id}
                      line={line}
                      rank={winners.length + idx + 1}
                      selected={selectedAdvertiserId === line.advertiser_id}
                      onSelect={() =>
                        setSelectedAdvertiserId(
                          selectedAdvertiserId === line.advertiser_id ? null : line.advertiser_id,
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Playground (always visible when there's a result) */}
        {auction && auction.lines.length > 0 && (
          <section className="pb-8">
            <Playground
              lines={auction.lines}
              bidOverrides={bidOverrides}
              qsOverrides={qsOverrides}
              onBidChange={(id, v) => setBidOverrides((p) => ({ ...p, [id]: v }))}
              onQsChange={(id, v) => setQsOverrides((p) => ({ ...p, [id]: v }))}
              onReset={() => {
                setBidOverrides({});
                setQsOverrides({});
                doRun(query, {}, {}, simulatedUserId);
              }}
            />
          </section>
        )}

        {/* Pipeline canvas (advanced, collapsed by default) */}
        <section className="pb-8">
          <button
            onClick={() => setShowCanvas((s) => !s)}
            className="text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text)] py-2"
          >
            {showCanvas ? "▾" : "▸"} {showCanvas ? "Hide" : "Show"} auction pipeline canvas
          </button>
          {showCanvas && (
            <div className="mt-3 rounded-xl border border-[var(--border)] overflow-hidden" style={{ height: 560 }}>
              <PipelineCanvas
                auction={auction}
                selectedAdvertiserId={selectedAdvertiserId}
                onSelectAdvertiser={setSelectedAdvertiserId}
              />
            </div>
          )}
        </section>

        {/* Simulation (advanced, collapsed by default) */}
        <section className="pb-12">
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
        </section>

        <footer className="border-t border-[var(--separator)] pt-4 text-[11px] text-[var(--text-dim)]">
          Synthetic data, no real money. {advertisers ? `${advertisers.length} advertisers · ${advertisers.reduce((s, a) => s + a.keyword_count, 0)} keywords` : "loading…"}
          {advertisersError && <span className="text-[var(--bad)]"> · API error: {advertisersError}</span>}
        </footer>
      </main>
    </div>
  );
}
