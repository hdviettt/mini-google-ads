"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdRankLine } from "@/lib/api";

/**
 * Hand-positioned SVG pipeline visualization, search-engine style.
 * Three lanes (Setup · Stores · Query), particles flowing on edges
 * when an auction runs, hover tooltips showing real data per node.
 */

type NodeKind = "process" | "store" | "io" | "ml";

type NodeDef = {
  id: string;
  label: string;
  sub?: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  kind: NodeKind;
  lane: "setup" | "stores" | "query";
};

type EdgeDef = {
  id: string;
  from: string;
  to: string;
  path: string;
  dashed?: boolean;
  particleDelayMs?: number;
};

const VIEW_W = 880;
const VIEW_H = 700;

const LANES = [
  { label: "Setup",  sub: "(once)",          y: 0,   h: 200, bg: "var(--bg-elevated)" },
  { label: "Stores", sub: "(state)",         y: 200, h: 110, bg: "var(--bg-card)" },
  { label: "Query",  sub: "(every search)",  y: 310, h: 390, bg: "var(--bg-elevated)" },
];

const KIND_COLOR: Record<NodeKind, { fill: string; stroke: string; active: string; label: string }> = {
  process: { fill: "#ccd0dc", stroke: "#8898b0", active: "#9aaac4", label: "#1a1a1a" },
  store:   { fill: "#ddd8c4", stroke: "#b0a880", active: "#c8c090", label: "#1a1a1a" },
  io:      { fill: "#d0d8d4", stroke: "#88a8a0", active: "#98c0b8", label: "#1a1a1a" },
  ml:      { fill: "#ccccd8", stroke: "#8888a8", active: "#9898c0", label: "#1a1a1a" },
};

const NODES: NodeDef[] = [
  { id: "advertiser", label: "Advertiser",   sub: "10 brands",      cx: 110, cy: 60,  w: 130, h: 44, kind: "io",      lane: "setup"  },
  { id: "campaign",   label: "Campaign",     sub: "+ KPIs",         cx: 290, cy: 60,  w: 120, h: 44, kind: "process", lane: "setup"  },
  { id: "keywords",   label: "Keywords",     sub: "exact/phrase/broad", cx: 470, cy: 60,  w: 160, h: 44, kind: "process", lane: "setup"  },
  { id: "ads",        label: "Ads",          sub: "headlines + LP", cx: 660, cy: 60,  w: 130, h: 44, kind: "process", lane: "setup"  },

  { id: "embedder",   label: "Embedder",     sub: "all-MiniLM-L6",  cx: 470, cy: 140, w: 150, h: 40, kind: "ml",      lane: "setup"  },
  { id: "trainer",    label: "Train pCVR",   sub: "LightGBM",       cx: 800, cy: 140, w: 110, h: 40, kind: "ml",      lane: "setup"  },

  { id: "campaign_db", label: "Campaign DB",       sub: "Postgres",                                cx: 110, cy: 255, w: 130, h: 44, kind: "store", lane: "stores" },
  { id: "kw_vectors",  label: "Keyword Vectors",   sub: "pgvector",                                cx: 290, cy: 255, w: 150, h: 44, kind: "store", lane: "stores" },
  { id: "conv_logs",   label: "Impression / Click / Conversion Logs", sub: "events",               cx: 540, cy: 255, w: 320, h: 44, kind: "store", lane: "stores" },
  { id: "pcvr_model",  label: "pCVR Model",        sub: "LightGBM .txt",                           cx: 800, cy: 200, w: 110, h: 38, kind: "ml",    lane: "stores" },

  { id: "query",       label: "User Query",        sub: "with intent",      cx: 110, cy: 360, w: 130, h: 44, kind: "io",      lane: "query" },
  { id: "match",       label: "Match Lookup",      sub: "exact + phrase + broad", cx: 290, cy: 360, w: 175, h: 44, kind: "process", lane: "query" },
  { id: "qs",          label: "Quality Score",     sub: "pCTR · Rel · LP",  cx: 500, cy: 360, w: 165, h: 44, kind: "process", lane: "query" },
  { id: "smart_bid",   label: "Smart Bidding",     sub: "Manual / Auto",    cx: 700, cy: 360, w: 140, h: 44, kind: "ml",      lane: "query" },

  { id: "ad_rank",     label: "Ad Rank",           sub: "Bid × QS",         cx: 290, cy: 460, w: 130, h: 44, kind: "process", lane: "query" },
  { id: "gsp",         label: "GSP Pricing",       sub: "min to beat next", cx: 470, cy: 460, w: 150, h: 44, kind: "process", lane: "query" },
  { id: "slots",       label: "Slot Allocation",   sub: "top N",            cx: 660, cy: 460, w: 140, h: 44, kind: "process", lane: "query" },

  { id: "impression",  label: "Impression",        sub: "shown to user",    cx: 290, cy: 560, w: 130, h: 44, kind: "io",      lane: "query" },
  { id: "click",       label: "Click?",            sub: "stochastic",       cx: 470, cy: 560, w: 110, h: 44, kind: "io",      lane: "query" },
  { id: "convert",     label: "Convert?",          sub: "stochastic",       cx: 640, cy: 560, w: 120, h: 44, kind: "io",      lane: "query" },

  { id: "narration",   label: "Narration",         sub: "Vietnamese",       cx: 110, cy: 640, w: 130, h: 44, kind: "io",      lane: "query" },
];

