// Vctr — 툴 리뷰 상세 페이지 (서버 컴포넌트 SSG)
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import CategoryBadge from '@/components/CategoryBadge'
import { getArticleById, getAllArticleIds, getRelatedArticles } from '@/lib/db'
import { getCatColor, formatDate, readTime, parseTags, SITE_NAME, catToSlug } from '@/lib/config'

interface Props { params: { id: string } }

// ── 소스 플랫폼 메타 ─────────────────────────────────────
const SOURCE_META: Record<string, { label: string; bg: string; text: string; cta: string }> = {
  producthunt:     { label: 'ProductHunt',   bg: '#DA552F', text: '#fff', cta: 'ProductHunt에서 보기' },
  hackernews:      { label: 'Hacker News',   bg: '#FF6600', text: '#fff', cta: 'Hacker News에서 보기' },
  github_trending: { label: 'GitHub',        bg: '#24292F', text: '#fff', cta: 'GitHub에서 보기' },
}

function getSource(name: string) {
  return SOURCE_META[name] ?? { label: name, bg: '#64748b', text: '#fff', cta: '원문 보기' }
}

// ── 메타데이터 ────────────────────────────────────────────
export async function generateStaticParams() {
  return getAllArticleIds().map(id => ({ id: String(id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleById(Number(params.id))
  if (!article) return { title: 'Not found' }
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

// ── 페이지 ────────────────────────────────────────────────
export default function ArticlePage({ params }: Props) {
  const article = getArticleById(Number(params.id))
  if (!article) notFound()

  const related    = getRelatedArticles(article.category, article.id)
  const tags       = parseTags(article.tags)
  const { bg }     = getCatColor(article.category)
  const source     = getSource(article.source_name)
  const bodyParas  = (article.body_en ?? '').split(/\n\n+/).filter(Boolean)

  return (
    <article className="max-w-2xl mx-auto">

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header className="mb-8 space-y-4">

        {/* 배지 행 */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={article.category} linked size="md" />

          {/* 소스 플랫폼 배지 */}
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
            style={{ background: source.bg, color: source.text }}
          >
            {source.label}
          </span>

          <span className="text-xs text-slate-400">{formatDate(article.published_at_ko)}</span>
          <span className="text-xs text-slate-400">· {readTime(article.body_en)} min read</span>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl md:text-[2rem] font-bold text-vctr-black leading-tight tracking-tight">
          {article.headline_en}
        </h1>

        {/* 부제목 */}
        {article.subheadline_en && (
          <p className="text-lg text-slate-500 leading-relaxed font-normal">
            {article.subheadline_en}
          </p>
        )}
      </header>

      {/* ── 히어로 이미지 ────────────────────────────────── */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-xl overflow-hidden mb-10"
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
              sizes="(max-width:640px) 100vw, 672px"
              unoptimized
            />
            {article.image_source === 'unsplash' && article.image_credit && (
              <p className="absolute bottom-2 right-3 text-white/50 text-[10px]">
                Photo by{' '}
                <a href={article.image_credit_url ?? '#'} target="_blank"
                   rel="noopener noreferrer" className="underline hover:text-white">
                  {article.image_credit}
                </a>{' '}on Unsplash
              </p>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/10 text-[7rem] font-black select-none leading-none">
              {article.category.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* ── 본문 ─────────────────────────────────────────── */}
      <div className="article-body mb-10">
        {bodyParas.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* ── 에디터 노트 (cultural_note 재활용) ───────────── */}
      {article.cultural_note && (
        <aside
          className="mb-10 rounded-xl p-5 border-l-4"
          style={{ borderColor: bg, background: `${bg}10` }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2"
             style={{ color: bg }}>
            에디터 노트
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">{article.cultural_note}</p>
        </aside>
      )}

      <hr className="prose-divider" />

      {/* ── 태그 ─────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 my-6">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── 원문 CTA 블록 ────────────────────────────────── */}
      <div className="my-8 rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">원문 출처</p>
          <p className="text-sm text-slate-700 font-medium">{source.label}</p>
          <p className="text-xs text-slate-400 mt-0.5 break-all">{article.source_url}</p>
        </div>
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ background: source.bg }}
        >
          {source.cta}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      <p className="text-xs text-slate-400 mb-10">
        이 리뷰는 원문 툴 정보를 기반으로 Vctr 에디터가 독립적으로 작성했습니다.
      </p>

      {/* ── 관련 리뷰 ────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {article.category} 더 보기
            </h2>
            <Link
              href={`/${catToSlug(article.category)}`}
              className="text-xs text-vctr-indigo hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
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
