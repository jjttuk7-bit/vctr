"""
agent/fact_extractor.py — KNow 팩트 추출기
CollectedArticle(title_ko + summary_ko) → ArticleFacts

설계 원칙 (DECISIONS.md 참조):
  - LLM 호출 없음 — 순수 regex/규칙 기반 (속도·비용 무관)
  - 원문 문장 보존 금지 (CLAUDE.md 규칙 #1)
  - ArticleFacts만 Processor에 전달 — 원문 문장 구조가 LLM에 노출되지 않음
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import yaml

from agent.collector import CollectedArticle


# ─────────────────────────────────────────────────────────────
# 정규식 패턴
# ─────────────────────────────────────────────────────────────

# 날짜: "2026년 6월 15일", "6월 15일", "이번 주", "오는 금요일" 등
_RE_DATE = re.compile(
    r'\d{4}년\s*\d{1,2}월\s*\d{1,2}일'
    r'|\d{1,2}월\s*\d{1,2}일'
    r'|(?:이번|다음|지난)\s*(?:주|달|해|시즌)'
    r'|오는\s*[월화수목금토일]요일'
    r'|\d{4}년'
)

# 수치: "10만 명", "3위", "15%", "500억 원", "12화" 등
_RE_NUMBER = re.compile(
    r'\d+(?:\.\d+)?억\s*원'
    r'|\d+(?:\.\d+)?만\s*원'
    r'|\d+(?:\.\d+)?만\s*명'
    r'|\d+(?:\.\d+)?천\s*명'
    r'|\d+\s*위'
    r'|\d+\s*%'
    r'|\d+\s*편'
    r'|\d+\s*화'
    r'|\d+\s*회'
    r'|\d+\s*장'        # 앨범 트랙 수
    r'|\d+\s*관'        # 극장 수
)

# 장소: 한국 주요 지명 + 해외 주요 도시
_RE_PLACE = re.compile(
    r'서울|부산|제주|인천|대구|광주|대전|수원|성남|용인'
    r'|잠실|홍대|강남|명동|이태원|종로|광화문|여의도|한남'
    r'|경복궁|코엑스|올림픽(?:주)?경기장|KSPO돔'
    r'|뉴욕|도쿄|파리|런던|로스앤젤레스|LA|베이징|상하이'
    r'|미국|일본|프랑스|영국|중국|태국|인도네시아|베트남'
)

# 인물 마커: "배우 홍길동", "가수 아이유" → 뒤 2~4자 한국어 이름 추출
_RE_ROLE_NAME = re.compile(
    r'(?:배우|가수|래퍼|작가|감독|MC|DJ|아나운서|셰프|디자이너)\s+'
    r'([가-힣]{2,4})'
)


# ─────────────────────────────────────────────────────────────
# 출력 타입
# ─────────────────────────────────────────────────────────────
@dataclass
class ArticleFacts:
    # 원본 추적 (DB 저장용)
    category:        str
    source_url:      str
    source_name:     str
    published_at_ko: datetime

    # 팩트 (Processor → LLM 프롬프트 입력)
    # ⚠️ title_ko: 팩트 참조용 레이블 — LLM에 문장째로 넘기지 않음
    title_ko:  str
    who:       list[str] = field(default_factory=list)   # 인물·그룹·브랜드
    what:      str       = ""                             # 핵심 행위/사건
    when:      str       = ""                             # 날짜 표현
    where:     str       = ""                             # 장소
    numbers:   list[str] = field(default_factory=list)   # 수치 목록
    context:   str       = ""                             # 추가 맥락


# ─────────────────────────────────────────────────────────────
# FactExtractor
# ─────────────────────────────────────────────────────────────
class FactExtractor:
    def __init__(self, config: dict | None = None) -> None:
        cfg = config or _load_config()
        # 카테고리 키워드를 엔티티 힌트로 활용 (BTS, 블랙핑크, 올리브영 등)
        self._keywords_by_category: dict[str, list[str]] = cfg["category_keywords"]

    # ── 공개 API ──────────────────────────────────────────────

    def extract(self, article: CollectedArticle) -> ArticleFacts:
        """CollectedArticle 1건 → ArticleFacts."""
        text = article.title_ko + " " + article.summary_ko

        return ArticleFacts(
            category=article.category,
            source_url=article.source_url,
            source_name=article.source_name,
            published_at_ko=article.published_at_ko,
            title_ko=article.title_ko,
            who=self._extract_who(text, article.category),
            what=_extract_what(article.title_ko),
            when=_first_match(_RE_DATE, text),
            where=_first_match(_RE_PLACE, text),
            numbers=_all_matches(_RE_NUMBER, text),
            context=_build_context(article.summary_ko, article.title_ko),
        )

    def extract_all(
        self, articles: list[CollectedArticle]
    ) -> list[ArticleFacts]:
        return [self.extract(a) for a in articles]

    # ── 인물 추출 ─────────────────────────────────────────────

    def _extract_who(self, text: str, category: str) -> list[str]:
        found: list[str] = []

        # ① 카테고리 키워드 중 고유명사 (길이 2자 이상, 한글·영문 혼용)
        for kw in self._keywords_by_category.get(category, []):
            if len(kw) >= 2 and kw in text:
                found.append(kw)

        # ② 역할 마커 뒤 이름 ("배우 김수현", "가수 아이유" 등)
        for m in _RE_ROLE_NAME.finditer(text):
            found.append(m.group(1))

        # 순서 유지 중복 제거
        return list(dict.fromkeys(found))


# ─────────────────────────────────────────────────────────────
# 내부 유틸
# ─────────────────────────────────────────────────────────────

def _extract_what(title_ko: str) -> str:
    """
    제목에서 핵심 행위만 추출.
    한국어 뉴스 제목 끝 서술형 어미("...밝혀", "...전했다" 등)를 제거하고
    행위 명사구 형태로 정리한다.
    """
    # 끝 서술형 어미 제거 패턴
    _RE_ENDING = re.compile(
        r'[,\s]*(?:밝혀|전했다|전해|공개돼|알려져|예고돼|확인돼'
        r'|나서|나섰다|밝혔다|말했다|전했다|소식이다|예정이다)\s*$'
    )
    return _RE_ENDING.sub("", title_ko).strip()


def _first_match(pattern: re.Pattern, text: str) -> str:
    m = pattern.search(text)
    return m.group(0).strip() if m else ""


def _all_matches(pattern: re.Pattern, text: str) -> list[str]:
    return [m.strip() for m in pattern.findall(text)]


def _build_context(summary_ko: str, title_ko: str) -> str:
    """
    summary_ko에서 title_ko와 중복되는 내용을 배제한 추가 맥락 반환.
    summary가 제목의 단순 반복일 경우 빈 문자열 반환.
    """
    if not summary_ko:
        return ""
    # 제목의 첫 10자가 summary에 그대로 포함되면 중복으로 판단
    if len(title_ko) >= 10 and title_ko[:10] in summary_ko:
        cleaned = summary_ko.replace(title_ko, "").strip(" .·…")
        return cleaned if len(cleaned) > 20 else ""
    return summary_ko.strip()


def _load_config() -> dict:
    path = Path(__file__).parent.parent / "config.yaml"
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)
