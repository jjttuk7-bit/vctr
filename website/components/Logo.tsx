// 참조: BRANDING.md 5절 — K(bold) + Now(light) 대비가 핵심
import Link from 'next/link'

interface Props {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'text-xl px-4 py-2', md: 'text-2xl px-5 py-3', lg: 'text-3xl px-7 py-4' }

export default function Logo({ variant = 'default', size = 'md' }: Props) {
  const bg      = variant === 'white' ? 'bg-know-white border border-gray-200' : 'bg-know-red'
  const kColor  = variant === 'white' ? 'text-know-red'  : 'text-white'
  const nowColor= variant === 'white' ? 'text-know-navy' : 'text-white/85'

  return (
    <Link href="/" className={`inline-flex items-center rounded-xl ${sizes[size]} ${bg}`}>
      <span className={`font-bold   tracking-tight ${kColor}`}>K</span>
      <span className={`font-light  tracking-tight ${nowColor}`}>Now</span>
    </Link>
  )
}
