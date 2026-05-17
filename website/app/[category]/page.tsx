// Vctr — 카테고리 1페이지 (SSG 서버 컴포넌트)
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import CategoryPagination from '@/components/CategoryPagination'
import { getArticlesByCategory, getPublishedCategories } from '@/lib/db'
import { slugToCat, getCatColor, catToSlug, MVP_CATEGORIES, SITE_NAME } from '@/lib/config'

interface Props { params: { category: string } }

const CAT_DESC: Record<string, string> = {
  'AI Writing':   'GPT · Claude · Jasper · Writesonic',
  'AI Image':     'Midjourney · DALL-E · Runway · Firefly',
  'Productivity': 'Notion · Linear · Obsidian · Cron',
  'Dev Tools':    'Copilot · Cursor · Supabase · Vercel',
  'No-Code':      'Webflow · Bubble · Framer · Zapier',
  'Marketing':    'Beehiiv · Ahrefs · Buffer · Taplio',
}

export async function generateStaticParams() {
  const published = getPublishedCategories()
  const all       = Array.from(new Set([...MVP_CATEGORIES, ...published]))
  return all.map(cat => ({ category: catToSlug(cat) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = slugToCat(params.category)
  return {
    title:       `${cat} 리뷰`,
    description: `${cat} 툴 리뷰 및 비교 — ${SITE_NAME}`,
  }
}

export default function CategoryPage({ params }: Props) {
  const cat = slugToCat(params.category)
  if (!cat) notFound()

  const { bg, text }                      = getCatColor(cat)
  const { articles, total, totalPages }   = getArticlesByCategory(cat, 1)
  const heroCards  = articles.slice(0, 2)
  const gridCards  = articles.slice(2)

  return (
    <div className="space-y-8">

      {/* ── 카테고리 헤더 ────────────────────────────────── */}
      <header
        className="relative rounded-2xl px-8 py-8 overflow-hidden"
        style={{ background: bg }}
      >
        {/* 장식 원 */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
             style={{ background: 'rgba(255,255,255,0.5)' }} />
        <div className="absolute -bottom-6 right-20 w-24 h-24 rounded-full opacity-10"
             style={{ background: 'rgba(255,255,255,0.5)' }} />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2"
               style={{ color: `${text}99` }}>
              Category
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {cat}
            </h1>
            {CAT_DESC[cat] && (
              <p className="mt-2 text-sm" style={{ color: `${text}80` }}>
                {CAT_DESC[cat]}
              </p>
            )}
          </div>

          {/* 리뷰 카운트 배지 */}
          <div className="flex-shrink-0 text-right">
            <span
              className="inline-block px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: text }}
            >
              {total}개 리뷰
            </span>
            {totalPages > 1 && (
              <p className="mt-1 text-[11px]" style={{ color: `${text}70` }}>
                1 / {totalPages} 페이지
              </p>
            )}
          </div>
        </div>

        {/* 카테고리 네비 — 다른 카테고리로 이동 */}
        <div className="relative mt-6 flex gap-2 flex-wrap">
          {MVP_CATEGORIES.filter(c => c !== cat).map(c => (
            <Link
              key={c}
              href={`/${catToSlug(c)}`}
              className="text-[11px] px-3 py-1 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', color: `${text}cc` }}
            >
              {c}
            </Link>
          ))}
        </div>
      </header>

      {/* ── 아티클 그리드 ────────────────────────────────── */}
      {articles.length > 0 ? (
        <div className="space-y-4">
          {/* 상단 2개 — 대형 카드 */}
          {heroCards.length > 0 && (
            <div className={`grid gap-4 ${heroCards.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {heroCards.map(a => (
                <ArticleCard key={a.id} article={a} layout="hero" />
              ))}
            </div>
          )}

          {/* 나머지 — 3열 그리드 */}
          {gridCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridCards.map(a => (
                <ArticleCard key={a.id} article={a} layout="grid" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 py-20 text-center bg-white">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl font-black text-white"
            style={{ background: bg }}
          >
            {cat.split(' ')[0][0]}
          </div>
          <p className="text-slate-400 text-sm font-medium">아직 리뷰가 없습니다.</p>
          <p className="text-slate-300 text-xs mt-1">내일 다시 확인해보세요.</p>
        </div>
      )}

      {/* ── 페이지네이션 ─────────────────────────────────── */}
      {totalPages > 1 && (
        <CategoryPagination
          slug={params.category}
          current={1}
          total={totalPages}
          accent={bg}
        />
      )}
    </div>
  )
}
