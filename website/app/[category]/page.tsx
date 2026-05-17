// 카테고리 1페이지 — SSG 서버 컴포넌트 (searchParams 없음 → SSG 유지)
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import CategoryPagination from '@/components/CategoryPagination'
import { getArticlesByCategory, getPublishedCategories } from '@/lib/db'
import { slugToCat, getCatColor, catToSlug, MVP_CATEGORIES, SITE_NAME } from '@/lib/config'

interface Props { params: { category: string } }

export async function generateStaticParams() {
  const published = getPublishedCategories()
  const all       = Array.from(new Set([...MVP_CATEGORIES, ...published]))
  return all.map(cat => ({ category: catToSlug(cat) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = slugToCat(params.category)
  return { title: cat, description: `Latest ${cat} news — ${SITE_NAME}` }
}

export default function CategoryPage({ params }: Props) {
  const cat  = slugToCat(params.category)
  if (!cat)  notFound()

  const { bg }                        = getCatColor(cat)
  const { articles, total, totalPages } = getArticlesByCategory(cat, 1)

  return (
    <div className="space-y-8">
      <div className="rounded-card px-8 py-6 text-white" style={{ background: bg }}>
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Category</p>
        <h1 className="text-3xl font-bold">{cat}</h1>
        <p className="text-white/70 text-sm mt-1">
          {total} {total === 1 ? 'story' : 'stories'}
          {totalPages > 1 && ` · Page 1 of ${totalPages}`}
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a, i) => (
            <ArticleCard key={a.id} article={a} featured={i === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-[#E8E6DF] py-16 text-center">
          <p className="text-gray-400 text-sm">No articles yet. Check back tomorrow.</p>
        </div>
      )}

      {totalPages > 1 && (
        <CategoryPagination slug={params.category} current={1} total={totalPages} accent={bg} />
      )}
    </div>
  )
}
