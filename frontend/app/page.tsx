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
import { BusinessSide } from "@/components/BusinessSide";
import { AlgorithmSide } from "@/components/AlgorithmSide";
import { FlowDiagram } from "@/components/FlowDiagram";
import { LiveStats } from "@/components/LiveStats";

const SAMPLE_QUERIES = [
  "váy dự tiệc",
  "vay tiền online",
  "vé máy bay giá rẻ",
  "tour phú quốc",
  "đặt phòng khách sạn",
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

  const [query, setQuery] = useState("vay tiền online");
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bidOverrides, setBidOverrides] = useState<Record<number, number>>({});
  const [qsOverrides, setQsOverrides] = useState<Record<number, number>>({});

  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<number | null>(null);
  const [simulatedUserId, setSimulatedUserId] = useState<number | null>(null);

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

  useEffect(() => {
    doRun(query, {}, {}, simulatedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <header
        className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}
      >
        <div className="max-w-[920px] mx-auto px-5 py-3 flex items-center gap-4">
          <h1 className="text-[15px] font-semibold tracking-tight">Mini Google Ads</h1>
          <span className="text-[11px] text-[var(--text-dim)]">auction sandbox</span>
          <span className="hidden md:flex items-center pl-3 ml-1 border-l border-[var(--border)]">
            <LiveStats />
          </span>
          <nav className="ml-auto flex items-center gap-3">
            <a href="#user" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]">
              User
            </a>
            <a href="#business" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]">
              Business
            </a>
            <a href="#algorithm" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]">
              Algorithm
            </a>
            <span className="w-px h-4 bg-[var(--border)]" />
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

      <main className="max-w-[920px] mx-auto px-5 pb-24">
        <div className="pt-8">
          <FlowDiagram />
        </div>

        {/* SECTION 1 — USER SIDE */}
        <section id="user" className="pt-2 fade-in">
          <div className="mb-5">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
              1 · Phía user
            </div>
            <h2 className="text-[18px] font-semibold text-[var(--text)] mb-2">
              User search một thứ gì đó
            </h2>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              Đây là toàn bộ trải nghiệm của user. Họ gõ truy vấn vào Google, thấy kết quả
              "Sponsored" ở trên cùng. Họ không biết Quality Score, không biết GSP. Họ chỉ
              thấy quảng cáo và quyết định click.
            </p>
          </div>

          {/* Sample queries + intent above the SERP frame so the frame
             stays visually pure (just like Google does not show your
             history above its SERP). */}
          <div className="mb-3 flex flex-wrap gap-2 items-center">
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
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-[var(--text-dim)]">User intent:</span>
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

          {/* Google-fidelity SERP wrapped in browser chrome. Theme-aware
             via --g-* CSS variables so light + dark both feel native. */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: "var(--g-border)",
              background: "var(--g-bg)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                className="flex-1 flex items-center gap-2 px-3 py-1 rounded-full text-[12px] truncate"
                style={{
                  background: "var(--g-bg)",
                  border: "1px solid var(--g-border)",
                  color: "var(--g-chrome-text)",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="truncate">google.com/search?q={encodeURIComponent(query)}</span>
              </div>
            </div>

            {/* SERP body */}
            <div
              style={{
                padding: "20px 22px 24px",
                fontFamily: "Roboto, arial, sans-serif",
                color: "var(--g-text)",
                background: "var(--g-bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 1, fontSize: 22, fontWeight: 500 }}>
                  <span style={{ color: "#4285f4" }}>G</span>
                  <span style={{ color: "#ea4335" }}>o</span>
                  <span style={{ color: "#fbbc04" }}>o</span>
                  <span style={{ color: "#4285f4" }}>g</span>
                  <span style={{ color: "#34a853" }}>l</span>
                  <span style={{ color: "#ea4335" }}>e</span>
                </div>
                <form onSubmit={onSubmit} style={{ flex: 1, display: "flex" }}>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      borderRadius: 24,
                      border: "1px solid var(--g-search-border)",
                      background: "var(--g-card-bg)",
                      boxShadow: "var(--g-search-shadow)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g-meta)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="váy dự tiệc"
                      style={{
                        flex: 1,
                        border: 0,
                        outline: 0,
                        background: "transparent",
                        fontSize: 15,
                        color: "var(--g-text)",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </form>
              </div>

              {auction && (
                <div style={{ fontSize: 12, color: "var(--g-meta)", marginBottom: 14 }}>
                  Khoảng {auction.lines.length.toLocaleString("vi-VN")} kết quả · {auction.time_ms.toFixed(0)} ms
                </div>
              )}

              {error && (
                <div style={{ fontSize: 13, color: "#c5221f", marginBottom: 12 }}>error: {error}</div>
              )}

              {auction && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {winners.length === 0 ? (
                    <div style={{ fontSize: 14, color: "var(--g-meta)", padding: "20px 0" }}>
                      Không có nhãn hàng nào thắng slot cho truy vấn này.
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

          {/* Narration callout — written for the user, sits below the
             SERP frame (outside the Google-fidelity world, back in our
             palette) so it reads as our voice, not Google's. */}
          {auction && auction.narration && (
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 fade-in">
              <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                Người không biết Google Ads cũng đọc được
              </div>
              <p className="text-[14.5px] leading-relaxed text-[var(--text)]">
                {auction.narration}
              </p>
            </div>
          )}
        </section>

        {/* Section divider */}
        {auction && auction.lines.length > 0 && (
          <div className="my-8 flex items-center gap-3 text-[var(--text-dim)] text-[11px] uppercase tracking-wider">
            <div className="flex-1 h-px bg-[var(--separator)]" />
            <span>Behind the scenes ↓</span>
            <div className="flex-1 h-px bg-[var(--separator)]" />
          </div>
        )}

        {/* SECTION 2 — BUSINESS SIDE */}
        {auction && <BusinessSide lines={auction.lines} query={auction.query} />}

        {/* Section divider */}
        {auction && auction.lines.length > 0 && (
          <div className="my-8 flex items-center gap-3 text-[var(--text-dim)] text-[11px] uppercase tracking-wider">
            <div className="flex-1 h-px bg-[var(--separator)]" />
            <span>Algorithm decides ↓</span>
            <div className="flex-1 h-px bg-[var(--separator)]" />
          </div>
        )}

        {/* SECTION 3 — ALGORITHM SIDE */}
        {auction && (
          <AlgorithmSide
            lines={auction.lines}
            selectedAdvertiserId={selectedAdvertiserId}
            onSelectAdvertiser={setSelectedAdvertiserId}
            bidOverrides={bidOverrides}
            qsOverrides={qsOverrides}
            onBidChange={(id, v) => setBidOverrides((p) => ({ ...p, [id]: v }))}
            onQsChange={(id, v) => setQsOverrides((p) => ({ ...p, [id]: v }))}
            onResetOverrides={() => {
              setBidOverrides({});
              setQsOverrides({});
              doRun(query, {}, {}, simulatedUserId);
            }}
          />
        )}

        <footer className="border-t border-[var(--separator)] pt-4 mt-12 text-[11px] text-[var(--text-dim)]">
          Synthetic data, no real money.{" "}
          {advertisers
            ? `${advertisers.length} advertisers · ${advertisers.reduce(
                (s, a) => s + a.keyword_count,
                0,
              )} keywords`
            : "loading…"}
          {advertisersError && <span className="text-[var(--bad)]"> · API error: {advertisersError}</span>}
        </footer>
      </main>
    </div>
  );
}
