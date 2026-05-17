"""
agent/main.py — Vctr pipeline orchestrator
Entry point: python -m agent.main [--dry-run]

Pipeline stages:
  [Collector]     ProductHunt + GitHub Trending → CollectedArticle list
  [FactExtractor] CollectedArticle → ArticleFacts (regex, no LLM)
  [Processor]     ArticleFacts → ProcessedArticle (LLM review writing)
  [ImageFetcher]  ProcessedArticle → ImageResult (Unsplash)
  [Publisher]     → DB save → daily_digest → git push
  [Notifier]      → email + Discord

Performance target: < 120s / day
"""

from __future__ import annotations

import argparse
import asyncio
import logging

import sys
import time

from dotenv import load_dotenv
load_dotenv()   # loads .env from repo root

# Force UTF-8 output on Windows (avoids cp949 UnicodeEncodeError)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from agent.collector import Collector
from agent.fact_extractor import FactExtractor
from agent.image_fetcher import ImageFetcher
from agent.notifier import Notifier
from agent.processor import Processor
from agent.publisher import Publisher
from database.models import Article, make_engine

# ─────────────────────────────────────────────────────────────
# 로깅 설정
# ─────────────────────────────────────────────────────────────

def _setup_logging(debug: bool = False) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    # httpx / anthropic 라이브러리 로그 억제
    for noisy in ("httpx", "httpcore", "anthropic", "openai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


logger = logging.getLogger(__name__)

_PERF_TARGET_SEC = 120   # CLAUDE.md 성능 목표


# ─────────────────────────────────────────────────────────────
# 파이프라인
# ─────────────────────────────────────────────────────────────

async def run_pipeline(dry_run: bool = False) -> None:
    t0    = time.monotonic()
    today = date.today()

    logger.info("=" * 52)
    logger.info("Vctr pipeline starting  [%s]  dry_run=%s", today, dry_run)
    logger.info("=" * 52)

    # ── 1. Collect ────────────────────────────────────────────
    t = time.monotonic()
    collector = Collector()
    collected = await collector.collect_all()
    logger.info("[1/6] Collected: %d items  (%.1fs)", len(collected), time.monotonic() - t)

    if not collected:
        logger.info("No items collected — pipeline done")
        return

    # ── 2. Extract facts (no LLM) ─────────────────────────────
    t = time.monotonic()
    extractor  = FactExtractor()
    facts_list = extractor.extract_all(collected)
    logger.info("[2/6] Facts extracted: %d items  (%.1fs)", len(facts_list), time.monotonic() - t)

    # ── 3. LLM review writing ─────────────────────────────────
    t = time.monotonic()
    processor = Processor()
    processed = await processor.process_all(facts_list)
    logger.info("[3/6] LLM processed: %d items  (%.1fs)", len(processed), time.monotonic() - t)

    if not processed:
        logger.info("No items processed — pipeline done")
        return

    # ── 4. Image fetch (parallel) ─────────────────────────────
    t = time.monotonic()
    image_fetcher = ImageFetcher()
    images = await asyncio.gather(
        *[image_fetcher.fetch_for_article(a) for a in processed]
    )
    hit  = sum(1 for img in images if img is not None)
    miss = len(images) - hit
    logger.info(
        "[4/6] Images done: %d items (hit=%d miss=%d)  (%.1fs)",
        len(images), hit, miss, time.monotonic() - t,
    )

    pairs = list(zip(processed, images))

    if dry_run:
        _log_dry_run_summary(pairs)
        logger.info("dry-run mode — skipping DB save and notifications")
        _log_elapsed(t0)
        return

    # ── 5. DB 저장 + daily_digest + git push ──────────────────
    t = time.monotonic()
    publisher      = Publisher()
    publish_result = publisher.publish_all(pairs)
    publisher.git_commit_and_push(today)
    logger.info(
        "[5/6] Published: saved=%d skipped=%d  (%.1fs)",
        publish_result.saved, publish_result.skipped, time.monotonic() - t,
    )

    if not publish_result.article_ids:
        logger.info("Nothing saved — skipping notifications")
        _log_elapsed(t0)
        return

    # ── 6. 알림 (이메일 + Discord) ─────────────────────────────
    t = time.monotonic()
    articles = _load_articles(publish_result.article_ids)
    notifier = Notifier()
    notify_result = await notifier.notify_all(
        articles=articles,
        featured_id=publish_result.featured_id,
        run_date=today,
    )
    logger.info(
        "[6/6] Notified: email=%s discord=%s  (%.1fs)",
        notify_result.email, notify_result.discord, time.monotonic() - t,
    )

    _log_elapsed(t0)


# ─────────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────────

_DB_PATH = "website/data/vctr.db"   # same path as publisher

def _load_articles(article_ids: list[int]) -> list[Article]:
    """게시된 기사를 DB에서 조회 (알림 발송용)."""
    engine = make_engine(_DB_PATH)
    with Session(engine) as session:
        return (
            session.query(Article)
            .filter(Article.id.in_(article_ids))
            .order_by(Article.id)
            .all()
        )


def _log_dry_run_summary(
    pairs: list[tuple]
) -> None:
    logger.info("── dry-run preview (%d items) ──", len(pairs))
    for article, image in pairs[:5]:
        img_src = image.source if image else "og_generated"
        logger.info(
            "  [%s] %s  (img=%s)",
            article.category,
            (article.headline_en or "")[:60],
            img_src,
        )
    if len(pairs) > 5:
        logger.info("  ... and %d more", len(pairs) - 5)


def _log_elapsed(t0: float) -> None:
    elapsed = time.monotonic() - t0
    flag    = "SLOW (over target)" if elapsed > _PERF_TARGET_SEC else "OK"
    logger.info("=" * 52)
    logger.info("Pipeline done: %.1fs  %s", elapsed, flag)
    logger.info("=" * 52)


# ─────────────────────────────────────────────────────────────
# CLI 진입점
# ─────────────────────────────────────────────────────────────

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Vctr daily pipeline")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="수집·처리·이미지까지만 실행. DB 저장·git push·알림 건너뜀.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="DEBUG 레벨 로깅 활성화",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    _setup_logging(debug=args.debug)
    asyncio.run(run_pipeline(dry_run=args.dry_run))
