// 기사 카드 — 메인 / 카테고리 페이지 공용
import Image from 'next/image'
import Link from 'next/link'
import CategoryBadge from './CategoryBadge'
import { getCatColor, formatDateShort, readTime } from '@/lib/config'
import type { ArticleRow } from '@/lib/db'

interface Props {
  article: ArticleRow
  featured?: boolean
}

export default function ArticleCard({ article, featured = false }: Props) {
  const { bg } = getCatColor(article.category)
  const href   = `/articles/${article.id}`

  return (
    <Link
      href={href}
      className={`group block rounded-card overflow-hidden border border-[#E8E6DF] hover:shadow-md transition-shadow
        ${featured ? 'md:col-span-2' : ''}`}
    >
      {/* 이미지 영역 */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/7]' : 'aspect-[16/9]'}`}
           style={{ background: bg }}>
        {article.image_url && article.image_source !== 'og_generated' ? (
          <Image
            src={article.image_url}
            alt={article.headline_en}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={featured ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 100vw, 33vw'}
          />
        ) : (
          /* 이미지 없을 때 카테고리 컬러 플레이스홀더 */
          <div className="absolute inset-0 flex items-end p-5">
            <span className="text-white/25 text-6xl font-bold select-none leading-none">
              {article.category.replace('K-', '')}
            </span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div className="p-4 bg-know-white">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={article.category} linked={false} size="sm" />
          <span className="text-xs text-gray-400">
            {formatDateShort(article.published_at_ko)}
          </span>
          <span className="text-xs text-gray-400">
            · {readTime(article.body_en ?? article.seo_description)} min
          </span>
        </div>

        <h2 className={`font-semibold text-know-navy leading-snug group-hover:text-know-red transition-colors
          ${featured ? 'text-xl md:text-2xl' : 'text-base'}`}>
          {article.headline_en}
        </h2>

        {article.seo_description && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
            {article.seo_description}
          </p>
        )}
      </div>
    </Link>
  )
}
