# SESSION.md — KNow
<!-- 매 세션 종료 시 업데이트. Claude Code가 세션 시작 시 가장 먼저 읽는 상태 파일. -->

## 현재 상태

| 항목 | 내용 |
|---|---|
| **최종 업데이트** | 2026-05-17 |
| **현재 단계** | MVP 코드베이스 완성 (세션 1~9) |
| **다음 작업** | GitHub Secrets 등록 → 첫 실행 (`--dry-run`) → 론칭 |

---

## 완료된 작업

- [x] `config.yaml` 작성 — 카테고리 9개 / 컬러 / 필터 키워드 / 이미지 키워드 SSOT 완성
- [x] `requirements.txt` 작성 — Python 3.11 의존성 확정
- [x] `database/schema.sql` 작성 — articles / daily_digest 테이블 + 인덱스
- [x] `database/models.py` 작성 — SQLAlchemy 2.0 ORM + JsonType + make_engine / init_db
- [x] `agent/collector.py` 작성 — Naver API + Daum RSS 수집, 중복 제거, 카테고리 분류
- [x] `agent/fact_extractor.py` 작성 — regex 기반 팩트 추출 (LLM 없음)
- [x] `agent/processor.py` 작성 — process_with_fallback / safe_parse_json / 프롬프트 로딩
- [x] `agent/prompts/v1_*.txt` 작성 — base + MVP 6개 카테고리 변형 프롬프트
- [x] `agent/image_fetcher.py` 작성 — Unsplash API + YouTube 썸네일, 우선순위 폴백
- [x] `agent/publisher.py` 작성 — DB 저장 + daily_digest 큐레이션 + git push
- [x] `agent/notifier.py` 작성 — Buttondown 이메일 + Discord Webhook
- [x] `agent/main.py` 작성 — 파이프라인 오케스트레이터 (6단계)
- [x] `website/` Next.js 14 작성 — 설정 + lib + 컴포넌트 4개 + 페이지 3개 + OG 라우트
- [x] `.github/workflows/daily-kwave.yml` — 2-job 워크플로우 (pipeline + deploy)
- [x] `agent/__init__.py` / `database/__init__.py` / `.gitignore` / `.env.example`

---

## 진행 중인 작업

- 없음

---

## 빌드 순서 (전체 로드맵)

```
세션 1   프로젝트 초기화
         config.yaml 작성 (카테고리·키워드·컬러 SSOT)
         requirements.txt / package.json

세션 2   DB 설계
         database/schema.sql
         database/models.py (JsonType 포함)

세션 3   Collector
         agent/collector.py (Naver Search API + Daum RSS)
         agent/fact_extractor.py (팩트 추출, 원문 버림)

세션 4   Processor
         agent/processor.py (카테고리별 프롬프트 로딩 + LLM 호출)
         safe_parse_json() + process_with_fallback()

세션 5   Image Fetcher
         agent/image_fetcher.py
         Unsplash API 연동
         YouTube 썸네일 (K-Pop · K-Drama)

세션 6   Publisher + Notifier
         agent/publisher.py (DB 저장 + Markdown 생성 + Git push)
         agent/notifier.py (이메일 / X / Discord)

세션 7   Next.js 기반
         website/app/page.tsx (메인)
         website/app/[category]/page.tsx
         website/app/articles/[id]/page.tsx

세션 8   OG 이미지 + SEO
         website/app/api/og/route.tsx (@vercel/og)
         메타태그 + Schema.org 구조화 데이터

세션 9   GitHub Actions
         .github/workflows/daily-kwave.yml

세션 10  통합 테스트 + 론칭
         E2E 테스트
         저작권 정책 페이지
         Google Analytics + Search Console
```

---

## 다음 세션 할 일

```
1. config.yaml 작성
   - categories (9개 단계별)
   - category_keywords (필터링용)
   - category_colors (OG 이미지용)
   - image_keywords (Unsplash 검색용)
   - prompt_version: "v1.0"

2. requirements.txt 작성

3. database/schema.sql 작성
   (KWAVE_DAILY_PLAN.md 7절 기준)
```

---

## 현재 이슈 / 블로커

- 없음

---

## 환경변수 체크리스트 (GitHub Secrets 등록 필요)

| 변수명 | 필수 | 발급처 | 등록 여부 |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ 필수 | platform.openai.com | ⬜ |
| `ANTHROPIC_API_KEY` | 권장 | console.anthropic.com | ⬜ |
| `NAVER_CLIENT_ID` | ✅ 필수 | developers.naver.com | ⬜ |
| `NAVER_CLIENT_SECRET` | ✅ 필수 | developers.naver.com | ⬜ |
| `UNSPLASH_ACCESS_KEY` | ✅ 필수 | unsplash.com/developers | ⬜ |
| `YOUTUBE_API_KEY` | 권장 | console.cloud.google.com | ⬜ |
| `BUTTONDOWN_API_KEY` | P1 | buttondown.email | ⬜ |
| `DISCORD_WEBHOOK` | P1 | Discord 채널 설정 | ⬜ |
| `TWITTER_API_KEY` | P2 (v1.1) | developer.twitter.com | ⬜ |

---

## 세션 시작 주문 템플릿

```
SESSION.md 읽고, [작업 내용] 이어서 시작해줘.
참조: KWAVE_DAILY_PLAN.md [N절] / PROMPTS.md [섹션명]
```
