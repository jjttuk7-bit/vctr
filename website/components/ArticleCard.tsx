// Vctr — 툴 리뷰 카드 (메인 / 카테고리 페이지 공용)
import Image from 'next/image'
import Link from 'next/link'
import CategoryBadge from './CategoryBadge'
import { getCatColor, formatDateShort, readTime } from '@/lib/config'
import type { ArticleRow } from '@/lib/db'

interface Props {
  article:  ArticleRow
  featured?: boolean
}

const SOURCE_LABEL: Record<string, string> = {
  producthunt:     'PH',
  hackernews:      'HN',
  github_trending: 'GH',
}

export default function ArticleCard({ article, featured = false }: Props) {
  const { bg } = getCatColor(article.category)
  const href   = `/articles/${article.id}`
  const srcLabel = SOURCE_LABEL[article.source_name] ?? article.source_name?.toUpperCase()

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-xl overflow-hidden border border-slate-200
        hover:shadow-md hover:border-slate-300 transition-all duration-200
        bg-white ${featured ? 'md:col-span-2' : ''}`}
    >
      {/* 이미지 */}
      <div
        className={`relative overflow-hidden ${featured ? 'aspect-[16/7]' : 'aspect-[16/9]'}`}
        style={{ background: bg }}
      >
        {article.image_url && article.image_source !== 'og_generated' ? (
          <Image
            src={article.image_url}
            alt={article.headline_en}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes={featured ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 100vw, 33vw'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/10 text-5xl font-black select-none">
              {article.category.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col flex-1 p-4">
        {/* 배지 행 */}
        <div className="flex items-center gap-2 mb-2.5">
          <CategoryBadge category={article.category} linked={false} size="sm" />
          {srcLabel && (
            <span className="text-[9px] font-bold tracking-widest text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
              {srcLabel}
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {formatDateShort(article.published_at_ko)}
          </span>
        </div>

        {/* 제목 */}
        <h2 className={`font-semibold text-vctr-black leading-snug
          group-hover:text-vctr-indigo transition-colors
          ${featured ? 'text-xl md:text-2xl' : 'text-[0.9375rem]'}`}>
          {article.headline_en}
        </h2>

        {/* 요약 */}
        {article.seo_description && (
          <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 flex-1">
            {article.seo_description}
          </p>
        )}

        {/* 하단 읽기 시간 */}
        <p className="mt-3 text-xs text-slate-400">
          {readTime(article.body_en ?? article.seo_description)} min read
        </p>
      </div>
    </Link>
  )
}
