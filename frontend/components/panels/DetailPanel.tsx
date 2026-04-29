"use client";
import type { AdRankLine } from "@/lib/api";

const vnd = (n: number | null | undefined) =>
  n == null ? "-" : `${Math.round(n).toLocaleString("vi-VN")} VND`;

type Props = {
  line: AdRankLine | null;
};

export function DetailPanel({ line }: Props) {
  if (!line) {
    return (
      <div style={{ padding: 16, color: "var(--text-dim)", fontSize: 12 }}>
        Click an advertiser node to see Ad Rank breakdown.
      </div>
    );
  }
  const winning = line.slot_position !== null && line.slot_position !== undefined;
  const savingsPct =
    winning && line.paid_cpc !== null && line.paid_cpc !== undefined && line.bid > 0
      ? ((1 - line.paid_cpc / line.bid) * 100).toFixed(0)
      : null;

  return (
    <div style={{ padding: 14, fontSize: 12, color: "var(--text)" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        {line.advertiser_name}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 11, marginBottom: 12 }}>
        keyword: {line.keyword_text} · {line.match_type}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: "var(--text-dim)", fontSize: 11, marginBottom: 4 }}>Headline</div>
        <div style={{ fontSize: 12, fontStyle: "italic" }}>{line.ad_headline || "(no headline)"}</div>
      </div>

      <div style={{ borderTop: "1px solid #2a2a4a", paddingTop: 10 }}>
        <Row label="Max bid" value={vnd(line.bid)} />
        <Row label="Quality Score" value={`${line.quality_score.toFixed(1)} / 10`} accent />

        {(line.pctr > 0 || line.ad_relevance > 0 || line.lp_experience > 0) && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "#0c1426",
              border: "1px solid #2a2a4a",
              borderRadius: 6,
            }}
          >
            <div style={{ color: "var(--text-dim)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Quality Score breakdown
            </div>
            <Bar label="pCTR" value={line.pctr * 100} max={30} unit="%" digits={2} />
            <Bar label="Ad relevance" value={line.ad_relevance} max={10} />
            <Bar label="LP experience" value={line.lp_experience} max={10} />
          </div>
        )}

        <div style={{ height: 10 }} />
        <Row
          label="Ad Rank"
          value={Math.round(line.ad_rank).toLocaleString("vi-VN")}
          accent
        />
        <div style={{ height: 8 }} />
        <Row label="Slot" value={winning ? `Position ${(line.slot_position ?? 0) + 1}` : "Filtered"} />
        <Row label="Paid CPC" value={vnd(line.paid_cpc)} accent />
        {savingsPct !== null && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "#0f2d1f",
              border: "1px solid #4ade8033",
              borderRadius: 6,
              color: "#86efac",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <strong>GSP saving:</strong> bid {vnd(line.bid)}, paid {vnd(line.paid_cpc)} ({savingsPct}% off).
            They only need to beat the next ranker, not their full bid.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span
        style={{
          color: accent ? "var(--accent)" : "var(--text)",
          fontWeight: accent ? 600 : 400,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Bar({ label, value, max, unit, digits = 1 }: { label: string; value: number; max: number; unit?: string; digits?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
          {value.toFixed(digits)}{unit || ""}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "#1a1a2e",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#ef4444",
          }}
        />
      </div>
    </div>
  );
}
