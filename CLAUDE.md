# CLAUDE.md — KNow

<!--
  Claude Code는 이 파일을 세션 시작 시 자동으로 읽는다.
  ⚡ 브리핑 → 📍 현재 상태 → 📐 규칙 순으로 읽고 작업 시작.
-->

---

## ⚡ 브리핑 — 항상 여기서 시작 (필독)

| 항목 | 내용 |
|---|---|
| **프로젝트** | KNow — K-culture 글로벌 영문 뉴스 자동화 미디어 |
| **한 줄 목표** | 한국 뉴스에서 K-culture 팩트 수집 → LLM 영문 재작성 → 글로벌 웹사이트 자동 게시 |
| **Python 스택** | Python 3.11 / httpx(async) / feedparser / SQLAlchemy 2.0 / openai + anthropic |
| **Web 스택** | Next.js 14 App Router / TypeScript / Tailwind CSS / @vercel/og / better-sqlite3 |
| **DB** | SQLite (`data/know.db`) — Git 커밋으로 지속성 유지 (MVP 전략) |
| **배포** | GitHub Actions (cron KST 08:00) → GitHub Pages |
| **알림** | Buttondown(이메일) / X(Tweepy) / Discord Webhook |

### 파이프라인 3단계

```
[Collector]   Naver Search API + Daum RSS → 팩트 추출 (원문 문장 버림)
      ↓
[Processor]   카테고리별 프롬프트 → LLM 1회 → 영문 기사 재작성 + unsplash_keywords
      ↓
[Publisher]   Unsplash 이미지 + OG 자동생성 → DB → Next.js 빌드 → 배포 → 알림
```

### 카테고리 9개 (단계별 오픈)

```
MVP 6개    K-Beauty · K-Drama · K-Pop · K-Food · K-Fashion · K-Lifestyle
v1.1 3개   K-Travel · K-Sport · K-Entertainment
```

### 이미지 전략 (비용 $0)

```
기사 본문   → Unsplash API (분위기 이미지, 인물 제외)
SNS / OG   → @vercel/og 자동생성 (카테고리 컬러 + 제목)
K-Pop/Drama → YouTube 공식 썸네일 (API, 공식 채널 한정)
❌ 금지     기사 이미지 · 아이돌 사진 · AI 생성 이미지
```

### 카테고리 컬러 시스템

```
K-Beauty  #D4537E  K-Drama  #7F77DD  K-Pop    #D85A30
K-Food    #BA7517  K-Fashion #444441  K-Lifestyle #1D9E75
K-Travel  #378ADD  K-Sport  #639922  K-Entertainment #E24B4A
```

### 핵심 설계 결정 (상세 → DECISIONS.md)

| 결정 | 이유 |
|---|---|
| 번역 ❌ 팩트 재작성 ✅ | 번역은 2차 저작물 → 저작권 위반 |
| AI 이미지 ❌ Unsplash ✅ | 월 $60 절감, 분위기 이미지가 오히려 감각적 |
| 카테고리별 프롬프트 분리 | 독자가 다르면 톤·구조가 달라야 함 |
| DB Git 커밋 허용 | GitHub Actions 클린 환경 → 누적 데이터 유지 |
| config.yaml SSOT | 카테고리 키워드·컬러·이미지키워드 단일 관리 |

---

## 📍 현재 상태 — SESSION.md를 먼저 읽어라

> **세션 시작 시 SESSION.md 확인 필수. 없으면 새로 만든다.**

**세션 시작 주문 패턴**:
```
SESSION.md 읽고, [모듈명] 작업 이어서 시작해줘.
참조: KWAVE_DAILY_PLAN.md [N절]
```

---

## 📐 개발 규칙 — 코드 작성 전 반드시 확인

1. **기사 처리** → 팩트만 추출, 원문 문장 저장 금지. LLM 입력에 원문 전문 넘기지 않음
2. **이미지** → Unsplash API + @vercel/og만. 기사 이미지·아이돌 사진 절대 사용 금지
3. **Unsplash 출처** → 모든 이미지 하단 "Photo by [이름] on Unsplash" 표기 필수 (정책)
4. **카테고리 수정** → `config.yaml`만. 코드·프롬프트 하드코딩 금지
5. **프롬프트 수정** → `PROMPTS.md`에 버전·이유 먼저 기록 후 변경
6. **LLM 호출** → `process_with_fallback()` 경유 (GPT-4o → Claude → 영문 fallback)
7. **JSON 파싱** → `safe_parse_json()` 경유. 직접 `json.loads()` 금지
8. **시크릿** → `os.getenv()` 사용. 코드·로그 하드코딩 절대 금지
9. **출처 표기** → 모든 기사 하단 "Source: [원문 URL]" 필수

