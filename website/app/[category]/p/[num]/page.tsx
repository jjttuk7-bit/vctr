// 카테고리 N페이지 — SSG 서버 컴포넌트 (/k-beauty/p/2/ 형태)
import type { Metadata } from 'next'
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
    title:       `${cat} — Page ${params.num}`,
    description: `${cat} news page ${params.num} — ${SITE_NAME}`,
  }
}

export default function CategoryPageN({ params }: Props) {
  const cat  = slugToCat(params.category)
  const page = Number(params.num)
  if (!cat || !page || page < 2) notFound()

  const { bg }                        = getCatColor(cat)
  const { articles, total, totalPages } = getArticlesByCategory(cat, page)
  if (page > totalPages)              notFound()

  return (
    <div className="space-y-8">
      <div className="rounded-card px-8 py-6 text-white" style={{ background: bg }}>
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Category</p>
        <h1 className="text-3xl font-bold">{cat}</h1>
        <p className="text-white/70 text-sm mt-1">
          {total} stories · Page {page} of {totalPages}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map(a => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>

      <CategoryPagination slug={params.category} current={page} total={totalPages} accent={bg} />
    </div>
  )
}
