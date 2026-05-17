// Vctr 홈페이지 — 서버 컴포넌트 (SSG)
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ArticleCard from '@/components/ArticleCard'
import CategoryBadge from '@/components/CategoryBadge'
import { getFeaturedArticle, getRecentArticles } from '@/lib/db'
import {
  getCatColor, formatDate, readTime,
  MVP_CATEGORIES, catToSlug, SITE_NAME, SITE_DESC,
} from '@/lib/config'

export const metadata: Metadata = {
  title:       SITE_NAME,
  description: SITE_DESC,
}

// 카테고리별 대표 툴 목록 — 브라우저 카드 서브텍스트
const CAT_TOOLS: Record<string, string> = {
  'AI Writing':   'GPT · Claude · Jasper · Writesonic',
  'AI Image':     'Midjourney · DALL-E · Runway · Firefly',
  'Productivity': 'Notion · Linear · Obsidian · Cron',
  'Dev Tools':    'Copilot · Cursor · Supabase · Vercel',
  'No-Code':      'Webflow · Bubble · Framer · Zapier',
  'Marketing':    'Beehiiv · Ahrefs · Buffer · Taplio',
}

// 소스 플랫폼
const SOURCE_META: Record<string, { label: string; bg: string }> = {
  producthunt:     { label: 'ProductHunt', bg: '#DA552F' },
  hackernews:      { label: 'Hacker News', bg: '#FF6600' },
  github_trending: { label: 'GitHub',      bg: '#24292F' },
}

export default function HomePage() {
  const featured = getFeaturedArticle()
  const recent   = getRecentArticles(20).filter(a => a.id !== featured?.id)
  const heroCards = recent.slice(0, 2)
  const listCards = recent.slice(2)

  return (
    <div className="space-y-14">

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {featured ? (
        <section>
          <Link
            href={`/articles/${featured.id}`}
            className="group block rounded-2xl overflow-hidden border border-slate-200
              hover:shadow-xl transition-shadow duration-300"
          >
            <div
              className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden"
              style={{ background: getCatColor(featured.category).bg }}
            >
              {featured.image_url && featured.image_source !== 'og_generated' && (
                <Image
                  src={featured.image_url}
                  alt={featured.headline_en}
                  fill priority
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="100vw"
                  unoptimized
                />
              )}
              {/* 그라디언트 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* 소스 배지 (우상단) */}
              {SOURCE_META[featured.source_name] && (
                <span
                  className="absolute top-5 right-5 text-[10px] font-bold uppercase
                    tracking-widest px-3 py-1.5 rounded-full text-white backdrop-blur-sm"
                  style={{ background: SOURCE_META[featured.source_name].bg + 'cc' }}
                >
                  {SOURCE_META[featured.source_name].label}
                </span>
              )}

              {/* 텍스트 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <CategoryBadge category={featured.category} size="md" />
                <h1
                  className="mt-3 text-2xl md:text-[2.25rem] font-bold text-white
                    leading-tight max-w-3xl group-hover:underline underline-offset-4"
                >
                  {featured.headline_en}
                </h1>
                {featured.subheadline_en && (
                  <p className="mt-2 text-white/75 text-sm md:text-base max-w-2xl">
                    {featured.subheadline_en}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-white/50 text-xs">
                    {formatDate(featured.published_at_ko)}
                  </span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/50 text-xs">
                    {readTime(featured.body_en ?? featured.seo_description)} min read
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl bg-vctr-indigo/5 border border-vctr-indigo/10 p-14 text-center">
          <p className="text-slate-400 text-sm">첫 번째 리뷰가 곧 발행됩니다.</p>
        </section>
      )}

      {/* ━━━ 최신 리뷰 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              최신 리뷰
            </h2>
            <span className="text-xs text-slate-300">{recent.length}개</span>
          </div>

          {/* 상단 2개 — 대형 카드 */}
          {heroCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {heroCards.map(a => (
                <ArticleCard key={a.id} article={a} layout="hero" />
              ))}
            </div>
          )}

          {/* 나머지 — 가로형 리스트 */}
          {listCards.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {listCards.map(a => (
                <ArticleCard key={a.id} article={a} layout="list" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ━━━ 뉴스레터 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #1C1C28 100%)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-vctr-indigo mb-1">
              Newsletter
            </p>
            <p className="text-white font-semibold text-lg leading-tight">
              매주 최고의 AI 툴 리뷰 받기
            </p>
            <p className="text-white/50 text-sm mt-0.5">
              노이즈 없이, 핵심만. 매주 토요일.
            </p>
          </div>
          <a
            href="https://buttondown.email/vctr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-vctr-indigo hover:bg-vctr-indigo-dark
              text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            무료 구독
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* ━━━ 카테고리 브라우저 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-5">
          카테고리
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MVP_CATEGORIES.map(cat => {
            const { bg } = getCatColor(cat)
            return (
              <Link
                key={cat}
                href={`/${catToSlug(cat)}`}
                className="group relative rounded-xl px-5 py-4 overflow-hidden
                  hover:scale-[1.01] transition-transform duration-200"
                style={{ background: bg }}
              >
                {/* 배경 장식 */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full
                    translate-x-8 -translate-y-8 opacity-20"
                  style={{ background: 'rgba(255,255,255,0.4)' }}
                />

                <div className="relative">
                  <p className="text-white font-bold text-[1rem] leading-tight mb-1">
                    {cat}
                  </p>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    {CAT_TOOLS[cat]}
                  </p>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2
                  text-white/30 group-hover:text-white/70 transition-colors text-lg font-light">
                  →
                </div>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
