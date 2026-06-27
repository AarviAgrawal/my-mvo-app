# MadMix Insights Portal — Frontend Context Memory

> This file is a quick-reference for AI assistants and developers making changes to this project. It summarises every key architectural decision, data contract, and integration point without having to re-read every source file.

---

## What This App Is

An internal operations dashboard for **MadMix Snacks Ltd.** — a healthy millet snack brand. It tracks sales, PODs (Point-of-Distribution) availability, advertising spend efficiency, and customer survey feedback across 50+ Indian cities and 3 e-commerce platforms (Big Basket, Instamart, Amazon).

**Current state:** Frontend is 100% complete and working with static seed data in `localStorage`. The backend does not exist yet. See `backend/PLAN.md` and `backend/schema.sql` for the full plan.

---

## Stack

- React 19 + TypeScript
- Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`)
- Recharts 3 (charts) · Lucide React (icons) · Motion (animations)
- Fonts: Inter (body), Poppins (`font-display`), Fredoka (`font-fredoka`, brand wordmark)
- No React Router — manual `activeTab` string routing in `App.tsx`

---

## Brand Colors (`src/index.css` / Tailwind v4 `@theme`)

| Token | Hex |
|---|---|
| `brand-purple` | `#4A2466` |
| `brand-lavender` | `#BB9CC9` |
| `brand-lavender-tint` | `#DDCDE4` (page background) |
| `brand-near-black` | `#2A1B33` |
| `brand-white` | `#FFFFFF` |
| `brand-green` | `#22C55E` |
| `brand-amber` | `#F59E0B` |
| `brand-red` | `#EF4444` |

---

## File Structure (critical paths)

```
src/
├── types.ts                  ← ALL interfaces live here
├── App.tsx                   ← auth gate + routing + all global state
├── lib/data/
│   ├── index.ts              ← data access layer (every TODO = backend endpoint)
│   └── seed.ts               ← seed datasets + geo mappings + SKU list
├── pages/                    ← Auth, Dashboard, Explore, DecisionDetail,
│                                Shared, Saved, Completed, Import, Profile
└── components/
    ├── layout/AppShell.tsx   ← sidebar + mobile header + bottom nav
    ├── charts/DashboardCharts.tsx  ← 5 Recharts exports
    ├── decisions/            ← DecisionCard, EvidencePanel, RawDataTable, CityBreakdown
    ├── filters/FilterBar.tsx ← cascading dropdowns, mobile bottom sheet
    └── ui/ShareDialog.tsx    ← team share modal
```

---

## Core Types (`src/types.ts`)

```ts
Decision {
  id, action, type: 'grow'|'reduce'|'remove'|'monitor'|'spend',
  severity: 'low'|'medium'|'high', confidence: 0-100,
  flavour?, city?, state?, platform?,
  reasoning, evidence: EvidenceItem[], rawDataRefs: RawDataRef[], createdAt
}

PodsAvailability { city, platform, month: 'Apr 2026'|'May 2026', value: number }
SkuSales { sku, line, city, platform, salesMrp: number }
SalesSpends { date, platform, spend, sales, a2s: number }
SurveyResponse { id, submittedAt, state, city, pincode, commerce, flavour, line,
                 taste, repurchase, recommend, improvement, snackFrequency }
SharedAnalysis { id, sharedBy, sharedAt, note, title, filterScope, previewType, decisionId? }
UserProfile { name, email, avatar, watchedCities, watchedFlavours }
EvidenceItem { label, detail, source, trend?: 'up'|'down'|'flat' }
RawDataRef { source, rows: Record<string, string|number>[] }
```

---

## Routing (tabs in App.tsx)

| `activeTab` | Page |
|---|---|
| `home` | Dashboard |
| `explore` | Explore & Analyze (accepts `initialFilters` prop) |
| `shared` | Shared team feed |
| `saved` | Bookmarked decisions |
| `completed` | Completed decisions |
| `import` | Data import workshop |
| `profile` | User settings |
| `decision-detail` | Single decision drill-down (stores `previousTab` for back nav) |

---

## AnalysisFilters

