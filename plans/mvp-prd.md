# Daily Brief MVP PRD

Last updated: 2026-03-20
Status: Drafted from `plans/mvp-architecture.md` + `PROGRESS.md` + current code audit

## Document Purpose

This document converts the current architecture intent into an execution-ready MVP product requirements document.

It exists to answer:

- what the MVP must do
- what is explicitly deferred
- what should be built first
- how real data reaches the current frontend
- how to test the product loop end to end

This document is intentionally opinionated. It favors the minimum architecture that gets the real product loop working without rebuilding the app.

## Step 0: Scope Challenge

Assumed review mode: `BIG CHANGE`

Reason:

- the request asked for a detailed review, a PRD-like artifact, and a task-by-task execution list
- a compressed review would lose the sequencing and dependency detail needed to implement the remaining MVP safely

### What already exists

Current code already partially solves several sub-problems and should be reused:

- Route shell already exists for `/today`, `/build`, `/topics`, `/insights/:insightId`
- `src/app/App.tsx` already owns shared app state and navigation handoff
- `src/components/cards/InsightCard.tsx` already renders the core insight card layout
- `src/components/modals/AddToBuildModal.tsx` already provides the main add-to-build interaction
- `src/pages/BuildQueuePage.tsx` already expresses the intended build queue UX
- `src/pages/TopicsPage.tsx` already expresses topic-first browsing
- `src/pages/InsightSharePage.tsx` already expresses the permalink page shape
- `src/components/audio/AudioPlayer.tsx` already expresses the audio entry point

### Minimum change set that achieves the goal

The minimum viable change set is:

1. Parse external Markdown into a normalized local data file.
2. Expand the TypeScript model to match the planned MVP contract.
3. Replace mock data on `/today`, `/topics`, and `/insights/:insightId` with parsed real data.
4. Persist personal build/learn state locally.
5. Read real audio metadata and playback URL from a manifest.

### Scope cuts that should remain deferred

The following work does not unblock the core objective and should stay deferred:

- backend API
- SQLite persistence
- full historical archive UI
- full-text search
- topic landing pages beyond filter UX
- auth or multi-user state
- poster generation, download, or link-copy analytics

### Complexity check

If implementation expands beyond the following without a new user decision, treat that as a smell:

- more than 8-10 touched product files in a single batch
- more than 2 new core data modules introduced at once
- adding both a backend service and a database before the frontend reads real data

Recommended architectural bias:

- reuse the current React shell
- add a local ingestion pipeline first
- defer backend/database work until local real-data MVP proves insufficient

## Product Summary

Daily Brief is a personal AI learning system for agent builders.

The MVP must help one user do four things every day:

1. listen to the brief quickly
2. scan the most important signals
3. decide what to build next
4. leave lightweight personal state about what was worth building or learning

Core loop:

`brief -> build -> learn -> reflect`

## Users and Jobs To Be Done

Primary user:

- a solo builder who follows AI and agent progress daily

Core jobs:

- when I only have 5 minutes, let me understand the most important signals fast
- when one signal matters, let me turn it into a concrete build idea
- when I revisit a topic, let me see what I already cared about
- when I am walking or commuting, let me consume the brief through audio

## Success Criteria

The MVP is successful when all of the following are true:

- the app loads real briefing content from external Markdown inputs
- `/today` shows a real daily audio card and real normalized insights
- `/topics` filters the same real insight set by topic
- `/insights/:insightId` renders a real permalink page from normalized data
- `/build` persists personal state across refreshes
- switching from one real date to another loads the correct daily content
- missing audio, malformed sections, and empty days fail visibly instead of silently

## NOT in Scope

- Full archive browsing UI beyond a lightweight recent-date switcher
  - rationale: not required to prove the daily loop
- Search
  - rationale: current dataset size does not justify it
- Backend API
  - rationale: Vite app can consume generated local JSON first
- SQLite in v1
  - rationale: adds migration and runtime complexity before the schema is validated
- User accounts or syncing
  - rationale: product is still single-user and local-first
- On-demand audio generation
  - rationale: audio is pre-generated upstream
- Topic enrichment pipeline or knowledge graph
  - rationale: filter-first UX is enough for MVP
- Share analytics or poster rendering
  - rationale: decorative value, not loop-critical

## Current State vs Target State

### Current state