function edgePath(from: NodeDef, to: NodeDef): string {
  const sameY = from.cy === to.cy;
  const sameX = from.cx === to.cx;
  if (sameY) {
    const startX = from.cx < to.cx ? from.cx + from.w / 2 : from.cx - from.w / 2;
    const endX   = from.cx < to.cx ? to.cx - to.w / 2     : to.cx + to.w / 2;
    return `M ${startX} ${from.cy} H ${endX}`;
  }
  if (sameX) {
    const startY = from.cy < to.cy ? from.cy + from.h / 2 : from.cy - from.h / 2;
    const endY   = from.cy < to.cy ? to.cy - to.h / 2     : to.cy + to.h / 2;
    return `M ${from.cx} ${startY} V ${endY}`;
  }
  const startY = from.cy < to.cy ? from.cy + from.h / 2 : from.cy - from.h / 2;
  const endX   = to.cx;
  const endY   = from.cy < to.cy ? to.cy - to.h / 2     : to.cy + to.h / 2;
  return `M ${from.cx} ${startY} V ${(from.cy + to.cy) / 2} H ${endX} V ${endY}`;
}

const NODE_BY_ID: Record<string, NodeDef> = Object.fromEntries(NODES.map((n) => [n.id, n]));

const EDGES: EdgeDef[] = [
  { id: "e_adv_camp",   from: "advertiser", to: "campaign", path: edgePath(NODE_BY_ID.advertiser, NODE_BY_ID.campaign) },
  { id: "e_camp_kw",    from: "campaign",   to: "keywords", path: edgePath(NODE_BY_ID.campaign, NODE_BY_ID.keywords) },
  { id: "e_kw_ads",     from: "keywords",   to: "ads",      path: edgePath(NODE_BY_ID.keywords, NODE_BY_ID.ads) },

  { id: "e_kw_emb",     from: "keywords",   to: "embedder", path: edgePath(NODE_BY_ID.keywords, NODE_BY_ID.embedder), dashed: true },
  { id: "e_emb_kwv",    from: "embedder",   to: "kw_vectors", path: edgePath(NODE_BY_ID.embedder, NODE_BY_ID.kw_vectors), dashed: true },

  { id: "e_camp_db",    from: "campaign",   to: "campaign_db", path: edgePath(NODE_BY_ID.campaign, NODE_BY_ID.campaign_db), dashed: true },
  { id: "e_ads_db",     from: "ads",        to: "campaign_db", path: edgePath(NODE_BY_ID.ads, NODE_BY_ID.campaign_db), dashed: true },

  { id: "e_logs_train", from: "conv_logs",  to: "trainer",    path: edgePath(NODE_BY_ID.conv_logs, NODE_BY_ID.trainer), dashed: true },
  { id: "e_train_pcvr", from: "trainer",    to: "pcvr_model", path: edgePath(NODE_BY_ID.trainer, NODE_BY_ID.pcvr_model), dashed: true },

  { id: "e_q_match",    from: "query",      to: "match",   path: edgePath(NODE_BY_ID.query, NODE_BY_ID.match), particleDelayMs: 0 },
  { id: "e_db_match",   from: "campaign_db", to: "match",  path: edgePath(NODE_BY_ID.campaign_db, NODE_BY_ID.match) },
  { id: "e_kwv_match",  from: "kw_vectors",  to: "match",  path: edgePath(NODE_BY_ID.kw_vectors, NODE_BY_ID.match) },

  { id: "e_match_qs",   from: "match",      to: "qs",      path: edgePath(NODE_BY_ID.match, NODE_BY_ID.qs), particleDelayMs: 200 },
  { id: "e_qs_sb",      from: "qs",         to: "smart_bid", path: edgePath(NODE_BY_ID.qs, NODE_BY_ID.smart_bid), particleDelayMs: 380 },
  { id: "e_pcvr_sb",    from: "pcvr_model", to: "smart_bid", path: edgePath(NODE_BY_ID.pcvr_model, NODE_BY_ID.smart_bid) },

  { id: "e_sb_ar",      from: "smart_bid",  to: "ad_rank", path: edgePath(NODE_BY_ID.smart_bid, NODE_BY_ID.ad_rank), particleDelayMs: 540 },
  { id: "e_qs_ar",      from: "qs",         to: "ad_rank", path: edgePath(NODE_BY_ID.qs, NODE_BY_ID.ad_rank), particleDelayMs: 540 },

  { id: "e_ar_gsp",     from: "ad_rank",    to: "gsp",     path: edgePath(NODE_BY_ID.ad_rank, NODE_BY_ID.gsp), particleDelayMs: 700 },
  { id: "e_gsp_slot",   from: "gsp",        to: "slots",   path: edgePath(NODE_BY_ID.gsp, NODE_BY_ID.slots), particleDelayMs: 860 },

  { id: "e_slot_imp",   from: "slots",      to: "impression", path: `M 660 482 V 510 H 290 V 538`, particleDelayMs: 1020 },
  { id: "e_imp_click",  from: "impression", to: "click",   path: edgePath(NODE_BY_ID.impression, NODE_BY_ID.click), particleDelayMs: 1180 },
  { id: "e_click_conv", from: "click",      to: "convert", path: edgePath(NODE_BY_ID.click, NODE_BY_ID.convert), particleDelayMs: 1340 },
  { id: "e_conv_logs",  from: "convert",    to: "conv_logs", path: `M 640 538 V 510 H 540 V 277`, dashed: true, particleDelayMs: 1500 },

  { id: "e_slots_narr", from: "slots",      to: "narration", path: `M 660 482 V 530 H 110 V 618`, dashed: true, particleDelayMs: 1100 },
];

