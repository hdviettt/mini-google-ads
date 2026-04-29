"""Seed 10 advertisers across 3 verticals (apparel, finance, travel)
with one campaign each, ~50 keywords, and 3 ads. Idempotent: skips if
data already present."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from db import get_connection


SEED = [
    # Apparel
    {
        "name": "BrandX Fashion",
        "vertical": "apparel",
        "daily_budget": 2500000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 2500000},
        "keywords": [
            ("vay du tiec", "exact", 8000),
            ("vay du tiec dep", "phrase", 7500),
            ("vay du tiec sang trong", "phrase", 7000),
            ("vay du tiec gia re", "exact", 5000),
            ("vay maxi", "exact", 6500),
            ("ao thun nu", "exact", 4500),
            ("ao so mi nu", "exact", 5000),
            ("quan jeans nu", "phrase", 5500),
            ("dam cong so", "phrase", 6000),
            ("dam du tiec", "phrase", 7500),
            ("thoi trang nu", "broad", 4000),
            ("quan ao nu cao cap", "broad", 5500),
            ("vay den nho", "exact", 6800),
            ("vay co dien", "phrase", 6200),
        ],
        "ads": [
            {
                "headlines": ["BrandX Fashion - Vay Du Tiec Sang Trong",
                              "Mua 1 Tang 1 Hom Nay",
                              "Mien Phi Giao Hang Toan Quoc"],
                "descriptions": ["Bo suu tap vay du tiec moi nhat. Chat lieu cao cap, gia tot.",
                                 "Doi tra trong 7 ngay. Chinh sach bao hanh ro rang."],
                "final_url": "https://brandx.vn/vay-du-tiec",
                "lp_load_ms": 1200,
                "lp_content_score": 0.85,
            },
            {
                "headlines": ["Vay Du Tiec Cao Cap", "Giam Den 50% Hom Nay",
                              "Hang Moi Ve Lien Tuc"],
                "descriptions": ["Hang chinh hang. Mau ma da dang.",
                                 "Hotline: 1900-xxxx"],
                "final_url": "https://brandx.vn/sale",
                "lp_load_ms": 1800,
                "lp_content_score": 0.65,
            },
            {
                "headlines": ["Thoi Trang Nu BrandX", "Phong Cach Hien Dai",
                              "Mien Phi Doi Tra"],
                "descriptions": ["Tu vay maxi den dam cong so.",
                                 "Lien he 24/7."],
                "final_url": "https://brandx.vn",
                "lp_load_ms": 1500,
                "lp_content_score": 0.75,
            },
        ],
    },
    {
        "name": "Coco Style",
        "vertical": "apparel",
        "daily_budget": 1500000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 1500000},
        "keywords": [
            ("vay du tiec", "exact", 6500),
            ("vay du tiec gia re", "exact", 6000),
            ("dam du tiec", "phrase", 6500),
            ("ao thun nu basic", "exact", 3500),
            ("set bo nu", "phrase", 5000),
            ("thoi trang cong so", "broad", 4500),
            ("vay nu", "broad", 4000),
            ("dam moi", "phrase", 5500),
        ],
        "ads": [
            {
                "headlines": ["Coco Style - Vay Du Tiec Gia Tot",
                              "Tu 199K", "Free Ship Toan Quoc"],
                "descriptions": ["Vay du tiec, dam cong so, set bo nu.",
                                 "Mua online tien loi."],
                "final_url": "https://cocostyle.vn",
                "lp_load_ms": 2200,
                "lp_content_score": 0.55,
            },
            {
                "headlines": ["Vay Du Tiec Ngay", "Sale 30%",
                              "Coco Style Chinh Hang"],
                "descriptions": ["Hang moi cap nhat moi tuan.",
                                 "Doi tra 3 ngay."],
                "final_url": "https://cocostyle.vn/sale",
                "lp_load_ms": 1900,
                "lp_content_score": 0.60,
            },
        ],
    },
    {
        "name": "Luxe Boutique",
        "vertical": "apparel",
        "daily_budget": 3500000,
        "campaign": {"bid_strategy": "target_roas", "target_roas": 3.0, "daily_budget": 3500000},
        "keywords": [
            ("vay du tiec sang trong", "phrase", 12000),
            ("vay du tiec cao cap", "exact", 11000),
            ("dam du tiec luxury", "exact", 13000),
            ("thoi trang sang trong", "broad", 8000),
            ("ao kieu cao cap", "phrase", 9000),
            ("dam dahab", "exact", 10000),
            ("vay den sang trong", "phrase", 10500),
        ],
        "ads": [
            {
                "headlines": ["Luxe Boutique - Sang Trong Tinh Te",
                              "Designer Collection 2026", "Showroom Quan 1"],
                "descriptions": ["Thiet ke doc quyen. Chat lieu Italy.",
                                 "Tu van mien phi tai cua hang."],
                "final_url": "https://luxe.vn/collection",
                "lp_load_ms": 1100,
                "lp_content_score": 0.92,
            },
            {
                "headlines": ["Vay Du Tiec Cao Cap", "Designer Made",
                              "Showroom Sai Gon"],
                "descriptions": ["Bo suu tap vay du tiec luxury.",
                                 "Dat lich thu do."],
                "final_url": "https://luxe.vn/dresses",
                "lp_load_ms": 1300,
                "lp_content_score": 0.88,
            },
        ],
    },

    # Finance
    {
        "name": "Tien Vay Nhanh",
        "vertical": "finance",
        "daily_budget": 5000000,
        "campaign": {"bid_strategy": "target_cpa", "target_cpa": 250000, "daily_budget": 5000000},
        "keywords": [
            ("vay tien online", "exact", 18000),
            ("vay tien nhanh", "exact", 17000),
            ("vay tien khong the chap", "phrase", 19000),
            ("vay tieu dung", "phrase", 15000),
            ("app vay tien", "exact", 16000),
            ("vay tien lai suat thap", "phrase", 17500),
            ("vay 24h", "exact", 14000),
            ("dich vu vay tien", "broad", 12000),
        ],
        "ads": [
            {
                "headlines": ["Vay Tien Online - Duyet 30 Phut",
                              "Khong Can The Chap", "Lai Suat Tu 0.5%/Thang"],
                "descriptions": ["Han muc len den 100 trieu. Thu tuc don gian.",
                                 "Giai ngan trong ngay."],
                "final_url": "https://vaynhanh.vn/dang-ky",
                "lp_load_ms": 1400,
                "lp_content_score": 0.78,
            },
            {
                "headlines": ["App Vay Tien Uy Tin", "Duyet Trong 30 Phut",
                              "Khong Can Giay To"],
                "descriptions": ["Tai app va dang ky ngay.",
                                 "Ho tro 24/7."],
                "final_url": "https://vaynhanh.vn/app",
                "lp_load_ms": 1600,
                "lp_content_score": 0.70,
            },
        ],
    },
    {
        "name": "Smart Loans",
        "vertical": "finance",
        "daily_budget": 4000000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 4000000},
        "keywords": [
            ("vay tien online", "exact", 16000),
            ("vay tieu dung", "phrase", 14000),
            ("vay the tin dung", "exact", 15000),
            ("dao no the tin dung", "phrase", 13000),
            ("vay khong chung minh thu nhap", "phrase", 17000),
            ("vay nhanh online", "broad", 12000),
        ],
        "ads": [
            {
                "headlines": ["Smart Loans - Giai Phap Tai Chinh",
                              "Lai Suat Canh Tranh", "Duyet Truc Tuyen"],
                "descriptions": ["Vay tieu dung, vay the tin dung.",
                                 "Tu van mien phi."],
                "final_url": "https://smartloans.vn",
                "lp_load_ms": 2100,
                "lp_content_score": 0.62,
            },
            {
                "headlines": ["Vay Tien Truc Tuyen", "Han Muc Cao",
                              "Smart Loans Dien Tu"],
                "descriptions": ["Dang ky online 5 phut.",
                                 "Giai ngan nhanh."],
                "final_url": "https://smartloans.vn/dang-ky",
                "lp_load_ms": 1800,
                "lp_content_score": 0.68,
            },
        ],
    },
    {
        "name": "Tin Tin Capital",
        "vertical": "finance",
        "daily_budget": 6000000,
        "campaign": {"bid_strategy": "target_roas", "target_roas": 4.0, "daily_budget": 6000000},
        "keywords": [
            ("vay tien online uy tin", "phrase", 22000),
            ("vay the chap so do", "exact", 25000),
            ("vay mua nha", "exact", 28000),
            ("vay mua xe", "exact", 24000),
            ("dich vu tai chinh chuyen nghiep", "broad", 18000),
            ("vay vai ti", "phrase", 26000),
        ],
        "ads": [
            {
                "headlines": ["Tin Tin Capital - Dong Hanh Tai Chinh",
                              "Chuyen Nghiep Va Uy Tin", "20 Nam Kinh Nghiem"],
                "descriptions": ["Vay the chap, vay tin chap, vay mua nha.",
                                 "Tu van 1-1 cung chuyen vien."],
                "final_url": "https://tintincapital.vn",
                "lp_load_ms": 1000,
                "lp_content_score": 0.95,
            },
        ],
    },

    # Travel
    {
        "name": "Sky Travel",
        "vertical": "travel",
        "daily_budget": 3000000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 3000000},
        "keywords": [
            ("ve may bay gia re", "exact", 9000),
            ("ve may bay khuyen mai", "phrase", 8500),
            ("dat ve may bay", "exact", 8000),
            ("ve may bay di da nang", "phrase", 7500),
            ("ve may bay tet 2027", "phrase", 11000),
            ("dat phong khach san", "exact", 7000),
            ("tour du lich", "broad", 6500),
            ("du lich da nang", "phrase", 7200),
        ],
        "ads": [
            {
                "headlines": ["Sky Travel - Ve May Bay Gia Re",
                              "Giam 30% Tat Ca Hang", "Dat Online Trong 2 Phut"],
                "descriptions": ["Ve may bay tu Vietjet, Bamboo, Vietnam Airlines.",
                                 "Hoan tien neu re hon."],
                "final_url": "https://skytravel.vn",
                "lp_load_ms": 1500,
                "lp_content_score": 0.80,
            },
            {
                "headlines": ["Tour Du Lich Tron Goi", "Khach San 4-5 Sao",
                              "Sky Travel Tin Cay"],
                "descriptions": ["Tu Sai Gon di moi noi.",
                                 "Dat ngay nhan ma giam 200K."],
                "final_url": "https://skytravel.vn/tour",
                "lp_load_ms": 1700,
                "lp_content_score": 0.72,
            },
        ],
    },
    {
        "name": "Booking VN",
        "vertical": "travel",
        "daily_budget": 2000000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 2000000},
        "keywords": [
            ("dat phong khach san", "exact", 8500),
            ("khach san gia re", "phrase", 7000),
            ("khach san da nang", "phrase", 7500),
            ("homestay", "exact", 5500),
            ("resort phu quoc", "exact", 9500),
            ("khach san 5 sao", "broad", 8000),
        ],
        "ads": [
            {
                "headlines": ["Booking VN - Khach San Gia Tot",
                              "Hon 50000 Khach San", "Mien Phi Huy Phong"],
                "descriptions": ["So sanh gia tu nhieu nha cung cap.",
                                 "Dat truoc tra sau."],
                "final_url": "https://bookingvn.vn",
                "lp_load_ms": 1400,
                "lp_content_score": 0.75,
            },
        ],
    },
    {
        "name": "Mua Tour",
        "vertical": "travel",
        "daily_budget": 1800000,
        "campaign": {"bid_strategy": "maximize_conversions", "daily_budget": 1800000},
        "keywords": [
            ("tour du lich gia re", "phrase", 6500),
            ("tour da lat", "exact", 7000),
            ("tour phu quoc", "exact", 8500),
            ("tour mien tay", "exact", 6000),
            ("du lich gia dinh", "phrase", 5500),
            ("tour du lich tron goi", "broad", 5000),
        ],
        "ads": [
            {
                "headlines": ["Mua Tour - Tour Du Lich Gia Re",
                              "Tron Goi - An Ngu Tat Ca", "Dat Som Giam Them"],
                "descriptions": ["Tour Phu Quoc, Da Lat, Mien Tay.",
                                 "Hotline 1900-xxxx."],
                "final_url": "https://muatour.vn",
                "lp_load_ms": 1900,
                "lp_content_score": 0.65,
            },
        ],
    },
    {
        "name": "VN Hotels Direct",
        "vertical": "travel",
        "daily_budget": 1200000,
        "campaign": {"bid_strategy": "manual_cpc", "daily_budget": 1200000},
        "keywords": [
            ("dat phong khach san", "exact", 5500),
            ("khach san gan trung tam", "phrase", 5000),
            ("khach san 3 sao", "exact", 4500),
            ("homestay gia re", "phrase", 4000),
        ],
        "ads": [
            {
                "headlines": ["VN Hotels Direct", "Dat Phong Truc Tiep",
                              "Khong Phi Hoa Hong"],
                "descriptions": ["Lien lac truc tiep voi khach san.",
                                 "Gia goc khong tang."],
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


def seed():
    with get_connection() as conn:
        if already_seeded(conn):
            print("advertisers table already populated, skipping")
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
                        json.dumps(a["headlines"]),
                        json.dumps(a["descriptions"]),
                        a["final_url"],
                        a["lp_load_ms"],
                        a["lp_content_score"],
                    ),
                )
        conn.commit()
    print(f"seeded {len(SEED)} advertisers with campaigns, keywords, ads")


if __name__ == "__main__":
    seed()
