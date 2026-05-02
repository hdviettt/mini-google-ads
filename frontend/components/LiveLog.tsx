"use client";
import { useEffect, useRef } from "react";

export type LogEntry = {
  ts: Date;
  kind: "info" | "auction" | "sim" | "ok" | "warn" | "error";
  text: string;
};

type Props = {
  entries: LogEntry[];
  maxHeight?: number;
};

const KIND_COLOR: Record<LogEntry["kind"], string> = {
  info:    "var(--text-dim)",
  auction: "var(--slot-2-fg)",
  sim:     "var(--accent-2, var(--warn))",
  ok:      "var(--ok)",
  warn:    "var(--warn)",
  error:   "var(--bad)",
};

const KIND_LABEL: Record<LogEntry["kind"], string> = {
  info:    "INFO",
  auction: "AUC",
  sim:     "SIM",
  ok:      "OK",
  warn:    "WARN",
  error:   "ERR",
};

function fmtTs(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function LiveLog({ entries, maxHeight = 220 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
      style={{ overflow: "hidden" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--separator)]">
        <div className="flex items-center gap-2">
          <span
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
          />
          <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Event log
          </span>
        </div>
        <span className="text-[10.5px] text-[var(--text-dim)]" style={{ fontFamily: "ui-monospace, monospace" }}>
          {entries.length} events
        </span>
      </div>
      <div
        className="p-2"
        style={{
          maxHeight,
          overflowY: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 11,
          lineHeight: 1.55,
        }}
      >
        {entries.length === 0 ? (
          <div className="text-center py-6 text-[var(--text-dim)] text-[11px]">Waiting for events…</div>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="flex gap-2 py-0.5 px-1 hover:bg-[var(--bg-elevated)] rounded">
              <span className="text-[var(--text-dim)] shrink-0" style={{ width: 84 }}>
                {fmtTs(e.ts)}
              </span>
              <span
                className="shrink-0 font-bold"
                style={{ color: KIND_COLOR[e.kind], width: 36 }}
              >
                {KIND_LABEL[e.kind]}
              </span>
              <span className="text-[var(--text-muted)]">{e.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