const STAGES: { delayMs: number; ids: string[] }[] = [
  { delayMs: 0,    ids: ["query"] },
  { delayMs: 150,  ids: ["match", "campaign_db", "kw_vectors"] },
  { delayMs: 350,  ids: ["qs"] },
  { delayMs: 550,  ids: ["smart_bid", "pcvr_model"] },
  { delayMs: 700,  ids: ["ad_rank"] },
  { delayMs: 850,  ids: ["gsp"] },
  { delayMs: 1000, ids: ["slots"] },
  { delayMs: 1150, ids: ["impression"] },
  { delayMs: 1300, ids: ["click"] },
  { delayMs: 1450, ids: ["convert", "conv_logs"] },
  { delayMs: 1600, ids: ["narration"] },
];

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const vnd = (n: number | null | undefined) => (n == null ? "-" : `${fmt(n)} đ`);

type Props = {
  auctionId: number;
  lines: AdRankLine[];
  selectedNodeId?: string | null;
  onSelectNode?: (id: string | null) => void;
  loading?: boolean;
};

export function AuctionPipelineSVG({ auctionId, lines, selectedNodeId, onSelectNode, loading }: Props) {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [particleKey, setParticleKey] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIds(new Set());
    setParticleKey((k) => k + 1);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((stage) => {
      timeouts.push(
        setTimeout(() => {
          setActiveIds((prev) => {
            const next = new Set(prev);
            stage.ids.forEach((id) => next.add(id));
            return next;
          });
        }, stage.delayMs),
      );
    });
    return () => timeouts.forEach(clearTimeout);
  }, [auctionId]);

  const winners = lines.filter((l) => l.slot_position !== null && l.slot_position !== undefined);

  const tooltipText = useMemo(() => {
    if (!hoverId) return null;
    const top = lines[0];
    switch (hoverId) {
      case "query":       return `User query passes through with intent + device + geo`;
      case "match":       return `${lines.length} keyword${lines.length === 1 ? "" : "s"} matched (exact + phrase + broad)`;
      case "qs":          return top
        ? `Top advertiser QS ${top.quality_score.toFixed(1)}/10 (pCTR ${(top.pctr * 100).toFixed(2)}%, rel ${top.ad_relevance.toFixed(1)}, LP ${top.lp_experience.toFixed(1)})`
        : "QS = pCTR + ad relevance + landing page experience";
      case "smart_bid":   return top
        ? `${top.bid_strategy} → bid ${vnd(top.bid)} (predicted CVR ${(top.predicted_pcvr * 100).toFixed(2)}%)`
        : "Consults pCVR model to decide bid per query";
      case "ad_rank":     return top
        ? `Top Ad Rank: ${fmt(top.ad_rank)} (${vnd(top.bid)} × ${top.quality_score.toFixed(1)})`
        : "Ad Rank = Bid × Quality Score";
      case "gsp":         return winners[0]
        ? `Slot 1 winner pays ${vnd(winners[0].paid_cpc)}, bid was ${vnd(winners[0].bid)}`
        : "GSP: pay min to beat next ranker";
      case "slots":       return `${winners.length} slot${winners.length === 1 ? "" : "s"} filled out of ${lines.length} bidders`;
      case "impression":  return `Top ad shown at slot 1: ${winners[0]?.advertiser_name ?? "—"}`;
      case "click":       return `CTR depends on Quality Score, slot, intent`;
      case "convert":     return `Conversion outcome feeds back into Smart Bidding training`;
      case "conv_logs":   return `Append-only events feed the LightGBM trainer`;
      case "pcvr_model":  return `Predicts P(conversion | query, user signals)`;
      case "embedder":    return `Embeds keywords once for broad-match cosine similarity`;
      case "trainer":     return `Trains pCVR model on logged conversions`;
      case "campaign_db": return `Postgres tables: advertisers, campaigns, keywords, ads`;
      case "kw_vectors":  return `pgvector index for broad-match nearest neighbors`;
      case "narration":   return `Vietnamese explanation of this auction outcome`;
      default:            return null;
    }
  }, [hoverId, lines, winners]);

  return (
    <div
      ref={wrapperRef}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 relative"
      style={{ opacity: loading ? 0.65 : 1, transition: "opacity 200ms ease" }}
    >
      <div className="flex items-baseline justify-between mb-2 px-2">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">Pipeline</div>
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            Auction flow · hover for details · click to focus
          </h3>
        </div>
        <div className="text-[10.5px] text-[var(--text-dim)] flex items-center gap-2">
          {loading && (
            <span
              className="block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--warn)", animation: "ticker-pulse 0.8s ease-in-out infinite" }}
            />
          )}
          {winners.length} of {lines.length} won slots
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          style={{ display: "block" }}
          onMouseLeave={() => {
            setHoverId(null);
            setHoverPos(null);
          }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" opacity="0.55" />
            </marker>
          </defs>

          {LANES.map((lane) => (
            <g key={lane.label}>
              <rect x={0} y={lane.y} width={VIEW_W} height={lane.h} fill={lane.bg} opacity={0.5} />
              <text
                x={14}
                y={lane.y + 22}
                fontSize={11}
                fontWeight={700}
                fill="var(--text-muted)"
                style={{ textTransform: "uppercase", letterSpacing: 1.2 }}
              >
                {lane.label}
              </text>
              <text x={56} y={lane.y + 22} fontSize={10} fill="var(--text-dim)">
                {lane.sub}
              </text>
            </g>
          ))}

          <g>
            {EDGES.map((e) => (
              <g key={`${e.id}-${particleKey}`}>
                <path
                  d={e.path}
                  fill="none"
                  stroke="var(--text-dim)"
                  strokeWidth={1.2}
                  strokeDasharray={e.dashed ? "4 4" : undefined}
                  opacity={0.42}
                  markerEnd="url(#arrow)"
                />
                {e.particleDelayMs !== undefined && (
                  <circle r="3.5" fill="var(--ok)">
                    <animateMotion
                      dur="0.8s"
                      begin={`${e.particleDelayMs / 1000}s`}
                      fill="freeze"
                      repeatCount="1"
                      path={e.path}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      keyTimes="0;0.1;0.9;1"
                      dur="0.8s"
                      begin={`${e.particleDelayMs / 1000}s`}
                      fill="freeze"
                      repeatCount="1"
                    />
                  </circle>
                )}
              </g>
            ))}
          </g>

          <g>
            {NODES.map((n) => {
              const active = activeIds.has(n.id);
              const selected = selectedNodeId === n.id;
              const hovered = hoverId === n.id;
              const c = KIND_COLOR[n.kind];
              const x = n.cx - n.w / 2;
              const y = n.cy - n.h / 2;
              return (
                <g
                  key={n.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectNode?.(selected ? null : n.id)}
                  onMouseEnter={(e) => {
                    setHoverId(n.id);
                    if (wrapperRef.current) {
                      const rect = wrapperRef.current.getBoundingClientRect();
                      setHoverPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (wrapperRef.current) {
                      const rect = wrapperRef.current.getBoundingClientRect();
                      setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={n.w}
                    height={n.h}
                    rx={7}
                    ry={7}
                    fill={active ? c.active : c.fill}
                    stroke={selected ? "var(--text)" : c.stroke}
                    strokeWidth={selected ? 2 : hovered ? 1.6 : 1.2}
                    style={{
                      transition: "fill 280ms ease, stroke-width 150ms ease",
                      filter: active
                        ? "drop-shadow(0 0 8px rgba(74,222,128,0.55))"
                        : hovered
                        ? "drop-shadow(0 1px 4px rgba(0,0,0,0.18))"
                        : undefined,
                    }}
                  />
                  <text x={n.cx} y={n.cy + (n.sub ? -3 : 4)} textAnchor="middle" fontSize={12} fontWeight={600} fill={c.label}>
                    {n.label}
                  </text>
                  {n.sub && (
                    <text x={n.cx} y={n.cy + 11} textAnchor="middle" fontSize={9.5} fill="#3a3a3a" opacity={0.72}>
                      {n.sub}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {hoverId && tooltipText && hoverPos && (
          <div
            className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-[11px] leading-tight"
            style={{
              left: Math.min(hoverPos.x + 12, (wrapperRef.current?.clientWidth ?? 0) - 280),
              top: hoverPos.y + 14,
              maxWidth: 260,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              zIndex: 10,
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>

      <div className="mt-2 px-2 flex items-center gap-3 text-[10px] text-[var(--text-dim)] flex-wrap">
        <Legend color={KIND_COLOR.io.fill} stroke={KIND_COLOR.io.stroke}>IO</Legend>
        <Legend color={KIND_COLOR.process.fill} stroke={KIND_COLOR.process.stroke}>Process</Legend>
        <Legend color={KIND_COLOR.store.fill} stroke={KIND_COLOR.store.stroke}>Store</Legend>
        <Legend color={KIND_COLOR.ml.fill} stroke={KIND_COLOR.ml.stroke}>ML</Legend>
        <span className="flex items-center gap-1.5">
          <span className="block w-2 h-2 rounded-full" style={{ background: "var(--ok)" }} />
          Particle = data flow
        </span>
        <span className="ml-auto">Dashed = offline / one-time</span>
      </div>
    </div>
  );
}

function Legend({ color, stroke, children }: { color: string; stroke: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="block w-2 h-2 rounded-sm" style={{ background: color, border: `1px solid ${stroke}` }} />
      {children}
    </span>
  );
}
