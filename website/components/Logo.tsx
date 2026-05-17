// Vctr logo — bold V (indigo) + light ctr (white/dark)
// V = vector direction mark. Contrast between weights is the identity.
import Link from 'next/link'

interface Props {
  variant?: 'default' | 'white'
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-xl px-4 py-2',
  md: 'text-2xl px-5 py-3',
  lg: 'text-3xl px-7 py-4',
}

export default function Logo({ variant = 'default', size = 'sm' }: Props) {
  const isDark   = variant !== 'white'
  const bg       = isDark ? 'bg-vctr-black' : 'bg-vctr-surface border border-slate-200'
  const vColor   = 'text-vctr-indigo'
  const ctrColor = isDark ? 'text-white' : 'text-vctr-black'

  return (
    <Link href="/" className={`inline-flex items-baseline rounded-xl ${sizes[size]} ${bg}`}>
      <span className={`font-black tracking-tight leading-none ${vColor}`}>V</span>
      <span className={`font-extralight tracking-tight leading-none ${ctrColor}`}>ctr</span>
    </Link>
  )
}