- frontend-only Vite app
- mock insight list in `src/data/mockInsights.ts`
- mock audio metadata in `src/data/mockAudio.ts`
- build queue stored only in React memory
- share page, topics page, and right rail are partially presentational

### Target state

- generated local data files become the source of truth for the frontend
- UI surfaces consume normalized `Insight`, `DailyAudio`, and `InsightState`
- personal build/learn state persists locally across refreshes
- the app can render a real day with both RSS and X-derived signals

## Opinionated Architecture Recommendation

### Recommendation

Implement a local ingestion pipeline that reads external Markdown files and writes generated JSON files inside this repo. Keep the app frontend-only for MVP.

Why this over backend or SQLite first:

- minimal diff against the current codebase
- explicit and debuggable data flow
- easiest way to replace mocks without introducing network or runtime database complexity
- preserves the option to move to SQLite later once the schema is proven

### V1 system shape

```text
External briefing files
  ~/.openclaw/workspace/briefings/*.md
           |
           v
Parser modules
  - parseDailyBriefing()
  - parseXBriefing()
           |
           v
Normalizer
  - toInsight[]
  - toDailyAudio?
  - toDailyIndex
           |
           v
Generated local artifacts
  src/generated/briefings-index.json
  src/generated/briefings-by-date.json
  src/generated/audio-index.json
           |
           v
Frontend loaders
  - getBriefingByDate(date)
  - getInsightById(id)
  - getTopics()
           |
           v
React pages
  /today
  /topics
  /insights/:insightId
  /build
```

### Why generated JSON is the right first persistence layer

- Vite can import JSON directly
- failures are inspectable by opening generated files
- no API contract or async fetch layer is required yet
- parser work and UI wiring can proceed independently after the contract is defined

### Deferred migration path

If JSON becomes limiting, later migration should be:

`generated JSON -> SQLite cache -> optional API`

Not:

`mock UI -> backend -> DB -> parser`

## Data Contracts

The current `src/types/models.ts` is too thin and should be replaced or expanded to the following v1 model.

### `BriefingRecord`

```ts
type BriefingRecord = {
  id: string;
  date: string;
  sourceType: "rss" | "x";
  title: string;
  filePath: string;
  summaryTopline?: string;
  insightIds: string[];
};
```

### `Insight`

```ts
type Insight = {
  id: string;
  briefingId: string;
  date: string;
  sourceType: "rss" | "x";
  sourceLabel: string;
  sourceName?: string;
  sourceUrl?: string;
  title: string;
  summary: string;
  take: string;
  whyItMatters?: string;
  buildIdea?: string;
  learnGoal?: string;
  topics: string[];
  entities: string[];
  signalScore?: number;
  effortEstimate?: "30m" | "2h" | "weekend";
  isTopSignal: boolean;
};
```

### `DailyAudio`

```ts
type DailyAudio = {
  id: string;
  briefingDate: string;
  status: "pending" | "ready" | "failed";
  provider: "notebooklm" | "manual";
  title?: string;
  audioUrl?: string;
  durationSec?: number;
  transcript?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};
```

### `InsightState`

```ts
type InsightState = {
  insightId: string;
  status: "Inbox" | "Interested" | "Building" | "Learned" | "Archived";
  note?: string;
  personalTakeaway?: string;
  lastTouchedAt: string;
};
```

### `DailyBriefPageData`

```ts
type DailyBriefPageData = {
  date: string;
  availableDates: string[];
  briefings: BriefingRecord[];
  insights: Insight[];
  audio?: DailyAudio;
};
```

### Explicit schema decisions

- `Insight` is the primary UI object; `BriefingRecord` is metadata only
- `BuildItem` should not remain a first-class persisted model in v1
- `/build` should derive its list from `InsightState + Insight`
- `Interested` should exist as a real state even if the first UI does not emphasize it heavily
- `learnGoal` and `whyItMatters` should be first-class because the PRD and current UI intent already depend on them

## Input Assumptions

The upstream content already contains:

- summaries
- source links
- actionable takes
- key points
- signal scoring
- practical next actions

The parser batch must verify the exact section names and normalize them conservatively.

Parser rules:

- support both daily briefing and X briefing formats
- skip malformed sections instead of crashing the whole day
- log or emit parser warnings for missing required fields
- only produce an insight when `title` and `summary` can be recovered

## UX Requirements by Surface

## `/today`

Must show:

- the current selected date
- a real audio card for that date
- a date switcher with recent available dates
- a top-signals section
- a why-it-matters section
- a build-this-today section
- a learn-this-next section
- topic filters that operate on the same day dataset

