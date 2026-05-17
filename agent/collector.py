"""
agent/collector.py — Vctr tool data collector
ProductHunt GraphQL API + GitHub Trending → category-mapped tool data

Rules:
  - Store tool tagline/description snippet only (no full page text)
  - Secrets via os.getenv() only
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import yaml

logger = logging.getLogger(__name__)

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _HTML_TAG_RE.sub("", text).strip()


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


# ─────────────────────────────────────────────────────────────
# Collected item type
# Field names kept compatible with KNow DB schema
# ─────────────────────────────────────────────────────────────
@dataclass
class CollectedArticle:
    source_url:      str
    source_name:     str        # "producthunt" | "github_trending"
    title_ko:        str        # tool name (schema field reused)
    summary_ko:      str        # tool tagline + description snippet
    published_at_ko: datetime
    category:        str
    # ProductHunt extras — passed to FactExtractor
    votes_count:     int              = 0
    rating:          float            = 0.0
    pricing_type:    str              = ""   # "free" | "freemium" | "paid" | "unknown"
    maker_names:     list[str]        = field(default_factory=list)


# ProductHunt GraphQL — top posts by topic
_PH_QUERY = """
query getTopPosts($topic: String!, $first: Int!) {
  posts(topic: $topic, first: $first, order: VOTES) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        reviewsRating
        createdAt
        makers { nodes { name } }
        pricing { planName isMonthlyPricing price }
      }
    }
  }
}
"""


# ─────────────────────────────────────────────────────────────
# Collector
# ─────────────────────────────────────────────────────────────
class Collector:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg         = config or _load_config()
        self._semaphore   = asyncio.Semaphore(self._cfg["pipeline"]["concurrency"])
        self._ph_token    = os.getenv("PRODUCTHUNT_API_KEY", "")
        self._window      = timedelta(hours=self._cfg["pipeline"]["fetch_window_hours"])
        self._max_per_cat = self._cfg["llm"]["max_articles_per_category"]
        self._keywords    = self._cfg["category_keywords"]
        self._enabled     = [c["key"] for c in self._cfg["categories"] if c["enabled"]]

    # ── Entry point ───────────────────────────────────────────

    async def collect_all(self) -> list[CollectedArticle]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            tasks: list = []

            if self._cfg["sources"]["producthunt"]["enabled"]:
                for cat_cfg in self._cfg["categories"]:
                    if not cat_cfg["enabled"]:
                        continue
                    cat = cat_cfg["key"]
                    # max 2 topics per category to avoid over-collection
                    for topic in cat_cfg.get("producthunt_topics", [])[:2]:
                        tasks.append(self._fetch_producthunt(client, topic, cat))

            if self._cfg["sources"]["github_trending"]["enabled"]:
                tasks.append(self._fetch_github_trending(client))

            batches = await asyncio.gather(*tasks, return_exceptions=True)

        return self._dedupe_and_filter(batches)

    # ── ProductHunt GraphQL ───────────────────────────────────

    async def _fetch_producthunt(
        self, client: httpx.AsyncClient, topic: str, category: str
    ) -> list[CollectedArticle]:
        headers = {
            "Authorization": f"Bearer {self._ph_token}",
            "Content-Type":  "application/json",
        }
        payload = {
            "query":     _PH_QUERY,
            "variables": {"topic": topic, "first": 10},
        }

        async with self._semaphore:
            try:
                r = await client.post(
                    self._cfg["sources"]["producthunt"]["api_base"],
                    headers=headers,
                    json=payload,
                )
                r.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("ProductHunt API failed [%s / %s]: %s", category, topic, exc)
                return []

        edges = r.json().get("data", {}).get("posts", {}).get("edges", [])
        results = []
        for edge in edges:
            node = edge.get("node", {})
            url  = node.get("url", "")
            if not url:
                continue

            created_raw = node.get("createdAt", "")
            try:
                pub_dt = datetime.fromisoformat(created_raw.replace("Z", "+00:00"))
            except Exception:
                pub_dt = datetime.now(tz=timezone.utc)

            tagline     = node.get("tagline") or ""
            description = node.get("description") or ""
            summary = tagline
            if description and description != tagline:
                summary = f"{tagline}. {description[:300]}".strip(". ")

            makers        = [m["name"] for m in node.get("makers", {}).get("nodes", [])]
            pricing_plans = node.get("pricing") or []
            pricing_type  = _infer_pricing(pricing_plans)
            votes         = int(node.get("votesCount") or 0)
            rating        = float(node.get("reviewsRating") or 0.0)

            results.append(CollectedArticle(
                source_url=url,
                source_name="producthunt",
                title_ko=node.get("name", ""),
                summary_ko=summary,
                published_at_ko=pub_dt,
                category=category,
                votes_count=votes,
                rating=rating,
                pricing_type=pricing_type,
                maker_names=makers,
            ))
        return results

    # ── GitHub Trending ───────────────────────────────────────

    async def _fetch_github_trending(
        self, client: httpx.AsyncClient
    ) -> list[CollectedArticle]:
        url = self._cfg["sources"]["github_trending"]["url"]
        async with self._semaphore:
            try:
                r = await client.get(url, headers={"Accept": "text/html"})
                r.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("GitHub Trending failed: %s", exc)
                return []

        repo_re = re.compile(r'href="/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)"')
        desc_re = re.compile(
            r'<p[^>]*class="[^"]*col-9[^"]*"[^>]*>\s*(.*?)\s*</p>', re.DOTALL
        )

        seen: set[str] = set()
        repos = [m.group(1) for m in repo_re.finditer(r.text)]
        descs = [_strip_html(m.group(1)) for m in desc_re.finditer(r.text)]

        results = []
        for i, repo in enumerate(repos[:25]):
            if repo in seen or repo.count("/") != 1:
                continue
            seen.add(repo)

            desc     = descs[i] if i < len(descs) else ""
            category = self._assign_category(repo.replace("/", " ") + " " + desc)
            if category is None:
                continue

            results.append(CollectedArticle(
                source_url=f"https://github.com/{repo}",
                source_name="github_trending",
                title_ko=repo,
                summary_ko=desc,
                published_at_ko=datetime.now(tz=timezone.utc),
                category=category,
            ))
        return results

    # ── Category assignment ───────────────────────────────────

    def _assign_category(self, text: str) -> str | None:
        text_lower = text.lower()
        best_cat, best_count = None, 0
        for category in self._enabled:
            count = sum(
                1 for kw in self._keywords.get(category, [])
                if kw.lower() in text_lower
            )
            if count > best_count:
                best_cat, best_count = category, count
        return best_cat if best_count > 0 else None

    # ── Deduplication + filter ────────────────────────────────

    def _dedupe_and_filter(self, batches: list) -> list[CollectedArticle]:
        seen_urls:       set[str]       = set()
        category_counts: dict[str, int] = defaultdict(int)
        results:         list[CollectedArticle] = []

        for batch in batches:
            if isinstance(batch, BaseException):
                logger.warning("Collect task exception: %s", batch)
                continue
            for tool in batch:
                if not tool.source_url:
                    continue
                if tool.source_url in seen_urls:
                    continue
                if category_counts[tool.category] >= self._max_per_cat:
                    continue
                seen_urls.add(tool.source_url)
                category_counts[tool.category] += 1
                results.append(tool)

        logger.info("Collected: %d items %s", len(results), dict(category_counts))
        return results


# ─────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────

def _infer_pricing(pricing_plans: list) -> str:
    if not pricing_plans:
        return "unknown"
    prices = [float(p.get("price") or 0) for p in pricing_plans]
    if all(p == 0 for p in prices):
        return "free"
    if any(p == 0 for p in prices):
        return "freemium"
    return "paid"
