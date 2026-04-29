"use client";

/**
 * Compact visual showing the three sides connect: User <- Algorithm <- Business.
 * Sits at the very top of the page so newcomers see the mental model
 * before they scroll into any single section.
 */
export function FlowDiagram() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 mb-6">
      <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)] mb-3">
        Three sides of every Google Ads auction
      </div>
      <div className="grid grid-cols-3 gap-3 text-[12px]">
        <Box
          label="USER"
          tag="1"
          title="Tìm kiếm"
          subtitle="Họ chỉ thấy quảng cáo. Không biết gì khác."
          accent="var(--slot-2-fg)"
          bg="var(--slot-2-bg)"
        />
        <Box
          label="BUSINESS"
          tag="2"
          title="Mỗi nhãn hàng"
          subtitle="Đăng ký từ khóa, bid, ad copy, landing page."
          accent="var(--slot-3-fg)"
          bg="var(--slot-3-bg)"
        />
        <Box
          label="ALGORITHM"
          tag="3"
          title="Đấu giá"
          subtitle="Tính Ad Rank, sắp xếp, định giá GSP."
          accent="var(--slot-1-fg)"
          bg="var(--slot-1-bg)"
        />
      </div>
      <div className="mt-3 text-[11px] text-[var(--text-dim)] text-center">
        User search → Algorithm chạy đấu giá giữa các Business → User thấy kết quả
      </div>
    </div>
  );
}

function Box({
  label,
  tag,
  title,
  subtitle,
  accent,
  bg,
}: {
  label: string;
  tag: string;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${accent}33` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: accent, color: "var(--bg)" }}
        >
          {tag}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
          {label}
        </span>
      </div>
      <div className="text-[13px] font-semibold text-[var(--text)] mb-0.5">{title}</div>
      <div className="text-[11px] text-[var(--text-muted)] leading-snug">{subtitle}</div>
    </div>
  );
}
