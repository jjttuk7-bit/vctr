'use client'
// 클라이언트 검색 — /api/search에서 인덱스 로드 후 fuse.js로 퍼지 검색
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getCatColor, parseTags, formatDateShort } from '@/lib/config'
import type { ArticleIndex } from '@/lib/db'

type FuseResult = { item: ArticleIndex; score?: number }

export default function SearchBar() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<ArticleIndex[]>([])
  const [open,    setOpen]    = useState(false)
  const [fuse,    setFuse]    = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)

  // fuse.js + 검색 인덱스 지연 로딩
  useEffect(() => {
    if (fuse) return
    Promise.all([
      import('fuse.js').then(m => m.default),
      fetch('/api/search').then(r => r.json()),
    ]).then(([Fuse, index]) => {
      setFuse(new Fuse(index, {
        keys:              [
          { name: 'headline_en',    weight: 0.6 },
          { name: 'seo_description', weight: 0.25 },
          { name: 'tags',           weight: 0.15 },
        ],
        threshold:         0.35,
        includeScore:      true,
        ignoreLocation:    true,
      }))
    })
  }, [fuse])

  // 쿼리 변경 시 검색
  useEffect(() => {
    if (!fuse || query.trim().length < 2) { setResults([]); return }
    const hits = (fuse.search(query) as FuseResult[])
      .slice(0, 8)
      .map(r => r.item)
    setResults(hits)
    setOpen(hits.length > 0)
  }, [query, fuse])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <input
          type="search"
          placeholder="Search articles…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6DF]
                     bg-white focus:outline-none focus:border-know-red transition-colors"
        />
        <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
      </div>

      {/* 검색 결과 드롭다운 */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-card
                        border border-[#E8E6DF] shadow-lg z-50 overflow-hidden">
          {results.map(article => {
            const { badgeBg, badgeText } = getCatColor(article.category)
            return (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                onClick={() => { setOpen(false); setQuery('') }}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span
                  className="flex-shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{ background: badgeBg, color: badgeText }}
                >
                  {article.category}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-know-navy line-clamp-1">
                    {article.headline_en}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateShort(article.published_at_ko)}
                  </p>
                </div>
              </Link>
            )
          })}
          <div className="px-4 py-2 border-t border-[#E8E6DF] bg-gray-50">
            <p className="text-xs text-gray-400">{results.length} results for "{query}"</p>
          </div>
        </div>
      )}
    </div>
  )
}
