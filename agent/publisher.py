"""
agent/publisher.py — KNow 게시기
ProcessedArticle + ImageResult → DB 저장 → daily_digest 큐레이션 → git push

규칙 (CLAUDE.md):
  - 모든 기사 published=True 시 source_url 출처 표기 보장 (DB 저장 단계)
  - Unsplash credit 컬럼 반드시 기록 (CLAUDE.md 규칙 #3)
  - git push: GitHub Actions 환경에서만 실행
참조: KWAVE_DAILY_PLAN.md 3절 / 7절
"""

from __future__ import annotations

import logging
import os
import subprocess
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from agent.image_fetcher import ImageResult
from agent.processor import ProcessedArticle
from database.models import Article, DailyDigest, init_db, make_engine

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# 결과 타입
# ─────────────────────────────────────────────────────────────
@dataclass
class PublishResult:
    saved:       int
    skipped:     int              # source_url 중복으로 스킵된 건수
    article_ids: list[int] = field(default_factory=list)
    featured_id: int | None = None  # daily_digest 히어로 기사 ID


# ─────────────────────────────────────────────────────────────
# Publisher
# ─────────────────────────────────────────────────────────────
class Publisher:
    def __init__(
        self,
        db_path: str = "website/data/vctr.db",   # repo root relative path
        config: dict | None = None,
    ) -> None:
        self._db_path = db_path
        self._cfg     = config or _load_config()
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._engine  = make_engine(db_path)
        init_db(db_path)   # 테이블 없으면 생성 (첫 실행 안전)

    # ── 공개 API ──────────────────────────────────────────────

    def publish_all(
        self,
        items: list[tuple[ProcessedArticle, ImageResult | None]],
    ) -> PublishResult:
        """
        (ProcessedArticle, ImageResult | None) 쌍 목록을 DB에 저장.
        중복(source_url)은 스킵. 완료 후 daily_digest 업데이트.
        """
        saved_ids: list[int] = []
        skipped = 0
        today = date.today()

        with Session(self._engine) as session:
            for article, image in items:
                row = self._save_article(session, article, image)
                if row is None:
                    skipped += 1
                else:
                    saved_ids.append(row.id)

            # flush로 ID 확정 후 digest 업데이트
            session.flush()
            featured_id = self._upsert_daily_digest(session, today, saved_ids)
            session.commit()

        result = PublishResult(
            saved=len(saved_ids),
            skipped=skipped,
            article_ids=saved_ids,
            featured_id=featured_id,
        )
        logger.info(
            "게시 완료 — 저장 %d건 / 중복 스킵 %d건 / 히어로 ID: %s",
            result.saved, result.skipped, result.featured_id,
        )
        return result

    # ── DB 저장 ───────────────────────────────────────────────

    def _save_article(
        self,
        session: Session,
        article: ProcessedArticle,
        image: ImageResult | None,
    ) -> Article | None:
        # source_url UNIQUE 제약 보완 — 애플리케이션 레벨 중복 체크
        exists = session.query(
            session.query(Article)
            .filter_by(source_url=article.source_url)
            .exists()
        ).scalar()
        if exists:
            logger.debug("중복 스킵: %s", article.source_url)
            return None

        row = Article(
            # 수집 원본
            source_url=article.source_url,
            source_name=article.source_name,
            title_ko=article.title_ko,

            # LLM 재작성 결과
            headline_en=article.headline_en,
            subheadline_en=article.subheadline_en,
            body_en=article.body_en,
            seo_title=article.seo_title,
            seo_description=article.seo_description,

            # 분류
            category=article.category,
            tags=article.tags,
            tone=article.tone,
            cultural_note=article.cultural_note,

            # 타임스탬프
            published_at_ko=article.published_at_ko,
            processed_at=datetime.now(tz=timezone.utc),

            # 상태
            published=True,
            prompt_version=article.prompt_version,
        )

        # 이미지 (없으면 website가 og_generated 사용)
        if image:
            row.image_url        = image.url
            row.image_source     = image.source
            row.image_credit     = image.credit       # Unsplash 정책 필수
            row.image_credit_url = image.credit_url
            row.image_license    = image.license
        else:
            row.image_source = "og_generated"

        session.add(row)
        session.flush()   # auto-increment ID 확정
        return row

    # ── Daily Digest 큐레이션 ─────────────────────────────────

    def _upsert_daily_digest(
        self,
        session: Session,
        today: date,
        article_ids: list[int],
    ) -> int | None:
        """
        오늘 날짜 digest를 article_ids 기준으로 재구성.
        rank=0이 히어로 기사(is_featured=True).
        멱등: 기존 항목 삭제 후 재삽입.
        """
        if not article_ids:
            return None

        session.query(DailyDigest).filter_by(date=today).delete()

        for rank, article_id in enumerate(article_ids):
            session.add(
                DailyDigest(
                    date=today,
                    article_id=article_id,
                    rank=rank,
                    is_featured=(rank == 0),
                )
            )

        return article_ids[0]

    # ── Git 커밋 + 푸시 ───────────────────────────────────────

    def git_commit_and_push(self, run_date: date | None = None) -> bool:
        """
        data/know.db 변경분 커밋 후 푸시.
        GITHUB_ACTIONS 환경변수가 없으면 로컬 실행으로 판단하고 건너뜀.
        """
        # WAL 모드에서 commit 후 데이터가 .db-wal에 남을 수 있음.
        # git add 전에 FULL 체크포인트로 메인 파일에 반드시 병합.
        try:
            from sqlalchemy import text as sa_text
            with self._engine.connect() as conn:
                conn.execute(sa_text("PRAGMA wal_checkpoint(FULL)"))
            self._engine.dispose()
        except Exception as exc:
            logger.warning("WAL 체크포인트 실패 (무시): %s", exc)

        if not os.getenv("GITHUB_ACTIONS"):
            logger.info("로컬 환경 감지 — git push 건너뜀")
            return False

        label = (run_date or date.today()).isoformat()

        try:
            _git("config", "user.email", "actions@github.com")
            _git("config", "user.name",  "github-actions[bot]")
            # WAL/SHM 파일도 함께 add (없으면 무시)
            for f in [self._db_path, self._db_path + "-wal", self._db_path + "-shm"]:
                _git("add", f, check=False)

            commit = _git(
                "commit", "-m", f"data: daily update {label}",
                check=False,
            )
            if commit.returncode == 1:
                # "nothing to commit" — 정상 케이스 (기사 전부 중복)
                logger.info("변경 없음 — 커밋 스킵")
                return True

            _git("push")
            logger.info("git push 완료 [%s]", label)
            return True

        except subprocess.CalledProcessError as exc:
            logger.error(
                "git 오류: cmd=%s / stderr=%s", exc.cmd, exc.stderr
            )
            return False


# ─────────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────────

def _git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        check=check,
        capture_output=True,
        text=True,
    )


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
