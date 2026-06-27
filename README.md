# MadMix Insights Portal — Frontend Documentation

> Internal operations and analytics dashboard for **MadMix Snacks Ltd.** — a healthy millet snack brand. Built to track sales, PODs (Point-of-Distribution) availability, ad-spend efficiency, and customer survey feedback across 50+ Indian cities and 3 e-commerce platforms.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Animation | Motion (Framer Motion) |
| Fonts | Inter (body), Poppins (headings), Fredoka (brand wordmark) |
| Storage | Browser `localStorage` (mock backend — to be replaced with Supabase + FastAPI) |

---

## Brand Design System

Defined in `src/index.css` as Tailwind CSS v4 `@theme` variables:

| Token | Hex | Usage |
|---|---|---|
| `brand-purple` | `#4A2466` | Primary CTA, nav active, headings |
| `brand-lavender` | `#BB9CC9` | Borders, passive indicators |
| `brand-lavender-tint` | `#DDCDE4` | Page background, card backgrounds |
| `brand-near-black` | `#2A1B33` | Body text |
| `brand-white` | `#FFFFFF` | Card surfaces |
| `brand-green` | `#22C55E` | Growth / positive signal |
| `brand-amber` | `#F59E0B` | Warnings / medium severity |
| `brand-red` | `#EF4444` | Critical / negative / remove |
| `brand-live` | `#25D366` | Live pulse indicator |

**Fonts:** `font-sans` = Inter · `font-display` = Poppins · `font-fredoka` = Fredoka

---

## Project File Structure

```
src/
├── App.tsx                          # Root: auth gate + routing + global state
├── main.tsx                         # React 19 entry point
├── types.ts                         # All TypeScript interfaces
├── index.css                        # Tailwind theme + global styles
│
├── pages/
│   ├── Auth.tsx                     # Login / Signup / Forgot password screens
│   ├── Dashboard.tsx                # Home: hot cities, hero KPIs, charts
│   ├── Explore.tsx                  # Filterable analytics workbench
│   ├── DecisionDetail.tsx           # Full-page view of a single decision
│   ├── Shared.tsx                   # Team collaboration feed
│   ├── Saved.tsx                    # Bookmarked decisions
│   ├── Completed.tsx                # Completed/executed decisions
│   ├── Import.tsx                   # CSV/JSON data import workshop
│   └── Profile.tsx                  # User profile + watchlists + notification settings
│
├── components/
│   ├── layout/
│   │   └── AppShell.tsx             # Sidebar (desktop) + top header + bottom nav (mobile)
│   ├── charts/
│   │   └── DashboardCharts.tsx      # All 5 Recharts chart components
│   ├── decisions/
│   │   ├── DecisionCard.tsx         # Reusable decision card with actions
│   │   ├── EvidencePanel.tsx        # Evidence items grid
│   │   ├── RawDataTable.tsx         # Ground-truth data tables
│   │   └── CityBreakdown.tsx        # City-level PODs breakdown widget
│   ├── filters/
│   │   └── FilterBar.tsx            # Cascading filter dropdowns (desktop + mobile sheet)
│   └── ui/
│       └── ShareDialog.tsx          # Modal for sharing a decision to the team feed
│
└── lib/
    └── data/
        ├── index.ts                 # Data access layer (all async functions + AnalysisFilters type)
        └── seed.ts                  # Static seed data arrays + geo mappings + SKU definitions
```

---

## Data Model (`src/types.ts`)

### Core Data Types

**`PodsAvailability`** — distribution coverage per city/platform/month
```ts
{ city, platform: 'Big Basket'|'Instamart'|'Amazon', month: 'Apr 2026'|'May 2026', value: number }
```

**`SkuSales`** — sales MRP per SKU per city/platform
```ts
{ sku, line, city, platform, salesMrp: number }
```

**`SalesSpends`** — daily advertising efficiency
```ts
{ date, platform, spend, sales, a2s: number }
```

**`SurveyResponse`** — customer feedback from packet QR scans
```ts
{ id, submittedAt, state, city, pincode, commerce, flavour, line, taste, repurchase, recommend, improvement, snackFrequency }
```

### Business Logic Types

**`Decision`** — a recommended business action
```ts
{
  id, action, type: 'grow'|'reduce'|'remove'|'monitor'|'spend',
  severity: 'low'|'medium'|'high', confidence: 0-100,
  flavour?, city?, state?, platform?,
  reasoning, evidence: EvidenceItem[], rawDataRefs: RawDataRef[],
  createdAt
}
```

