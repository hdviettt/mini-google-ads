"use client";
import { useState } from "react";
import type { AdRankLine } from "@/lib/api";

/**
 * Google-fidelity sponsored ad card. Used in the User section to drop
 * viewers into a familiar mental model: "this is what a Google search
 * result looks like." Hard-coded to Google's actual SERP colors and
 * spacing regardless of theme — the User section is its own visual
 * world separate from the Business / Algorithm sections.
 */

type Props = {
  line: AdRankLine;
  selected: boolean;
  onSelect: () => void;
};

const FAVICON_COLORS = [
  "#1a73e8", "#ea4335", "#fbbc04", "#34a853",
  "#9334e6", "#f29900", "#1e8e3e", "#e8710a",
];

function urlDomain(name: string, finalUrl: string): string {
  if (finalUrl) {
    try {
      const u = new URL(finalUrl);
      return u.hostname.replace(/^www\./, "");
    } catch {}
  }
  return `${name.toLowerCase().replace(/\s+/g, "")}.vn`;
}

function urlPath(finalUrl: string): string {
  if (!finalUrl) return "";
  try {
    const u = new URL(finalUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.length > 0 ? ` › ${parts.join(" › ")}` : "";
  } catch {
    return "";
  }
}

function brandFavicon(name: string): { letter: string; color: string } {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const color = FAVICON_COLORS[Math.abs(hash) % FAVICON_COLORS.length];
  return { letter, color };
}

export function AdResult({ line, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const fav = brandFavicon(line.advertiser_name);
  const domain = urlDomain(line.advertiser_name, line.final_url);
  const path = urlPath(line.final_url);

  return (
    <div
      onClick={onSelect}
      className="rounded-lg cursor-pointer fade-in transition-shadow"
      style={{
        background: "#ffffff",
        border: selected ? "1px solid #1a73e8" : "1px solid transparent",
        boxShadow: selected
          ? "0 0 0 1px #1a73e8 inset"
          : "0 1px 2px rgba(0,0,0,0.04)",
        padding: "14px 16px 12px",
        fontFamily: "Roboto, arial, sans-serif",
      }}
    >
      {/* Top row: Sponsored + favicon + brand + URL breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#202124" }}>
          Sponsored
        </span>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: fav.color,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {fav.letter}
        </div>
        <span style={{ fontSize: 14, color: "#202124", fontWeight: 500 }}>
          {line.advertiser_name}
        </span>
        <span style={{ fontSize: 12, color: "#5f6368" }}>·</span>
        <span style={{ fontSize: 12, color: "#5f6368" }}>
          {domain}
          {path}
        </span>
      </div>

      {/* Headline (Google blue) */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1.3,
          color: "#1a0dab",
          margin: "2px 0 4px",
        }}
      >
        {line.ad_headline || "(no headline)"}
      </h3>

      {/* Description (Google snippet gray) */}
      {line.ad_description && (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.58,
            color: "#4d5156",
            margin: "0 0 4px",
          }}
        >
          {line.ad_description}
        </p>
      )}

      {/* Pedagogical breakdown toggle, intentionally subtle so it
         doesn't break the SERP feel. Click to reveal auction details. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          marginTop: 6,
          padding: 0,
          background: "transparent",
          border: 0,
          color: "#70757a",
          fontSize: 11,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {open ? "Ẩn chi tiết đấu giá" : "Xem chi tiết đấu giá"}
      </button>

      {open && <Breakdown line={line} />}
    </div>
  );
}

function Breakdown({ line }: { line: AdRankLine }) {
  const winning = line.slot_position !== null && line.slot_position !== undefined;
  const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
  const savingsPct =
    winning && line.paid_cpc != null && line.bid > 0
      ? Math.round((1 - line.paid_cpc / line.bid) * 100)
      : 0;

  return (
    <div
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: "1px solid #ebebeb",
        fontSize: 11,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 16px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      <Cell label="Slot" value={winning ? `#${(line.slot_position ?? 0) + 1}` : "Filtered"} />
      <Cell label="Match" value={line.match_type} />
      <Cell label="Bid" value={`${fmt(line.bid)} đ`} />
      <Cell label="Quality Score" value={`${line.quality_score.toFixed(1)} / 10`} />
      <Cell label="Ad Rank" value={fmt(line.ad_rank)} />
      <Cell
        label="Paid CPC"
        value={
          winning && line.paid_cpc != null
            ? `${fmt(line.paid_cpc)} đ${savingsPct > 1 ? ` (−${savingsPct}%)` : ""}`
            : "—"
        }
      />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
      <span style={{ color: "#80868b" }}>{label}</span>
      <span style={{ color: "#202124" }}>{value}</span>
    </div>
  );
}
