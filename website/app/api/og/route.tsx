// Vctr OG image generator — @vercel/og (Vercel edge runtime only)
// GitHub Pages static export (STATIC_EXPORT=true) excludes this route
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const CATEGORY_COLORS: Record<string, string> = {
  'AI Writing':   '#6366F1',
  'AI Image':     '#EC4899',
  'Productivity': '#10B981',
  'Dev Tools':    '#F59E0B',
  'No-Code':      '#3B82F6',
  'Marketing':    '#EF4444',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    ?? 'Vctr — Find your vector.'
  const category = searchParams.get('category') ?? 'AI Writing'
  const bg       = CATEGORY_COLORS[category]    ?? '#6366F1'

  return new ImageResponse(
    (
      <div
        style={{
          background:     bg,
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'space-between',
          padding:        '48px 56px',
          position:       'relative',
          overflow:       'hidden',
        }}
      >
        {/* Deco circle */}
        <div
          style={{
            position:     'absolute',
            right:        -40,
            bottom:       -40,
            width:        220,
            height:       220,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.10)',
          }}
        />

        {/* Logo: V (bold) + ctr (light) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>V</span>
          <span style={{ fontSize: 28, fontWeight: 200, color: 'rgba(255,255,255,0.85)' }}>ctr</span>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              background:    'rgba(255,255,255,0.2)',
              color:         '#fff',
              fontSize:      13,
              fontWeight:    600,
              padding:       '4px 14px',
              borderRadius:  20,
              width:         'fit-content',
              letterSpacing: '0.08em',
            }}
          >
            {category.toUpperCase()}
          </span>
          <p
            style={{
              color:      '#fff',
              fontSize:   36,
              fontWeight: 500,
              lineHeight: 1.3,
              margin:     0,
              maxWidth:   '85%',
            }}
          >
            {title}
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
