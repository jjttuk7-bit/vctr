# KNow 시스템 설계 구조

> K-culture 글로벌 영문 뉴스 자동화 미디어
> "한국 뉴스 팩트 수집 → LLM 영문 재작성 → 글로벌 웹사이트 자동 게시"

---

## 1. 전체 흐름

```
GitHub Actions (매일 KST 08:00)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Python 파이프라인  (agent/)                         │
│                                                     │
│  [1] Collector      Naver API → 기사 수집            │
│  [2] FactExtractor  제목+요약 → 팩트 구조화 (regex)  │
│  [3] Processor      팩트 → GPT-4o → 영문 기사 생성  │
│  [4] ImageFetcher   Unsplash API → 이미지 페치       │
│  [5] Publisher      SQLite DB 저장 → git push        │
│  [6] Notifier       이메일(Buttondown) + Discord     │
└─────────────────────────────────────────────────────┘
         │  git push (website/data/know.db 포함)
         ▼
  GitHub Repository
         │  push 감지
         ▼
  Vercel 자동 재빌드
         │  next build (DB 읽어 정적 HTML 생성)
         ▼
  https://know-red.vercel.app  (라이브)
```

---

## 2. Python 파이프라인

### 2-1. 수집 (Collector)

```
Naver Search API
  카테고리별 키워드로 검색 (config.yaml SSOT)
  → 429 Too Many Requests 시 해당 키워드만 스킵
  → asyncio.Semaphore(5)로 병렬 제한

Daum RSS
  엔터테인먼트 RSS → 키워드 매칭으로 카테고리 분류

필터링:
  - 24시간 이내 기사만
  - URL 중복 제거 (set)
  - 카테고리당 최대 8건
```

### 2-2. 팩트 추출 (FactExtractor)

```
LLM 호출 없음 — 순수 regex

title_ko + summary_ko
  → who     : 카테고리 키워드 매칭 + 역할마커 ("배우 홍길동")
  → what    : 제목에서 서술형 어미 제거
  → when    : 날짜 regex ("2026년 6월", "이번 주")
  → where   : 장소 regex (서울, 잠실, 뉴욕 ...)
  → numbers : 수치 regex ("10만 명", "3위", "15%")
  → context : summary에서 제목 중복 제외한 나머지
```

### 2-3. LLM 재작성 (Processor)

```
입력 (팩트만 — 원문 문장 없음):
  { category, key_facts: { who, what, when, where, numbers, context } }

프롬프트 구조:
  v1_base.txt (공통 규칙)
  + v1_{category}.txt (카테고리별 톤·구조)
  → config.yaml의 prompt_version으로 버전 관리

폴백 체인:
  GPT-4o → 실패 시 Claude → 실패 시 기사 스킵

출력 (JSON):
  headline_en, subheadline_en, body_en
  seo_title, seo_description, tags, tone
  cultural_note, unsplash_keywords
```

### 2-4. 이미지 (ImageFetcher)

```
우선순위:
  1. YouTube 썸네일 (K-Pop·K-Drama, youtube_id 있을 때)
  2. Unsplash (LLM 생성 unsplash_keywords)
  3. Unsplash (config.yaml 카테고리 기본 키워드 fallback)
  4. None → image_source = "og_generated"

Unsplash 정책:
  - 출처 표기 필수: "Photo by [이름] on Unsplash"
  - image_credit / image_credit_url DB에 저장
  - Demo: 50 req/h → Production 승인 후 5,000 req/h
```

### 2-5. 저장 (Publisher)

```
SQLite DB (website/data/know.db):
  - source_url UNIQUE → 중복 삽입 방지
  - WAL 체크포인트 후 git add (WAL 미병합 방지)
  - published = True 로 저장

daily_digest 테이블:
  - 오늘 기사 중 rank=0 → is_featured=True (히어로)
  - 멱등 재실행 (DELETE + INSERT)

git push:
  GITHUB_ACTIONS 환경변수 확인 후 실행
  커밋 메시지: "data: daily update YYYY-MM-DD"
```

---

## 3. 데이터베이스

```sql
articles 테이블  (핵심 컬럼)
  id              PK
  source_url      UNIQUE     ← 중복 방지 키
  category        TEXT       ← "K-Beauty" | "K-Drama" | ...
  headline_en     TEXT       ← LLM 생성
  body_en         TEXT       ← LLM 생성 (3~5문단)
  cultural_note   TEXT       ← 서양 독자 맥락 설명
  image_url       TEXT       ← Unsplash URL
  image_source    TEXT       ← "unsplash" | "og_generated"
  image_credit    TEXT       ← Unsplash 작가명 (정책 필수)
  published       BOOLEAN
  prompt_version  TEXT       ← "v1.0"

daily_digest 테이블
  date / article_id / rank / is_featured
```