```ts
{ state: string, city: string, pincode: string, platform: string, flavour: string }
```
This type is exported from `lib/data/index.ts` and drives all filtering across `getAnalysis()`, `getDecisions()`, and the FilterBar component.

---

## Data Access Layer (`src/lib/data/index.ts`) → Backend Map

Every function has a `TODO` comment. Replace body with API call:

| Function | Mock now | Replace with |
|---|---|---|
| `getHotCities()` | hardcoded array | FastAPI `GET /api/v1/hot-cities` |
| `getAnalysis(filters)` | in-memory aggregation | FastAPI `GET /api/v1/analysis` |
| `getDecisions(filters?)` | filter seed array | FastAPI `GET /api/v1/decisions` |
| `getDecisionById(id)` | seed array find | Supabase or FastAPI |
| `getSharedAnalyses()` | localStorage | Supabase `shared_analyses` SELECT |
| `shareAnalysis(...)` | localStorage push | Supabase `shared_analyses` INSERT |
| `getBookmarkedDecisionIds()` | localStorage | Supabase `saved_items` SELECT |
| `toggleBookmarkDecision(id)` | localStorage | Supabase upsert/delete |
| `getCompletedDecisionIds()` | localStorage | Supabase `completed_items` SELECT |
| `toggleCompletedDecision(id)` | localStorage | Supabase upsert/delete |
| `getUserProfile()` | localStorage | Supabase `profiles` SELECT |
| `updateUserProfile()` | localStorage | Supabase `profiles` UPDATE |
| `saveImportedData()` | localStorage | FastAPI bulk import |
| `clearImportedData()` | localStorage.removeItem | reset/flush endpoint |

### localStorage keys (current mock persistence)
`madmix_session_active`, `madmix_user_profile`, `madmix_bookmarks`, `madmix_completed_decisions`, `madmix_shared_analyses`, `madmix_imported_sku_sales`, `madmix_imported_pods_availability`, `madmix_imported_sales_spends`, `madmix_imported_survey_responses`, `madmix_imported_decisions`

---

## Geo Reference Data (`src/lib/data/seed.ts`)

- `STATE_CITY_MAPPING` — 19 Indian states → city arrays (drives FilterBar cascading)
- `CITY_PINCODES` — city → array of pincodes
- `RAW_CITY_DATA` — ~65 cities with `bb_apr`, `bb_may`, `im_apr`, `im_may` PODs values
- `SKUS` — 8 flavour names (keys of `FLAVOUR_LINE_MAPPING`)

---

## Seed Anomalies (intentional — used to trigger specific decisions)

| Anomaly | Decision |
|---|---|
| Ahmedabad BBQ Blast Instamart: 82% "Too spicy", sales near-zero | DEC-001 reduce |
| Surat Pizza Party Amazon: 100% negative, ₹6k revenue | DEC-002 remove |
| Bangalore Aloo Sev Big Basket: 97% "Loved it", ₹145k | DEC-003 grow |
| Instamart Week 3 Apr: A2S spikes to 77% (normal 25%) | DEC-004 spend |
| Surat Tangy Twist Instamart: 100% "Maybe" repurchase, flat sales | DEC-005 monitor |
| Mumbai Masala Masti Instamart: availability fell 94%→92% | DEC-006 grow |

---

## Backend Architecture Plan

**Hybrid:** Supabase (Postgres + Auth + RLS) + FastAPI on Render

- Auth: Supabase Auth → JWT → forwarded to FastAPI as `Authorization: Bearer <token>`
- CRUD (bookmarks, profile, shared analyses): Direct client → Supabase with RLS
- Analytics + Decisions Engine: Client → FastAPI → Supabase service role

**Decisions Engine pipeline:**
1. Deterministic rules (sales drop, survey complaints, A2S ratio thresholds)
2. Evidence row selection
3. Claude API call with strict JSON schema `{action, reasoning}`
4. Cache by `scope_hash` in `decisions` table (24h TTL)

**Schema file:** `backend/schema.sql` — 8 tables: `profiles`, `geo_reference`, `pods_availability`, `sku_sales`, `sales_spends`, `survey_responses`, `decisions`, `shared_analyses`

**Full backend plan:** `backend/PLAN.md`
**Full frontend docs:** `README.md`
