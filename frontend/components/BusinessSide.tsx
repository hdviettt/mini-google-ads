"use client";
import type { AdRankLine } from "@/lib/api";
import { QualityGauge } from "@/components/charts/QualityGauge";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const vnd = (n: number | null | undefined) =>
  n == null ? "-" : `${fmt(n)} đ`;

const STRATEGY_LABEL: Record<string, string> = {
  manual_cpc: "Manual CPC",
  target_roas: "Target ROAS",
  target_cpa: "Target CPA",
  maximize_conversions: "Maximize Conversions",
};

const STRATEGY_HINT: Record<string, string> = {
  manual_cpc: "Advertiser sets max bid per click directly.",
  target_roas: "Smart Bidding: ML adjusts bid to hit a return-on-ad-spend target.",
  target_cpa: "Smart Bidding: ML adjusts bid to hit a target cost-per-acquisition.",
  maximize_conversions: "Smart Bidding: ML spends the daily budget on the highest-pCVR clicks.",
};

type Props = {
  lines: AdRankLine[];
  query: string;
};

export function BusinessSide({ lines, query }: Props) {
  if (lines.length === 0) return null;

  return (
    <section id="business" className="pt-12 pb-6 fade-in">
      <div className="mb-5">
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
          2 · Phía doanh nghiệp
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--text)] mb-2">
          {lines.length} nhãn hàng muốn quảng cáo cho truy vấn này
        </h2>
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
          Đây là cách mỗi nhãn hàng đã chuẩn bị: từ khóa họ muốn nhắm, mức bid sẵn sàng trả,
          chiến lược, mẫu quảng cáo. Quality Score do Google tự chấm dựa trên chất lượng quảng cáo
          và landing page. Tất cả những thông tin này tồn tại trước khi user search.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lines.map((line) => {
          const winning = line.slot_position !== null && line.slot_position !== undefined;
          return (
            <div
              key={line.advertiser_id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-semibold text-[var(--text)] truncate">
                    {line.advertiser_name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                    {line.match_type}
                  </span>
                </div>
                {winning ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[var(--ok)]"
                    style={{ background: "var(--slot-1-bg)" }}>
                    Won slot {(line.slot_position ?? 0) + 1}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded text-[var(--text-dim)]"
                    style={{ background: "var(--badge-bg)" }}>
                    Lost
                  </span>
                )}
              </div>

              {/* Bidding for */}
              <div className="mb-2">
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-0.5">
                  Bidding for
                </div>
                <div className="text-[13px] text-[var(--text)]">"{line.keyword_text}"</div>
              </div>

              {/* Strategy + bid */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-0.5">
                    Strategy
                  </div>
                  <div className="text-[12px] text-[var(--text)]" title={STRATEGY_HINT[line.bid_strategy] ?? ""}>
                    {STRATEGY_LABEL[line.bid_strategy] ?? line.bid_strategy}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-0.5">
                    Their bid
                  </div>
                  <div className="text-[12px] text-[var(--text)]" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {vnd(line.bid)}
                    {line.bid_strategy !== "manual_cpc" && line.predicted_pcvr > 0 && (
                      <span className="ml-2 text-[10.5px] text-[var(--text-dim)]">
                        (ML pCVR {(line.predicted_pcvr * 100).toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ad preview */}
              <div className="rounded-lg p-2.5 mb-2" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-1">
                  Their ad
                </div>
                <div className="text-[13px] text-[var(--link-blue)] leading-tight">
                  {line.ad_headline || "(no headline)"}
                </div>
              </div>

              {/* Quality gauge with component bars */}
              <div className="pt-2 border-t border-[var(--separator)]">
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                  Quality Score (Google chấm)
                </div>
                <QualityGauge
                  score={line.quality_score}
                  pctr={line.pctr}
                  adRelevance={line.ad_relevance}
                  lpExperience={line.lp_experience}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
