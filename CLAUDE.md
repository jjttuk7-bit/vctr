# CLAUDE.md — Vctr

<!--
  Claude Code reads this file automatically at session start.
  Read: Briefing → Current state → Rules
-->

---

## ⚡ Briefing — start here

| Item | Content |
|---|---|
| **Project** | Vctr — AI/SaaS tool review global English media |
| **Goal** | Collect tool data (ProductHunt + GitHub Trending) → LLM review writing → auto-publish |
| **Python stack** | Python 3.11 / httpx(async) / SQLAlchemy 2.0 / openai + anthropic |
| **Web stack** | Next.js 14 App Router / TypeScript / Tailwind CSS / @vercel/og / better-sqlite3 |
| **DB** | SQLite (`website/data/vctr.db`) — Git-committed for persistence (MVP strategy) |
| **Deploy** | GitHub Actions (cron UTC 01:00) → push DB → Vercel auto-redeploy |
| **Notifications** | Buttondown (email) / Discord Webhook |

### Pipeline

```
[Collector]   ProductHunt GraphQL API + GitHub Trending → tool data
      ↓
[FactExtractor]  tool name + description → structured facts (no LLM)
      ↓
[Processor]   category prompt → LLM 1 call → English review + unsplash_keywords
      ↓
[Publisher]   Unsplash image + OG fallback → DB → Next.js build → deploy → notify
```

### Categories (MVP 6)

```
AI Writing   AI Image   Productivity   Dev Tools   No-Code   Marketing
```

### Image strategy ($0 cost)

```
Review images  → Unsplash API (mood/workspace images, no product logos)
Social / OG    → @vercel/og auto-generated (category color + headline)
❌ Banned       product screenshots · brand logos · AI-generated images
```

### Category color system

```
AI Writing  #6366F1   AI Image  #EC4899   Productivity  #10B981
Dev Tools   #F59E0B   No-Code   #3B82F6   Marketing     #EF4444
```

### Key design decisions

| Decision | Reason |
|---|---|
| Facts only → no copy-paste | Avoids copyright issues |
| AI images banned | Unsplash = $0, better trust |
| Category-specific prompts | Different readers need different tones |
| DB in Git | GitHub Actions clean env → data persists across runs |
| config.yaml SSOT | Single source for categories/colors/keywords |

---

## 📍 Current state — check SESSION.md first

> **Always read SESSION.md at session start. Create one if missing.**

**Session start pattern**:
```
Read SESSION.md and continue [module] work.
```

---

## 📐 Development rules — check before writing code

1. **Tool data** → extract facts only, no raw description copy-paste. LLM never sees raw summary text directly
2. **Images** → Unsplash API + @vercel/og only. Product logos / brand screenshots banned
3. **Unsplash credit** → all images need "Photo by [name] on Unsplash" attribution (policy)
4. **Category changes** → `config.yaml` only. No hardcoding in code or prompts
5. **Prompt changes** → document version and reason in PROMPTS.md first
6. **LLM calls** → via `process_with_fallback()` only (GPT-4o → Claude fallback)
7. **JSON parsing** → via `safe_parse_json()` only. Direct `json.loads()` banned
8. **Secrets** → `os.getenv()` only. Never hardcode or log
9. **Source attribution** → all articles show "Source: [ProductHunt URL]"

---

## 📚 Reference index

| Question | File | Section |
|---|---|---|
| Service strategy | `KWAVE_DAILY_PLAN.md` | (legacy — create VCTR_PLAN.md) |
| Category definitions + colors | `config.yaml` | categories / category_colors |
| Data collection flow | `agent/collector.py` | — |
| LLM processing | `agent/processor.py` | — |
| Unsplash image fetching | `agent/image_fetcher.py` | — |
| DB schema + models | `database/schema.sql` + `models.py` | — |
| Prompt versions | `PROMPTS.md` | — |
| Logo / colors / slogan | `BRANDING.md` | all sections |
| OG image code | `website/app/api/og/route.tsx` | — |
| Tailwind color config | `website/tailwind.config.js` | — |

---

## Directory structure

```
vctr/
├── agent/
│   ├── main.py              # pipeline entry point
│   ├── collector.py         # ProductHunt + GitHub Trending
│   ├── fact_extractor.py    # tool data → structured facts
│   ├── processor.py         # LLM review writing (category prompts)
│   ├── image_fetcher.py     # Unsplash API
│   ├── publisher.py         # DB save + deploy trigger
│   ├── notifier.py          # email / Discord
│   └── prompts/
│       ├── v1_base.txt
│       ├── v1_aiwriting.txt
│       ├── v1_aiimage.txt
│       ├── v1_productivity.txt
│       ├── v1_devtools.txt
│       ├── v1_nocode.txt
│       ├── v1_marketing.txt
│       └── archive/
│
├── database/
│   ├── schema.sql
│   └── models.py
│
├── website/                 # Next.js 14
│   ├── app/
│   │   ├── page.tsx             # homepage
│   │   ├── [category]/page.tsx  # category listing
│   │   ├── articles/[id]/page.tsx
│   │   └── api/og/route.tsx     # @vercel/og
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── Header.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── CategoryBadge.tsx
│   │   └── SearchBar.tsx
│   ├── data/vctr.db             # SQLite (Git-tracked)
│   └── lib/
│       ├── config.ts
│       └── db.ts
│
├── .github/workflows/daily-vctr.yml
├── config.yaml              # SSOT: categories · keywords · colors
├── CLAUDE.md                # this file
├── BRANDING.md              # brand identity
├── PROMPTS.md               # prompt version history
└── SESSION.md               # current work state
```

---

## Performance & cost targets

| Metric | Target |
|---|---|
| Pipeline runtime (6 categories MVP) | < 120s/day |
| LLM cost | < $0.20/day (~$6/month) |
| Image cost | $0 (Unsplash + OG auto-gen) |
| Total infra cost | $0 (excl. LLM) |
| JSON parse success rate | > 99% |
