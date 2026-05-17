'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getCatColor, formatDateShort } from '@/lib/config'
import type { ArticleIndex } from '@/lib/db'

type FuseResult = { item: ArticleIndex; score?: number }

export default function SearchBar() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<ArticleIndex[]>([])
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
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
        keys:           [
          { name: 'headline_en',    weight: 0.6 },
          { name: 'seo_description', weight: 0.25 },
          { name: 'tags',           weight: 0.15 },
        ],
        threshold:      0.35,
        includeScore:   true,
        ignoreLocation: true,
      }))
    })
  }, [fuse])

  // 쿼리 변경 시 검색
  useEffect(() => {
    if (!fuse || query.trim().length < 2) { setResults([]); setOpen(false); return }
    const hits = (fuse.search(query) as FuseResult[])
      .slice(0, 7)
      .map(r => r.item)
    setResults(hits)
    setOpen(hits.length > 0)
  }, [query, fuse])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-[220px] lg:max-w-xs">

      {/* 입력창 */}
      <div className={`relative flex items-center transition-all duration-200 ${
        focused ? 'ring-2 ring-vctr-indigo/30 rounded-xl' : ''
      }`}>
        <svg
          className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          type="search"
          placeholder="리뷰 검색..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true) }}
          onBlur={() => setFocused(false)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200
            bg-white text-vctr-black placeholder:text-slate-400
            focus:outline-none focus:border-vctr-indigo transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl
          border border-slate-200 shadow-xl shadow-slate-200/60 z-50 overflow-hidden">

          {results.map(article => {
            const { badgeBg, badgeText } = getCatColor(article.category)
            return (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                onClick={() => { setOpen(false); setQuery('') }}
                className="flex items-start gap-3 px-4 py-3
                  hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <span
                  className="flex-shrink-0 mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded
                    uppercase tracking-wider whitespace-nowrap"
                  style={{ background: badgeBg, color: badgeText }}
                >
                  {article.category}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-vctr-black line-clamp-1 leading-snug">
                    {article.headline_en}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateShort(article.published_at_ko)}
                  </p>
                </div>
              </Link>
            )
          })}

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              <span className="font-medium text-vctr-black">{results.length}개</span> 검색 결과
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
