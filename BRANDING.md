# BRANDING.md — KNow 브랜드 아이덴티티

> 개발·디자인·마케팅 작업 시 반드시 이 파일을 참조한다.
> 컬러·타이포·로고·슬로건은 여기서만 정의한다. 코드에 하드코딩 금지.

---

## 1. 서비스 정체성

| 항목 | 내용 |
|---|---|
| **서비스명** | KNow |
| **이름의 의미** | K(한국) + Now(지금) + Know(알다) — 세 가지 의미 동시 내포 |
| **한 줄 정의** | 전 세계 K-culture 팬을 위한 영문 자동화 미디어 |
| **포지셔닝** | "속보 + 깊이" — 가장 빠르면서도 문화 맥락까지 전달하는 K-culture 미디어 |
| **보이스** | 세련되고 친근하다. 전문적이지만 어렵지 않다. 빠르지만 가볍지 않다. |

---

## 2. 슬로건

### 메인 슬로건 (추천)

```
"KNow Korea, before anyone else."
```

> KNow를 동사처럼 활용. 속보 미디어 포지셔닝 명확. 위트 있음.

### 서브 슬로건 (상황별 활용)

| 상황 | 슬로건 |
|---|---|
| 뉴스레터 구독 유도 | "Your daily KNow of Korean culture." |
| 홈페이지 히어로 | "Everything Korean. Right now." |
| SNS 소개란 | "K-beauty · K-drama · K-pop · K-food. Daily." |
| About 페이지 | "We KNow Korea so you don't have to search." |

---

## 3. 브랜드 컬러

> **규칙**: 아래 hex값만 사용. 임의로 다른 값 사용 금지.
> CSS 변수로 정의해서 전체 프로젝트에 적용한다.

### 브랜드 코어 컬러

| 이름 | Hex | 용도 |
|---|---|---|
| **Korean Red** | `#C0392B` | 로고 배경, 주요 CTA 버튼, 강조 |
| **Deep Navy** | `#1A1A2E` | 다크 배경, 텍스트, 로고 다크버전 |
| **Off White** | `#FAF9F6` | 페이지 배경, 로고 라이트버전 |
| **Gold** | `#E8B86D` | 하이라이트, 프리미엄 강조, 구분선 |

### CSS 변수 정의 (Next.js globals.css)

```css
:root {
  --know-red:        #C0392B;
  --know-red-light:  #E8534A;   /* hover 상태 */
  --know-red-dark:   #922B21;   /* active 상태 */
  --know-navy:       #1A1A2E;
  --know-navy-light: #2C2C4A;
  --know-off-white:  #FAF9F6;
  --know-gold:       #E8B86D;
  --know-gold-light: #F5D49A;

  --know-bg:         var(--know-off-white);
  --know-text:       var(--know-navy);
  --know-accent:     var(--know-red);
}

[data-theme="dark"] {
  --know-bg:         var(--know-navy);
  --know-text:       var(--know-off-white);
  --know-accent:     var(--know-red-light);
}
```

---

## 4. 카테고리 컬러 시스템

> OG 이미지 자동생성, UI 배지, 카테고리 필터에 일관되게 사용.
> config.yaml에도 동일한 값이 정의되어 있음 (SSOT).

| 카테고리 | 배경색 | 텍스트색 | 배지 배경 | 배지 텍스트 | 단계 |
|---|---|---|---|---|---|
| **K-Beauty** | `#D4537E` | `#fff` | `#FBEAF0` | `#993556` | MVP |
| **K-Drama** | `#7F77DD` | `#fff` | `#EEEDFE` | `#534AB7` | MVP |
| **K-Pop** | `#D85A30` | `#fff` | `#FAECE7` | `#993C1D` | MVP |
| **K-Food** | `#BA7517` | `#fff` | `#FAEEDA` | `#854F0B` | MVP |
| **K-Fashion** | `#444441` | `#fff` | `#F1EFE8` | `#5F5E5A` | MVP |
| **K-Lifestyle** | `#1D9E75` | `#fff` | `#E1F5EE` | `#0F6E56` | MVP |
| **K-Travel** | `#378ADD` | `#fff` | `#E6F1FB` | `#185FA5` | v1.1 |
| **K-Sport** | `#639922` | `#fff` | `#EAF3DE` | `#3B6D11` | v1.1 |
| **K-Entertainment** | `#E24B4A` | `#fff` | `#FCEBEB` | `#A32D2D` | v1.1 |

