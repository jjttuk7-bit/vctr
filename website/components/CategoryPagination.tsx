// SSG 경로 기반 페이지네이션 — /[category]/p/[num]/
import Link from 'next/link'

interface Props {
  slug:    string
  current: number
  total:   number
  accent:  string
}

export default function CategoryPagination({ slug, current, total, accent }: Props) {
  const pages = buildPageList(current, total)
  const href  = (p: number) => p === 1 ? `/${slug}/` : `/${slug}/p/${p}/`

  return (
    <nav
      className="flex items-center justify-center gap-1 py-2"
      aria-label="페이지 이동"
    >
      {current > 1 ? (
        <Link
          href={href(current - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm
            text-slate-500 hover:bg-white hover:border hover:border-slate-200
            transition-all"
        >
          ← 이전
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-slate-300">← 이전</span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all"
              style={
                p === current
                  ? { background: accent, color: '#fff' }
                  : { color: '#64748b' }
              }
            >
              {p}
            </Link>
          )
        )}
      </div>

      {current < total ? (
        <Link
          href={href(current + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm
            text-slate-500 hover:bg-white hover:border hover:border-slate-200
            transition-all"
        >
          다음 →
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-slate-300">다음 →</span>
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