**`EvidenceItem`** — a supporting data point for a decision
```ts
{ label, detail, source: 'PODs Sales'|'PODs Availability'|'Sales vs Spends'|'Customer Survey', trend?: 'up'|'down'|'flat' }
```

**`SharedAnalysis`** — a team collaboration post
```ts
{ id, sharedBy, sharedAt, note, title, filterScope: {state,city,pincode,platform,flavour}, previewType, decisionId? }
```

**`UserProfile`**
```ts
{ name, email, avatar, watchedCities: string[], watchedFlavours: string[] }
```

---

## Routing & Navigation

The app uses **manual tab-based routing** in `App.tsx` (no React Router). Navigation state is managed via `activeTab` string.

| Tab ID | Page | Description |
|---|---|---|
| `home` | `Dashboard` | KPI summary, hot cities, priority decisions |
| `explore` | `Explore` | Full analytics workbench with filter bar |
| `shared` | `Shared` | Team collaboration feed |
| `saved` | `Saved` | User's bookmarked decisions |
| `completed` | `Completed` | Marked-complete decisions |
| `import` | `Import` | CSV/JSON data importer |
| `profile` | `Profile` | User profile & settings |
| `decision-detail` | `DecisionDetail` | Drill-down for a single decision (pushes onto `previousTab`) |

### Navigation Flow
- `decision-detail` is an overlay tab; it stores `previousTab` so Back returns correctly.
- `Shared` → "Replicate Scope" → navigates to `explore` with pre-filled filters (or directly to `decision-detail`).
- `Dashboard` "Hot City" cards → navigate to `explore` with state+city pre-filled.
- `DecisionDetail` → "Open in Workbench" → navigates to `explore` with full filter scope.

---

## Global State (`App.tsx`)

All cross-page state lives at the App root and is passed down as props:

| State | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | Persisted in `localStorage` as `madmix_session_active` |
| `userProfile` | `UserProfile \| null` | Loaded from localStorage on login |
| `bookmarks` | `string[]` | Array of bookmarked Decision IDs |
| `completedDecisions` | `string[]` | Array of completed Decision IDs |
| `activeTab` | `string` | Current route |
| `previousTab` | `string` | Previous route (for detail-view back navigation) |
| `activeDecisionId` | `string` | ID of the decision being viewed in detail |
| `exploreFilters` | `AnalysisFilters` | Pre-set filters passed to `Explore` (enables "jump to city" flows) |
| `shareTarget` | `Decision \| null` | Decision being shared (drives `ShareDialog` global modal) |

---

## Data Access Layer (`src/lib/data/index.ts`)

All data functions are async and simulate network latency with `delay()`. Each is tagged with a `TODO` comment for Supabase replacement.

### `AnalysisFilters` interface
```ts
{ state: string, city: string, pincode: string, platform: string, flavour: string }
```

### Key Functions

| Function | Returns | Backend replacement |
|---|---|---|
| `getHotCities()` | Priority city list with sparklines | Supabase aggregates + joins |
| `getAnalysis(filters)` | Full analytics payload (charts, KPIs, survey summary) | FastAPI `/api/v1/analysis` |
| `getDecisions(filters?)` | Filtered `Decision[]` | FastAPI `/api/v1/decisions` |
| `getDecisionById(id)` | Single `Decision` | Supabase single-row query |
| `getSharedAnalyses()` | `SharedAnalysis[]` | Supabase `shared_analyses` table |
| `shareAnalysis(...)` | New `SharedAnalysis` | Supabase INSERT |
| `getBookmarkedDecisionIds()` | `string[]` | Supabase `saved_items` table |
| `toggleBookmarkDecision(id)` | `boolean` | Supabase upsert/delete |
| `getCompletedDecisionIds()` | `string[]` | Supabase `completed_items` table |
| `toggleCompletedDecision(id)` | `boolean` | Supabase upsert/delete |
| `getUserProfile()` | `UserProfile` | Supabase `profiles` table |
| `updateUserProfile(profile)` | `UserProfile` | Supabase UPDATE |
| `saveImportedData(type, data)` | `void` | FastAPI bulk import endpoint |
| `clearImportedData(type)` | `void` | Data reset endpoint |

