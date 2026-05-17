'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { MVP_CATEGORIES, catToSlug, getCatColor } from '@/lib/config'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-know-white/95 backdrop-blur border-b border-[#E8E6DF]">
      <div className="max-w-6xl mx-auto px-4">
        {/* 상단 줄: 로고 + 검색 */}
        <div className="flex items-center justify-between h-14 gap-4">
          <Logo size="sm" />
          <SearchBar />
        </div>

        {/* 카테고리 네비 */}
        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-none">
          {MVP_CATEGORIES.map(cat => {
            const slug    = catToSlug(cat)
            const active  = pathname === `/${slug}` || pathname === `/${slug}/`
            const { bg }  = getCatColor(cat)
            return (
              <Link
                key={cat}
                href={`/${slug}`}
                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-t transition-colors"
                style={active ? { background: bg, color: '#fff' } : { color: '#555' }}
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