Behavior:

- default to the most recent available date
- if a selected date has no audio, show `pending` or `failed` visibly
- if a selected date has no insights, show a clear empty state
- add-to-build must create or update `InsightState`
- share must navigate to the permalink for that insight

## `/topics`

Must show:

- the same real insight set, grouped or filtered by topic
- controlled topic chips
- a visible active filter state

Behavior:

- topics derive from normalized insights, constrained to the approved MVP topic list
- topic switching must not depend on the right rail only

## `/insights/:insightId`

Must show:

- title
- summary
- why it matters
- source link
- personal take / user takeaway
- build idea
- topic tags

Behavior:

- missing insight id returns a clear not-found state
- source links open the original source
- permalink pages use the generated normalized data, not route-derived mock memory

## `/build`

Must show:

- persisted items derived from `InsightState`
- status transitions
- skill focus / effort estimate / linked source insight
- editable note and personal takeaway in a later batch

Behavior:

- page survives refresh
- inbox and active groupings come from persisted state
- an item can be re-opened from build queue back into its insight page

## Audio

Must support:

- one audio record per day
- status `pending`, `ready`, `failed`
- real playback URL when ready

Must not support:

- generating audio on demand
- multiple variants
- custom prompt controls

## State and Storage Decisions

### Content storage

Use generated JSON under `src/generated/`.

Suggested files:

- `src/generated/briefings-index.json`
- `src/generated/briefings-by-date.json`
- `src/generated/audio-index.json`

### Personal state storage

Use browser `localStorage` for `InsightState`.

Why this is the right MVP choice:

- single-user product
- no backend yet
- enough to persist build and learning intent across refreshes
- smaller diff than introducing a database before content ingestion stabilizes

Suggested storage key:

- `daily-brief.insight-state.v1`

## Routing Recommendation

Keep the existing routes and avoid adding new top-level pages in the next batch.

Recommended additions:

- support `/today?date=YYYY-MM-DD` for date switching
- keep `/insights/:insightId`
- defer `/briefings/:date` until after real `/today` works

Reason:

- minimal diff
- no routing redesign required
- date switching can ship without a new page

## Data Flow Details

### Content ingestion flow

```text
Find latest candidate files
      |
      v
Classify by format
  - YYYY-MM-DD.md => rss daily brief
  - x_briefing_YYYY-MM-DD.md => x brief
      |
      v
Parse sections
      |
      +--> warnings[] for malformed or missing sections
      |
      v
Normalize into shared Insight schema
      |
      v
Merge by date
      |
      v
Write generated JSON
      |
      v
Frontend imports generated JSON
```

### Build-state flow

```text
User clicks "Add to Build"
      |
      v
Create or update InsightState
  status = Inbox
  lastTouchedAt = now
      |
      v
Persist to localStorage
      |
      v
/build derives visible cards from
  InsightState + Insight catalog
```

### Date selection flow

```text
App opens /today
      |
      v
Read availableDates from generated index
      |
      v
Select query param date if valid
Else fall back to latest available date
      |
      v
Render daily dataset + audio + topic filters
```

## Failure Modes

### New codepath failure review

| Codepath | Realistic failure mode | Test needed | Error handling needed | User-visible outcome |
| --- | --- | --- | --- | --- |
| external file discovery | expected briefing file missing | yes | yes | empty day state with warning copy |
| markdown parser | section header format changed | yes | yes | partial day with parser warning, not blank crash |
| normalizer | duplicate IDs across sources | yes | yes | deterministic ID strategy and collision guard |
| generated artifact write | malformed JSON or missing output file | yes | yes | build command fails loudly |
| frontend daily loader | selected date not found | yes | yes | fallback to latest date or not-found state |
| permalink lookup | stale insight id in URL | yes | yes | explicit insight-not-found card |
| localStorage load | corrupted stored state | yes | yes | reset invalid entries and continue |
| audio player | audio marked ready but URL missing | yes | yes | failed audio state, no fake progress |

### Critical gaps to avoid

The implementation must not ship with any flow that has:

- no test
- no error handling
- silent UI failure

The biggest risks are parser drift, missing generated files, and corrupted local state.

## Test Review

### Required test diagram

