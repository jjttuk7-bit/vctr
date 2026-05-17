// OG 이미지 자동생성 — @vercel/og (Vercel 서버 런타임 전용)
// GitHub Pages 정적 빌드(STATIC_EXPORT=true) 시 이 라우트는 포함되지 않음
// 참조: BRANDING.md 7절 / KWAVE_DAILY_PLAN.md 4.4절
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const CATEGORY_COLORS: Record<string, string> = {
  'K-Beauty':        '#D4537E',
  'K-Drama':         '#7F77DD',
  'K-Pop':           '#D85A30',
  'K-Food':          '#BA7517',
  'K-Fashion':       '#444441',
  'K-Lifestyle':     '#1D9E75',
  'K-Travel':        '#378ADD',
  'K-Sport':         '#639922',
  'K-Entertainment': '#E24B4A',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    ?? 'KNow Korea'
  const category = searchParams.get('category') ?? 'K-Pop'
  const bg       = CATEGORY_COLORS[category]    ?? '#C0392B'

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
        {/* 데코 원 */}
        <div
          style={{
            position:     'absolute',
            right:        -40,
            bottom:       -40,
            width:        200,
            height:       200,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.12)',
          }}
        />

        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>K</span>
          <span style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,0.85)' }}>Now</span>
        </div>

        {/* 콘텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              background:    'rgba(255,255,255,0.2)',
              color:         '#fff',
              fontSize:      14,
              fontWeight:    500,
              padding:       '4px 14px',
              borderRadius:  20,
              width:         'fit-content',
              letterSpacing: '0.06em',
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
