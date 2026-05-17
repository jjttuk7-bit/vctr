'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { MVP_CATEGORIES, catToSlug, getCatColor } from '@/lib/config'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-vctr-surface/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top row: logo + search */}
        <div className="flex items-center justify-between h-14 gap-4">
          <Logo size="sm" />
          <SearchBar />
        </div>

        {/* Category nav */}
        <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-none">
          {MVP_CATEGORIES.map(cat => {
            const slug   = catToSlug(cat)
            const active = pathname === `/${slug}` || pathname === `/${slug}/`
            const { bg } = getCatColor(cat)
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