### localStorage Keys
| Key | Data |
|---|---|
| `madmix_session_active` | `'true'` when authenticated |
| `madmix_user_profile` | Serialized `UserProfile` JSON |
| `madmix_bookmarks` | JSON array of bookmarked decision IDs |
| `madmix_completed_decisions` | JSON array of completed decision IDs |
| `madmix_shared_analyses` | JSON array of `SharedAnalysis` objects |
| `madmix_imported_sku_sales` | User-imported SKU sales rows |
| `madmix_imported_pods_availability` | User-imported availability rows |
| `madmix_imported_sales_spends` | User-imported sales/spends rows |
| `madmix_imported_survey_responses` | User-imported survey rows |
| `madmix_imported_decisions` | User-imported decision rows |

---

## Seed Data (`src/lib/data/seed.ts`)

Contains all hardcoded seed data and reference mappings:

- **`STATE_CITY_MAPPING`** — 19 states → cities (used for FilterBar cascading dropdowns)
- **`CITY_PINCODES`** — city → pincodes list (used in survey filtering)
- **`RAW_CITY_DATA`** — ~65 cities with Apr/May PODs values for Big Basket and Instamart
- **`SEED_PODS_AVAILABILITY`** — auto-generated from `RAW_CITY_DATA` including Amazon (at 35% of base)
- **`SEED_SKU_SALES`** — auto-generated from `RAW_CITY_DATA` using `SKU_DISTRIBUTION` fractions, with deliberate anomalies (Ahmedabad BBQ Blast = low, Surat Pizza Party = near-zero)
- **`SEED_SALES_SPENDS`** — 30 days of April 2026 data; Week 3 (Apr 15–21) has A2S spike to ~77% on Instamart
- **`SEED_SURVEY_RESPONSES`** — ~237 responses including 4 targeted groups:
  1. 28 Ahmedabad BBQ Blast/Instamart: "Too spicy", zero repurchase
  2. 35 Bangalore Aloo Sev/Big Basket: 97% "Loved it", all Promoters
  3. 6 Surat Pizza Party/Amazon: 100% "Didn't like it" (texture/packaging)
  4. 18 Surat Tangy Twist/Instamart: all "Maybe" repurchase
- **`SEED_DECISIONS`** — 6 pre-built decisions (DEC-001 to DEC-006) representing grow/reduce/remove/monitor/spend types

### SKUs / Flavours
- Aloo Sev Millet Bhujia (30% share)
- BBQ Blast Millet Bhujia (15%)
- Chaat Corner Quinoa Millet Puffs (12%)
- Masala Masti Bhujia (18%)
- Pudina Picnic Bhujia (8%)
- Tangy Twist Bhujia (10%)
- Pizza Party Quinoa Puffs (5%)
- Flavoured Raisins (2%)

---

## Pages In Detail

### Auth (`src/pages/Auth.tsx`)
Three-screen form: `login | signup | forgot`. No real auth — any email/password is accepted. Persists session in localStorage. Pre-fills `arghamjain.rj@gmail.com` / `password123`.

### Dashboard (`src/pages/Dashboard.tsx`)
On mount, fetches `getHotCities()`, `getDecisions()` (high+medium severity only, top 4), and `getAnalysis()` in parallel.

