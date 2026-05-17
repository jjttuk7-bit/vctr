"""
agent/fact_extractor.py — Vctr tool fact extractor
CollectedArticle (tool name + description) → ArticleFacts for LLM processor

Design:
  - No LLM calls — pure rule/regex based
  - Extracts structured facts: maker, pricing, votes, capabilities
  - Only ArticleFacts is passed to Processor — no raw summary text
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import yaml

from agent.collector import CollectedArticle


# ─────────────────────────────────────────────────────────────
# Regex patterns for English tool data
# ─────────────────────────────────────────────────────────────

_RE_NUMBER = re.compile(
    r'\$\d+(?:\.\d+)?(?:/mo|/month|/year|/yr)?'
    r'|\d+[,\d]*\s+(?:users|votes|stars|downloads|reviews|teams?|customers)'
    r'|\d+(?:\.\d+)?(?:x|X)\s+(?:faster|cheaper|better|more)'
    r'|\d+(?:\.\d+)?\s*%\s+(?:faster|cheaper|more|less|reduction|improvement|accurate)'
)

_RE_DEPLOY = re.compile(
    r'\b(?:self[- ]hosted|on[- ]prem(?:ise)?|open[- ]source|cloud[- ]native|'
    r'self[- ]deploy|local[- ]first)\b',
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────
# Output type
# ─────────────────────────────────────────────────────────────
@dataclass
class ArticleFacts:
    # Source tracking (for DB)
    category:        str
    source_url:      str
    source_name:     str
    published_at_ko: datetime

    # Tool identity — passed to LLM as structured facts, not raw sentences
    title_ko: str   # tool name

    # Structured facts
    who:          list[str] = field(default_factory=list)   # maker names
    what:         str       = ""                             # core capability phrase
    when:         str       = ""                             # launch/update signal
    where:        str       = ""                             # deployment type
    numbers:      list[str] = field(default_factory=list)   # votes, pricing, metrics
    context:      str       = ""                             # extended description
    pricing_type:  str       = ""                             # free|freemium|paid|unknown
    votes_count:   int       = 0
    rating:        float     = 0.0
    thumbnail_url: str       = ""                             # official product image


# ─────────────────────────────────────────────────────────────
# FactExtractor
# ─────────────────────────────────────────────────────────────
class FactExtractor:
    def __init__(self, config: dict | None = None) -> None:
        cfg = config or _load_config()
        self._keywords_by_category: dict[str, list[str]] = cfg["category_keywords"]

    def extract(self, article: CollectedArticle) -> ArticleFacts:
        summary = article.summary_ko

        numbers = _all_matches(_RE_NUMBER, summary)
        if article.votes_count > 0:
            numbers.insert(0, f"{article.votes_count} upvotes on ProductHunt")
        if article.rating > 0:
            numbers.append(f"{article.rating:.1f}/5 rating")

        return ArticleFacts(
            category=article.category,
            source_url=article.source_url,
            source_name=article.source_name,
            published_at_ko=article.published_at_ko,
            title_ko=article.title_ko,
            who=article.maker_names[:3],
            what=_extract_what(summary),
            when=_extract_when(article),
            where=_extract_where(summary),
            numbers=numbers[:8],
            context=_build_context(summary),
            pricing_type=article.pricing_type,
            votes_count=article.votes_count,
            rating=article.rating,
            thumbnail_url=article.thumbnail_url,
        )

    def extract_all(self, articles: list[CollectedArticle]) -> list[ArticleFacts]:
        return [self.extract(a) for a in articles]


# ─────────────────────────────────────────────────────────────
# Utility functions
# ─────────────────────────────────────────────────────────────

def _extract_what(summary: str) -> str:
    """First sentence of summary as the core capability phrase."""
    first = re.split(r'[.!?]\s+', summary.strip())[0]
    return first[:200] if first else ""


def _extract_when(article: CollectedArticle) -> str:
    if article.source_name == "producthunt":
        dt = article.published_at_ko
        return dt.strftime("%b %Y") if dt else ""
    return "trending now"


def _extract_where(text: str) -> str:
    m = _RE_DEPLOY.search(text)
    if m:
        return m.group(0).lower().replace(" ", "-")
    return "cloud"


def _build_context(summary: str) -> str:
    """Return the full enriched description (README + comments included)."""
    # summary_ko may now contain README and HN comments after enrichment
    # Return most of it so the LLM has rich material
    return summary.strip()[:2000]


def _all_matches(pattern: re.Pattern, text: str) -> list[str]:
    return [m.strip() for m in pattern.findall(text)]


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
