# KNow — K-Culture 글로벌 뉴스 자동화 서비스 기획서

> 대한민국의 K-culture 소식을 매일 자동 수집하고,
> 팩트를 기반으로 LLM이 독자적인 영문 기사를 재작성하여
> 전 세계 한류 팬들에게 저작권 안전한 감각적 콘텐츠를 전달하는 자동화 미디어.

> ⚠️ **핵심 원칙**: 번역(Translation) ❌ → 팩트 기반 재작성(Rewriting) ✅
> 이미지 무단 사용 ❌ → OG 자동생성 + 무료 소스 ✅

---

## 1. 서비스 개요

### 1.1 서비스명 후보

| 이름 | 느낌 | 도메인 가능성 |
|---|---|---|
| **KNow** | 한류 파도, 매일 업데이트 | k-now.co ✅ |
| **Seoul Signal** | 서울발 신호, 트렌디 | seoulsi​gnal.com ✅ |
| **HanFlow** | 한국의 흐름, 심플 | hanfl​ow.io ✅ |
| **KulturePulse** | 문화의 맥박, 감각적 | kultu​repulse.com ✅ |

> **추천**: `KNow` — "K-Wave(한류)"와 "Daily(매일)"의 결합. 직관적이고 검색 노출에 유리.

### 1.2 한 줄 비전

> "Your daily dose of Korea — beauty, drama, music, and food, all in one place."

### 1.3 타겟 독자

| 페르소나 | 설명 | 국가 | 주요 카테고리 |
|---|---|---|---|
| K-drama 팬 Emma | Netflix로 한국 드라마 입문, 배우 소식 팔로우 | 미국·영국·브라질 | Drama · Entertainment |
| K-beauty 마니아 Sofia | 한국 화장품 직구, 스킨케어 루틴 관심 | 동남아·유럽 | Beauty · Fashion |
| K-pop 팬 Yuki | 아이돌 덕질, 굿즈 구매, 콘서트 정보 수집 | 일본·대만·미국 | Pop · Entertainment |
| K-food 탐험가 Marco | 한국 음식 요리 시도, 식당 방문 | 유럽·호주 | Food · Travel |
| 한국 방문 예정자 Lisa | 한국 여행 계획 중, 드라마 성지순례 꿈꿈 | 전 세계 | Travel · Drama · Food |
| 손흥민 팬 David | 프리미어리그 통해 한국 문화 접함 | 영국·동남아 | Sport · Pop |

---

## 2. 콘텐츠 카테고리

> **운영 원칙**: 카테고리는 한 번에 열지 않는다.
> 카테고리당 하루 최소 3~5편이 나와야 독자가 재방문한다.
> MVP 6개로 밀도를 먼저 확보하고, 트래픽이 붙으면 순서대로 추가한다.

### MVP — 6개 (론칭 즉시)

| 카테고리 | 다루는 내용 | 기사 스타일 | 레퍼런스 |
|---|---|---|---|
| **K-Beauty** | 스킨케어·메이크업·뷰티 트렌드·브랜드 | How-to · 성분 설명 · 루틴 가이드 | Allure |
| **K-Drama** | 드라마 리뷰·배우 소식·넷플릭스 신작 | 스토리텔링 · 리뷰 · 시청 가이드 | Entertainment Weekly |
| **K-Pop** | 컴백·음원차트·콘서트·아이돌 화제 | 속보 · 팬 감성 · 숫자 강조 | Billboard |
| **K-Food** | 음식 트렌드·레시피 팁·한식 문화 | 음식 소개 · 문화 맥락 풍부 | Bon Appétit |
| **K-Fashion** | 스트릿 패션·디자이너·트렌드 리포트 | 쿨하고 세련되게 · 스타일링 팁 | Vogue / Hypebeast |
| **K-Lifestyle** | 웰니스·인테리어·일상 문화·철학 | 느리고 감성적으로 · 라이프 팁 | Well+Good |

### v1.1 추가 — 3개 (4~8주차)

| 카테고리 | 다루는 내용 | 추가 이유 |
|---|---|---|
| **K-Travel** | 여행지·관광코스·한류 성지·맛집 지도 | 검색량 폭발, 호텔·항공 제휴 수익 최고 |
| **K-Sport** | 손흥민·류현진·김민재 등 글로벌 선수 소식 | 완전히 다른 독자층 확보, 규모 확장 |
| **K-Entertainment** | 예능·영화·OTT·배우 (드라마와 분리) | K-Drama와 독자·톤 달라 분리 필요 |

### v1.2 검토 — 2개 (8주차 이후)

