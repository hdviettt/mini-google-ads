"use client";

type Props = {
  score: number;       // in [1, 10]
  pctr: number;        // raw probability in [0, 1]
  adRelevance: number; // in [1, 10]
  lpExperience: number;// in [1, 10]
};

/**
 * Visual Quality Score gauge for the Business cards. Shows a circular
 * gauge with the QS in the middle, plus three small bars for the
 * components. Reads at a glance: green = good, amber = ok, red = bad.
 */
export function QualityGauge({ score, pctr, adRelevance, lpExperience }: Props) {
  const pct = Math.max(0, Math.min(1, score / 10));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const color = score >= 7 ? "var(--ok)" : score >= 4 ? "var(--warn)" : "var(--bad)";

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
        <svg width="56" height="56" className="-rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="var(--score-bar-bg)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 500ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[14px] font-semibold text-[var(--text)]" style={{ fontFamily: "ui-monospace, monospace" }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <Mini label="pCTR" value={pctr * 100} max={30} unit="%" digits={2} />
        <Mini label="Relevance" value={adRelevance} max={10} digits={1} />
        <Mini label="LP" value={lpExperience} max={10} digits={1} />
      </div>
    </div>
  );
}

function Mini({ label, value, max, unit, digits = 1 }: { label: string; value: number; max: number; unit?: string; digits?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct >= 70 ? "var(--ok)" : pct >= 40 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="grid grid-cols-[60px_1fr_44px] items-center gap-2 text-[10.5px]">
      <span className="text-[var(--text-dim)]">{label}</span>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--score-bar-bg)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-right text-[var(--text-muted)]" style={{ fontFamily: "ui-monospace, monospace" }}>
        {value.toFixed(digits)}{unit || ""}
      </span>
    </div>
  );
}
