"""
agent/image_fetcher.py — Vctr image fetcher

Priority order:
  1. Official product thumbnail (ProductHunt thumbnail or GitHub OG preview)
  2. Unsplash — LLM-generated keywords
  3. Unsplash — config fallback keywords
  4. None → publisher uses og_generated

Rules:
  - Unsplash credit attribution required ("Photo by [name] on Unsplash")
  - No product logos/screenshots from arbitrary sources
  - Secrets via os.getenv() only
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


# ─────────────────────────────────────────────────────────────
# Result type
# ─────────────────────────────────────────────────────────────
@dataclass
class ImageResult:
    url:        str
    source:     str         # "producthunt_thumbnail" | "github_preview" | "unsplash"
    credit:     str | None  # Unsplash author name (required for attribution)
    credit_url: str | None  # Unsplash author profile URL
    license:    str | None  # audit trail


# ─────────────────────────────────────────────────────────────
# ImageFetcher
# ─────────────────────────────────────────────────────────────
class ImageFetcher:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg             = config or _load_config()
        self._semaphore       = asyncio.Semaphore(self._cfg["pipeline"]["concurrency"])
        self._unsplash_key    = os.getenv("UNSPLASH_ACCESS_KEY", "")
        self._default_keywords: dict[str, list[str]] = self._cfg["image_keywords"]

    # ── Public API ────────────────────────────────────────────

    async def fetch_for_article(
        self,
        article: ProcessedArticle,
    ) -> ImageResult | None:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:

            # 1. Official product thumbnail (PH or GitHub OG)
            if article.thumbnail_url:
                result = await self._fetch_official(client, article)
                if result:
                    return result

            # 2. Unsplash — LLM keywords
            if article.unsplash_keywords and self._unsplash_key:
                result = await self._fetch_unsplash(client, article.unsplash_keywords)
                if result:
                    return result

            # 3. Unsplash — config fallback keywords
            default_kws = self._default_keywords.get(article.category, [])
            if default_kws and self._unsplash_key:
                result = await self._fetch_unsplash(client, default_kws)
                if result:
                    return result

        logger.warning("Image fetch failed [%s] %s", article.category, article.title_ko[:40])
        return None

    # ── Official thumbnail ────────────────────────────────────

    async def _fetch_official(
        self,
        client: httpx.AsyncClient,
        article: ProcessedArticle,
    ) -> ImageResult | None:
        url = article.thumbnail_url
        if not url:
            return None

        # Determine source from URL, not source_name
        if "opengraph.github.com" in url:
            source = "github_preview"
        elif "producthunt" in url or "imgix.net" in url or "ph-files" in url:
            source = "producthunt_thumbnail"
        elif "redd.it" in url:
            source = "reddit_preview"
        else:
            source = "official_thumbnail"

        # Skip HEAD verification for trusted CDN domains.
        # opengraph.github.com and PH CDN always return valid images
        # for URLs that were set from their respective APIs.
        _TRUSTED = (
            "opengraph.github.com",
            "imgix.net", "ph-files", "producthunt",
            "preview.redd.it", "i.redd.it",   # Reddit preview images
        )
        if any(t in url for t in _TRUSTED):
            return ImageResult(
                url=url,
                source=source,
                credit=None,
                credit_url=None,
                license=f"{source} — official product image",
            )

        # For other domains: verify with a HEAD request
        async with self._semaphore:
            try:
                r = await client.head(url)
                if r.status_code != 200:
                    return None
                content_type = r.headers.get("content-type", "")
                if "html" in content_type:
                    return None
            except httpx.HTTPError as exc:
                logger.debug("Official thumbnail check failed [%s]: %s", url, exc)
                return None

        return ImageResult(
            url=url,
            source=source,
            credit=None,
            credit_url=None,
            license=f"{source} — official product image",
        )

    # ── Unsplash ──────────────────────────────────────────────

    async def _fetch_unsplash(
        self,
        client: httpx.AsyncClient,
        keywords: list[str],
    ) -> ImageResult | None:
        query = " ".join(keywords[:2])
        params = {
            "query":          query,
            "orientation":    "landscape",
            "content_filter": "high",
        }
        headers = {"Authorization": f"Client-ID {self._unsplash_key}"}

        async with self._semaphore:
            try:
                r = await client.get(
                    "https://api.unsplash.com/photos/random",
                    params=params,
                    headers=headers,
                )
                r.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.warning("Unsplash HTTP error [%s]: %s", query, exc.response.status_code)
                return None
            except httpx.HTTPError as exc:
                logger.warning("Unsplash connection error [%s]: %s", query, exc)
                return None

        data = r.json()
        try:
            return ImageResult(
                url=data["urls"]["regular"],
                source="unsplash",
                credit=data["user"]["name"],
                credit_url=data["user"]["links"]["html"],
                license=f"Unsplash License — {data.get('links', {}).get('html', '')}",
            )
        except (KeyError, TypeError) as exc:
            logger.warning("Unsplash parse error [%s]: %s", query, exc)
            return None


# ─────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────
def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