| 카테고리 | 다루는 내용 | 조건 |
|---|---|---|
| **K-Wellness** | 한방·찜질방·명상·한국식 건강법 | 웰니스 광고 단가 높음, 트렌드 성장 중 |
| **K-Games** | e스포츠·한국 게임사·인디게임 | 게임 광고 단가 높음, 글로벌 팬층 존재 |

> **카테고리별 컬러 시스템** (OG 이미지 + UI 배지):
> Beauty(핑크 #D4537E) · Drama(퍼플 #7F77DD) · Pop(코랄 #D85A30)
> Food(앰버 #BA7517) · Fashion(그레이 #5F5E5A) · Lifestyle(틸 #1D9E75)
> Travel(블루 #378ADD) · Sport(그린 #639922) · Entertainment(레드 #E24B4A)

---

## 3. 시스템 아키텍처

### 3.1 파이프라인 3단계

```
[① Collector]  한국 뉴스 소스에서 K-culture 기사 수집
                → 제목 + 팩트(이름·날짜·수치·사건)만 추출 (전문 저장 ❌)
      ↓
[② Processor]  LLM 1회 호출 → 팩트 기반 영문 기사 재작성
                + 헤드라인 최적화 + SEO 메타 + 감성 태그 + Cultural Note
      ↓
[③ Publisher]  DB 저장 → OG 이미지 자동생성 → Next.js 빌드
                → GitHub Pages 배포 → SNS + 이메일 발송
```

> **왜 "번역"이 아닌 "재작성"인가**
> 번역은 2차 저작물로 원저작권자 허락 없이 상업적 게시 불가.
> 반면 **팩트(누가·언제·무엇을)에는 저작권이 없다.**
> LLM이 팩트만 가져와서 완전히 새로운 문장으로 쓰면 독립적 저작물이 된다.
> AP·Reuters·BBC가 같은 뉴스를 각자 다른 문체로 쓰는 것과 동일한 원리.

### 3.2 수집 소스 전략

#### 공식 API 우선 (안정적, 법적 문제 없음)

| 소스 | 방식 | 카테고리 |
|---|---|---|
| **Naver Search API** | REST API (무료, 일 25,000건) | 뉴스 전반 |
| **Naver DataLab** | 트렌드 API | 인기 키워드 |
| **YouTube Data API** | 뮤직비디오, 공식 채널 | K-Pop |
| **Melon/Bugs RSS** | 음원 차트 RSS | K-Pop 차트 |

#### RSS 피드 활용 (준안정적)

| 소스 | RSS 엔드포인트 | 카테고리 |
|---|---|---|
| Daum 뉴스 | `https://news.daum.net/rss/entertain` | 연예 |
| 헤럴드경제 | RSS 제공 | 패션·뷰티 |
| 매일경제 스타투데이 | RSS 제공 | 연예 |
| 코리아헤럴드 | RSS 제공 | 영문 기사 (번역 생략 가능) |

#### 보완적 스크래핑 (robots.txt 준수, 캐싱 필수)

```python
SCRAPING_RULES = {
    "nate_entertainment": {
        "url": "https://news.nate.com/category/entertain",
        "rate_limit": "1 request / 3 seconds",
        "cache_ttl": "6 hours",
        "respect_robots_txt": True,
    }
}
```

> ⚠️ **법적 주의**: 네이버·다음은 상업적 스크래핑을 이용약관으로 제한.
> Naver Search API를 주력으로 사용하고 스크래핑은 보조 수단으로만 활용.
> 기사 전문 대신 요약+링크 형식으로 게시하여 저작권 문제 최소화.

### 3.3 콘텐츠 필터링 로직

```python
# config.yaml의 키워드 기반 카테고리 분류 (9개 — SSOT)
CATEGORY_KEYWORDS = {
    # MVP 6개
    "K-Beauty":        ["스킨케어", "뷰티", "화장품", "메이크업", "올리브영", "아모레", "LG생활건강", "성분", "세럼"],
    "K-Drama":         ["드라마", "넷플릭스", "tvN", "JTBC", "MBC", "시청률", "배우", "출연", "시즌"],
    "K-Pop":           ["아이돌", "컴백", "음원", "콘서트", "BTS", "블랙핑크", "뮤직비디오", "차트", "앨범"],
    "K-Food":          ["음식", "레시피", "맛집", "한식", "트렌드 음식", "요리", "식당", "먹방"],
    "K-Fashion":       ["패션", "스트릿", "스타일", "의류", "브랜드", "룩북", "트렌드"],
    "K-Lifestyle":     ["라이프스타일", "인테리어", "웰니스", "명상", "일상", "취미"],
    # v1.1 추가 3개
    "K-Travel":        ["여행", "관광", "서울 여행", "제주", "경복궁", "성지순례", "투어"],
    "K-Sport":         ["손흥민", "류현진", "김민재", "스포츠", "축구", "야구", "올림픽", "선수"],
    "K-Entertainment": ["예능", "영화", "OTT", "웨이브", "티빙", "개봉", "시상식", "연예인"],
}

# 중복 제거: URL 해시 기반
# 품질 필터: 최소 200자 이상 본문
# 최신성 필터: 24시간 이내 기사만
# 카테고리당 일 최대 기사 수: 8편 (과잉 수집 방지)
```

---

## 4. LLM 처리 설계 — 팩트 기반 재작성

### 4.1 저작권 안전 처리 흐름

```
원문 기사 (전문)
    ↓
[팩트 추출기]  제목 + 핵심 팩트만 파싱
               누가(인물명) / 언제(날짜) / 무엇을(사건) / 수치
               ← 이 단계에서 원문 문장은 버린다
    ↓
[LLM Rewriter]  팩트만 넘겨 완전히 새 기사 작성
                원문 문체·구조 참고 금지
    ↓
게시 (저작권 독립적 창작물)
    + 하단에 "Source: Naver News" 링크 표기
```

### 4.2 Processor 프롬프트 설계

**시스템 프롬프트**:
```
당신은 KNow의 영문 저널리스트입니다.
주어진 팩트 정보를 바탕으로 완전히 새로운 영어 기사를 작성하세요.

절대 금지:
- 한국어 원문을 번역하지 마세요
- 원문의 문장 구조를 그대로 따르지 마세요
- 원문에서 문장을 그대로 가져오지 마세요

반드시 준수:
- 제공된 팩트(이름, 날짜, 수치, 사건)만 활용
- Vogue / BuzzFeed / Allure 수준의 세련된 영문 문체
- 서양 독자를 위한 한국 문화 맥락 설명 포함
- JSON 외 텍스트 출력 금지
```

**입력 (팩트만)**:
```json
{
  "category": "K-Pop",
  "key_facts": {
    "who": ["BTS", "Jin"],
    "what": "첫 단독 콘서트 개최",
    "when": "2026년 6월 15일",
    "where": "서울 잠실 올림픽주경기장",
    "numbers": ["10만 명 관객", "2회 공연"],
    "context": "군 전역 후 첫 솔로 활동"
  }
}
```

**출력 (JSON)**:
```json
{
  "headline_en": "BTS's Jin Makes Historic Return With Sold-Out Solo Concert",
  "subheadline_en": "First performance since military discharge draws 100,000 fans",
  "body_en": "3~5문단 완전 재작성 영문 기사",
  "seo_title": "BTS Jin Solo Concert 2026: Everything You Need to Know",
  "seo_description": "BTS member Jin held his first solo concert after military discharge...",
  "tags": ["BTS", "Jin", "K-Pop", "Concert", "2026"],
  "tone": "exciting",
  "cultural_note": "In South Korea, military service is mandatory for men...",
  "unsplash_keywords": ["concert stage", "music performance", "neon lights"]
}
```

> `unsplash_keywords` 필드: Unsplash API 검색에 사용할 키워드 목록.
> LLM이 기사 내용을 보고 가장 어울리는 분위기 검색어를 자동 생성한다.
> 실제 인물 묘사 키워드는 포함하지 않는다 (저작권·초상권 안전).

### 4.3 K-culture 재작성 규칙

```
1. 고유명사 원문 유지      "BTS", "BLACKPINK", "Parasite (Gisaengchung)"
2. 문화 용어 설명 병기     "Hallyu (Korean Wave)", "Aegyo (cute behavior)"
3. 음식명 원문+설명        "Tteokbokki (spicy rice cakes)"
4. 방송사·플랫폼 영문화    "tvN" → "tvN (Korean cable network)"
5. 헤드라인 스타일         BuzzFeed / Vogue 톤, 클릭 유도
6. Cultural Note 필수      서양 독자가 모를 수 있는 맥락 반드시 포함
7. 출처 표기 필수          기사 하단 "Source: [원문 링크]"
```

### 4.4 이미지 전략 — 비용 $0, 저작권 안전

**핵심 원칙**: AI 이미지 생성 ❌ → OG 자동생성 + Unsplash 조합으로 완전 무료 운영.

#### 두 가지 용도를 분리한다

```
기사 상세 페이지  →  Unsplash 분위기 이미지  (감각적, 몰입감)
SNS 공유 / OG    →  @vercel/og 자동생성     (브랜드 일관성)
```

#### ① @vercel/og 자동생성 (SNS 공유용)

카테고리 컬러 배경 + 제목 텍스트 + KNow 로고만으로 구성.
Next.js의 `@vercel/og`로 서버에서 즉시 생성. 비용 $0.

```typescript
// app/api/og/route.tsx
export async function GET(req: Request) {
  const { title, category } = getParams(req)
  const color = CATEGORY_COLORS[category]  // 카테고리별 hex

  return new ImageResponse(
    <div style={{ background: color, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  padding: '48px', justifyContent: 'space-between' }}>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18 }}>
        KNow
      </span>
      <div>
        <span style={{ background: 'rgba(255,255,255,0.2)',
                       color: '#fff', fontSize: 14, padding: '4px 14px',
                       borderRadius: 20 }}>
          {category.toUpperCase()}
        </span>
        <p style={{ color: '#fff', fontSize: 36,
                    fontWeight: 500, lineHeight: 1.3, marginTop: 16 }}>
          {title}
        </p>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

#### ② Unsplash API (기사 본문 상단 이미지)

LLM이 생성한 `unsplash_keywords`로 자동 검색 → 무료 (월 50,000 requests).
인물이 아닌 **분위기·장소·사물** 키워드만 사용.

```python
# publisher.py
import httpx

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

async def fetch_unsplash_image(keywords: list[str]) -> str | None:
    query = " ".join(keywords[:2])  # 첫 2개 키워드만 사용
    url = "https://api.unsplash.com/photos/random"
    params = {
        "query": query,
        "orientation": "landscape",
        "content_filter": "high",  # 안전한 이미지만
    }
    headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}

    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params, headers=headers)
        if r.status_code == 200:
            data = r.json()
            # Unsplash 정책: 출처 표기 필수
            return {
                "url": data["urls"]["regular"],
                "credit": data["user"]["name"],
                "credit_url": data["user"]["links"]["html"],
            }
    return None
```

> **Unsplash 정책 필수 준수**: 이미지 하단에 `Photo by [이름] on Unsplash` 출처 표기.
> 이를 어기면 API 키 정지. DB의 `image_source`, `image_credit` 컬럼에 반드시 기록.

#### ③ YouTube 공식 썸네일 (K-Pop · K-Drama 한정)

뮤직비디오·드라마 공식 유튜브 채널의 썸네일은 YouTube Data API로 합법 사용 가능.
별도 비용 없음. 단, 공식 채널 확인 필수 (채널 인증 배지 ✓).

```python
# K-Pop 컴백 기사일 때만 YouTube 썸네일 시도
if category == "K-Pop" and article.youtube_id:
    image_url = f"https://img.youtube.com/vi/{article.youtube_id}/maxresdefault.jpg"
```

#### 카테고리별 Unsplash 기본 키워드 (config.yaml SSOT)

```yaml
# config.yaml
image_keywords:
  K-Beauty:        ["korean skincare", "beauty cosmetics", "glass skin routine"]
  K-Drama:         ["seoul night cityscape", "korean street aesthetic", "cinema screen"]
  K-Pop:           ["concert stage lights", "music performance crowd", "neon stage"]
  K-Food:          ["korean street food", "bibimbap bowl", "seoul food market"]
  K-Fashion:       ["street style fashion", "seoul style", "minimal fashion"]
  K-Lifestyle:     ["korean minimalist interior", "seoul cafe", "wellness spa"]
  K-Travel:        ["seoul skyline", "gyeongbokgung palace", "korea travel"]
  K-Sport:         ["football stadium aerial", "soccer match action", "sport crowd"]
  K-Entertainment: ["film clapperboard", "television studio", "award ceremony stage"]
```

#### 비용 최종 정리

| 항목 | 방식 | 월 비용 |
|---|---|---|
| SNS / OG 이미지 | `@vercel/og` 자동생성 | **$0** |
| 기사 본문 이미지 | Unsplash API | **$0** |
| K-Pop/Drama 이미지 | YouTube 공식 썸네일 | **$0** |
| ~~AI 생성 이미지~~ | ~~DALL-E 3~~ | ~~월 $60~~ |
| **이미지 총비용** | | **$0/월** |

> AI 이미지 생성은 트래픽이 월 100만 PV를 넘고, 이미지 품질이
> 수익에 직결된다는 게 데이터로 증명된 후 도입해도 늦지 않다.

### 4.5 비용 추정

```
기사당 예상 토큰      Input ~400 (팩트만), Output ~800 (재작성)

MVP (6개 카테고리)
  일 처리 기사 수    30~48편 (카테고리당 5~8편)
  일 LLM 비용       ~$0.20 (GPT-4o 기준)
  월 LLM 비용       ~$6
  월 이미지 비용     $0 (OG 자동생성 + Unsplash)

v1.1 (9개 카테고리)
  일 처리 기사 수    45~72편 (카테고리당 5~8편)
  일 LLM 비용       ~$0.30
  월 LLM 비용       ~$9
  월 이미지 비용     $0 (동일)

월 예상 총비용       MVP ~$6 / v1.1 ~$9
```

> 인프라 전체가 LLM API 비용만 발생. 이미지·호스팅·이메일 모두 $0.

---

## 5. 웹사이트 디자인 전략

### 5.1 디자인 컨셉

```
키워드: 감각적 · 모던 · 한국적 미감 · 글로벌 미디어

레퍼런스:
- Vogue Korea 영문판 수준의 타이포그래피
- Hypebeast의 카드형 레이아웃
- Allure의 뷰티 카테고리 표현
- The Guardian의 뉴스 밀도감

색상:
- Primary: Korean Red (#C0392B) + Off-White (#FAF9F6)
- Accent: Deep Navy (#1A1A2E) + Gold (#E8B86D)
- 카테고리별 컬러: Beauty(핑크) Drama(퍼플) Pop(코랄) Food(앰버) Fashion(블랙)
```

### 5.2 메인 페이지 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│  KNow   [Beauty|Drama|Pop|Food|Fashion|Lifestyle]  │
│  "Your daily dose of Korea"           [Travel] [🌙][☰]   │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  │
│  │  🔥 TODAY'S HEADLINE (풀 와이드 히어로 이미지)      │  │
│  │  [CATEGORY TAG]                                    │  │
│  │  "BTS Announces World Tour 2026:                   │  │
│  │   Everything You Need to Know"                     │  │
│  │  2 hours ago · 5 min read                          │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  TODAY'S STORIES                                  [Date]  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ [이미지]      │ │ [이미지]      │ │ [이미지]      │     │
│  │ K-BEAUTY     │ │ K-DRAMA      │ │ K-POP        │     │
│  │ "Korean..."  │ │ "Netflix..." │ │ "BLACKPIN..." │     │
│  │ 1hr ago      │ │ 3hr ago      │ │ 4hr ago      │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌────────────────────┐ │
│  │  TRENDING NOW               │  │  BEAUTY PICKS      │ │
│  │  1. [기사 제목]              │  │  [뷰티 제품 링크]   │ │
│  │  2. [기사 제목]              │  │  (제휴 마케팅)      │ │
│  │  3. [기사 제목]              │  └────────────────────┘ │
│  └─────────────────────────────┘                         │
├──────────────────────────────────────────────────────────┤
│  📧 Get Korea delivered to your inbox — every morning    │
│  [Enter your email]                     [Subscribe Free] │
├──────────────────────────────────────────────────────────┤
│  🗂 BROWSE BY CATEGORY                                   │
│  [K-Beauty] [K-Drama] [K-Pop] [K-Food] [K-Fashion] ...  │
└──────────────────────────────────────────────────────────┘
```

### 5.3 기사 상세 페이지

```
┌──────────────────────────────────────────────────────────┐
│  [K-POP] · 2 hours ago · 4 min read                     │
│                                                          │
│  # BTS Jin Returns: His First Solo Concert               │
│    After Military Discharge                              │
│                                                          │
│  [히어로 이미지 - 풀 와이드]                               │
│                                                          │
│  [본문 1문단]                                            │
│                                                          │
│  ░░░░ 광고 (네이티브) ░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                                          │
│  [본문 2~3문단]                                          │
│                                                          │
│  📌 Cultural Note                                        │
│  "In Korea, military service is mandatory for all..."    │
│                                                          │
│  [본문 4~5문단]                                          │
│                                                          │
│  🔗 Source: 원문 기사 링크 (네이버/다음)                  │
│                                                          │
│  🏷 Tags: [Jin] [BTS] [Military] [K-Pop] [2026]         │
│                                                          │
│  ░░░░ 광고 (하단) ░░░░░░░░░░░░░░░░░░░░░░               │
│                                                          │
│  📰 MORE FROM K-POP                                     │
│  [관련 기사 3개 카드]                                     │
└──────────────────────────────────────────────────────────┘
```

---

## 6. 기술 스택

### 6.1 에이전트 (Backend)

| 목적 | 라이브러리 | 비고 |
|---|---|---|
| HTTP 비동기 | `httpx` | asyncio Semaphore(5) |
| RSS 파싱 | `feedparser` | Daum·Nate RSS |
| HTML 파싱 | `beautifulsoup4` | 보조 스크래핑 |
| LLM | `openai` (GPT-4o) | 주력 번역·생성 |
| LLM 백업 | `anthropic` | Claude 3.5 Sonnet |
| ORM | `sqlalchemy` 2.0 | JsonType 포함 |
| 설정 | `pyyaml` | 키워드 풀 SSOT |
| 환경변수 | `python-dotenv` | 로컬 개발 |

### 6.2 웹사이트 (Frontend)

| 목적 | 패키지 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 App Router | SSG + ISR |
| 스타일 | Tailwind CSS + custom font | Pretendard / Geist |
| 이미지 | `next/image` | OG 이미지 자동 생성 |
| 마크다운 | `react-markdown` | 기사 본문 렌더링 |
| 검색 | `fuse.js` | 클라이언트 사이드 검색 |
| 분석 | Google Analytics GA4 | |
| DB | `better-sqlite3` | 서버 컴포넌트 |

### 6.3 인프라 (전체 무료 MVP)

| 서비스 | 용도 | 비용 |
|---|---|---|
| GitHub Actions | 스케줄러 (KST 08:00) | 무료 |
| GitHub Pages | 정적 사이트 호스팅 | 무료 |
| SQLite + Git | DB 지속성 | 무료 |
| Buttondown | 이메일 (구독자 1,000명까지) | 무료 |
| Unsplash API | 기사 본문 이미지 (월 50,000 req) | 무료 |
| @vercel/og | OG 이미지 자동생성 | 무료 |
| Vercel (v1.1+) | ISR 동적 기능 필요 시 | 무료 티어 |

---

## 7. 데이터 모델

### 7.1 articles 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | INTEGER PK | |
| `source_url` | TEXT UNIQUE | 원본 기사 URL |
| `source_name` | TEXT | "naver" / "daum" / "nate" |
| `title_ko` | TEXT | 원문 한국어 제목 |
| `summary_ko` | TEXT | 원문 요약 (3문단) |
| `headline_en` | TEXT | LLM 생성 영문 헤드라인 |
| `subheadline_en` | TEXT | 부제목 |
| `body_en` | TEXT | 영문 기사 본문 |
| `seo_title` | TEXT | SEO 제목 |
| `seo_description` | TEXT | 메타 디스크립션 |
| `category` | TEXT | K-Beauty / K-Drama / ... |
| `tags` | JsonType | list[str] |
| `tone` | TEXT | exciting / informative / ... |
| `cultural_note` | TEXT | 문화 맥락 설명 |
| `image_url` | TEXT | 대표 이미지 URL (Unsplash 또는 YouTube 썸네일) |
| `image_source` | TEXT | "unsplash" / "youtube_thumbnail" / "og_generated" |
| `image_credit` | TEXT | Unsplash 작가명 (출처 표기용, 정책 필수) |
| `image_credit_url` | TEXT | Unsplash 작가 프로필 URL |
| `image_license` | TEXT | 이미지 라이선스 정보 (감사 추적용) |
| `published_at_ko` | DATETIME | 원문 게시 시각 |
| `fetched_at` | DATETIME | 수집 시각 |
| `processed_at` | DATETIME | LLM 처리 완료 |
| `published` | BOOLEAN | 웹사이트 게시 여부 |
| `prompt_version` | TEXT | 사용 프롬프트 버전 |
| `view_count` | INTEGER | 조회수 (선택) |

### 7.2 daily_digest 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `date` | DATE | 큐레이션 날짜 |
| `article_id` | FK | articles 참조 |
| `rank` | INTEGER | 당일 노출 순위 |
| `is_featured` | BOOLEAN | 히어로 기사 여부 |

---

## 8. SNS 자동 발행 전략

### 8.1 채널별 포맷

#### X (Twitter/X)
```
🇰🇷 K-Beauty Alert

Korean skincare brands are leading the global market
with their latest "Glass Skin" trend products.

Here's what's going viral this week →
[링크]

#KBeauty #KoreanSkincare #Hallyu #KWaveDaily
```

#### Instagram (Buffer/Make 연동)
```
이미지: @vercel/og 자동생성 이미지 (카테고리 컬러 + 제목)
캡션: 헤드라인 + 2줄 요약 + 링크 in bio
해시태그: 카테고리별 30개 자동 생성
```

#### TikTok (v1.2 — TTS 활용)
```
텍스트 → TTS(ElevenLabs) → 자막 슬라이드 영상
카테고리별 BGM 템플릿 (K-Pop 차트 음악)
```

### 8.2 자동화 도구

| 채널 | 도구 | 비용 |
|---|---|---|
| X | Tweepy API (Python) | 무료 (Basic 100 posts/월) |
| Instagram | Buffer | 무료 (3 채널) |
| TikTok | TikTok API (v1.2) | 무료 |
| Pinterest | Pinterest API | 무료 (K-Beauty 이미지 강세) |

---

## 9. SEO 전략

### 9.1 타겟 키워드 구조

```
[즉시 노출 — 롱테일]
"BTS Jin solo concert 2026"
"Korean glass skin routine steps"
"What is tteokbokki"
"Squid Game season 3 release date"

[중기 — 카테고리]
"K-beauty trends 2026"
"best Korean dramas on Netflix"
"K-pop comebacks this week"

[장기 — 브랜드]
"KNow"
"Korean culture news English"
"daily Korea news for fans"
```

### 9.2 구조화 데이터

```typescript
// 기사마다 Article Schema 삽입
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": headline_en,
  "datePublished": published_at,
  "author": { "@type": "Organization", "name": "KNow" },
  "keywords": tags.join(", "),
  "inLanguage": "en"
}
```

---

## 10. 수익화 로드맵

### 10.1 광고 플랫폼별 전략

| 단계 | 플랫폼 | 조건 | 예상 수익 | K-culture 특이점 |
|---|---|---|---|---|
| 론칭 즉시 | Google AdSense | 도메인 승인 후 | $30~150/월 | Beauty/Fashion CPC 높음 |
| 3개월차 | Carbon Ads | 월 1만 PV+ | $150~500/월 | 글로벌 개발자 독자 포함 |
| 6개월차 | K-Beauty 브랜드 직접 스폰서 | 구독자 1,000명+ | $200~1,000/회 | **핵심 수익원** |
| 12개월차 | 미디어킷 발행 | 월 5만 PV+ | 협상 기반 | |

### 10.2 K-Beauty 브랜드 스폰서십 (핵심 전략)

K-beauty는 글로벌 마케팅 예산이 크고, 영문 인플루언서 채널을 항상 찾고 있습니다.

```
타겟 브랜드:
- 올리브영 글로벌 (iherb, YesStyle 입점 브랜드)
- 아모레퍼시픽 (Laneige, Innisfree 해외 마케팅)
- LG생활건강 (The History of Whoo 해외 확장)
- 중소 K-beauty 브랜드 (글로벌 진출 원하는 곳)

제안 패키지:
- 스폰서 기사 1편: $100~300
- 뉴스레터 단독 광고: $50~200/회
- 카테고리 배너 한 달: $200~500
```

### 10.3 제휴 마케팅

```
K-Beauty 제휴
  YesStyle          K-beauty 제품 3~8% 커미션
  StyleKorean       K-beauty 직구 사이트
  Amazon            한국 제품 글로벌

K-Pop 제휴
  Weverse           K-pop 굿즈
  인터파크 글로벌    콘서트 티켓

K-Travel 제휴 (v1.1 — 수익 잠재력 최고)
  Booking.com       서울 호텔 8% 커미션
  Klook             한국 투어·액티비티 5%
  Korean Air        항공권 제휴
  Airbnb            숙소 3%
  Visit Korea 공식   한국관광공사 파트너
```

### 10.4 수익 시나리오

| 시점 | 월 방문자 | 이메일 구독자 | 월 수익 |
|---|---|---|---|
| 1개월차 | 3,000~8,000 | 200명 | $0~50 |
| 3개월차 | 15,000~30,000 | 800명 | $100~300 |
| 6개월차 | 50,000~100,000 | 3,000명 | $500~1,500 |
| 12개월차 | 200,000~500,000 | 10,000명 | $2,000~8,000 |

> **글로벌 K-beauty 검색량**: 월 450만 건 이상. SEO만 잘 잡아도 트래픽이 붙는 구조.

---

## 11. papermint와의 차이점 & 추가 고려사항

### 11.1 papermint 대비 복잡도

| 항목 | papermint | KNow |
|---|---|---|
| 수집 소스 | HF Papers API 1개 | 네이버·다음·Nate + RSS |
| 콘텐츠 | 논문 (텍스트 중심) | 뉴스 (이미지 + 텍스트) |
| 언어 방향 | EN 유지 / 한글 추가 | KO → EN 완전 번역 |
| 법적 이슈 | 없음 | 저작권 주의 필요 |
| SEO 경쟁 | 낮음 | 높음 (K-pop 검색량 폭발) |
| 수익 잠재력 | 중간 | **높음** (글로벌 뷰티 광고 단가) |
| SNS 확산성 | 낮음 | **매우 높음** (K-pop 팬덤) |

### 11.2 저작권 안전 운영 원칙

```
✅ 해도 되는 것                          ❌ 하면 안 되는 것
────────────────────────────────────────────────────────────
팩트 기반 재작성 기사 게시               원문 번역 그대로 게시
원문 링크 하단 출처 표기                 원문 문단 그대로 복사
공식 YouTube 썸네일 (API)                기사 첨부 이미지 무단 사용
Unsplash 이미지 + 작가 출처 표기         연합뉴스 / AP 이미지 무단 사용
@vercel/og 자동생성 이미지               소속사 아이돌 사진 무단 사용
공식 프레스킷 이미지 (신청 후)           원문 인용구 과도하게 포함
                                         기사 전문 저장 및 재배포
```

**법적 보호 장치 체크리스트**:
- [ ] 모든 기사 하단 "Source:" 원문 링크 표기
- [ ] Unsplash 이미지 하단 "Photo by [이름] on Unsplash" 표기 (Unsplash 정책 필수)
- [ ] 개인정보처리방침 + 저작권 정책 페이지 운영
- [ ] DMCA 신고 접수 이메일 공개 (dmca@k-now.co)
- [ ] 기사 본문에 원문 문장 5단어 이상 연속 포함 금지 (코드 레벨 검증)
- [ ] DB `image_source`, `image_credit`, `image_credit_url` 컬럼 기록 필수

---

## 12. 개발 로드맵

### Phase 1 — MVP (3주) · 6개 카테고리

```
✅ Naver Search API 수집 (팩트 추출 전처리 포함)
✅ LLM 팩트 기반 재작성 파이프라인 (카테고리별 프롬프트 변형 6종)
✅ OG 이미지 자동생성 — @vercel/og + 9개 카테고리 컬러 시스템
✅ Unsplash API 연동 — 기사 본문 분위기 이미지 자동 매칭
✅ YouTube 공식 썸네일 — K-Pop·Drama 한정
✅ SQLite DB + Git 지속성
✅ Next.js 웹사이트 (메인, 카테고리 6개, 상세)
✅ GitHub Actions 자동화 (KST 08:00)
✅ Buttondown 이메일 구독
✅ Google Analytics + Search Console
✅ 저작권 정책 + DMCA 이메일 페이지
✅ 모든 기사 하단 원문 출처 링크 + Unsplash 이미지 출처 표기
```

### Phase 2 — v1.1 성장 (4~8주) · 9개 카테고리로 확장

```
⬜ K-Travel 카테고리 추가 (호텔·항공 제휴 연동)
⬜ K-Sport 카테고리 추가 (손흥민·류현진 등 글로벌 선수)
⬜ K-Entertainment 카테고리 추가 (드라마에서 분리)
⬜ 카테고리별 프롬프트 변형 3종 추가 (총 9종)
⬜ OG 이미지 컬러 3개 추가
⬜ Pinterest + X 자동 포스팅 (Tweepy)
⬜ Daum RSS + Nate 소스 추가
⬜ 카테고리 필터 + 검색
⬜ Google AdSense 신청
⬜ RSS 피드 (/api/feed.xml)
⬜ 다크모드
```

### Phase 3 — 수익화 (8~16주)

```
⬜ K-Beauty 브랜드 미디어킷 제작
⬜ K-Travel 호텔·투어 제휴 링크 자동 삽입
⬜ 제휴 마케팅 링크 카테고리별 자동화
⬜ 뉴스레터 스폰서십 패키지
⬜ Instagram 자동 포스팅 (Buffer)
⬜ 인기 기사 기반 추천 엔진
⬜ Vercel 마이그레이션 (ISR)
```

### Phase 4 — 확장 (16주+) · v1.2 카테고리 검토

```
⬜ K-Wellness 카테고리 추가 (트렌드 확인 후)
⬜ K-Games 카테고리 추가 (e스포츠·게임사)
⬜ TikTok TTS 자동 영상 (ElevenLabs + ffmpeg)
⬜ 일본어·스페인어 버전 추가 (다국어)
⬜ K-pop 아이돌 개인 페이지
⬜ 이벤트 캘린더 (콘서트, 컴백, 스포츠 일정)
```

---

## 13. KPI

| 지표 | 3개월 목표 | 6개월 목표 | 12개월 목표 |
|---|---|---|---|
| 활성 카테고리 수 | 6개 (MVP) | 9개 (v1.1) | 9개 + 심화 |
| 월 방문자 | 20,000 | 80,000 | 300,000 |
| 이메일 구독자 | 500 | 2,000 | 8,000 |
| X 팔로워 | 500 | 2,000 | 10,000 |
| 카테고리당 일 기사 수 | 3~5편 | 5~8편 | 8편 유지 |
| 파이프라인 성공률 | 99% | 99% | 99% |
| 월 수익 | $50 | $500 | $3,000 |
| 주요 수익원 | AdSense | AdSense + K-Beauty 스폰서 | 전 카테고리 스폰서 + 여행 제휴 |

---

## 14. 핵심 전략 한 줄

> **"K-pop 팬덤의 정보 갈증 + K-beauty의 글로벌 광고 예산 + 팩트 재작성 파이프라인 = 저작권 걱정 없이 수면 중에도 돌아가는 미디어 비즈니스"**