---

## 📚 참조 인덱스 — 필요한 섹션만 열 것

| 궁금한 것 | 파일 | 섹션 |
|---|---|---|
| 서비스 전체 전략 | `KWAVE_DAILY_PLAN.md` | 1~3절 |
| 카테고리 정의·컬러 | `KWAVE_DAILY_PLAN.md` | 2절 |
| 수집 소스·필터링 | `KWAVE_DAILY_PLAN.md` | 3절 |
| LLM 처리 흐름·코드 | `KWAVE_DAILY_PLAN.md` | 4절 |
| Unsplash 연동 코드 | `KWAVE_DAILY_PLAN.md` | 4.4절 |
| OG 이미지 코드 | `KWAVE_DAILY_PLAN.md` | 4.4절 |
| DB 스키마·모델 | `KWAVE_DAILY_PLAN.md` | 7절 |
| SNS 자동 발행 | `KWAVE_DAILY_PLAN.md` | 8절 |
| SEO 전략·키워드 | `KWAVE_DAILY_PLAN.md` | 9절 |
| 수익화 전략 | `KWAVE_DAILY_PLAN.md` | 10절 |
| 카테고리별 프롬프트 전문 | `PROMPTS.md` | 카테고리별 섹션 |
| 프롬프트 롤백 | `PROMPTS.md` | 롤백 절차 |
| 설계 결정 이유 | `DECISIONS.md` | 전체 |
| 장애 대응 | `OPERATIONS.md` | 3절 (론칭 후 생성) |
| 로고·컬러·슬로건 | `BRANDING.md` | 전체 |
| OG 이미지 코드 | `BRANDING.md` | 7절 |
| 카테고리 컬러 hex | `BRANDING.md` | 4절 |
| Tailwind 컬러 설정 | `BRANDING.md` | 4절 |
| 뉴스레터 구조 | `BRANDING.md` | 10절 |

---

## 디렉토리 구조

```
know/
├── agent/
│   ├── main.py              # 진입점
│   ├── collector.py         # Naver API + Daum RSS 수집
│   ├── fact_extractor.py    # 원문 → 팩트 추출
│   ├── processor.py         # LLM 재작성 (카테고리별 프롬프트)
│   ├── image_fetcher.py     # Unsplash API + YouTube 썸네일
│   ├── publisher.py         # DB 저장 + 배포 트리거
│   ├── notifier.py          # 이메일 / X / Discord
│   └── prompts/
│       ├── v1_base.txt          # 공통 시스템 프롬프트
│       ├── v1_kbeauty.txt       # K-Beauty 변형
│       ├── v1_kdrama.txt        # K-Drama 변형
│       ├── v1_kpop.txt          # K-Pop 변형
│       ├── v1_kfood.txt         # K-Food 변형
│       ├── v1_kfashion.txt      # K-Fashion 변형
│       ├── v1_klifestyle.txt    # K-Lifestyle 변형
│       └── archive/             # 이전 버전 보관
│
├── database/
│   ├── schema.sql
│   └── models.py            # JsonType TypeDecorator 포함
│
├── data/
│   └── know.db             # SQLite (Git 추적 대상)
│
├── website/                 # Next.js 14
│   ├── app/
│   │   ├── page.tsx             # 메인 (오늘의 K-culture)
│   │   ├── [category]/
│   │   │   └── page.tsx         # 카테고리 페이지
│   │   ├── articles/
│   │   │   └── [id]/page.tsx    # 기사 상세
│   │   └── api/
│   │       ├── og/route.tsx     # @vercel/og 자동생성
│   │       └── feed.xml/route.ts
│   └── lib/
│       └── db.ts
│
├── .github/workflows/
│   └── daily-kwave.yml
│
├── config.yaml              # 카테고리·키워드·컬러 SSOT
├── CLAUDE.md                # 이 파일
├── KWAVE_DAILY_PLAN.md      # 마스터 기획서
├── PROMPTS.md               # 프롬프트 버전 관리
├── SESSION.md               # 작업 상태 추적
├── DECISIONS.md             # 설계 결정 이유
└── OPERATIONS.md            # 운영 매뉴얼 (론칭 후)
```

---

## 성능·비용 목표

| 지표 | 목표 |
|---|---|
| 파이프라인 실행 (MVP 6카테고리) | < 120초/일 |
| LLM 비용 | < $0.20/일 (월 ~$6) |
| 이미지 비용 | $0 (Unsplash + OG 자동생성) |
| 인프라 총비용 | $0 (LLM 제외) |
| JSON 파싱 성공률 | > 99% |
