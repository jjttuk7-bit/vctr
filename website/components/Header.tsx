'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { MVP_CATEGORIES, catToSlug, getCatColor } from '@/lib/config'

export default function Header() {
  const pathname = usePathname()

  const isHome = pathname === '/' || pathname === ''

  return (
    <header className="sticky top-0 z-50 bg-vctr-surface/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">

        {/* ── 상단 행: 로고 + 검색 ──────────────────────── */}
        <div className="flex items-center justify-between h-14 gap-4">
          <Logo size="sm" />

          {/* 데스크탑: 카테고리 인라인 표시 */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 px-4">
            {/* 홈 링크 */}
            <Link
              href="/"
              className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-full transition-all duration-150 font-medium
                ${isHome
                  ? 'bg-vctr-black text-white'
                  : 'text-slate-500 hover:text-vctr-black hover:bg-slate-100'}`}
            >
              홈
            </Link>

            {/* 카테고리 */}
            {MVP_CATEGORIES.map(cat => {
              const slug   = catToSlug(cat)
              const active = pathname.startsWith(`/${slug}`)
              const { bg } = getCatColor(cat)

              return (
                <Link
                  key={cat}
                  href={`/${slug}`}
                  className="flex-shrink-0 text-sm px-3 py-1.5 rounded-full transition-all duration-150 font-medium"
                  style={active
                    ? { background: `${bg}18`, color: bg, fontWeight: 600 }
                    : { color: '#64748b' }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.background = '#f1f5f9'
                      ;(e.target as HTMLElement).style.color = '#0f172a'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.target as HTMLElement).style.background = ''
                      ;(e.target as HTMLElement).style.color = '#64748b'
                    }
                  }}
                >
                  {cat}
                </Link>
              )
            })}
          </nav>

          <SearchBar />
        </div>

        {/* ── 모바일 카테고리 스크롤 바 ─────────────────── */}
        <nav className="lg:hidden flex gap-1 overflow-x-auto pb-2.5 -mb-px scrollbar-none">
          {/* 홈 */}
          <Link
            href="/"
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all
              ${isHome
                ? 'bg-vctr-black text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            홈
          </Link>

          {MVP_CATEGORIES.map(cat => {
            const slug   = catToSlug(cat)
            const active = pathname.startsWith(`/${slug}`)
            const { bg } = getCatColor(cat)

            return (
              <Link
                key={cat}
                href={`/${slug}`}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={active
                  ? { background: bg, color: '#fff' }
                  : { color: '#64748b' }}
              >
                {cat}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
