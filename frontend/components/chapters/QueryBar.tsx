"use client";

const SAMPLE_QUERIES = [
  "váy dự tiệc",
  "vay tiền online",
  "vé máy bay giá rẻ",
  "tour phú quốc",
  "đặt phòng khách sạn",
];

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  loading: boolean;
};

export function QueryBar({ query, onQueryChange, onSearch, loading }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 max-w-[640px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(query);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Gõ một query — vd: váy dự tiệc"
          className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[14px] outline-none focus:border-[var(--text)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="text-[11px] text-[var(--text-dim)] py-1">Try:</span>
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => {
              onQueryChange(q);
              onSearch(q);
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
    </div>
  );
}