```text
1. Ingestion
   A. discover external markdown files
   B. parse rss briefing format
   C. parse x briefing format
   D. normalize into shared Insight schema
   E. write generated JSON artifacts

2. Runtime data loading
   A. select latest available date
   B. select explicit date from query param
   C. load insight by permalink id
   D. handle missing date / missing insight

3. User interactions
   A. add insight to build queue
   B. update build status
   C. keep state after refresh
   D. filter by topic
   E. switch recent date

4. Audio
   A. ready state renders playable control
   B. pending state renders non-playable placeholder
   C. failed state renders explicit message
```

### Recommended test layers

- parser and normalizer unit tests
- generated artifact writer tests
- state-store unit tests for localStorage corruption and upgrades
- React component/integration tests for loaders and empty states
- Playwright E2E for the main flow once real data reaches the UI

### Minimum acceptance test matrix

1. real RSS sample parses into at least one valid insight
2. real X sample parses into at least one valid insight
3. a day containing both sources renders on `/today`
4. switching date updates insights and audio together
5. adding an insight to build persists after refresh
6. permalink page renders the same insight after refresh
7. malformed audio metadata produces visible failed state

## Performance Review

Performance is not the primary MVP risk, but the plan should still avoid obvious waste.

Recommendations:

- parse files in a build step or explicit sync command, not on every render
- keep generated artifacts date-indexed so the app does not repeatedly re-scan everything at runtime
- derive topic views from in-memory normalized data, not repeated parsing
- keep localStorage payload scoped to personal state only, not full content data

Potential issues:

- loading a single giant JSON blob for all dates may become wasteful if the archive grows
- repeated route-level filtering is fine for MVP, but keep data loaders centralized

Opinionated recommendation:

- start with date-indexed generated JSON
- do not optimize further until the dataset actually becomes large enough to feel slow

## Implementation Plan

### Batch 1: Lock the data contract

Deliverables:

- real sample audit for both markdown formats
- parser-oriented field mapping
- final v1 normalized TypeScript model

Exit criteria:

- team can point to one agreed field contract for `Insight`, `DailyAudio`, and `InsightState`

### Batch 2: Build the ingestion pipeline

Deliverables:

- parser for RSS daily briefing
- parser for X briefing
- normalizer shared across both
- generated JSON output command

Exit criteria:

- one command writes valid generated data for at least one real date

### Batch 3: Replace mock content on `/today`

Deliverables:

- runtime loader for generated data
- real daily insights on `/today`
- real audio card state
- recent date switcher

Exit criteria:

- opening `/today` shows a real day with no mock imports

### Batch 4: Wire real data into `/topics` and `/insights/:insightId`

Deliverables:

- topic chips backed by normalized topics
- permalink page backed by normalized data
- source link, why-it-matters, build idea surfaced

Exit criteria:

- the same insight can be found from `/today`, `/topics`, and permalink

### Batch 5: Persist personal build state

Deliverables:

- localStorage-backed `InsightState`
- `/build` derived from persisted state
- status transitions and refresh persistence

Exit criteria:

- add-to-build and status updates survive refreshes

### Batch 6: Harden errors and tests

Deliverables:

- parser failure coverage
- missing-data UI coverage
- persisted-state corruption handling
- basic E2E flow coverage

Exit criteria:

- the core loop works and fails loudly

## Unresolved Decisions That May Bite Later

- exact upstream audio file location and URL mapping convention
- whether `learnGoal` should be parser-derived, heuristically generated, or optional when absent
- whether generated JSON should live under `src/generated/` or `public/generated/`

Recommended defaults if no new decision is made:

- audio uses a manifest with relative URL strings
- `learnGoal` is optional in parser output
- generated artifacts live under `src/generated/` for typed local imports

## Completion Summary

- Step 0: Scope Challenge (user intent interpreted as `BIG CHANGE`)
- Architecture Review: 4 major issues found
  - no real data path
  - current model too thin
  - build state modeled incorrectly for persistence
  - routing/date selection not yet aligned with real data
- Code Quality Review: 4 major issues found
  - mock data tightly coupled to pages
  - type drift between plan and code
  - presentational UI elements with no data contract
  - route-derived selected insight is too narrow for real loading
- Test Review: diagram produced, 8 required coverage areas identified
- Performance Review: 2 issues found
  - avoid runtime parsing
  - avoid oversized undifferentiated JSON blobs
- NOT in scope: written
- What already exists: written
- Failure modes: 0 critical gaps accepted; all must be covered before the batch is considered complete
