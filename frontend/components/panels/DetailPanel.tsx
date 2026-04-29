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
        <Row label="Quality Score" value={`${line.quality_score.toFixed(1)} / 10`} />
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
