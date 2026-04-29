"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdvertisers,
  runAuction,
  type AuctionResponse,
  type Advertiser,
} from "@/lib/api";
import { PipelineCanvas } from "@/components/canvas/PipelineCanvas";
import { Playground } from "@/components/playground/Playground";
import { DetailPanel } from "@/components/panels/DetailPanel";

const SAMPLE_QUERIES = [
  "vay du tiec",
  "vay du tiec gia re",
  "vay du tiec sang trong",
  "vay tien online",
  "vay tieu dung",
  "ve may bay gia re",
  "dat phong khach san",
  "tour phu quoc",
];

export default function Home() {
  const [advertisers, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [advertisersError, setAdvertisersError] = useState<string | null>(null);
  const [query, setQuery] = useState("vay du tiec");
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bidOverrides, setBidOverrides] = useState<Record<number, number>>({});
  const [qsOverrides, setQsOverrides] = useState<Record<number, number>>({});
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<number | null>(null);

  // Debounce timer for slider re-runs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdvertisers().then(setAdvertisers).catch((e) => setAdvertisersError(String(e)));
  }, []);

  const doRun = useCallback(
    async (q: string, bids: Record<number, number>, qs: Record<number, number>) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await runAuction(q, {
          num_slots: 4,
          bid_overrides: bids,
          qs_overrides: qs,
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

  // Re-run on slider change with 200ms debounce
  useEffect(() => {
    if (!auction) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doRun(query, bidOverrides, qsOverrides);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidOverrides, qsOverrides]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidOverrides({});
    setQsOverrides({});
    doRun(query, {}, {});
  };

  const selectedLine = useMemo(() => {
    if (!auction || selectedAdvertiserId === null) return null;
    return auction.lines.find((l) => l.advertiser_id === selectedAdvertiserId) ?? null;
  }, [auction, selectedAdvertiserId]);

  const resetOverrides = () => {
    setBidOverrides({});
    setQsOverrides({});
    if (auction) doRun(query, {}, {});
  };

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto auto 1fr", gridTemplateColumns: "1fr 320px" }}>
      <header
        style={{
          gridColumn: "1 / -1",
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", margin: 0 }}>
          Mini Google Ads
        </h1>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>auction sandbox</span>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
          {advertisers
            ? `${advertisers.length} advertisers`
            : advertisersError
            ? `error: ${advertisersError}`
            : "loading..."}
        </div>
      </header>

      <div style={{ gridColumn: "1 / -1", padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a search query..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "#16213e",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "none",
              background: "var(--accent)",
              color: "#0a0a14",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {loading ? "Running..." : "Run auction"}
          </button>
        </form>
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Try:</span>
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuery(q);
                setBidOverrides({});
                setQsOverrides({});
                doRun(q, {}, {});
              }}
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "#16213e",
                color: "var(--text-dim)",
                fontSize: 11,
              }}
            >
              {q}
            </button>
          ))}
        </div>
        {auction && auction.narration && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "#0f1c2e",
              border: "1px solid #2a3a5a",
              borderRadius: 6,
              fontSize: 12.5,
              color: "#cbd5e1",
              lineHeight: 1.55,
            }}
          >
            <span style={{ color: "var(--accent)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              Narration
            </span>
            <div style={{ marginTop: 4 }}>{auction.narration}</div>
          </div>
        )}
        {error && <div style={{ marginTop: 8, color: "var(--danger)" }}>error: {error}</div>}
      </div>

      <main style={{ position: "relative", borderRight: "1px solid var(--border)" }}>
        <PipelineCanvas
          auction={auction}
          selectedAdvertiserId={selectedAdvertiserId}
          onSelectAdvertiser={setSelectedAdvertiserId}
        />
      </main>

      <aside style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <DetailPanel line={selectedLine} />
        </div>
        <div>
          <Playground
            lines={auction?.lines ?? []}
            bidOverrides={bidOverrides}
            qsOverrides={qsOverrides}
            onBidChange={(id, v) => setBidOverrides((prev) => ({ ...prev, [id]: v }))}
            onQsChange={(id, v) => setQsOverrides((prev) => ({ ...prev, [id]: v }))}
            onReset={resetOverrides}
          />
        </div>
      </aside>
    </div>
  );
}
