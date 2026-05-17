-- KNow — database/schema.sql
-- 참조: KWAVE_DAILY_PLAN.md 7절
-- SQLite 3.x / SQLAlchemy 2.0 호환
-- 실행: sqlite3 data/know.db < database/schema.sql

PRAGMA journal_mode = WAL;   -- GitHub Actions 병렬 쓰기 안전
PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────
-- articles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,

    -- 수집 원본
    source_url        TEXT     NOT NULL UNIQUE,   -- 중복 방지 키
    source_name       TEXT     NOT NULL,           -- "naver" | "daum" | "nate"
    title_ko          TEXT     NOT NULL,
    summary_ko        TEXT,                        -- 원문 요약 (전문 저장 금지)

    -- LLM 재작성 결과
    headline_en       TEXT,
    subheadline_en    TEXT,
    body_en           TEXT,
    seo_title         TEXT,
    seo_description   TEXT,

    -- 분류
    category          TEXT     NOT NULL,           -- "K-Beauty" | "K-Drama" | ...
    tags              TEXT,                        -- JSON: ["BTS", "K-Pop", ...]
    tone              TEXT,                        -- "exciting" | "informative" | ...
    cultural_note     TEXT,

    -- 이미지 (Unsplash 출처 표기 필수 — Unsplash 정책)
    image_url         TEXT,
    image_source      TEXT,                        -- "unsplash" | "youtube_thumbnail" | "og_generated"
    image_credit      TEXT,                        -- Unsplash 작가명
    image_credit_url  TEXT,                        -- Unsplash 작가 프로필 URL
    image_license     TEXT,                        -- 감사 추적용

    -- 타임스탬프
    published_at_ko   DATETIME,                    -- 원문 게시 시각
    fetched_at        DATETIME NOT NULL DEFAULT (datetime('now')),
    processed_at      DATETIME,

    -- 상태
    published         INTEGER  NOT NULL DEFAULT 0, -- BOOLEAN (0 | 1)
    prompt_version    TEXT,                        -- "v1.0"
    view_count        INTEGER  NOT NULL DEFAULT 0
);

-- 자주 쓰는 조회 패턴 최적화
CREATE INDEX IF NOT EXISTS idx_articles_category
    ON articles (category);

CREATE INDEX IF NOT EXISTS idx_articles_published
    ON articles (published);

CREATE INDEX IF NOT EXISTS idx_articles_published_at_ko
    ON articles (published_at_ko DESC);

-- 카테고리별 최신 게시 기사 목록 (메인/카테고리 페이지)
CREATE INDEX IF NOT EXISTS idx_articles_category_published_date
    ON articles (category, published, published_at_ko DESC);

-- ─────────────────────────────────────────────────────────────
-- daily_digest  — 날짜별 큐레이션 (히어로 기사 선정)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_digest (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    date        DATE     NOT NULL,
    article_id  INTEGER  NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    rank        INTEGER  NOT NULL DEFAULT 0,  -- 당일 노출 순위 (낮을수록 상위)
    is_featured INTEGER  NOT NULL DEFAULT 0,  -- 히어로 기사 여부 (BOOLEAN)

    UNIQUE (date, article_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_digest_date
    ON daily_digest (date DESC, rank);
