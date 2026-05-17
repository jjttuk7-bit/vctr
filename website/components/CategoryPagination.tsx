// SSG 경로 기반 페이지네이션 — /[category]/page/[num]/
import Link from 'next/link'

interface Props {
  slug:    string   // URL slug (e.g. "k-beauty")
  current: number
  total:   number
  accent:  string   // 카테고리 배경색
}

export default function CategoryPagination({ slug, current, total, accent }: Props) {
  const pages = buildPageList(current, total)

  const href = (p: number) =>
    p === 1 ? `/${slug}/` : `/${slug}/p/${p}/`

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {current > 1 ? (
        <Link href={href(current - 1)}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
          ← Prev
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300">← Prev</span>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 py-2 text-sm text-gray-400">…</span>
        ) : (
          <Link key={p} href={href(p)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                style={p === current ? { background: accent, color: '#fff' } : { color: '#555' }}>
            {p}
          </Link>
        )
      )}

      {current < total ? (
        <Link href={href(current + 1)}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
          Next →
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300">Next →</span>
      )}
    </nav>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const p: (number | '…')[] = [1]
  if (current > 3)         p.push('…')
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n++) p.push(n)
  if (current < total - 2) p.push('…')
  p.push(total)
  return p
}
