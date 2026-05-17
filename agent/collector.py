"""
agent/collector.py — Vctr tool data collector
Sources: ProductHunt GraphQL + Hacker News (Show HN) + GitHub Trending

Phase 1 — Collect: basic tool data from each source
Phase 2 — Enrich:  GitHub README + HN comments → richer LLM input

Rules:
  - Secrets via os.getenv() only
"""

from __future__ import annotations

import asyncio
import html as _html_module
import logging
import os
import re
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import yaml

# GitHub paths that are not actual repos (navigation links)
_GH_RESERVED = frozenset({
    "trending", "topics", "explore", "marketplace", "features",
    "enterprise", "sponsors", "about", "pricing", "login", "join",
    "organizations", "settings", "notifications", "pulls", "issues",
})

logger = logging.getLogger(__name__)

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _HTML_TAG_RE.sub("", text).strip()


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def _clean_readme(text: str) -> str:
    """Strip markdown formatting from README for LLM consumption."""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)                          # badge images
    text = _strip_html(text)                                              # HTML tags
    text = _html_module.unescape(text)                                   # &amp; → & etc.
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)           # headings
    text = re.sub(r'```[\s\S]*?```', '', text)                           # code blocks
    text = re.sub(r'`[^`\n]+`', '', text)                                # inline code
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)                 # links → text
    text = re.sub(r'^[-*_]{3,}$', '', text, flags=re.MULTILINE)          # horizontal rules
    text = re.sub(r'^\s*[-*+]\s+', '• ', text, flags=re.MULTILINE)       # bullets
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ─────────────────────────────────────────────────────────────
# Collected item type
# ─────────────────────────────────────────────────────────────
@dataclass
class CollectedArticle:
    source_url:      str
    source_name:     str        # "producthunt" | "github_trending" | "hackernews"
    title_ko:        str        # tool name (schema field reused)
    summary_ko:      str        # enriched description (tagline + README + comments)
    published_at_ko: datetime
    category:        str
    votes_count:     int              = 0
    rating:          float            = 0.0
    pricing_type:    str              = ""
    maker_names:     list[str]        = field(default_factory=list)
    thumbnail_url:   str              = ""


