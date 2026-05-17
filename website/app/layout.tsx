import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import Header from '@/components/Header'
import { SITE_NAME, SITE_DESC, MVP_CATEGORIES, catToSlug } from '@/lib/config'

const geist = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title:       { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESC,
  openGraph: {
    siteName: SITE_NAME,
    type:     'website',
    locale:   'en_US',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()

  return (
    <html lang="ko" className={geist.variable}>
      <body className="min-h-screen bg-vctr-surface flex flex-col">
        <Header />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>

        {/* ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <footer
          className="mt-20 border-t border-white/5"
          style={{ background: 'linear-gradient(180deg, #1C1C28 0%, #0A0A0F 100%)' }}
        >
          <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">

            {/* ── 상단: 로고 + 3컬럼 ─────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

              {/* 브랜드 */}
              <div className="col-span-2 md:col-span-1">
                {/* Vctr 로고 텍스트 */}
                <div className="inline-flex items-baseline mb-4">
                  <span className="text-2xl font-black text-vctr-indigo tracking-tight">V</span>
                  <span className="text-2xl font-extralight text-white tracking-tight">ctr</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed max-w-[200px]">
                  AI·SaaS 툴을 직접 테스트하고 솔직하게 리뷰합니다.
                </p>
                <p className="mt-3 text-xs text-white/30 italic">
                  "Find your vector."
                </p>

                {/* 데이터 소스 뱃지 */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {[
                    { label: 'ProductHunt', color: '#DA552F' },
                    { label: 'Hacker News', color: '#FF6600' },
                    { label: 'GitHub',      color: '#6e7681' },
                  ].map(src => (
                    <span
                      key={src.label}
                      className="text-[10px] font-bold px-2 py-1 rounded-md"
                      style={{ background: `${src.color}25`, color: src.color }}
                    >
                      {src.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-4">
                  카테고리
                </p>
                <ul className="space-y-2.5">
                  {MVP_CATEGORIES.map(cat => (
                    <li key={cat}>
                      <Link
                        href={`/${catToSlug(cat)}`}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 미디어 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-4">
                  미디어
                </p>
                <ul className="space-y-2.5">
                  {[
                    { label: '홈',          href: '/' },
                    { label: '최신 리뷰',   href: '/' },
                    { label: '뉴스레터 구독', href: 'https://buttondown.email/vctr', external: true },
                    { label: '툴 제보하기',  href: 'mailto:hello@vctr.io', external: true },
                  ].map(item => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        {item.label}
                        {item.external && (
                          <span className="ml-1 text-white/20">↗</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 정책 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-4">
                  법적 고지
                </p>
                <ul className="space-y-2.5">
                  {[
                    { label: '개인정보처리방침', href: '/privacy' },
                    { label: '이용약관',          href: '/terms' },
                    { label: 'DMCA',              href: 'mailto:dmca@vctr.io', external: true },
                    { label: '광고 문의',          href: 'mailto:ads@vctr.io',  external: true },
                  ].map(item => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── 구분선 ──────────────────────────────────────── */}
            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-white/30">
                © {year} Vctr. 리뷰는 수집된 툴 정보를 기반으로 독립적으로 작성됩니다.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/25 hover:text-white/50 transition-colors"
                >
                  이미지 출처: Unsplash
                </a>
                <span className="text-white/15">·</span>
                <a
                  href="https://vctr.io"
                  className="text-xs text-white/25 hover:text-white/50 transition-colors"
                >
                  vctr.io
                </a>
              </div>
            </div>

          </div>
        </footer>
      </body>
    </html>
  )
}
