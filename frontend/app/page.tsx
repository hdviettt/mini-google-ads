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
import { ControlPanel } from "@/components/ControlPanel";
import { TypewriterText } from "@/components/TypewriterText";
import { AuctionPipelineSVG } from "@/components/canvas/AuctionPipelineSVG";
import { AdRankRace } from "@/components/charts/AdRankRace";
import { GspChart } from "@/components/charts/GspChart";
import { StatsRibbon } from "@/components/StatsRibbon";
import { LiveLog, type LogEntry } from "@/components/LiveLog";
import { ExploreTab } from "@/components/tabs/ExploreTab";
import { OperationsTab } from "@/components/tabs/OperationsTab";

type Tab = "auction" | "explore" | "ops";

const TAB_LIST: { id: Tab; label: string }[] = [
  { id: "auction", label: "Auction" },
  { id: "explore", label: "Explore" },
  { id: "ops", label: "Operations" },
];

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [advertisersError, setAdvertisersError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("auction");

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

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logCollapsed, setLogCollapsed] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushLog = useCallback((kind: LogEntry["kind"], text: string) => {
    setLogEntries((prev) => {
      const next = [...prev, { ts: new Date(), kind, text }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  useEffect(() => {
    fetchAdvertisers()
      .then((a) => {
        setAdvertisers(a);
        pushLog("ok", `loaded ${a.length} advertisers`);
      })
      .catch((e) => {
        setAdvertisersError(String(e));
        pushLog("error", `advertisers fetch: ${e}`);
      });
  }, [pushLog]);

  const doRun = useCallback(
    async (q: string, bids: Record<number, number>, qs: Record<number, number>, userId: number | null, slots: number) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      const t0 = performance.now();
      try {
        const resp = await runAuction(q, {
          num_slots: slots,
          bid_overrides: bids,
          qs_overrides: qs,
          user_id: userId,
        });
        setAuction(resp);
        pushLog(
          "auction",
          `q="${q}" matched=${resp.matched_count} slots=${resp.slot_count} ${resp.time_ms.toFixed(0)}ms`,
        );
      } catch (e: any) {
        setError(String(e));
        pushLog("error", `auction failed: ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    },
    [pushLog],
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* App header — denser, with tabs */}
      <header
        className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
      >
        <div className="px-5 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              μ
            </div>
            <h1 className="text-[14px] font-semibold tracking-tight">Mini Google Ads</h1>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-0 ml-4">
            {TAB_LIST.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1 text-[12.5px] font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-[var(--text)] text-[var(--text)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
                style={{ marginBottom: -9 }}
              >
                {t.label}
              </button>
            ))}
          </nav>

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

      {/* StatsRibbon below header — always visible across tabs */}
      <StatsRibbon />

      {/* Tab content */}
      <main className="flex-1 px-5 py-4 max-w-[1400px] mx-auto w-full">
        {tab === "auction" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 min-w-0">
            <div className="space-y-4 min-w-0">
              {auction ? (
                <AuctionPipelineSVG
                  auctionId={auction.auction_id || Date.now()}
                  lines={auction.lines}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  loading={loading}
                />
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
                  <div
                    className="inline-block w-3 h-3 rounded-full mb-3"
                    style={{ background: "var(--warn)", animation: "ticker-pulse 0.8s ease-in-out infinite" }}
                  />
                  <div className="text-[12px] text-[var(--text-muted)]">Loading auction…</div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
                <SerpFrame query={query} auction={auction} winners={winners} error={error}
                  selectedAdvertiserId={selectedAdvertiserId} onSelect={setSelectedAdvertiserId} />
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

              {auction && auction.narration && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
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
            </div>

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
          </div>
        )}

        {tab === "explore" && (
          <div className="max-w-[1100px] mx-auto">
            <ExploreTab />
          </div>
        )}

        {tab === "ops" && (
          <div className="max-w-[900px] mx-auto">
            <OperationsTab onLog={(text, kind) => pushLog(kind, text)} />
          </div>
        )}
      </main>

      {/* Floating LiveLog dock — always present, collapsible */}
      <div
        className="fixed bottom-3 right-3 z-40"
        style={{ width: logCollapsed ? 200 : 460, transition: "width 200ms ease" }}
      >
        {logCollapsed ? (
          <button
            onClick={() => setLogCollapsed(false)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[11px] text-left flex items-center gap-2 hover:border-[var(--border-hover)]"
          >
            <span
              className="block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
            />
            <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[10px]">Log</span>
            <span className="text-[var(--text-dim)] ml-auto" style={{ fontFamily: "ui-monospace, monospace" }}>
              {logEntries.length}
            </span>
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setLogCollapsed(true)}
              className="absolute top-2 right-3 z-10 text-[var(--text-dim)] hover:text-[var(--text)] text-[11px] px-1"
              title="collapse"
            >
              −
            </button>
            <LiveLog entries={logEntries} maxHeight={240} />
          </div>
        )}
      </div>

      {advertisersError && (
        <div className="px-5 py-2 text-[11px] text-[var(--bad)] border-t border-[var(--border)]">
          API error: {advertisersError}
        </div>
      )}
    </div>
  );
}

function SerpFrame({
  query, auction, winners, error, selectedAdvertiserId, onSelect,
}: {
  query: string;
  auction: AuctionResponse | null;
  winners: any[];
  error: string | null;
  selectedAdvertiserId: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: "var(--g-border)", background: "var(--g-bg)" }}
    >
      <div
        className="flex items-center gap-3 px-3 py-2"
        style={{ background: "var(--g-chrome-bg)", borderBottom: "1px solid var(--g-border)" }}
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
            <span style={{ flex: 1, fontSize: 13, color: "var(--g-text)" }}>{query}</span>
          </div>
        </div>

        {auction && (
          <div style={{ fontSize: 11, color: "var(--g-meta)", marginBottom: 10 }}>
            Khoảng {auction.lines.length.toLocaleString("vi-VN")} kết quả · {auction.time_ms.toFixed(0)} ms
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "#c5221f", marginBottom: 12 }}>error: {error}</div>}

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
                  onSelect={() => onSelect(selectedAdvertiserId === line.advertiser_id ? null : line.advertiser_id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
