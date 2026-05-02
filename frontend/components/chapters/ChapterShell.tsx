"use client";

type Props = {
  chapterNum: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

/**
 * Layout for one chapter of the walkthrough. Generous whitespace,
 * Substack-style. Number + title + subtitle stacked at top, big
 * hero visual area below, no sidebars.
 */
export function ChapterShell({ chapterNum, title, subtitle, children }: Props) {
  return (
    <div className="max-w-[860px] mx-auto py-10 fade-in">
      <div className="mb-8">
        <div
          className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-dim)] mb-3"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          Chapter {chapterNum}
        </div>
        <h1 className="text-[32px] sm:text-[36px] font-semibold leading-[1.15] text-[var(--text)] mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-[16px] text-[var(--text-muted)] leading-relaxed max-w-[640px]">
          {subtitle}
        </p>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function ChapterProse({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[640px] text-[15px] leading-[1.7] text-[var(--text-muted)] space-y-4">
      {children}
    </div>
  );
}

export function ChapterAction({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-[640px] rounded-lg px-4 py-3 text-[13.5px] leading-relaxed flex items-start gap-2.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
      }}
    >
      <span
        className="block flex-shrink-0 mt-0.5 text-[var(--accent-2, #fbbf24)]"
        style={{ fontSize: 14 }}
      >
        →
      </span>
      <span>{children}</span>
    </div>
  );
}
