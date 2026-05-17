"""
database/models.py — KNow ORM 모델
SQLAlchemy 2.0 Declarative / SQLite
참조: KWAVE_DAILY_PLAN.md 7절 · database/schema.sql
"""

from __future__ import annotations

import json
from datetime import datetime, date
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    create_engine,
    event,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator


# ─────────────────────────────────────────────────────────────
# JsonType — SQLite TEXT 컬럼에 list/dict 투명 직렬화
# 사용: tags 컬럼 (list[str])
# ─────────────────────────────────────────────────────────────
class JsonType(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> str | None:
        if value is None:
            return None
        return json.dumps(value, ensure_ascii=False)

    def process_result_value(self, value: str | None, dialect: Any) -> Any:
        if value is None:
            return None
        return json.loads(value)


# ─────────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ─────────────────────────────────────────────────────────────
# Article
# ─────────────────────────────────────────────────────────────
class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 수집 원본
    source_url:  Mapped[str]           = mapped_column(Text, nullable=False, unique=True)
    source_name: Mapped[str]           = mapped_column(Text, nullable=False)  # "naver" | "daum" | "nate"
    title_ko:    Mapped[str]           = mapped_column(Text, nullable=False)
    summary_ko:  Mapped[str | None]    = mapped_column(Text)

    # LLM 재작성 결과
    headline_en:     Mapped[str | None] = mapped_column(Text)
    subheadline_en:  Mapped[str | None] = mapped_column(Text)
    body_en:         Mapped[str | None] = mapped_column(Text)
    seo_title:       Mapped[str | None] = mapped_column(Text)
    seo_description: Mapped[str | None] = mapped_column(Text)

    # 분류
    category:     Mapped[str]           = mapped_column(Text, nullable=False)
    tags:         Mapped[list | None]   = mapped_column(JsonType)   # list[str]
    tone:         Mapped[str | None]    = mapped_column(Text)       # "exciting" | "informative" | ...
    cultural_note: Mapped[str | None]  = mapped_column(Text)

    # 이미지 (Unsplash 출처 표기 필수 — Unsplash 정책)
    image_url:        Mapped[str | None] = mapped_column(Text)
    image_source:     Mapped[str | None] = mapped_column(Text)      # "unsplash" | "youtube_thumbnail" | "og_generated"
    image_credit:     Mapped[str | None] = mapped_column(Text)      # Unsplash 작가명
    image_credit_url: Mapped[str | None] = mapped_column(Text)      # Unsplash 작가 프로필 URL
    image_license:    Mapped[str | None] = mapped_column(Text)

    # 타임스탬프
    published_at_ko: Mapped[datetime | None] = mapped_column(DateTime)
    fetched_at:      Mapped[datetime]        = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # 상태
    published:      Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    prompt_version: Mapped[str | None] = mapped_column(Text)
    view_count:     Mapped[int]        = mapped_column(Integer, nullable=False, default=0)

    # 관계
    digest_entries: Mapped[list[DailyDigest]] = relationship(
        "DailyDigest", back_populates="article", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_articles_category", "category"),
        Index("idx_articles_published", "published"),
        Index("idx_articles_published_at_ko", "published_at_ko"),
        Index(
            "idx_articles_category_published_date",
            "category", "published", "published_at_ko",
        ),
    )

    def __repr__(self) -> str:
        return f"<Article id={self.id} category={self.category!r} headline={self.headline_en!r}>"


# ─────────────────────────────────────────────────────────────
# DailyDigest — 날짜별 큐레이션 (히어로 기사 선정)
# ─────────────────────────────────────────────────────────────
class DailyDigest(Base):
    __tablename__ = "daily_digest"

    id:         Mapped[int]  = mapped_column(Integer, primary_key=True, autoincrement=True)
    date:       Mapped[date] = mapped_column(Date, nullable=False)
    article_id: Mapped[int]  = mapped_column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    rank:       Mapped[int]  = mapped_column(Integer, nullable=False, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    article: Mapped[Article] = relationship("Article", back_populates="digest_entries")

    __table_args__ = (
        UniqueConstraint("date", "article_id", name="uq_daily_digest_date_article"),
        Index("idx_daily_digest_date", "date", "rank"),
    )

    def __repr__(self) -> str:
        return f"<DailyDigest date={self.date} article_id={self.article_id} rank={self.rank}>"


# ─────────────────────────────────────────────────────────────
# 엔진 팩토리 — agent/ 코드에서 import해서 사용
# ─────────────────────────────────────────────────────────────
def make_engine(db_path: str = "website/data/know.db"):
    engine = create_engine(f"sqlite:///{db_path}", echo=False)

    # WAL 모드 + 외래 키 활성화 (연결마다 적용)
    @event.listens_for(engine, "connect")
    def _set_pragmas(conn, _):
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

    return engine


def init_db(db_path: str = "website/data/know.db") -> None:
    """테이블이 없으면 생성. GitHub Actions 첫 실행 시 호출."""
    engine = make_engine(db_path)
    Base.metadata.create_all(engine)
