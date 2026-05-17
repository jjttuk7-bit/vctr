// Vctr — 카테고리 N페이지 (/dev-tools/p/2/)
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import CategoryPagination from '@/components/CategoryPagination'
import { getArticlesByCategory, getArticleCountByCategory, getPublishedCategories } from '@/lib/db'
import { slugToCat, getCatColor, catToSlug, MVP_CATEGORIES, SITE_NAME } from '@/lib/config'

interface Props { params: { category: string; num: string } }

export async function generateStaticParams() {
  const published = getPublishedCategories()
  const all       = Array.from(new Set([...MVP_CATEGORIES, ...published]))
  const params: { category: string; num: string }[] = []
  for (const cat of all) {
    const total      = getArticleCountByCategory(cat)
    const totalPages = Math.ceil(total / 12)
    for (let p = 2; p <= totalPages; p++)
      params.push({ category: catToSlug(cat), num: String(p) })
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = slugToCat(params.category)
  return {
    title:       `${cat} 리뷰 — ${params.num}페이지`,
    description: `${cat} 툴 리뷰 ${params.num}페이지 — ${SITE_NAME}`,
  }
}

export default function CategoryPageN({ params }: Props) {
  const cat  = slugToCat(params.category)
  const page = Number(params.num)
  if (!cat || !page || page < 2) notFound()

  const { bg, text }                      = getCatColor(cat)
  const { articles, total, totalPages }   = getArticlesByCategory(cat, page)
  if (page > totalPages)                  notFound()

  return (
    <div className="space-y-8">

      {/* ── 카테고리 헤더 (슬림 버전) ───────────────────── */}
      <header
        className="relative rounded-2xl px-8 py-6 overflow-hidden"
        style={{ background: bg }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
             style={{ background: 'rgba(255,255,255,0.5)' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              href={`/${catToSlug(cat)}`}
              className="text-[10px] font-bold uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
              style={{ color: `${text}99` }}
            >
              ← {cat}
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1 leading-tight">
              {cat}
            </h1>
          </div>

          <span
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: text }}
          >
            {total}개 중 {page}페이지
          </span>
        </div>
      </header>

      {/* ── 3열 그리드 (2페이지~) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map(a => (
          <ArticleCard key={a.id} article={a} layout="grid" />
        ))}
      </div>

      <CategoryPagination
        slug={params.category}
        current={page}
        total={totalPages}
        accent={bg}
      />
    </div>
  )
}
