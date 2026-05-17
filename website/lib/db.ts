// 참조: KWAVE_DAILY_PLAN.md 7절 · database/schema.sql
// better-sqlite3: 서버 컴포넌트(빌드 타임)에서만 호출

import Database from 'better-sqlite3'
import path from 'path'

// Vercel: Root Directory = website → process.cwd() = website/
// GitHub Actions / local: npm run build from website/ → 동일
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'know.db')
console.log('[KNow/db] DB_PATH =', DB_PATH)

export interface ArticleRow {
  id:               number
  source_url:       string
  source_name:      string
  title_ko:         string
  headline_en:      string
  subheadline_en:   string | null
  body_en:          string | null
  seo_title:        string | null
  seo_description:  string | null
  category:         string
  tags:             string | null   // JSON string
  tone:             string | null
  cultural_note:    string | null
  image_url:        string | null
  image_source:     string | null
  image_credit:     string | null
  image_credit_url: string | null
  published_at_ko:  string
  prompt_version:   string | null
}

type Row = Record<string, unknown>

let _db: Database.Database | null = null

function db(): Database.Database {
  if (!_db) _db = new Database(DB_PATH, { readonly: true, fileMustExist: false })
  return _db
}

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn() } catch (err) {
    console.error('[KNow/db]', err)
    return fallback
  }
}

// ── 홈 페이지 ─────────────────────────────────────────────────

export function getFeaturedArticle(): ArticleRow | null {
  return safe(() =>
    db().prepare(`
      SELECT a.*
      FROM   articles a
      JOIN   daily_digest d ON a.id = d.article_id
      WHERE  d.is_featured = 1
        AND  d.date = date('now')
      LIMIT  1
    `).get() as ArticleRow | null
  , null)
}

export function getRecentArticles(limit = 24): ArticleRow[] {
  return safe(() =>
    db().prepare(`
      SELECT id, headline_en, subheadline_en, seo_description, category,
             image_url, image_credit, image_credit_url, image_source,
             published_at_ko, tags, source_url
      FROM   articles
      WHERE  published = 1
      ORDER  BY published_at_ko DESC
      LIMIT  ?
    `).all(limit) as ArticleRow[]
  , [])
}

// ── 카테고리 페이지 (페이지네이션) ───────────────────────────

const PER_PAGE = 12

export function getArticlesByCategory(
  category: string,
  page = 1,
): { articles: ArticleRow[]; total: number; totalPages: number } {
  const offset = (page - 1) * PER_PAGE
  const articles = safe(() =>
    db().prepare(`
      SELECT id, headline_en, subheadline_en, seo_description, category,
             image_url, image_credit, image_credit_url, image_source,
             published_at_ko, tags, source_url
      FROM   articles
      WHERE  published = 1 AND category = ?
      ORDER  BY published_at_ko DESC
      LIMIT  ? OFFSET ?
    `).all(category, PER_PAGE, offset) as ArticleRow[]
  , [])
  const total = safe(() =>
    (db().prepare(
      'SELECT COUNT(*) as n FROM articles WHERE published = 1 AND category = ?'
    ).get(category) as { n: number }).n
  , 0)
  return { articles, total, totalPages: Math.ceil(total / PER_PAGE) }
}

export function getArticleCountByCategory(category: string): number {
  return safe(() =>
    (db().prepare(
      'SELECT COUNT(*) as n FROM articles WHERE published = 1 AND category = ?'
    ).get(category) as { n: number }).n
  , 0)
}

// ── 검색 인덱스 (클라이언트 fuse.js용) ───────────────────────

export interface ArticleIndex {
  id: number
  headline_en: string
  seo_description: string | null
  category: string
  tags: string | null
  published_at_ko: string
}

export function getAllArticleIndex(): ArticleIndex[] {
  return safe(() =>
    db().prepare(`
      SELECT id, headline_en, seo_description, category, tags, published_at_ko
      FROM   articles
      WHERE  published = 1
      ORDER  BY published_at_ko DESC
    `).all() as ArticleIndex[]
  , [])
}

// ── 기사 상세 ─────────────────────────────────────────────────

export function getArticleById(id: number): ArticleRow | null {
  return safe(() =>
    db().prepare(
      'SELECT * FROM articles WHERE id = ? AND published = 1'
    ).get(id) as ArticleRow | null
  , null)
}

export function getRelatedArticles(category: string, excludeId: number, limit = 3): ArticleRow[] {
  return safe(() =>
    db().prepare(`
      SELECT id, headline_en, seo_description, category,
             image_url, image_source, published_at_ko
      FROM   articles
      WHERE  published = 1 AND category = ? AND id != ?
      ORDER  BY published_at_ko DESC
      LIMIT  ?
    `).all(category, excludeId, limit) as ArticleRow[]
  , [])
}

// ── generateStaticParams 용 ───────────────────────────────────

export function getAllArticleIds(): number[] {
  return safe(() =>
    (db().prepare('SELECT id FROM articles WHERE published = 1').all() as Row[])
      .map(r => r.id as number)
  , [])
}

export function getPublishedCategories(): string[] {
  return safe(() =>
    (db().prepare(
      'SELECT DISTINCT category FROM articles WHERE published = 1'
    ).all() as Row[]).map(r => r.category as string)
  , [])
}