# ProductHunt GraphQL
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
        thumbnail { url }
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
        self._cfg          = config or _load_config()
        self._semaphore    = asyncio.Semaphore(self._cfg["pipeline"]["concurrency"])
        self._ph_semaphore = asyncio.Semaphore(1)   # PH rate limit ~1 req/sec
        self._ph_token     = os.getenv("PRODUCTHUNT_API_KEY", "")
        self._window       = timedelta(hours=self._cfg["pipeline"]["fetch_window_hours"])
        self._max_per_cat  = self._cfg["llm"]["max_articles_per_category"]
        self._keywords     = self._cfg["category_keywords"]
        self._enabled      = [c["key"] for c in self._cfg["categories"] if c["enabled"]]

    # ── Entry point ───────────────────────────────────────────

    async def collect_all(self) -> list[CollectedArticle]:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:

            # ── Phase 1: collect ──────────────────────────────
            tasks: list = []

            if self._cfg["sources"]["producthunt"]["enabled"]:
                for cat_cfg in self._cfg["categories"]:
                    if not cat_cfg["enabled"]:
                        continue
                    cat = cat_cfg["key"]
                    for topic in cat_cfg.get("producthunt_topics", [])[:3]:
                        tasks.append(self._fetch_producthunt(client, topic, cat))

            if self._cfg["sources"]["github_trending"]["enabled"]:
                tasks.append(self._fetch_github_trending(client))

            if self._cfg["sources"].get("hackernews", {}).get("enabled"):
                tasks.append(self._fetch_hackernews(client))

            batches  = await asyncio.gather(*tasks, return_exceptions=True)
            raw      = self._dedupe_and_filter(batches)

            # ── Phase 2: enrich (README + HN comments) ────────
            enrich_tasks = [self._enrich_item(client, item) for item in raw]
            enriched     = await asyncio.gather(*enrich_tasks, return_exceptions=True)

        results = [r for r in enriched if isinstance(r, CollectedArticle)]
        logger.info("Collected + enriched: %d items", len(results))
        return results

    # ── ProductHunt GraphQL ───────────────────────────────────

    async def _fetch_producthunt(
        self, client: httpx.AsyncClient, topic: str, category: str
    ) -> list[CollectedArticle]:
        headers = {
            "Authorization": f"Bearer {self._ph_token}",
            "Content-Type":  "application/json",
        }
        payload = {"query": _PH_QUERY, "variables": {"topic": topic, "first": 10}}

        async with self._ph_semaphore:
            await asyncio.sleep(0.8)
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

        edges   = r.json().get("data", {}).get("posts", {}).get("edges", [])
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
            # ↓ 300자 → 1200자로 확장
            summary = tagline
            if description and description != tagline:
                summary = f"{tagline}. {description[:1200]}".strip(". ")

            makers        = [m["name"] for m in node.get("makers", {}).get("nodes", [])]
            pricing_plans = node.get("pricing") or []
            pricing_type  = _infer_pricing(pricing_plans)
            votes         = int(node.get("votesCount") or 0)
            rating        = float(node.get("reviewsRating") or 0.0)
            thumbnail_url = (node.get("thumbnail") or {}).get("url", "")

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
                thumbnail_url=thumbnail_url,
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
            owner = repo.split("/")[0].lower()
            if owner in _GH_RESERVED:
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
                thumbnail_url=f"https://opengraph.github.com/repo/{repo}",
            ))
        return results

    # ── Hacker News ───────────────────────────────────────────

    async def _fetch_hackernews(
        self, client: httpx.AsyncClient
    ) -> list[CollectedArticle]:
        hn_cfg    = self._cfg["sources"]["hackernews"]
        min_score = hn_cfg.get("min_score", 20)
        window_h  = hn_cfg.get("fetch_window_hours", 72)
        since     = int(time.time()) - window_h * 3600

        params = {
            "tags":           "show_hn",
            "numericFilters": f"created_at_i>{since},points>={min_score}",
            "hitsPerPage":    80,
        }

        async with self._semaphore:
            try:
                r = await client.get(hn_cfg["search_base"], params=params)
                r.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("Hacker News fetch failed: %s", exc)
                return []

        hits = r.json().get("hits", [])

        # Build items and gather comment fetches in parallel
        proto_items: list[tuple[CollectedArticle, str]] = []   # (item, story_id)
        for hit in hits:
            raw_title = hit.get("title", "")
            title = re.sub(r"^[Ss]how HN:\s*", "", raw_title).strip()
            if not title:
                continue

            url = hit.get("url", "")
            if not url:
                url = f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"

            summary  = _strip_html(hit.get("story_text") or "")[:600]
            category = self._assign_category(title + " " + summary)
            if category is None:
                continue

            pub_dt = datetime.fromtimestamp(
                int(hit.get("created_at_i") or 0), tz=timezone.utc
            )
            votes = int(hit.get("points") or 0)

            thumbnail_url = ""
            gh_match = re.match(
                r"https?://github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", url
            )
            if gh_match:
                thumbnail_url = f"https://opengraph.github.com/repo/{gh_match.group(1)}"

            item = CollectedArticle(
                source_url=url,
                source_name="hackernews",
                title_ko=title,
                summary_ko=summary,
                published_at_ko=pub_dt,
                category=category,
                votes_count=votes,
                thumbnail_url=thumbnail_url,
            )
            proto_items.append((item, str(hit.get("objectID", ""))))

        # Fetch comments for all HN items in parallel
        comment_tasks = [
            self._fetch_hn_comments(client, story_id)
            for _, story_id in proto_items
        ]
        comments_list = await asyncio.gather(*comment_tasks, return_exceptions=True)

        results = []
        for (item, _), comments in zip(proto_items, comments_list):
            if isinstance(comments, str) and comments:
                item.summary_ko = item.summary_ko.rstrip() + "\n\n커뮤니티 반응:\n" + comments
            results.append(item)

        logger.info("Hacker News: %d Show HN posts matched categories", len(results))
        return results

    async def _fetch_hn_comments(
        self, client: httpx.AsyncClient, story_id: str
    ) -> str:
        """Fetch top comments for a HN story via Algolia items API."""
        if not story_id:
            return ""
        url = f"https://hn.algolia.com/api/v1/items/{story_id}"
        async with self._semaphore:
            try:
                r = await client.get(url)
                r.raise_for_status()
            except httpx.HTTPError:
                return ""

        children = r.json().get("children", [])
        comments = []
        for child in children[:20]:
            text = _strip_html(child.get("text", "") or "").strip()
            if len(text) < 80:
                continue
            author  = child.get("author", "")
            excerpt = (text[:280].rsplit(" ", 1)[0] + "…") if len(text) > 280 else text
            comments.append(f'- {author}: "{excerpt}"')
            if len(comments) >= 4:
                break
        return "\n".join(comments)

    # ── Phase 2: README enrichment ────────────────────────────

    async def _enrich_item(
        self, client: httpx.AsyncClient, item: CollectedArticle
    ) -> CollectedArticle:
        """Fetch GitHub README for items whose source_url is a GitHub repo."""
        gh_match = re.match(
            r"https?://github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)",
            item.source_url
        )
        if not gh_match:
            return item

        repo   = gh_match.group(1).rstrip("/")
        readme = await self._fetch_readme(client, repo)
        if readme:
            item.summary_ko = (
                item.summary_ko.rstrip()
                + "\n\n기능 및 상세 설명:\n"
                + readme
            )
            logger.debug("README enriched: %s (%d chars)", repo, len(readme))
        return item

    async def _fetch_readme(
        self, client: httpx.AsyncClient, repo: str
    ) -> str:
        """Fetch and clean GitHub README, return first ~1500 chars of plain text."""
        for branch in ("main", "master"):
            url = f"https://raw.githubusercontent.com/{repo}/{branch}/README.md"
            async with self._semaphore:
                try:
                    r = await client.get(url)
                    if r.status_code == 200:
                        cleaned = _clean_readme(r.text)
                        return cleaned[:1500]
                except httpx.HTTPError:
                    continue
        return ""

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
