// 메인 홈 페이지 — 서버 컴포넌트 (SSG)
// 참조: KWAVE_DAILY_PLAN.md 5.2절
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ArticleCard from '@/components/ArticleCard'
import CategoryBadge from '@/components/CategoryBadge'
import { getFeaturedArticle, getRecentArticles } from '@/lib/db'
import { getCatColor, formatDate, readTime, MVP_CATEGORIES, catToSlug, SITE_NAME, SITE_DESC } from '@/lib/config'

export const metadata: Metadata = {
  title:       SITE_NAME,
  description: SITE_DESC,
}

export default function HomePage() {
  const featured = getFeaturedArticle()
  const recent   = getRecentArticles(15).filter(a => a.id !== featured?.id)

  return (
    <div className="space-y-12">

      {/* ── 히어로 섹션 ────────────────────────────────────── */}
      {featured ? (
        <section>
          <Link
            href={`/articles/${featured.id}`}
            className="group block rounded-card overflow-hidden border border-[#E8E6DF] hover:shadow-lg transition-shadow"
          >
            <div
              className="relative aspect-[21/9] overflow-hidden"
              style={{ background: getCatColor(featured.category).bg }}
            >
              {featured.image_url && featured.image_source !== 'og_generated' && (
                <Image
                  src={featured.image_url}
                  alt={featured.headline_en}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="100vw"
                />
              )}
              {/* 그라디언트 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <CategoryBadge category={featured.category} size="md" />
                <h1 className="mt-3 text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl
                               group-hover:underline underline-offset-2">
                  {featured.headline_en}
                </h1>
                {featured.subheadline_en && (
                  <p className="mt-2 text-white/80 text-sm md:text-base max-w-2xl">
                    {featured.subheadline_en}
                  </p>
                )}
                <p className="mt-3 text-white/60 text-xs">
                  {formatDate(featured.published_at_ko)}
                  {' · '}{readTime(featured.body_en ?? featured.seo_description)} min read
                </p>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="rounded-card bg-know-red/5 border border-know-red/10 p-10 text-center">
          <p className="text-know-navy/40 text-sm">첫 번째 기사가 곧 발행됩니다.</p>
        </section>
      )}

      {/* ── 최신 기사 그리드 ───────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Today&apos;s Stories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── 이메일 구독 CTA ────────────────────────────────── */}
      <section className="rounded-card bg-know-navy text-white p-8 text-center">
        <p className="text-sm text-white/60 uppercase tracking-widest mb-2">Newsletter</p>
        <h2 className="text-xl font-semibold mb-1">Get Korea delivered every morning.</h2>
        <p className="text-white/60 text-sm mb-6">K-beauty, drama, music, and food — daily.</p>
        <a
          href="https://buttondown.email/knowkorea"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-know-red hover:bg-know-red-dark text-white font-medium
                     px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Subscribe Free →
        </a>
      </section>

      {/* ── 카테고리 브라우저 ──────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MVP_CATEGORIES.map(cat => {
            const { bg } = getCatColor(cat)
            return (
              <Link
                key={cat}
                href={`/${catToSlug(cat)}`}
                className="rounded-card px-5 py-4 text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ background: bg }}
              >
                {cat}
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
