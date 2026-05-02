"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdvertisers, runAuction, type AuctionResponse, type Advertiser } from "@/lib/api";
import { Explainer } from "@/components/Explainer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChapterNav, ChapterFooter } from "@/components/ChapterNav";
import { Chapter1Search } from "@/components/chapters/Chapter1Search";
import { Chapter2Bidders } from "@/components/chapters/Chapter2Bidders";
import { Chapter3Winner } from "@/components/chapters/Chapter3Winner";
import { Chapter4GSP } from "@/components/chapters/Chapter4GSP";
import { Chapter5Playground } from "@/components/chapters/Chapter5Playground";

const CHAPTER_TITLES = [
  "Bạn search",
  "Ai đấu giá?",
  "Ai thắng?",
  "Trả bao nhiêu?",
  "Tự chơi",
];

const TOTAL = CHAPTER_TITLES.length;

export default function Home() {
  const [, setAdvertisers] = useState<Advertiser[] | null>(null);
  const [, setAdvertisersError] = useState<string | null>(null);

  const [chapter, setChapter] = useState(0);

  const [query, setQuery] = useState("vay tiền online");
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [bidOverrides, setBidOverrides] = useState<Record<number, number>>({});
  const [qsOverrides, setQsOverrides] = useState<Record<number, number>>({});
  const [simulatedUserId, setSimulatedUserId] = useState<number | null>(null);
  const [numSlots, setNumSlots] = useState(4);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdvertisers().then(setAdvertisers).catch((e) => setAdvertisersError(String(e)));
  }, []);

  const doRun = useCallback(
    async (q: string, bids: Record<number, number>, qs: Record<number, number>, userId: number | null, slots: number) => {
      if (!q.trim()) return;
      setLoading(true);
      try {
        const resp = await runAuction(q, {
          num_slots: slots,
          bid_overrides: bids,
          qs_overrides: qs,
          user_id: userId,
        });
        setAuction(resp);
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

  const onSearch = useCallback(
    (q: string) => {
      setQuery(q);
      setBidOverrides({});
      setQsOverrides({});
      doRun(q, {}, {}, simulatedUserId, numSlots);
    },
    [doRun, simulatedUserId, numSlots],
  );

  const jumpTo = (i: number) => {
    setChapter(Math.max(0, Math.min(TOTAL - 1, i)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => jumpTo(chapter + 1);
  const prev = () => jumpTo(chapter - 1);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Slim header */}
      <header
        className="sticky top-0 z-30 backdrop-blur border-b border-[var(--border)]"
        style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
      >
        <div className="max-w-[1100px] mx-auto px-5 py-2.5 flex items-center gap-3">
          <button
            onClick={() => jumpTo(0)}
            className="flex items-center gap-2 group"
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              μ
            </span>
            <span className="text-[14px] font-semibold tracking-tight group-hover:text-[var(--text-muted)]">
              Mini Google Ads
            </span>
          </button>
          <span className="text-[11px] text-[var(--text-dim)] hidden sm:inline">
            Hiểu Google Ads trong 5 phút
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

      <ChapterNav current={chapter} total={TOTAL} titles={CHAPTER_TITLES} onJump={jumpTo} />

      <main className="px-5">
        {chapter === 0 && (
          <Chapter1Search query={query} onQueryChange={setQuery} onSearch={onSearch} auction={auction} loading={loading} />
        )}
        {chapter === 1 && (
          <Chapter2Bidders query={query} onQueryChange={setQuery} onSearch={onSearch} auction={auction} loading={loading} />
        )}
        {chapter === 2 && (
          <Chapter3Winner query={query} onQueryChange={setQuery} onSearch={onSearch} auction={auction} loading={loading} />
        )}
        {chapter === 3 && (
          <Chapter4GSP query={query} onQueryChange={setQuery} onSearch={onSearch} auction={auction} loading={loading} />
        )}
        {chapter === 4 && (
          <Chapter5Playground
            query={query}
            onQueryChange={setQuery}
            onSearch={onSearch}
            auction={auction}
            loading={loading}
            simulatedUserId={simulatedUserId}
            setSimulatedUserId={setSimulatedUserId}
            numSlots={numSlots}
            setNumSlots={setNumSlots}
            bidOverrides={bidOverrides}
            qsOverrides={qsOverrides}
            onBidChange={(id, v) => setBidOverrides((p) => ({ ...p, [id]: v }))}
            onQsChange={(id, v) => setQsOverrides((p) => ({ ...p, [id]: v }))}
            onResetOverrides={() => {
              setBidOverrides({});
              setQsOverrides({});
              doRun(query, {}, {}, simulatedUserId, numSlots);
            }}
          />
        )}

        <ChapterFooter current={chapter} total={TOTAL} onPrev={prev} onNext={next} />
      </main>
    </div>
  );
}