### Tailwind 클래스 매핑 (커스텀 설정 필요)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'know-red':   '#C0392B',
        'know-navy':  '#1A1A2E',
        'know-white': '#FAF9F6',
        'know-gold':  '#E8B86D',
        'cat-beauty':  '#D4537E',
        'cat-drama':   '#7F77DD',
        'cat-pop':     '#D85A30',
        'cat-food':    '#BA7517',
        'cat-fashion': '#444441',
        'cat-lifestyle':'#1D9E75',
        'cat-travel':  '#378ADD',
        'cat-sport':   '#639922',
        'cat-ent':     '#E24B4A',
      }
    }
  }
}
```

---

## 5. 로고

### 로고 원칙

```
K  → font-weight: 700  (굵게 — 브랜드 강인함)
Now → font-weight: 300  (얇게 — 속도감, 현재성)
대비가 핵심. 같은 굵기로 쓰면 로고의 정체성이 사라진다.
```

### HTML/TSX 구현

```tsx
// components/Logo.tsx
export function Logo({ variant = 'default' }: { variant?: 'default' | 'dark' | 'white' }) {
  const bgMap = {
    default: 'bg-know-red',
    dark:    'bg-know-navy',
    white:   'bg-know-white border border-gray-200',
  }
  const kColor = variant === 'white' ? 'text-know-red' : 'text-white'
  const nowColor = variant === 'white' ? 'text-know-navy' : 'text-white/85'

  return (
    <div className={`inline-flex items-center px-7 py-4 rounded-xl ${bgMap[variant]}`}>
      <span className={`text-3xl font-bold tracking-tight ${kColor}`}>K</span>
      <span className={`text-3xl font-light tracking-tight ${nowColor}`}>Now</span>
    </div>
  )
}
```

### 로고 사용 규칙

```
✅ 올바른 사용
- Korean Red 배경에 흰 텍스트
- Deep Navy 배경에 흰 텍스트
- Off White 배경에 Red K + Navy Now
- 최소 크기: 24px (모바일 기준)

❌ 금지
- 임의 색상 배경 사용
- K와 Now를 같은 굵기로 표시
- 로고 변형 또는 왜곡
- 배경과 대비 낮은 컬러 조합
```

---

## 6. 타이포그래피

### 폰트 패밀리

| 용도 | 폰트 | 비고 |
|---|---|---|
| **헤드라인** | `Geist` 또는 `Inter` | Variable font, 700 |
| **본문** | `Geist` 또는 `Inter` | 400/500 |
| **한글 UI** | `Pretendard` | 한글 포함 시 사용 |
| **코드** | `Geist Mono` | 코드 블록 |

### 타입 스케일

```css
/* 기사 상세 페이지 기준 */
--type-headline:    36px / font-weight: 700 / line-height: 1.2
--type-subheadline: 22px / font-weight: 500 / line-height: 1.3
--type-body:        17px / font-weight: 400 / line-height: 1.75
--type-caption:     13px / font-weight: 400 / line-height: 1.5
--type-label:       11px / font-weight: 500 / letter-spacing: 0.05em / UPPERCASE
```

---

## 7. OG 이미지 시스템

> `app/api/og/route.tsx`에서 `@vercel/og`로 자동 생성.
> 모든 기사·카테고리·메인 페이지에 일관되게 적용.

### OG 이미지 스펙

```
크기: 1200 × 630px
레이아웃:
  - 배경: 카테고리 컬러 (solid, no gradient)
  - 상단 왼쪽: "KNow" 로고 (흰색, 작게)
  - 중간: 카테고리 배지 (반투명 흰색 배경)
  - 하단: 기사 제목 (흰색, 36px, font-weight 500)
  - 우하단: 원형 데코 요소 (흰색 12% 투명도)
