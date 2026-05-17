// 기사 상세 페이지 — 서버 컴포넌트 (SSG)
// 참조: KWAVE_DAILY_PLAN.md 5.3절
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import CategoryBadge from '@/components/CategoryBadge'
import { getArticleById, getAllArticleIds, getRelatedArticles } from '@/lib/db'
import { getCatColor, formatDate, readTime, parseTags, SITE_NAME } from '@/lib/config'

interface Props { params: { id: string } }

export async function generateStaticParams() {
  return getAllArticleIds().map(id => ({ id: String(id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleById(Number(params.id))
  if (!article) return { title: 'Article not found' }
  return {
    title:       article.seo_title ?? article.headline_en,
    description: article.seo_description ?? undefined,
    openGraph: {
      title:       article.headline_en,
      description: article.seo_description ?? undefined,
      images:      article.image_url ? [{ url: article.image_url }] : [],
      type:        'article',
      siteName:    SITE_NAME,
    },
    twitter: {
      card:        'summary_large_image',
      title:       article.headline_en,
      description: article.seo_description ?? undefined,
      images:      article.image_url ? [article.image_url] : [],
    },
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleById(Number(params.id))
  if (!article) notFound()

  const related  = getRelatedArticles(article.category, article.id)
  const tags     = parseTags(article.tags)
  const { bg }   = getCatColor(article.category)
  const bodyPara = (article.body_en ?? '').split(/\n\n+/).filter(Boolean)

  return (
    <article className="max-w-2xl mx-auto space-y-8">

      {/* ── 메타 행 ────────────────────────────────────────── */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={article.category} linked size="md" />
          <span className="text-xs text-gray-400">{formatDate(article.published_at_ko)}</span>
          <span className="text-xs text-gray-400">· {readTime(article.body_en)} min read</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-vctr-black leading-snug">
          {article.headline_en}
        </h1>

        {article.subheadline_en && (
          <p className="text-lg text-gray-500 leading-relaxed">{article.subheadline_en}</p>
        )}
      </header>

      {/* ── 히어로 이미지 ────────────────────────────────────── */}
      <div
        className="relative w-full aspect-[16/9] rounded-card overflow-hidden"
        style={{ background: bg }}
      >
        {article.image_url && article.image_source !== 'og_generated' ? (
          <>
            <Image
              src={article.image_url}
              alt={article.headline_en}
              fill
              priority
              className="object-cover"
              sizes="(max-width:768px) 100vw, 672px"
            />
            {/* Unsplash 출처 표기 — 정책 필수 (CLAUDE.md 규칙 #3) */}
            {article.image_source === 'unsplash' && article.image_credit && (
              <p className="absolute bottom-2 right-3 text-white/60 text-[10px]">
                Photo by{' '}
                <a
                  href={article.image_credit_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  {article.image_credit}
                </a>{' '}
                on Unsplash
              </p>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-8xl font-bold select-none">
              {article.category.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* ── 본문 ─────────────────────────────────────────────── */}
      <div className="article-body">
        {bodyPara.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* ── Cultural Note ────────────────────────────────────── */}
      {article.cultural_note && (
        <aside className="border-l-4 pl-4 py-2" style={{ borderColor: bg }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1"
             style={{ color: bg }}>
            Cultural Note
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{article.cultural_note}</p>
        </aside>
      )}

      {/* ── 태그 ─────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── 출처 표기 — 필수 (CLAUDE.md 규칙 #9) ──────────────── */}
      <div className="pt-4 border-t border-[#E8E6DF]">
        <p className="text-xs text-gray-400">
          Source:{' '}
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-vctr-indigo break-all"
          >
            {article.source_url}
          </a>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Originally sourced via{' '}
          {article.source_name === 'producthunt' ? 'ProductHunt'
            : article.source_name === 'github_trending' ? 'GitHub Trending'
            : article.source_name}.
          {' '}This review was independently written based on tool facts only.
        </p>
      </div>

      {/* ── 관련 기사 ─────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-[#E8E6DF]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            More from {article.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

    </article>
  )
}
