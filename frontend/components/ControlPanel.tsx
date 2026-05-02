"use client";
import type { AdRankLine } from "@/lib/api";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

const SAMPLE_QUERIES = [
  "váy dự tiệc",
  "vay tiền online",
  "vé máy bay giá rẻ",
  "tour phú quốc",
  "đặt phòng khách sạn",
];

const USER_PRESETS: { label: string; id: number | null }[] = [
  { label: "Anon", id: null },
  { label: "High", id: 1 },
  { label: "Med", id: 200 },
  { label: "Low", id: 400 },
];

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  loading: boolean;
  simulatedUserId: number | null;
  onUserChange: (id: number | null) => void;
  numSlots: number;
  onNumSlotsChange: (n: number) => void;
  lines: AdRankLine[];
  bidOverrides: Record<number, number>;
  qsOverrides: Record<number, number>;
  onBidChange: (id: number, v: number) => void;
  onQsChange: (id: number, v: number) => void;
  onReset: () => void;
};

export function ControlPanel({
  query,
  onQueryChange,
  onSubmit,
  loading,
  simulatedUserId,
  onUserChange,
  numSlots,
  onNumSlotsChange,
  lines,
  bidOverrides,
  qsOverrides,
  onBidChange,
  onQsChange,
  onReset,
}: Props) {
  return (
    <aside
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-[12px]"
      style={{ position: "sticky", top: 70, maxHeight: "calc(100vh - 90px)", overflowY: "auto" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">
            Control panel
          </div>
          <div className="text-[12px] font-semibold text-[var(--text)] flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--ok)", animation: "ticker-pulse 1.5s ease-in-out infinite" }}
            />
            Live
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-[10.5px] px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)]"
        >
          Reset
        </button>
      </div>

      {/* Query */}
      <div className="mb-3">
        <Label>Query</Label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] text-[12px] outline-none focus:border-[var(--text)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-2.5 py-1.5 rounded bg-[var(--text)] text-[var(--bg)] text-[11px] font-medium disabled:opacity-50"
          >
            {loading ? "…" : "Run"}
          </button>
        </form>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                onQueryChange(q);
                setTimeout(onSubmit, 0);
              }}
              className={`text-[10.5px] px-1.5 py-0.5 rounded border transition-colors ${
                q === query
                  ? "border-[var(--text)] bg-[var(--bg-elevated)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* User intent */}
      <div className="mb-3">
        <Label>User intent</Label>
        <div className="flex gap-1">
          {USER_PRESETS.map((u) => (
            <button
              key={u.label}
              onClick={() => onUserChange(u.id)}
              className={`flex-1 text-[10.5px] px-2 py-1 rounded border transition-colors ${
                simulatedUserId === u.id
                  ? "border-[var(--text)] bg-[var(--bg-elevated)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slots */}
      <div className="mb-3">
        <Label>
          Slots <span className="text-[var(--text-muted)]">{numSlots}</span>
        </Label>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={numSlots}
          onChange={(e) => onNumSlotsChange(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "var(--text)" }}
        />
      </div>

      {/* Bidders */}
      {lines.length > 0 && (
        <div>
          <Label>Bidders ({lines.length})</Label>
          <div className="space-y-2.5">
            {lines.map((line) => {
              const bid = bidOverrides[line.advertiser_id] ?? line.bid;
              const qs = qsOverrides[line.advertiser_id] ?? line.quality_score;
              const winning = line.slot_position !== null && line.slot_position !== undefined;

              return (
                <div
                  key={line.advertiser_id}
                  className="rounded border border-[var(--border)] p-2"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-[var(--text)] truncate">
                      {line.advertiser_name}
                    </span>
                    {winning ? (
                      <span
                        className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded shrink-0"
                        style={{ background: "var(--slot-1-bg)", color: "var(--slot-1-fg)" }}
                      >
                        #{(line.slot_position ?? 0) + 1}
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)]">—</span>
                    )}
                  </div>
                  <Slider
                    label="bid"
                    value={bid}
                    min={500}
                    max={30000}
                    step={500}
                    display={fmt(bid)}
                    onChange={(v) => onBidChange(line.advertiser_id, v)}
                  />
                  <Slider
                    label="QS"
                    value={qs}
                    min={1}
                    max={10}
                    step={0.1}
                    display={qs.toFixed(1)}
                    onChange={(v) => onQsChange(line.advertiser_id, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] mb-1.5">
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[26px_1fr_50px] items-center gap-1.5 mb-0.5">
      <span className="text-[9.5px] text-[var(--text-dim)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--text)" }}
      />
      <span
        className="text-[10px] text-right text-[var(--text-muted)]"
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {display}
      </span>
    </div>
  );
}
