"""Seed 10 advertisers across 3 verticals (apparel, finance, travel)
with one campaign each, ~50 keywords, and 3 ads per advertiser.
Idempotent: skips if data already present. Pass --reset to truncate
first."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection


SEED = [
    # ============================================================
    # APPAREL
    # ============================================================
    {
        "name": "BrandX Fashion",
        "vertical": "apparel",
        "daily_budget": 2_500_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 2_500_000},
        "keywords": [
            ("váy dự tiệc", "exact", 8000),
            ("váy dự tiệc đẹp", "phrase", 7500),
            ("váy dự tiệc sang trọng", "phrase", 7000),
            ("váy dự tiệc giá rẻ", "exact", 5000),
            ("váy maxi", "exact", 6500),
            ("áo thun nữ", "exact", 4500),
            ("áo sơ mi nữ", "exact", 5000),
            ("quần jeans nữ", "phrase", 5500),
            ("đầm công sở", "phrase", 6000),
            ("đầm dự tiệc", "phrase", 7500),
            ("thời trang nữ", "broad", 4000),
            ("quần áo nữ cao cấp", "broad", 5500),
            ("váy đen nhỏ", "exact", 6800),
            ("váy cổ điển", "phrase", 6200),
        ],
        "ads": [
            {
                "headlines": [
                    "BrandX Fashion - Váy Dự Tiệc Sang Trọng",
                    "Mua 1 Tặng 1 Hôm Nay",
                    "Miễn Phí Giao Hàng Toàn Quốc",
                ],
                "descriptions": [
                    "Bộ sưu tập váy dự tiệc mới nhất. Chất liệu cao cấp, giá tốt.",
                    "Đổi trả trong 7 ngày. Chính sách bảo hành rõ ràng.",
                ],
                "final_url": "https://brandx.vn/vay-du-tiec",
                "lp_load_ms": 1200,
                "lp_content_score": 0.85,
            },
            {
                "headlines": [
                    "Váy Dự Tiệc Cao Cấp",
                    "Giảm Đến 50% Hôm Nay",
                    "Hàng Mới Về Liên Tục",
                ],
                "descriptions": [
                    "Hàng chính hãng. Mẫu mã đa dạng.",
                    "Hotline: 1900-xxxx",
                ],
                "final_url": "https://brandx.vn/sale",
                "lp_load_ms": 1800,
                "lp_content_score": 0.65,
            },
            {
                "headlines": [
                    "Thời Trang Nữ BrandX",
                    "Phong Cách Hiện Đại",
                    "Miễn Phí Đổi Trả",
                ],
                "descriptions": [
                    "Từ váy maxi đến đầm công sở.",
                    "Liên hệ 24/7.",
                ],
                "final_url": "https://brandx.vn",
                "lp_load_ms": 1500,
                "lp_content_score": 0.75,
            },
        ],
    },
    {
        "name": "Coco Style",
        "vertical": "apparel",
        "daily_budget": 1_500_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 1_500_000},
        "keywords": [
            ("váy dự tiệc", "exact", 6500),
            ("váy dự tiệc giá rẻ", "exact", 6000),
            ("đầm dự tiệc", "phrase", 6500),
            ("áo thun nữ basic", "exact", 3500),
            ("set bộ nữ", "phrase", 5000),
            ("thời trang công sở", "broad", 4500),
            ("váy nữ", "broad", 4000),
            ("đầm mới", "phrase", 5500),
        ],
        "ads": [
            {
                "headlines": [
                    "Coco Style - Váy Dự Tiệc Giá Tốt",
                    "Từ 199K",
                    "Free Ship Toàn Quốc",
                ],
                "descriptions": [
                    "Váy dự tiệc, đầm công sở, set bộ nữ.",
                    "Mua online tiện lợi.",
                ],
                "final_url": "https://cocostyle.vn",
                "lp_load_ms": 2200,
                "lp_content_score": 0.55,
            },
            {
                "headlines": [
                    "Váy Dự Tiệc Ngay",
                    "Sale 30%",
                    "Coco Style Chính Hãng",
                ],
                "descriptions": [
                    "Hàng mới cập nhật mỗi tuần.",
                    "Đổi trả 3 ngày.",
                ],
                "final_url": "https://cocostyle.vn/sale",
                "lp_load_ms": 1900,
                "lp_content_score": 0.60,
            },
        ],
    },
    {
        "name": "Luxe Boutique",
        "vertical": "apparel",
        "daily_budget": 3_500_000,
        "campaign": {"bid_strategy": "target_roas", "target_roas": 3.0, "daily_budget": 3_500_000},
        "keywords": [
            ("váy dự tiệc sang trọng", "phrase", 12000),
            ("váy dự tiệc cao cấp", "exact", 11000),
            ("đầm dạ hội", "exact", 13000),
            ("thời trang sang trọng", "broad", 8000),
            ("áo kiểu cao cấp", "phrase", 9000),
            ("đầm dạ tiệc luxury", "exact", 10000),
            ("váy đen sang trọng", "phrase", 10500),
        ],
        "ads": [
            {
                "headlines": [
                    "Luxe Boutique - Sang Trọng Tinh Tế",
                    "Designer Collection 2026",
                    "Showroom Quận 1",
                ],
                "descriptions": [
                    "Thiết kế độc quyền. Chất liệu Italy.",
                    "Tư vấn miễn phí tại cửa hàng.",
                ],
                "final_url": "https://luxe.vn/collection",
                "lp_load_ms": 1100,
                "lp_content_score": 0.92,
            },
            {
                "headlines": [
                    "Váy Dự Tiệc Cao Cấp",
                    "Designer Made",
                    "Showroom Sài Gòn",
                ],
                "descriptions": [
                    "Bộ sưu tập váy dự tiệc luxury.",
                    "Đặt lịch thử đồ.",
                ],
                "final_url": "https://luxe.vn/dresses",
                "lp_load_ms": 1300,
                "lp_content_score": 0.88,
            },
        ],
    },

    # ============================================================
    # FINANCE
    # ============================================================
    {
        "name": "Tiền Vay Nhanh",
        "vertical": "finance",
        "daily_budget": 5_000_000,
        "campaign": {"bid_strategy": "target_cpa", "target_cpa": 250_000, "daily_budget": 5_000_000},
        "keywords": [
            ("vay tiền online", "exact", 18000),
            ("vay tiền nhanh", "exact", 17000),
            ("vay tiền không thế chấp", "phrase", 19000),
            ("vay tiêu dùng", "phrase", 15000),
            ("app vay tiền", "exact", 16000),
            ("vay tiền lãi suất thấp", "phrase", 17500),
            ("vay 24h", "exact", 14000),
            ("dịch vụ vay tiền", "broad", 12000),
        ],
        "ads": [
            {
                "headlines": [
                    "Vay Tiền Online - Duyệt 30 Phút",
                    "Không Cần Thế Chấp",
                    "Lãi Suất Từ 0.5%/Tháng",
                ],
                "descriptions": [
                    "Hạn mức lên đến 100 triệu. Thủ tục đơn giản.",
                    "Giải ngân trong ngày.",
                ],
                "final_url": "https://vaynhanh.vn/dang-ky",
                "lp_load_ms": 1400,
                "lp_content_score": 0.78,
            },
            {
                "headlines": [
                    "App Vay Tiền Uy Tín",
                    "Duyệt Trong 30 Phút",
                    "Không Cần Giấy Tờ",
                ],
                "descriptions": [
                    "Tải app và đăng ký ngay.",
                    "Hỗ trợ 24/7.",
                ],
                "final_url": "https://vaynhanh.vn/app",
                "lp_load_ms": 1600,
                "lp_content_score": 0.70,
            },
        ],
    },
    {
        "name": "Smart Loans",
        "vertical": "finance",
        "daily_budget": 4_000_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 4_000_000},
        "keywords": [
            ("vay tiền online", "exact", 16000),
            ("vay tiêu dùng", "phrase", 14000),
            ("vay thẻ tín dụng", "exact", 15000),
            ("đáo nợ thẻ tín dụng", "phrase", 13000),
            ("vay không chứng minh thu nhập", "phrase", 17000),
            ("vay nhanh online", "broad", 12000),
        ],
        "ads": [
            {
                "headlines": [
                    "Smart Loans - Giải Pháp Tài Chính",
                    "Lãi Suất Cạnh Tranh",
                    "Duyệt Trực Tuyến",
                ],
                "descriptions": [
                    "Vay tiêu dùng, vay thẻ tín dụng.",
                    "Tư vấn miễn phí.",
                ],
                "final_url": "https://smartloans.vn",
                "lp_load_ms": 2100,
                "lp_content_score": 0.62,
            },
            {
                "headlines": [
                    "Vay Tiền Trực Tuyến",
                    "Hạn Mức Cao",
                    "Smart Loans Điện Tử",
                ],
                "descriptions": [
                    "Đăng ký online 5 phút.",
                    "Giải ngân nhanh.",
                ],
                "final_url": "https://smartloans.vn/dang-ky",
                "lp_load_ms": 1800,
                "lp_content_score": 0.68,
            },
        ],
    },
    {
        "name": "Tín Tín Capital",
        "vertical": "finance",
        "daily_budget": 6_000_000,
        "campaign": {"bid_strategy": "target_roas", "target_roas": 4.0, "daily_budget": 6_000_000},
        "keywords": [
            ("vay tiền online uy tín", "phrase", 22000),
            ("vay thế chấp sổ đỏ", "exact", 25000),
            ("vay mua nhà", "exact", 28000),
            ("vay mua xe", "exact", 24000),
            ("dịch vụ tài chính chuyên nghiệp", "broad", 18000),
            ("vay vài tỉ", "phrase", 26000),
        ],
        "ads": [
            {
                "headlines": [
                    "Tín Tín Capital - Đồng Hành Tài Chính",
                    "Chuyên Nghiệp Và Uy Tín",
                    "20 Năm Kinh Nghiệm",
                ],
                "descriptions": [
                    "Vay thế chấp, vay tín chấp, vay mua nhà.",
                    "Tư vấn 1-1 cùng chuyên viên.",
                ],
                "final_url": "https://tintincapital.vn",
                "lp_load_ms": 1000,
                "lp_content_score": 0.95,
            },
        ],
    },

    # ============================================================
    # TRAVEL
    # ============================================================
    {
        "name": "Sky Travel",
        "vertical": "travel",
        "daily_budget": 3_000_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 3_000_000},
        "keywords": [
            ("vé máy bay giá rẻ", "exact", 9000),
            ("vé máy bay khuyến mại", "phrase", 8500),
            ("đặt vé máy bay", "exact", 8000),
            ("vé máy bay đi đà nẵng", "phrase", 7500),
            ("vé máy bay tết 2027", "phrase", 11000),
            ("đặt phòng khách sạn", "exact", 7000),
            ("tour du lịch", "broad", 6500),
            ("du lịch đà nẵng", "phrase", 7200),
        ],
        "ads": [
            {
                "headlines": [
                    "Sky Travel - Vé Máy Bay Giá Rẻ",
                    "Giảm 30% Tất Cả Hãng",
                    "Đặt Online Trong 2 Phút",
                ],
                "descriptions": [
                    "Vé máy bay từ Vietjet, Bamboo, Vietnam Airlines.",
                    "Hoàn tiền nếu rẻ hơn.",
                ],
                "final_url": "https://skytravel.vn",
                "lp_load_ms": 1500,
                "lp_content_score": 0.80,
            },
            {
                "headlines": [
                    "Tour Du Lịch Trọn Gói",
                    "Khách Sạn 4-5 Sao",
                    "Sky Travel Tin Cậy",
                ],
                "descriptions": [
                    "Từ Sài Gòn đi mọi nơi.",
                    "Đặt ngay nhận mã giảm 200K.",
                ],
                "final_url": "https://skytravel.vn/tour",
                "lp_load_ms": 1700,
                "lp_content_score": 0.72,
            },
        ],
    },
    {
        "name": "Booking VN",
        "vertical": "travel",
        "daily_budget": 2_000_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 2_000_000},
        "keywords": [
            ("đặt phòng khách sạn", "exact", 8500),
            ("khách sạn giá rẻ", "phrase", 7000),
            ("khách sạn đà nẵng", "phrase", 7500),
            ("homestay", "exact", 5500),
            ("resort phú quốc", "exact", 9500),
            ("khách sạn 5 sao", "broad", 8000),
        ],
        "ads": [
            {
                "headlines": [
                    "Booking VN - Khách Sạn Giá Tốt",
                    "Hơn 50000 Khách Sạn",
                    "Miễn Phí Hủy Phòng",
                ],
                "descriptions": [
                    "So sánh giá từ nhiều nhà cung cấp.",
                    "Đặt trước trả sau.",
                ],
                "final_url": "https://bookingvn.vn",
                "lp_load_ms": 1400,
                "lp_content_score": 0.75,
            },
        ],
    },
    {
        "name": "Mua Tour",
        "vertical": "travel",
        "daily_budget": 1_800_000,
        "campaign": {"bid_strategy": "maximize_conversions", "daily_budget": 1_800_000},
        "keywords": [
            ("tour du lịch giá rẻ", "phrase", 6500),
            ("tour đà lạt", "exact", 7000),
            ("tour phú quốc", "exact", 8500),
            ("tour miền tây", "exact", 6000),
            ("du lịch gia đình", "phrase", 5500),
            ("tour du lịch trọn gói", "broad", 5000),
        ],
        "ads": [
            {
                "headlines": [
                    "Mua Tour - Tour Du Lịch Giá Rẻ",
                    "Trọn Gói - Ăn Ngủ Tất Cả",
                    "Đặt Sớm Giảm Thêm",
                ],
                "descriptions": [
                    "Tour Phú Quốc, Đà Lạt, Miền Tây.",
                    "Hotline 1900-xxxx.",
                ],
                "final_url": "https://muatour.vn",
                "lp_load_ms": 1900,
                "lp_content_score": 0.65,
            },
        ],
    },
    {
        "name": "VN Hotels Direct",
        "vertical": "travel",
        "daily_budget": 1_200_000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 1_200_000},
        "keywords": [
            ("đặt phòng khách sạn", "exact", 5500),
            ("khách sạn gần trung tâm", "phrase", 5000),
            ("khách sạn 3 sao", "exact", 4500),
            ("homestay giá rẻ", "phrase", 4000),
        ],
        "ads": [
            {
                "headlines": [
                    "VN Hotels Direct",
                    "Đặt Phòng Trực Tiếp",
                    "Không Phí Hoa Hồng",
                ],
                "descriptions": [
                    "Liên lạc trực tiếp với khách sạn.",
                    "Giá gốc không tăng.",
                ],
                "final_url": "https://vnhotelsdirect.vn",
                "lp_load_ms": 2400,
                "lp_content_score": 0.50,
            },
        ],
    },
]


def already_seeded(conn) -> bool:
    n = conn.execute("SELECT COUNT(*) FROM advertisers").fetchone()[0]
    return n > 0


def reset(conn) -> None:
    """Truncate event tables + advertiser graph. Cascades through FK chain."""
    conn.execute(
        "TRUNCATE conversions, clicks, impressions, ad_rank_results, "
        "auctions, queries, ads, keywords, campaigns, advertisers RESTART IDENTITY CASCADE"
    )
    conn.commit()
    print("reset existing seed data")


def seed():
    with get_connection() as conn:
        if already_seeded(conn):
            print("advertisers table already populated, skipping (use --reset to re-seed)")
            return

        for adv in SEED:
            adv_id = conn.execute(
                "INSERT INTO advertisers (name, vertical, daily_budget) VALUES (%s, %s, %s) RETURNING id",
                (adv["name"], adv["vertical"], adv["daily_budget"]),
            ).fetchone()[0]

            c = adv["campaign"]
            campaign_id = conn.execute(
                """
                INSERT INTO campaigns (advertiser_id, name, bid_strategy, target_roas, target_cpa, daily_budget)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """,
                (
                    adv_id,
                    f"{adv['name']} - main",
                    c["bid_strategy"],
                    c.get("target_roas"),
                    c.get("target_cpa"),
                    c["daily_budget"],
                ),
            ).fetchone()[0]

            for text, match_type, max_cpc in adv["keywords"]:
                conn.execute(
                    "INSERT INTO keywords (campaign_id, text, match_type, max_cpc_bid) VALUES (%s, %s, %s, %s)",
                    (campaign_id, text, match_type, max_cpc),
                )

            for a in adv["ads"]:
                conn.execute(
                    """
                    INSERT INTO ads (campaign_id, headlines, descriptions, final_url, lp_load_ms, lp_content_score)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        campaign_id,
                        json.dumps(a["headlines"], ensure_ascii=False),
                        json.dumps(a["descriptions"], ensure_ascii=False),
                        a["final_url"],
                        a["lp_load_ms"],
                        a["lp_content_score"],
                    ),
                )
        conn.commit()
    print(f"seeded {len(SEED)} advertisers with campaigns, keywords, ads")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="truncate existing data first")
    args = parser.parse_args()

    if args.reset:
        with get_connection() as conn:
            reset(conn)
    seed()
