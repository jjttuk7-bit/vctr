// Vctr — 툴 리뷰 카드
// layout="grid"  : 이미지 위 + 텍스트 아래 (카테고리 페이지)
// layout="list"  : 썸네일 좌 + 텍스트 우  (홈 리스트뷰)
// layout="hero"  : 2컬 대형 카드           (홈 상단)
import Image from 'next/image'
import Link from 'next/link'
import CategoryBadge from './CategoryBadge'
import { getCatColor, formatDateShort, readTime } from '@/lib/config'
import type { ArticleRow } from '@/lib/db'

interface Props {
  article:  ArticleRow
  layout?:  'grid' | 'list' | 'hero'
}

const SOURCE_LABEL: Record<string, string> = {
  producthunt:     'PH',
  hackernews:      'HN',
  github_trending: 'GH',
}

export default function ArticleCard({ article, layout = 'grid' }: Props) {
  const { bg } = getCatColor(article.category)
  const href   = `/articles/${article.id}`
  const src    = SOURCE_LABEL[article.source_name] ?? ''

  const hasImage = !!(article.image_url && article.image_source !== 'og_generated')

  // ── 가로형 리스트 카드 ────────────────────────────────────
  if (layout === 'list') {
    return (
      <Link
        href={href}
        className="group flex items-start gap-4 px-4 py-3.5 rounded-xl
          hover:bg-white hover:shadow-sm transition-all duration-200
          border border-transparent hover:border-slate-200"
      >
        {/* 썸네일 */}
        <div
          className="relative flex-shrink-0 w-[88px] h-[66px] rounded-lg overflow-hidden"
          style={{ background: bg }}
        >
          {hasImage ? (
            <Image
              src={article.image_url!}
              alt={article.headline_en}
              fill
              className="object-cover group-hover:scale-[1.04] transition-transform duration-400"
              sizes="88px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/20 text-xl font-black select-none">
                {article.category.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <CategoryBadge category={article.category} size="sm" />
            {src && (
              <span className="text-[9px] font-bold tracking-wider text-slate-400
                border border-slate-200 rounded px-1 py-0.5">
                {src}
              </span>
            )}
          </div>
          <h3 className="text-[0.875rem] font-semibold text-vctr-black leading-snug line-clamp-2
            group-hover:text-vctr-indigo transition-colors">
            {article.headline_en}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {formatDateShort(article.published_at_ko)}
            {' · '}{readTime(article.body_en ?? article.seo_description)} min read
          </p>
        </div>
      </Link>
    )
  }

  // ── 대형 히어로 카드 (홈 상단 2개) ───────────────────────
  if (layout === 'hero') {
    return (
      <Link
        href={href}
        className="group flex flex-col rounded-xl overflow-hidden border border-slate-200
          hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white"
      >
        {/* 이미지 */}
        <div
          className="relative aspect-[16/8] overflow-hidden"
          style={{ background: bg }}
        >
          {hasImage ? (
            <Image
              src={article.image_url!}
              alt={article.headline_en}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-5">
              <span className="text-white/10 text-6xl font-black select-none leading-none">
                {article.category.split(' ')[0]}
              </span>
            </div>
          )}
          {/* 소스 배지 (이미지 위 우상단) */}
          {src && (
            <span className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1
              bg-black/50 text-white rounded-full tracking-widest backdrop-blur-sm">
              {src}
            </span>
          )}
        </div>

        {/* 텍스트 */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <CategoryBadge category={article.category} size="sm" />
            <span className="text-xs text-slate-400 ml-auto">
              {formatDateShort(article.published_at_ko)}
            </span>
          </div>
          <h2 className="text-[1.0625rem] font-bold text-vctr-black leading-snug
            group-hover:text-vctr-indigo transition-colors line-clamp-2">
            {article.headline_en}
          </h2>
          {article.seo_description && (
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">
              {article.seo_description}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {readTime(article.body_en ?? article.seo_description)} min read
          </p>
        </div>
      </Link>
    )
  }

  // ── 기본 그리드 카드 ─────────────────────────────────────
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl overflow-hidden border border-slate-200
        hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white"
    >
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: bg }}
      >
        {hasImage ? (
          <Image
            src={article.image_url!}
            alt={article.headline_en}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/10 text-5xl font-black select-none">
              {article.category.split(' ')[0]}
            </span>
          </div>
        )}
        {src && (
          <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5
            bg-black/50 text-white rounded-full tracking-widest backdrop-blur-sm">
            {src}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={article.category} size="sm" />
          <span className="text-xs text-slate-400 ml-auto">
            {formatDateShort(article.published_at_ko)}
          </span>
        </div>
        <h2 className="text-[0.9375rem] font-semibold text-vctr-black leading-snug
          group-hover:text-vctr-indigo transition-colors line-clamp-2">
          {article.headline_en}
        </h2>
        {article.seo_description && (
          <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 flex-1">
            {article.seo_description}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          {readTime(article.body_en ?? article.seo_description)} min read
        </p>
      </div>
    </Link>
  )
}
