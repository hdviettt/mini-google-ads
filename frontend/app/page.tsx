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
import { LiveStats } from "@/components/LiveStats";
import { ControlPanel } from "@/components/ControlPanel";
import { TypewriterText } from "@/components/TypewriterText";
import { AuctionPipelineSVG } from "@/components/canvas/AuctionPipelineSVG";
import { AdRankRace } from "@/components/charts/AdRankRace";
import { GspChart } from "@/components/charts/GspChart";

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [advertisersError, setAdvertisersError] = useState<string | null>(null);

  const [query, setQuery] = useState("vay tiền online");
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bidOverrides, setBidOverrides] = useState<Record<number, number>>({});
  const [qsOverrides, setQsOverrides] = useState<Record<number, number>>({});

  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<number | null>(null);
  const [simulatedUserId, setSimulatedUserId] = useState<number | null>(null);
  const [numSlots, setNumSlots] = useState(4);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdvertisers().then(setAdvertisers).catch((e) => setAdvertisersError(String(e)));
  }, []);

  const doRun = useCallback(
    async (q: string, bids: Record<number, number>, qs: Record<number, number>, userId: number | null, slots: number) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await runAuction(q, {
          num_slots: slots,
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

  useEffect(() => {
    doRun(query, {}, {}, simulatedUserId, numSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!auction) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doRun(query, bidOverrides, qsOverrides, simulatedUserId, numSlots);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidOverrides, qsOverrides, simulatedUserId, numSlots]);

  const winners = useMemo(
    () => auction?.lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined) ?? [],
    [auction],
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header
        className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}
      >
        <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center gap-4">
          <h1 className="text-[15px] font-semibold tracking-tight">Mini Google Ads</h1>
          <span className="hidden md:flex items-center pl-3 ml-1 border-l border-[var(--border)]">
            <LiveStats />
          </span>
          <nav className="ml-auto flex items-center gap-3">
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
          </nav>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-5 pb-12 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5 min-w-0">
          {/* Pipeline canvas — hero. The auction visibly plays out here. */}
          {auction && (
            <AuctionPipelineSVG
              auctionId={auction.auction_id || Date.now()}
              lines={auction.lines}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          )}

          {/* Two-column: SERP on the left, charts on the right. */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
            {/* Google SERP frame */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: "var(--g-border)",
                background: "var(--g-bg)",
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  background: "var(--g-chrome-bg)",
                  borderBottom: "1px solid var(--g-border)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="block w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="block w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
                  <span className="block w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div
                  className="flex-1 flex items-center gap-2 px-3 py-1 rounded-full text-[11px] truncate"
                  style={{
                    background: "var(--g-bg)",
                    border: "1px solid var(--g-border)",
                    color: "var(--g-chrome-text)",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="truncate">google.com/search?q={encodeURIComponent(query)}</span>
                </div>
              </div>

              <div
                style={{
                  padding: "16px 20px 20px",
                  fontFamily: "Roboto, arial, sans-serif",
                  color: "var(--g-text)",
                  background: "var(--g-bg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 1, fontSize: 18, fontWeight: 500 }}>
                    <span style={{ color: "#4285f4" }}>G</span>
                    <span style={{ color: "#ea4335" }}>o</span>
                    <span style={{ color: "#fbbc04" }}>o</span>
                    <span style={{ color: "#4285f4" }}>g</span>
                    <span style={{ color: "#34a853" }}>l</span>
                    <span style={{ color: "#ea4335" }}>e</span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 14px",
                      borderRadius: 22,
                      border: "1px solid var(--g-search-border)",
                      background: "var(--g-card-bg)",
                      boxShadow: "var(--g-search-shadow)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g-meta)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--g-text)" }}>
                      {query}
                    </span>
                  </div>
                </div>

                {auction && (
                  <div style={{ fontSize: 11, color: "var(--g-meta)", marginBottom: 10 }}>
                    Khoảng {auction.lines.length.toLocaleString("vi-VN")} kết quả · {auction.time_ms.toFixed(0)} ms
                  </div>
                )}

                {error && (
                  <div style={{ fontSize: 13, color: "#c5221f", marginBottom: 12 }}>error: {error}</div>
                )}

                {auction && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {winners.length === 0 ? (
                      <div style={{ fontSize: 13, color: "var(--g-meta)", padding: "16px 0" }}>
                        Không có nhãn hàng nào thắng slot.
                      </div>
                    ) : (
                      winners.map((line) => (
                        <AdResult
                          key={line.advertiser_id}
                          line={line}
                          selected={selectedAdvertiserId === line.advertiser_id}
                          onSelect={() =>
                            setSelectedAdvertiserId(
                              selectedAdvertiserId === line.advertiser_id ? null : line.advertiser_id,
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Charts column */}
            <div className="space-y-3">
              {auction && auction.lines.length > 0 && (
                <>
                  <AdRankRace
                    lines={auction.lines}
                    numSlots={Math.max(1, winners.length)}
                    selectedAdvertiserId={selectedAdvertiserId}
                    onSelect={setSelectedAdvertiserId}
                  />
                  {winners.length > 0 && <GspChart lines={auction.lines} />}
                </>
              )}
            </div>
          </div>

          {/* Narration — typewriter-style, attached to the bottom */}
          {auction && auction.narration && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 fade-in">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1.5 flex items-center gap-2">
                Narration
                <span
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
                />
              </div>
              <TypewriterText
                text={auction.narration}
                className="text-[13.5px] leading-relaxed text-[var(--text)]"
              />
            </div>
          )}

          <footer className="border-t border-[var(--separator)] pt-3 mt-2 text-[10.5px] text-[var(--text-dim)] flex items-center gap-3 flex-wrap">
            <span>
              {advertisers
                ? `${advertisers.length} advertisers · ${advertisers.reduce(
                    (s, a) => s + a.keyword_count,
                    0,
                  )} keywords · synthetic data, no real money`
                : "loading…"}
            </span>
            {advertisersError && <span className="text-[var(--bad)]">API error: {advertisersError}</span>}
          </footer>
        </div>

        {/* Sticky control panel */}
        <div className="hidden lg:block">
          <ControlPanel
            query={query}
            onQueryChange={setQuery}
            onSubmit={() => {
              setBidOverrides({});
              setQsOverrides({});
              doRun(query, {}, {}, simulatedUserId, numSlots);
            }}
            loading={loading}
            simulatedUserId={simulatedUserId}
            onUserChange={setSimulatedUserId}
            numSlots={numSlots}
            onNumSlotsChange={setNumSlots}
            lines={auction?.lines ?? []}
            bidOverrides={bidOverrides}
            qsOverrides={qsOverrides}
            onBidChange={(id, v) => setBidOverrides((p) => ({ ...p, [id]: v }))}
            onQsChange={(id, v) => setQsOverrides((p) => ({ ...p, [id]: v }))}
            onReset={() => {
              setBidOverrides({});
              setQsOverrides({});
              doRun(query, {}, {}, simulatedUserId, numSlots);
            }}
          />
        </div>
      </main>
    </div>
  );
}
