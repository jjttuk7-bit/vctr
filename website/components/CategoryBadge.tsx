// 참조: BRANDING.md 4절 — 카테고리 컬러 시스템
import Link from 'next/link'
import { getCatColor, catToSlug } from '@/lib/config'

interface Props {
  category: string
  linked?: boolean
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, linked = false, size = 'md' }: Props) {
  const { badgeBg, badgeText } = getCatColor(category)
  const cls = `inline-block rounded font-semibold uppercase tracking-wider
    ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`

  const badge = (
    <span className={cls} style={{ background: badgeBg, color: badgeText }}>
      {category}
    </span>
  )

  return linked
    ? <Link href={`/${catToSlug(category)}`}>{badge}</Link>
    : badge
}
