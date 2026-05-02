"use client";
import { useEffect, useState } from "react";
import {
  fetchRecentAuctions,
  fetchRecentImpressions,
  fetchRecentConversions,
} from "@/lib/api";

type Tab = "auctions" | "impressions" | "conversions";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ExploreTab() {
  const [tab, setTab] = useState<Tab>("auctions");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    const fn =
      tab === "auctions" ? fetchRecentAuctions :
      tab === "impressions" ? fetchRecentImpressions :
      fetchRecentConversions;
    fn(50)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center border-b border-[var(--separator)] px-2">
        {(["auctions", "impressions", "conversions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[var(--text)] text-[var(--text)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-2 text-[10.5px] text-[var(--text-dim)]">
          <span
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: loading ? "var(--warn)" : "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
          />
          {data.length} rows · refreshes every 5s
        </div>
      </div>

      <div style={{ maxHeight: 480, overflowY: "auto" }}>
        {tab === "auctions" && <AuctionsTable rows={data} />}
        {tab === "impressions" && <ImpressionsTable rows={data} />}
        {tab === "conversions" && <ConversionsTable rows={data} />}
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-dim)] py-2 px-3 sticky top-0"
      style={{ background: "var(--bg-card)", textAlign: align ?? "left", borderBottom: "1px solid var(--separator)" }}
    >
      {children}
    </th>
  );
}

function Td({ children, align, mono }: { children: React.ReactNode; align?: "left" | "right" | "center"; mono?: boolean }) {
  return (
    <td
      className="py-1.5 px-3 text-[12px] text-[var(--text-muted)]"
      style={{ textAlign: align ?? "left", fontFamily: mono ? "ui-monospace, monospace" : undefined }}
    >
      {children}
    </td>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-8 text-[var(--text-dim)] text-[12px]">
        No rows yet — run an auction or simulation.
      </td>
    </tr>
  );
}

function AuctionsTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>id</Th><Th>query</Th><Th>intent</Th>
          <Th align="right">bidders</Th><Th align="right">slots</Th><Th align="right">when</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow cols={6} /> : rows.map((r) => (
          <tr key={r.id} className="border-b border-[var(--separator)] hover:bg-[var(--bg-elevated)]">
            <Td mono>#{r.id}</Td>
            <Td>{r.query}</Td>
            <Td>{r.intent_level}</Td>
            <Td align="right" mono>{r.n_bidders}</Td>
            <Td align="right" mono>{r.n_slots}</Td>
            <Td align="right">{relTime(r.created_at)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ImpressionsTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>advertiser</Th><Th>query</Th>
          <Th align="right">slot</Th><Th align="right">paid</Th>
          <Th align="center">click</Th><Th align="center">conv</Th>
          <Th align="right">when</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow cols={7} /> : rows.map((r) => (
          <tr key={r.id} className="border-b border-[var(--separator)] hover:bg-[var(--bg-elevated)]">
            <Td>{r.advertiser}</Td>
            <Td>{r.query}</Td>
            <Td align="right" mono>#{r.slot + 1}</Td>
            <Td align="right" mono>{fmt(r.paid_cpc)} đ</Td>
            <Td align="center">
              {r.clicked ? <span style={{ color: "var(--ok)" }}>●</span> : <span className="text-[var(--text-dim)]">—</span>}
            </Td>
            <Td align="center">
              {r.converted ? <span style={{ color: "var(--ok)" }}>●</span> : <span className="text-[var(--text-dim)]">—</span>}
            </Td>
            <Td align="right">{relTime(r.created_at)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConversionsTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>advertiser</Th><Th>query</Th>
          <Th align="right">paid CPC</Th><Th align="right">value</Th>
          <Th align="right">ROAS</Th><Th align="right">when</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow cols={6} /> : rows.map((r) => {
          const roas = r.paid_cpc > 0 ? r.value_vnd / r.paid_cpc : 0;
          return (
            <tr key={r.id} className="border-b border-[var(--separator)] hover:bg-[var(--bg-elevated)]">
              <Td>{r.advertiser}</Td>
              <Td>{r.query}</Td>
              <Td align="right" mono>{fmt(r.paid_cpc)} đ</Td>
              <Td align="right" mono>{fmt(r.value_vnd)} đ</Td>
              <Td align="right" mono>
                <span style={{ color: roas >= 3 ? "var(--ok)" : roas >= 1 ? "var(--warn)" : "var(--bad)" }}>
                  {roas.toFixed(1)}×
                </span>
              </Td>
              <Td align="right">{relTime(r.created_at)}</Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
