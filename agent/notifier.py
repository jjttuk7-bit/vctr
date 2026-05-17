"""
agent/notifier.py — KNow 알림 발송기
Buttondown 이메일 뉴스레터 + Discord Webhook

설계:
  - 활성화 여부: config.yaml notifications 섹션 (enabled 플래그)
  - 시크릿: os.getenv() 경유 (CLAUDE.md 규칙 #8)
  - Twitter/X: config에서 비활성화 → v1.1에서 Tweepy 추가
참조: KWAVE_DAILY_PLAN.md 8절 / BRANDING.md 10절
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from textwrap import shorten

import httpx
import yaml

from database.models import Article

logger = logging.getLogger(__name__)

# 브랜드 컬러 (BRANDING.md 3절)
_KOREAN_RED = "#C0392B"

# 카테고리 컬러 → Discord embed color (hex int)
_CAT_COLORS_INT: dict[str, int] = {
    "K-Beauty":        0xD4537E,
    "K-Drama":         0x7F77DD,
    "K-Pop":           0xD85A30,
    "K-Food":          0xBA7517,
    "K-Fashion":       0x444441,
    "K-Lifestyle":     0x1D9E75,
    "K-Travel":        0x378ADD,
    "K-Sport":         0x639922,
    "K-Entertainment": 0xE24B4A,
}
_DEFAULT_COLOR_INT = 0xC0392B  # Korean Red fallback


# ─────────────────────────────────────────────────────────────
# 결과 타입
# ─────────────────────────────────────────────────────────────
@dataclass
class NotifyResult:
    email:   bool = False
    discord: bool = False
    twitter: bool = False   # v1.1


# ─────────────────────────────────────────────────────────────
# Notifier
# ─────────────────────────────────────────────────────────────
class Notifier:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg      = config or _load_config()
        self._site_url = self._cfg["site"]["url"].rstrip("/")
        self._notif    = self._cfg["notifications"]

    # ── 공개 API ──────────────────────────────────────────────

    async def notify_all(
        self,
        articles: list[Article],
        featured_id: int | None,
        run_date: date | None = None,
    ) -> NotifyResult:
        """발행된 기사 목록을 이메일·Discord로 전송."""
        if not articles:
            logger.info("발송할 기사 없음 — 알림 건너뜀")
            return NotifyResult()

        today       = run_date or date.today()
        featured    = _find_featured(articles, featured_id)
        result      = NotifyResult()

        async with httpx.AsyncClient(timeout=15) as client:
            if self._notif["email"]["enabled"]:
                result.email = await self._send_email(client, articles, featured, today)

            if self._notif["discord"]["enabled"]:
                result.discord = await self._send_discord(client, articles, featured, today)

        logger.info(
            "알림 완료 — email=%s discord=%s", result.email, result.discord
        )
        return result

    # ── Buttondown 이메일 ──────────────────────────────────────

    async def _send_email(
        self,
        client: httpx.AsyncClient,
        articles: list[Article],
        featured: Article | None,
        today: date,
    ) -> bool:
        api_key = os.getenv("BUTTONDOWN_API_KEY", "")
        if not api_key:
            logger.warning("BUTTONDOWN_API_KEY 없음 — 이메일 건너뜀")
            return False

        date_str  = today.strftime("%B %-d")   # "May 17"
        highlight = featured.headline_en if featured else "Today's K-culture news"
        subject   = f"KNow Daily — {date_str} | {shorten(highlight, 50, placeholder='…')}"
        body_html = _build_email_html(articles, featured, today, self._site_url)

        try:
            r = await client.post(
                "https://api.buttondown.email/v1/emails",
                headers={"Authorization": f"Token {api_key}"},
                json={"subject": subject, "body": body_html, "status": "sent"},
            )
            r.raise_for_status()
            logger.info("이메일 발송 완료: %s", subject)
            return True
        except httpx.HTTPError as exc:
            logger.error("Buttondown 오류: %s", exc)
            return False

    # ── Discord Webhook ────────────────────────────────────────

    async def _send_discord(
        self,
        client: httpx.AsyncClient,
        articles: list[Article],
        featured: Article | None,
        today: date,
    ) -> bool:
        webhook_url = os.getenv("DISCORD_WEBHOOK", "")
        if not webhook_url:
            logger.warning("DISCORD_WEBHOOK 없음 — Discord 건너뜀")
            return False

        payload = _build_discord_payload(articles, featured, today, self._site_url)

        try:
            r = await client.post(webhook_url, json=payload)
            r.raise_for_status()
            logger.info("Discord 발송 완료: %d건", len(articles))
            return True
        except httpx.HTTPError as exc:
            logger.error("Discord 오류: %s", exc)
            return False


# ─────────────────────────────────────────────────────────────
# 이메일 HTML 빌더 (BRANDING.md 10절)
# ─────────────────────────────────────────────────────────────

def _build_email_html(
    articles: list[Article],
    featured: Article | None,
    today: date,
    site_url: str,
) -> str:
    date_str = today.strftime("%B %-d, %Y")
    parts: list[str] = [
        # ── 헤더 ──────────────────────────────────────────────
        f"""
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    max-width:600px;margin:0 auto;background:#FAF9F6;">
          <div style="background:{_KOREAN_RED};padding:24px 32px;text-align:center;">
            <span style="color:#fff;font-size:28px;font-weight:700;">K</span>
            <span style="color:rgba(255,255,255,.85);font-size:28px;font-weight:300;">Now</span>
            <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:13px;letter-spacing:.04em;">
              KNow Daily — {date_str}
            </p>
          </div>
        """,
    ]

    # ── 히어로 기사 ───────────────────────────────────────────
    if featured:
        cat_color = _cat_hex(featured.category)
        feat_url  = f"{site_url}/articles/{featured.id}"
        parts.append(f"""
          <div style="background:{cat_color};padding:32px;">
            <span style="background:rgba(255,255,255,.2);color:#fff;
                         padding:3px 12px;border-radius:20px;font-size:11px;
                         letter-spacing:.06em;text-transform:uppercase;">
              {featured.category}
            </span>
            <h1 style="color:#fff;font-size:22px;font-weight:500;
                       line-height:1.3;margin:14px 0 10px;">
              {featured.headline_en}
            </h1>
            <p style="color:rgba(255,255,255,.88);font-size:14px;
                      line-height:1.6;margin:0 0 16px;">
              {featured.seo_description or ""}
            </p>
            <a href="{feat_url}"
               style="color:#fff;font-size:14px;font-weight:500;">
              Read more →
            </a>
          </div>
        """)

    # ── 섹션별 기사 목록 (히어로 제외, 최대 8건) ──────────────
    others = [a for a in articles if a.id != (featured.id if featured else None)][:8]
    if others:
        parts.append(
            '<div style="padding:24px 32px;">'
            '<p style="color:#1A1A2E;font-size:11px;font-weight:600;'
            'letter-spacing:.08em;text-transform:uppercase;margin:0 0 16px;">'
            "TODAY'S STORIES</p>"
        )
        for art in others:
            art_url   = f"{site_url}/articles/{art.id}"
            cat_color = _cat_hex(art.category)
            headline  = shorten(art.headline_en or "", 80, placeholder="…")
            parts.append(f"""
              <div style="margin-bottom:16px;padding-bottom:16px;
                          border-bottom:.5px solid #E8E6DF;">
                <span style="background:{cat_color};color:#fff;
                             padding:2px 8px;border-radius:4px;
                             font-size:10px;font-weight:600;
                             text-transform:uppercase;letter-spacing:.04em;">
                  {art.category}
                </span>
                <p style="margin:6px 0 4px;color:#1A1A2E;
                           font-size:15px;font-weight:500;line-height:1.4;">
                  {headline}
                </p>
                <a href="{art_url}"
                   style="color:{_KOREAN_RED};font-size:13px;text-decoration:none;">
                  Read more →
                </a>
              </div>
            """)
        parts.append("</div>")

    # ── 구독 유도 ─────────────────────────────────────────────
    parts.append(f"""
      <div style="background:#1A1A2E;padding:24px 32px;text-align:center;">
        <p style="color:rgba(255,255,255,.6);font-size:12px;margin:0;">
          <a href="{site_url}" style="color:rgba(255,255,255,.6);">k-now.co</a>
          · You're receiving this because you subscribed to KNow Daily.
        </p>
      </div>
    </div>
    """)

    return "".join(parts)


# ─────────────────────────────────────────────────────────────
# Discord 페이로드 빌더
# ─────────────────────────────────────────────────────────────

def _build_discord_payload(
    articles: list[Article],
    featured: Article | None,
    today: date,
    site_url: str,
) -> dict:
    date_str = today.strftime("%B %-d, %Y")
    embeds: list[dict] = []

    # 요약 embed
    embeds.append({
        "title":       f"📰 KNow Daily — {date_str}",
        "description": f"{len(articles)}개 기사가 발행됐습니다.",
        "color":       _DEFAULT_COLOR_INT,
        "url":         site_url,
    })

    # 히어로 embed
    if featured:
        embeds.append({
            "title":       f"🔥 {featured.headline_en}",
            "description": shorten(featured.seo_description or "", 200, placeholder="…"),
            "url":         f"{site_url}/articles/{featured.id}",
            "color":       _CAT_COLORS_INT.get(featured.category, _DEFAULT_COLOR_INT),
            "footer":      {"text": featured.category},
        })

    # 카테고리별 상위 기사 (히어로 제외, 최대 4건 — Discord embed 한도)
    others = [a for a in articles if a.id != (featured.id if featured else None)][:4]
    for art in others:
        embeds.append({
            "title":       shorten(art.headline_en or "", 90, placeholder="…"),
            "url":         f"{site_url}/articles/{art.id}",
            "color":       _CAT_COLORS_INT.get(art.category, _DEFAULT_COLOR_INT),
            "footer":      {"text": art.category},
        })

    return {"embeds": embeds[:10]}   # Discord 최대 10개


# ─────────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────────

def _find_featured(
    articles: list[Article], featured_id: int | None
) -> Article | None:
    if featured_id is None:
        return articles[0] if articles else None
    return next((a for a in articles if a.id == featured_id), articles[0] if articles else None)


def _cat_hex(category: str) -> str:
    """카테고리명 → 배경 hex 색상 (config 컬러 시스템)."""
    colors: dict[str, str] = {
        "K-Beauty":        "#D4537E",
        "K-Drama":         "#7F77DD",
        "K-Pop":           "#D85A30",
        "K-Food":          "#BA7517",
        "K-Fashion":       "#444441",
        "K-Lifestyle":     "#1D9E75",
        "K-Travel":        "#378ADD",
        "K-Sport":         "#639922",
        "K-Entertainment": "#E24B4A",
    }
    return colors.get(category, _KOREAN_RED)


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