**Sections:**
1. Greeting banner (purple header with user's name + live timeline badge)
2. "Hot Cities" horizontal scroll strip — 4 city cards with SVG sparklines, click navigates to Explore with city filter
3. 12-column grid: left (7 cols) = DecisionCards, right (5 cols) = 4 KPI stat boxes + info callout
4. Two charts row: `SalesByPlatformChart` + `AvailabilityDeltaChart`

### Explore (`src/pages/Explore.tsx`)
The analytics workbench. Accepts `initialFilters` prop (set by Dashboard city clicks or Shared scope loads).

**Flow:**
- FilterBar on top (cascading state/city/platform/flavour dropdowns)
- Active scope badge showing current filters
- "Regenerate Actions" button triggers 2.8s animated pipeline simulation with step-by-step log messages (`ENGINE_MESSAGES`)
- Results: `CityBreakdown` widget (if city selected) + DecisionCards grid + charts grid
  - Left 8 cols: `SalesByFlavourChart` + `A2SOverTimeChart`
  - Right 4 cols: `TasteSentimentChart` + NPS bar + top complaint card + most-loved flavour card

### DecisionDetail (`src/pages/DecisionDetail.tsx`)
Full-page drill-down for one decision. Accessed from any `DecisionCard`'s "Full View" button.

**Sections:**
1. Back button + Complete/Bookmark/Share action bar
2. Hero card: severity badge, confidence score, action title, reasoning block, scope metadata chips
3. `EvidencePanel` — 2-col grid of evidence cards with source icon + trend badge
4. `RawDataTable` — one table per `rawDataRef` with formatted cells
5. Purple CTA banner: "Open in Workbench" → navigates to Explore pre-filtered

### Shared (`src/pages/Shared.tsx`)
Team feed. Loads `SharedAnalysis[]` from localStorage. Each post shows author, timestamp, title, note, scope tags, and a "Replicate Scope" button that navigates to Explore (or directly to DecisionDetail if `decisionId` is set).

### Saved / Completed (`src/pages/Saved.tsx`, `Completed.tsx`)
Filter the full decisions list by bookmarked/completed IDs and display as `DecisionCard` list. Empty state links back to Explore.

### Import (`src/pages/Import.tsx`)
5-panel data workshop. Supports CSV and JSON import (paste or file drag-and-drop) with live validation. Preview table shows first 5 rows. On commit, saves to localStorage (overrides seed data for that type). Each database type shows row count badge and a trash icon to revert to seed.

**Data types supported:** SKU Sales, PODs Availability, Sales & Spends, Customer Surveys, Recommended Actions

### Profile (`src/pages/Profile.tsx`)
Edit name, email, avatar URL. Comma-separated watched cities and flavours (used in future watchlist features). Notification toggles for Email and Slack (mocked state only). Logout button.

---

## Components In Detail

### `AppShell` (`components/layout/AppShell.tsx`)
Responsive shell:
- **Desktop (md+):** Fixed left sidebar (w-64, purple) with logo, nav items with badge counts, user card, logout button
- **Mobile:** Sticky top header bar + fixed bottom nav bar (7 icons)
- Nav items: Dashboard, Explore & Analyze, Shared Feed, Saved Actions (badge), Completed Actions (badge), Import Data, Team Profile

### `DecisionCard` (`components/decisions/DecisionCard.tsx`)
Reusable card with left-border accent color by type. Shows:
- Type badge (grow/reduce/remove/monitor/spend) + severity badge + confidence bar
- Action title (clickable) + reasoning text
- Scope chips (City, Platform, Flavour)
- Footer: Complete button, Bookmark button, Share button, Full View button
- Auto-inlined `EvidencePanel` + `RawDataTable`

### `FilterBar` (`components/filters/FilterBar.tsx`)
- Desktop: inline horizontal bar with 4 dropdowns (State, City, Platform, Flavour) + Apply/Clear buttons
- Mobile: compact toggle button → bottom sheet overlay
- Cascading logic: selecting State resets City and Pincode; selecting City resets Pincode
- Auto-applies on change for desktop; manual Apply for mobile

### `DashboardCharts` (`components/charts/DashboardCharts.tsx`)
Five Recharts components all sharing a `CustomTooltip` with brand typography:
1. `SalesByPlatformChart` — vertical bar, platform on X axis, sales MRP on Y
2. `AvailabilityDeltaChart` — vertical bar, delta (red=negative, purple=positive)
3. `SalesByFlavourChart` — horizontal bar, top 5 flavours
4. `TasteSentimentChart` — donut pie chart + legend
5. `A2SOverTimeChart` — dual-axis line chart (sales + spend on left, A2S% on right)

### `CityBreakdown` (`components/decisions/CityBreakdown.tsx`)
City intelligence card shown at top of Explore results when a city is selected. Computes from `RAW_CITY_DATA`:
- City rank by total May volume
- Priority score (0–100)
- BB and Instamart Apr→May delta with trend %
- Growth signal text + business risk text
- Two narrative recommendations (pro/con style)

### `EvidencePanel` (`components/decisions/EvidencePanel.tsx`)
2-column grid of evidence cards. Each card has source icon (Customer Survey / PODs / Sales / Spends) and trend badge (Up/Down/Flat).

### `RawDataTable` (`components/decisions/RawDataTable.tsx`)
One scrollable table per `RawDataRef`. Numbers > 1000 are formatted as `₹` with Indian locale. Column headers converted from `snake_case` to `Title Case`.

### `ShareDialog` (`components/ui/ShareDialog.tsx`)
Fixed modal. Fields: Title (pre-filled from decision action name), optional note textarea, team member multi-select (mocked roster of 4 people). On confirm → calls `shareAnalysis()` + navigates to Shared feed.

---

## Analytics Engine (`getAnalysis` in `lib/data/index.ts`)

The `getAnalysis(filters)` function performs all in-memory aggregation:

1. **Filter** — SkuSales, PodsAvailability, SurveyResponses by state→city→pincode, platform, flavour (in order of specificity)
2. **Compute KPIs:**
   - `totalSales` — sum of `salesMrp`
   - `totalSurveys` — count of filtered survey responses
   - `avgRepurchaseIntent` — % of "Definitely" + "Maybe" responses
   - `worstA2SPlatform` — Instamart vs Big Basket cumulative A2S ratio
3. **Build chart series:**
   - `salesByPlatform` — pie/bar series
   - `availabilityDelta` — Apr vs May per platform (avg across cities)
   - `salesByFlavour` — sorted descending
   - `tasteSentiment` — donut with color mapping
   - `repurchaseIntent` — bar series
   - `a2sOverTime` — daily line chart (or combined "Both" if no platform filter)
4. **Survey summary:**
   - `topComplaint` — most frequent improvement category
   - `promoterSplit` — Promoter/Passive/Detractor percentages
   - `mostLovedFlavour` — flavour with most "Loved it" votes

---

## Decision Filtering (`getDecisions` in `lib/data/index.ts`)

Decisions are filtered against the scope:
- **State filter:** Checks `decision.state` or derives state from `decision.city` via `STATE_CITY_MAPPING`
- **City filter:** Checks `decision.city` and infers state match
- **Platform filter:** Checks `decision.platform` (partial match OK if decision has no platform)
- **Flavour filter:** Exact match on `decision.flavour`; decisions with no flavour are excluded when flavour filter is set

---

## Authentication (Mock)

`Auth.tsx` shows three screens (`login`, `signup`, `forgot`). All submissions succeed after a 850ms delay. The session is stored as `localStorage.getItem('madmix_session_active') === 'true'`. `App.tsx` checks this on load to skip the auth screen.

**Backend replacement:** Replace with Supabase Auth SDK. The JWT token from Supabase needs to be forwarded as `Authorization: Bearer <token>` to FastAPI for analytical endpoints.

---

## Backend Integration Plan (See `backend/PLAN.md`)

The planned backend is a **hybrid architecture**:
- **Supabase (Postgres + Auth + RLS)** — for CRUD operations, auth, profiles, shared analyses, bookmarks
- **FastAPI on Render** — for heavy analytical aggregations, the rules-based Decisions Engine, and Claude AI phrasing

### Every `TODO` in `lib/data/index.ts` maps to a backend endpoint:

| Frontend function | Target backend |
|---|---|
| `getHotCities()` | `GET /api/v1/hot-cities` (FastAPI) |
| `getAnalysis(filters)` | `GET /api/v1/analysis?state=&city=...` (FastAPI) |
| `getDecisions(filters)` | `GET /api/v1/decisions` (FastAPI) |
| `getDecisionById(id)` | `GET /api/v1/decisions/{id}` or Supabase direct |
| `getSharedAnalyses()` | Supabase `shared_analyses` SELECT |
| `shareAnalysis(...)` | Supabase `shared_analyses` INSERT |
| `getBookmarkedDecisionIds()` | Supabase `saved_items` SELECT |
| `toggleBookmarkDecision(id)` | Supabase upsert/delete |
| `getCompletedDecisionIds()` | Supabase `completed_items` SELECT |
| `getUserProfile()` | Supabase `profiles` SELECT |
| `updateUserProfile()` | Supabase `profiles` UPDATE |

The Decisions Engine (FastAPI `engine.py`) uses Claude API to phrase rule-triggered findings as natural English actions, then caches results by `scope_hash` in the `decisions` table.

---

## Running Locally

```bash
npm install
# Set GEMINI_API_KEY in .env.local (currently unused by frontend — leftover from AI Studio)
npm run dev
# App runs at http://localhost:3000
```

Pre-filled credentials: `arghamjain.rj@gmail.com` / `password123`
