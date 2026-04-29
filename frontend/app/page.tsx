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
              Đây là toàn bộ trải nghiệm của user. Họ gõ truy vấn vào Google, thấy một loạt
              kết quả "Sponsored" ở trên cùng. Họ không biết các nhãn hàng đã đấu giá, không
              biết Quality Score, không biết GSP. Họ chỉ thấy quảng cáo và quyết định click.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="váy dự tiệc"
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-[15px] outline-none focus:border-[var(--text)] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] text-[14px] font-medium disabled:opacity-50"
            >
              {loading ? "Running…" : "Search"}
            </button>
          </form>

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

          <div className="mt-2 flex flex-wrap gap-2 items-center">
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

          {error && <div className="mt-3 text-[12px] text-[var(--bad)]">error: {error}</div>}

          {/* Narration callout — written for the user, not the algorithm */}
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

          {/* Sponsored results — what the user actually sees */}
          {auction && (
            <div className="mt-5 space-y-3">
              <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">
                Sponsored results · {winners.length} of {auction.lines.length} bidders shown
              </div>
              {winners.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-[var(--text-muted)] text-[13px]">
                  Không có nhãn hàng nào thắng slot cho truy vấn này.
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
