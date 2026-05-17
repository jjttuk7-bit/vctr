"""
agent/image_fetcher.py — KNow 이미지 페처
Unsplash API(기사 본문) + YouTube 공식 썸네일(K-Pop·K-Drama)

규칙 (CLAUDE.md):
  - Unsplash 출처 표기 필수: "Photo by [이름] on Unsplash" (Unsplash 정책)
  - 인물 사진·아이돌 사진 절대 사용 금지
  - AI 생성 이미지 사용 금지
  - 시크릿: os.getenv() 경유
참조: KWAVE_DAILY_PLAN.md 4.4절
"""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from pathlib import Path

import httpx
import yaml

from agent.processor import ProcessedArticle

logger = logging.getLogger(__name__)

# YouTube 썸네일을 시도하는 카테고리
_YOUTUBE_CATEGORIES = {"K-Pop", "K-Drama"}


# ─────────────────────────────────────────────────────────────
# 결과 타입
# ─────────────────────────────────────────────────────────────
@dataclass
class ImageResult:
    url:        str
    source:     str         # "unsplash" | "youtube_thumbnail"
    credit:     str | None  # Unsplash 작가명 (출처 표기 필수)
    credit_url: str | None  # Unsplash 작가 프로필 URL
    license:    str | None  # 감사 추적용


# ─────────────────────────────────────────────────────────────
# ImageFetcher
# ─────────────────────────────────────────────────────────────
class ImageFetcher:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg       = config or _load_config()
        self._semaphore = asyncio.Semaphore(self._cfg["pipeline"]["concurrency"])
        self._access_key = os.getenv("UNSPLASH_ACCESS_KEY", "")
        self._default_keywords: dict[str, list[str]] = self._cfg["image_keywords"]

    # ── 공개 API ──────────────────────────────────────────────

    async def fetch(
        self,
        unsplash_keywords: list[str],
        category: str,
        youtube_id: str | None = None,
    ) -> ImageResult | None:
        """
        이미지 우선순위:
          1. YouTube 공식 썸네일 (K-Pop·K-Drama + youtube_id 있을 때)
          2. Unsplash — LLM 생성 키워드
          3. Unsplash — config 기본 키워드 (fallback)
          4. None (publisher가 og_generated로 처리)
        """
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            # 1. YouTube 썸네일
            if youtube_id and category in _YOUTUBE_CATEGORIES:
                result = await self._fetch_youtube(client, youtube_id)
                if result:
                    return result

            # 2. Unsplash (LLM 키워드)
            if unsplash_keywords:
                result = await self._fetch_unsplash(client, unsplash_keywords)
                if result:
                    return result

            # 3. Unsplash (config 기본 키워드)
            default_kws = self._default_keywords.get(category, [])
            if default_kws and default_kws != unsplash_keywords:
                result = await self._fetch_unsplash(client, default_kws)
                if result:
                    return result

        logger.warning("이미지 페치 실패 [%s]", category)
        return None

    async def fetch_for_article(
        self,
        article: ProcessedArticle,
        youtube_id: str | None = None,
    ) -> ImageResult | None:
        return await self.fetch(
            unsplash_keywords=article.unsplash_keywords,
            category=article.category,
            youtube_id=youtube_id,
        )

    # ── Unsplash API ──────────────────────────────────────────

    async def _fetch_unsplash(
        self,
        client: httpx.AsyncClient,
        keywords: list[str],
    ) -> ImageResult | None:
        # 첫 2개 키워드만 사용 (API 권장)
        query = " ".join(keywords[:2])
        params = {
            "query":          query,
            "orientation":    "landscape",
            "content_filter": "high",   # 안전한 이미지만
        }
        headers = {"Authorization": f"Client-ID {self._access_key}"}

        async with self._semaphore:
            try:
                r = await client.get(
                    "https://api.unsplash.com/photos/random",
                    params=params,
                    headers=headers,
                )
                r.raise_for_status()
            except httpx.HTTPStatusError as exc:
                # 401: API 키 문제, 403: 한도 초과
                logger.warning("Unsplash HTTP 오류 [%s]: %s", query, exc.response.status_code)
                return None
            except httpx.HTTPError as exc:
                logger.warning("Unsplash 연결 오류 [%s]: %s", query, exc)
                return None

        data = r.json()
        try:
            return ImageResult(
                url=data["urls"]["regular"],
                source="unsplash",
                credit=data["user"]["name"],
                credit_url=data["user"]["links"]["html"],
                # Unsplash 정책: image_license 컬럼에 기록 (DB 감사 추적용)
                license=f"Unsplash License — {data.get('links', {}).get('html', '')}",
            )
        except (KeyError, TypeError) as exc:
            logger.warning("Unsplash 응답 파싱 실패 [%s]: %s", query, exc)
            return None

    # ── YouTube 공식 썸네일 ───────────────────────────────────

    async def _fetch_youtube(
        self,
        client: httpx.AsyncClient,
        youtube_id: str,
    ) -> ImageResult | None:
        """
        YouTube maxresdefault 썸네일 존재 여부 확인 후 반환.
        공식 채널 확인은 수집 단계에서 보장되어야 함.
        """
        url = f"https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg"
        async with self._semaphore:
            try:
                r = await client.head(url)
                # YouTube는 썸네일 없을 때 120×90 기본 이미지 반환(200) — 크기로 판별
                if r.status_code == 200:
                    content_length = int(r.headers.get("content-length", 0))
                    if content_length > 5000:   # 기본 이미지는 ~1.4 KB
                        return ImageResult(
                            url=url,
                            source="youtube_thumbnail",
                            credit=None,
                            credit_url=None,
                            license="YouTube thumbnail — official channel",
                        )
            except httpx.HTTPError as exc:
                logger.debug("YouTube 썸네일 확인 실패 [%s]: %s", youtube_id, exc)
        return None


# ─────────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────────
def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