**지속성 전략**: DB를 Git으로 추적 (`website/data/know.db`)
→ GitHub Actions 매 실행이 클린 환경이어도 누적 데이터 유지

---

## 4. 웹사이트 (Next.js 14)

```
website/
  app/
    page.tsx              홈 — 히어로 + 최신 기사 그리드
    [category]/
      page.tsx            카테고리 1페이지 (SSG)
      p/[num]/page.tsx    카테고리 N페이지 (SSG, /k-beauty/p/2/)
    articles/[id]/
      page.tsx            기사 상세
    api/
      og/route.tsx        OG 이미지 동적 생성 (@vercel/og)
      search/route.tsx    검색 인덱스 JSON
  components/
    ArticleCard           기사 카드 (이미지 + 배지 + 제목)
    SearchBar             fuse.js 클라이언트 검색
    CategoryPagination    경로 기반 페이지네이션
    Header                카테고리 네비 + 검색창
  lib/
    db.ts                 better-sqlite3 쿼리 (SSG 빌드 시 실행)
    config.ts             카테고리 컬러·유틸 함수
```

**렌더링 전략**: SSG (정적 생성)
- 모든 페이지가 빌드 시 DB를 읽어 정적 HTML로 생성
- DB가 업데이트(git push)되면 Vercel이 자동 재빌드
- `serverExternalPackages: ['better-sqlite3']` 필수
  (네이티브 바이너리를 Next.js 번들러에서 제외)

**이미지 전략**:
```
기사 카드 / 상세  →  Unsplash (image_source = "unsplash")
                    없으면 카테고리 컬러 플레이스홀더
SNS 공유 OG      →  /api/og (카테고리 컬러 + 제목, @vercel/og)
```

---

## 5. 배포 구조

```
GitHub Repository (master)
  │
  ├── GitHub Actions  ─────────────────────────────────────
  │     cron: '0 23 * * *'  (KST 08:00)
  │     workflow_dispatch (수동 실행 가능)
  │
  │     Steps:
  │       1. Python 3.11 설치 + requirements.txt
  │       2. python -m agent.main
  │          (수집→재작성→이미지→DB저장→git push)
  │
  └── Vercel  ─────────────────────────────────────────────
        Root Directory: website/
        트리거: master push 감지 → next build 자동 실행
        DB 경로: process.cwd()/data/know.db
                 (= {vercel_build_root}/website/data/know.db)
```

---

## 6. 핵심 설계 결정

| 결정 | 이유 |
|---|---|
| 번역 ❌ 팩트 재작성 ✅ | 번역 = 2차 저작물 → 저작권 위반 |
| config.yaml SSOT | 카테고리·컬러·키워드 한 파일에서 관리 |
| DB Git 추적 | GitHub Actions 클린 환경 → 데이터 누적 유지 |
| SSG (정적 생성) | DB 읽기가 빌드 시에만 → Vercel 서버리스 파일접근 문제 회피 |
| 경로 기반 페이지네이션 | `/k-beauty/p/2/` — searchParams 쓰면 SSG 포기됨 |
| `serverExternalPackages` | better-sqlite3 네이티브 바이너리 번들 방지 |
| Unsplash + OG 자동생성 | 이미지 비용 $0, 저작권·초상권 안전 |
| 2-레이어 프롬프트 | base(공통) + category(톤·구조) 분리 → 카테고리별 품질 |
| process_with_fallback() | GPT-4o → Claude 폴백 → 파이프라인 중단 없음 |
| safe_parse_json() | LLM JSON 출력의 마크다운 펜스·오염 제거 |

---

## 7. 비용 구조

| 항목 | 비용 |
|---|---|
| LLM (GPT-4o, ~32건/일) | ~$0.20/일 (~$6/월) |
| 이미지 (Unsplash) | $0 |
| 호스팅 (Vercel) | $0 |
| CI/CD (GitHub Actions) | $0 |
| 이메일 (Buttondown, ~1,000명) | $0 |
| **합계** | **~$6/월** |

---

## 8. 카테고리 시스템

```
MVP 6개 (현재 운영)
  K-Beauty   #D4537E    K-Drama    #7F77DD    K-Pop      #D85A30
  K-Food     #BA7517    K-Fashion  #444441    K-Lifestyle #1D9E75

v1.1 예정 3개
  K-Travel   #378ADD    K-Sport    #639922    K-Entertainment #E24B4A
```

카테고리 추가 시 `config.yaml`만 수정 (코드·프롬프트 하드코딩 금지)
