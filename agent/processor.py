"""
agent/processor.py — KNow LLM 처리기
ArticleFacts → 카테고리별 프롬프트 → LLM → ProcessedArticle

규칙 (CLAUDE.md):
  - LLM 호출:  process_with_fallback() 경유 (GPT-4o → Claude)
  - JSON 파싱: safe_parse_json() 경유 — 직접 json.loads() 금지
  - 프롬프트:  agent/prompts/{version_prefix}_{category_key}.txt
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import anthropic
import openai
import yaml

from agent.fact_extractor import ArticleFacts

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent / "prompts"


# ─────────────────────────────────────────────────────────────
# JSON 파싱 (CLAUDE.md 규칙 #7)
# ─────────────────────────────────────────────────────────────
_RE_FENCE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
_RE_BARE  = re.compile(r"\{.*\}",                          re.DOTALL)


def safe_parse_json(text: str) -> dict | None:
    """
    LLM 출력 텍스트에서 JSON 객체 추출. 실패 시 None 반환.
    시도 순서: 직접 파싱 → 마크다운 펜스 → 첫 { } 블록
    """
    cleaned = text.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    m = _RE_FENCE.search(cleaned)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    m = _RE_BARE.search(cleaned)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    logger.warning("safe_parse_json 실패 (앞 200자): %s", cleaned[:200])
    return None


# ─────────────────────────────────────────────────────────────
# 출력 타입
# ─────────────────────────────────────────────────────────────
@dataclass
class ProcessedArticle:
    # 원본 추적
    category:        str
    source_url:      str
    source_name:     str
    published_at_ko: datetime
    title_ko:        str
    prompt_version:  str

    # LLM 생성 필드
    headline_en:       str
    subheadline_en:    str
    body_en:           str
    seo_title:         str
    seo_description:   str
    tags:              list[str] = field(default_factory=list)
    tone:              str       = "informative"
    cultural_note:     str | None = None
    unsplash_keywords: list[str] = field(default_factory=list)
    thumbnail_url:     str       = ""   # official product image passed from collector


# ─────────────────────────────────────────────────────────────
# Processor
# ─────────────────────────────────────────────────────────────
class Processor:
    def __init__(self, config: dict | None = None) -> None:
        self._cfg        = config or _load_config()
        self._semaphore  = asyncio.Semaphore(3)   # LLM 동시 호출 상한
        self._oai        = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self._ant        = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self._primary    = self._cfg["llm"]["primary"]      # "gpt-4o"
        self._fallback   = self._cfg["llm"]["fallback"]     # "claude-3-5-sonnet-..."
        self._prompt_ver = self._cfg["llm"]["prompt_version"]  # "v1.0"

    # ── 공개 API ──────────────────────────────────────────────

    async def process_all(
        self, facts_list: list[ArticleFacts]
    ) -> list[ProcessedArticle]:
        """ArticleFacts 목록 전체 처리. 실패 건은 로깅 후 스킵."""
        results = await asyncio.gather(
            *[self._process_one(f) for f in facts_list],
            return_exceptions=True,
        )
        processed = []
        for r in results:
            if isinstance(r, BaseException):
                logger.warning("처리 태스크 예외: %s", r)
            elif r is not None:
                processed.append(r)

        logger.info("LLM done: %d / %d items", len(processed), len(facts_list))
        return processed

    # ── 단건 처리 ─────────────────────────────────────────────

    async def _process_one(
        self, facts: ArticleFacts
    ) -> ProcessedArticle | None:
        system = self._build_system_prompt(facts.category)
        user   = _build_user_message(facts)

        raw = await self._process_with_fallback(system, user, facts.category)
        if raw is None:
            return None

        data = safe_parse_json(raw)
        if data is None:
            logger.warning("JSON parse failed [%s]: %s", facts.category, facts.title_ko)
            return None

        return self._to_processed_article(facts, data)

    # ── LLM 호출 (CLAUDE.md 규칙 #6) ─────────────────────────

    async def _process_with_fallback(
        self, system: str, user: str, category: str
    ) -> str | None:
        # 1차: GPT-4o (json_object 모드로 파싱 안정성 확보)
        try:
            async with self._semaphore:
                r = await self._oai.chat.completions.create(
                    model=self._primary,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"},
                )
            return r.choices[0].message.content
        except Exception as exc:
            logger.warning("GPT-4o failed [%s]: %s — retrying with Claude", category, exc)

        # 2차: Claude
        try:
            async with self._semaphore:
                r = await self._ant.messages.create(
                    model=self._fallback,
                    max_tokens=1500,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                )
            return r.content[0].text
        except Exception as exc:
            logger.error("Claude failed [%s]: %s — skipping item", category, exc)

        return None

    # ── 프롬프트 빌드 ─────────────────────────────────────────

    def _build_system_prompt(self, category: str) -> str:
        # "v1.0" → "v1"  (파일명 접두사)
        ver = self._prompt_ver.split(".")[0]
        base    = _load_prompt(f"{ver}_base")
        variant = _load_prompt(f"{ver}_{_category_key(category)}")
        return base + "\n\n" + variant

    # ── 출력 변환 + 품질 검증 ─────────────────────────────────

    def _to_processed_article(
        self, facts: ArticleFacts, data: dict
    ) -> ProcessedArticle:
        # 길이 상한 적용 (PROMPTS.md 품질 기준)
        headline    = str(data.get("headline_en",    ""))[:90]
        subheadline = str(data.get("subheadline_en", ""))[:60]
        seo_title   = str(data.get("seo_title",      ""))[:60]
        seo_desc    = str(data.get("seo_description",""))[:155]

        tags = data.get("tags", [])
        tags = [t for t in tags if isinstance(t, str)][:10]

        # unsplash_keywords: 3개 이하, config fallback 보장
        keywords = [k for k in data.get("unsplash_keywords", []) if isinstance(k, str)][:3]
        if not keywords:
            keywords = self._cfg["image_keywords"].get(facts.category, [])[:3]

        return ProcessedArticle(
            category=facts.category,
            source_url=facts.source_url,
            source_name=facts.source_name,
            published_at_ko=facts.published_at_ko,
            title_ko=facts.title_ko,
            prompt_version=self._prompt_ver,
            headline_en=headline,
            subheadline_en=subheadline,
            body_en=str(data.get("body_en", "")),
            seo_title=seo_title,
            seo_description=seo_desc,
            tags=tags,
            tone=str(data.get("tone", "informative")),
            cultural_note=data.get("cultural_note") or None,
            unsplash_keywords=keywords,
            thumbnail_url=facts.thumbnail_url,
        )


# ─────────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────────

def _build_user_message(facts: ArticleFacts) -> str:
    return json.dumps(
        {
            "category": facts.category,
            "key_facts": {
                "who":     facts.who,
                "what":    facts.what,
                "when":    facts.when,
                "where":   facts.where,
                "numbers": facts.numbers,
                "context": facts.context,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def _category_key(category: str) -> str:
    """"K-Beauty" → "kbeauty" / "K-Pop" → "kpop" """
    return category.lower().replace("-", "").replace(" ", "")


def _load_prompt(name: str) -> str:
    path = _PROMPTS_DIR / f"{name}.txt"
    if not path.exists():
        path = _PROMPTS_DIR / "archive" / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {name}.txt (path: {_PROMPTS_DIR})")
    return path.read_text(encoding="utf-8").strip()


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