```

### 카테고리별 OG 예시

```
[K-Pop 기사]
배경: #D85A30
배지: "K-POP" (흰색 반투명 배경)
제목: "BTS Jin Announces First Solo World Tour After Military Discharge"
로고: "KNow" (우측 상단, 흰색)
```

### TSX 구현 스니펫

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

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
  const title    = searchParams.get('title') ?? 'KNow Korea'
  const category = searchParams.get('category') ?? 'K-Pop'
  const bg       = CATEGORY_COLORS[category] ?? '#C0392B'

  return new ImageResponse(
    <div style={{
      background: bg,
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 56px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 데코 원 */}
      <div style={{
        position: 'absolute', right: -40, bottom: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
      }} />
      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>K</span>
        <span style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,0.85)' }}>Now</span>
      </div>
      {/* 콘텐츠 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          color: '#fff', fontSize: 14, fontWeight: 500,
          padding: '4px 14px', borderRadius: 20,
          width: 'fit-content', letterSpacing: '0.06em',
        }}>
          {category.toUpperCase()}
        </span>
        <p style={{
          color: '#fff', fontSize: 36, fontWeight: 500,
          lineHeight: 1.3, margin: 0,
          maxWidth: '85%',
        }}>
          {title}
        </p>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

---

## 8. 도메인 & SNS 핸들

### 도메인 후보 (우선순위 순)

| 도메인 | 우선순위 | 비고 |
|---|---|---|
| `k-now.co` | ✅ 1순위 | 짧고 세련됨, .co는 글로벌 스타트업 확장자 |
| `knowkorea.com` | 2순위 | 직관적, SEO "korea" 키워드 포함 |
| `getknow.com` | 3순위 | 행동 유도 느낌 |
| `know.kr` | 4순위 | 한국 도메인, 한국어 서비스용 |

> 도메인 확보 즉시 `config.yaml`의 `site_url`과 GitHub Pages CNAME 업데이트.

### SNS 핸들

| 채널 | 핸들 | 상태 |
|---|---|---|
| X (Twitter) | `@knowkorea` | 확인 필요 |
| Instagram | `@know.korea` | 확인 필요 |
| TikTok | `@knowkorea` | 확인 필요 |
| Pinterest | `@knowkorea` | 확인 필요 |
| YouTube | `KNow Korea` | 확인 필요 |

### 해시태그 전략

```
브랜드 태그:   #KNow  #KNowKorea
카테고리 태그: #KBeauty  #KDrama  #KPop  #KFood  #KFashion
기사 태그:     LLM이 articles.tags에서 자동 생성
최대 사용 수:  Instagram 15~20개 / X 3~5개 / TikTok 5~7개
```

---

## 9. 디자인 레퍼런스

### 전체 사이트 느낌

```
Vogue Korea 영문판   →  타이포그래피 기준
Hypebeast           →  카드 레이아웃, 밀도감
Allure              →  K-Beauty 카테고리 표현
The Guardian        →  뉴스 정보 구조
Billboard           →  K-Pop 속보 스타일
```

### 디자인 원칙

```
1. 미니멀  →  콘텐츠에 집중. 장식 최소화.
2. 대비    →  타이포 굵기·크기 대비로 위계 표현.
3. 컬러    →  카테고리 컬러가 UI의 주요 시각 언어.
4. 여백    →  기사 간 충분한 여백. 숨막히지 않게.
5. 속도감  →  로딩 빠르고 인터랙션 즉각 반응.
```

### 주요 UI 컴포넌트 규칙

```
카드 모서리:   border-radius 12px (너무 둥글지 않게)
보더:          0.5px solid (얇게 — 가벼운 느낌)
그림자:        없음 (flat design 원칙)
카테고리 배지: pill 형태, 카테고리 컬러 50 배경 + 800 텍스트
CTA 버튼:      Korean Red 배경, 흰 텍스트, hover시 know-red-dark
링크:          밑줄 없음, hover시 know-red 컬러
```

---

## 10. 이메일 뉴스레터 브랜딩

### 뉴스레터 제목 형식

```
제목: "KNow Daily — [날짜] | [오늘의 하이라이트]"
예시: "KNow Daily — May 16 | BTS Jin is back + Glass Skin Secrets"
```

### 뉴스레터 구조

```
[헤더]  KNow 로고 (Korean Red 배경)
        "KNow Daily — [날짜]"

[히어로]  오늘의 탑 기사 1개 (카테고리 컬러 배경 + 제목 + 링크)

[섹션별]  K-Beauty / K-Pop / K-Drama / K-Food ... 각 1~2편
          제목 + 한 줄 요약 + "Read more →"

[푸터]  "Unsubscribe · kwaved​aily.com"
        Korean Red 하단 배너
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-05-16 | 초기 브랜딩 패키지 확정. 서비스명 KNow 결정. |
