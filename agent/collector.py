"""
agent/collector.py — KNow 뉴스 수집기
Naver Search API + Daum RSS → 카테고리별 원시 기사 수집
참조: KWAVE_DAILY_PLAN.md 3.2절 / 3.3절

규칙:
  - 원문 전문 저장 금지 (API 제공 description snippet만 보존)
  - 시크릿은 os.getenv() 경유 (CLAUDE.md 규칙 #8)
"""

from __future__ import annotations

import asyncio
import html
import logging
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

import calendar as _calendar

import feedparser
import httpx
import yaml

logger = logging.getLogger(__name__)

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    """Naver API 응답의 <b> 태그·HTML 엔티티 제거."""
    return html.unescape(_HTML_TAG_RE.sub("", text)).strip()


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


# ─────────────────────────────────────────────────────────────
# 수집 결과 단위
# ─────────────────────────────────────────────────────────────
@dataclass
class CollectedArticle:
    source_url:      str
    source_name:     str       # "naver" | "daum"
    title_ko:        str
    summary_ko:      str       # API snippet — 원문 전문 아님
    published_at_ko: datetime
    category:        str


# ─────────────────────────────────────────────────────────────
# Collector
# ─────────────────────────────────────────────────────────────
class Collector:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg = config or _load_config()
        self._semaphore = asyncio.Semaphore(self._cfg["pipeline"]["concurrency"])

        self._naver_id     = os.getenv("NAVER_CLIENT_ID", "")
        self._naver_secret = os.getenv("NAVER_CLIENT_SECRET", "")

        self._window        = timedelta(hours=self._cfg["pipeline"]["fetch_window_hours"])
        self._max_per_cat   = self._cfg["llm"]["max_articles_per_category"]
        self._keywords: dict[str, list[str]] = self._cfg["category_keywords"]
        self._enabled: list[str] = [
            c["key"] for c in self._cfg["categories"] if c["enabled"]
        ]

    # ── 공개 진입점 ───────────────────────────────────────────

    async def collect_all(self) -> list[CollectedArticle]:
        """활성 카테고리 전체 수집 → 중복 제거·시간 필터·카테고리 상한 적용."""
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            tasks: list = []

            if self._cfg["sources"]["naver"]["enabled"]:
                for category in self._enabled:
                    for keyword in self._keywords.get(category, []):
                        tasks.append(
                            self._fetch_naver(client, keyword, category)
                        )

            if self._cfg["sources"]["daum"]["enabled"]:
                for feed in self._cfg["sources"]["daum"]["rss_feeds"]:
                    tasks.append(self._fetch_daum_rss(client, feed["url"]))

            batches = await asyncio.gather(*tasks, return_exceptions=True)

        return self._dedupe_and_filter(batches)

    # ── Naver Search API ──────────────────────────────────────

    async def _fetch_naver(
        self, client: httpx.AsyncClient, keyword: str, category: str
    ) -> list[CollectedArticle]:
        headers = {
            "X-Naver-Client-Id":     self._naver_id,
            "X-Naver-Client-Secret": self._naver_secret,
        }
        params = {"query": keyword, "display": 10, "sort": "date"}

        async with self._semaphore:
            try:
                r = await client.get(
                    self._cfg["sources"]["naver"]["api_base"],
                    headers=headers,
                    params=params,
                )
                r.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("Naver API 실패 [%s / %s]: %s", category, keyword, exc)
                return []

        results = []
        for item in r.json().get("items", []):
            pub_dt = _parse_rfc2822(item.get("pubDate", ""))
            if pub_dt is None:
                continue
            # originallink가 있으면 실제 기사 URL, 없으면 naver 캐시 URL 사용
            url = item.get("originallink") or item.get("link", "")
            if not url:
                continue
            results.append(
                CollectedArticle(
                    source_url=url,
                    source_name="naver",
                    title_ko=_strip_html(item.get("title", "")),
                    summary_ko=_strip_html(item.get("description", "")),
                    published_at_ko=pub_dt,
                    category=category,
                )
            )
        return results

    # ── Daum RSS ──────────────────────────────────────────────

    async def _fetch_daum_rss(
        self, client: httpx.AsyncClient, feed_url: str
    ) -> list[CollectedArticle]:
        async with self._semaphore:
            try:
                r = await client.get(feed_url)
                r.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("Daum RSS 실패 [%s]: %s", feed_url, exc)
                return []

        feed = feedparser.parse(r.text)
        results = []
        for entry in feed.entries:
            pub_dt = _parse_struct_time(entry.get("published_parsed"))
            if pub_dt is None:
                continue
            url = entry.get("link", "")
            if not url:
                continue
            title   = _strip_html(entry.get("title", ""))
            summary = _strip_html(entry.get("summary", ""))
            category = self._assign_category(title, summary)
            if category is None:
                continue
            results.append(
                CollectedArticle(
                    source_url=url,
                    source_name="daum",
                    title_ko=title,
                    summary_ko=summary,
                    published_at_ko=pub_dt,
                    category=category,
                )
            )
        return results

    # ── 카테고리 분류 (Daum RSS용) ────────────────────────────

    def _assign_category(self, title: str, summary: str) -> str | None:
        """키워드 히트 수가 가장 많은 활성 카테고리 반환. 0히트면 None."""
        text = title + " " + summary
        best_cat, best_count = None, 0
        for category in self._enabled:
            count = sum(1 for kw in self._keywords.get(category, []) if kw in text)
            if count > best_count:
                best_cat, best_count = category, count
        return best_cat if best_count > 0 else None

    # ── 중복 제거·필터 ────────────────────────────────────────

    def _dedupe_and_filter(
        self, batches: list
    ) -> list[CollectedArticle]:
        seen_urls:       set[str]       = set()
        category_counts: dict[str, int] = defaultdict(int)
        results:         list[CollectedArticle] = []

        for batch in batches:
            if isinstance(batch, BaseException):
                logger.warning("수집 태스크 예외: %s", batch)
                continue
            for article in batch:
                if not article.source_url:
                    continue
                if article.source_url in seen_urls:
                    continue
                if not self._is_fresh(article.published_at_ko):
                    continue
                if category_counts[article.category] >= self._max_per_cat:
                    continue
                seen_urls.add(article.source_url)
                category_counts[article.category] += 1
                results.append(article)

        logger.info("수집 완료: %d건 %s", len(results), dict(category_counts))
        return results

    def _is_fresh(self, dt: datetime) -> bool:
        now    = datetime.now(tz=timezone.utc)
        dt_utc = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        return (now - dt_utc) <= self._window


# ─────────────────────────────────────────────────────────────
# 날짜 파싱 유틸
# ─────────────────────────────────────────────────────────────
def _parse_rfc2822(date_str: str) -> datetime | None:
    """Naver pubDate: "Mon, 17 May 2026 08:00:00 +0900" 형식."""
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        return None


def _parse_struct_time(t) -> datetime | None:
    """feedparser published_parsed: time.struct_time (UTC) → datetime."""
    if t is None:
        return None
    try:
        return datetime.fromtimestamp(_calendar.timegm(t), tz=timezone.utc)
    except Exception:
        return None
