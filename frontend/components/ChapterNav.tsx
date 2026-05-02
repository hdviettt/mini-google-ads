"use client";

type Props = {
  current: number;
  total: number;
  titles: string[];
  onJump: (i: number) => void;
};

/**
 * Top progress: numbered dots with chapter titles on hover. Clickable
 * to jump. Sticky at top, replaces the StatsRibbon.
 */
export function ChapterNav({ current, total, titles, onJump }: Props) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-[1100px] mx-auto px-5 py-3.5 flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const active = i === current;
          const visited = i < current;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className="group flex items-center gap-1.5 transition-opacity"
              title={titles[i]}
            >
              <span
                className="flex items-center justify-center text-[10px] font-bold rounded-full transition-all"
                style={{
                  width: active ? 22 : 18,
                  height: active ? 22 : 18,
                  background: active ? "var(--text)" : visited ? "var(--text-muted)" : "var(--border)",
                  color: active ? "var(--bg)" : visited ? "var(--bg)" : "var(--text-dim)",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {i + 1}
              </span>
              <span
                className={`text-[12px] hidden md:inline transition-colors ${
                  active
                    ? "text-[var(--text)] font-medium"
                    : "text-[var(--text-dim)] group-hover:text-[var(--text-muted)]"
                }`}
              >
                {titles[i]}
              </span>
              {i < total - 1 && (
                <span
                  className="hidden md:block ml-1.5 mr-1.5"
                  style={{
                    width: 16,
                    height: 1,
                    background: visited ? "var(--text-muted)" : "var(--border)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChapterFooter({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-[860px] mx-auto px-5 pt-12 pb-16 border-t border-[var(--separator)] mt-12 flex items-center">
      {current > 0 ? (
        <button
          onClick={onPrev}
          className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-2 group"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Previous</span>
        </button>
      ) : (
        <span />
      )}

      <span className="mx-auto text-[11px] text-[var(--text-dim)]" style={{ fontFamily: "ui-monospace, monospace" }}>
        {current + 1} / {total}
      </span>

      {current < total - 1 ? (
        <button
          onClick={onNext}
          className="px-5 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 transition-all hover:gap-3 group"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          <span>Next</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      ) : (
        <button
          onClick={() => onPrev()}
          className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ↑ Back to top
        </button>
      )}
    </div>
  );
}
