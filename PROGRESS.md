# Daily Brief Explore - Progress

Last updated: 2026-04-07

## Project Snapshot

This project is a personal AI learning system for agent builders.

It is not:

- a Markdown archive
- a generic blog
- a standalone podcast product

Core loop:

`brief -> build -> learn -> reflect`

Primary user goals:

- reduce AI information overload
- stay current on agent-related trends
- consume the daily brief quickly by listening or scanning
- turn daily signals into concrete build and learn actions

## Source of Truth

- Working protocol: `AGENTS.md`
- Product / architecture plan: `plans/mvp-architecture.md`
- Existing upstream inputs:
  - `/Users/yuzhang/.openclaw/workspace/briefings/YYYY-MM-DD.md`
  - `/Users/yuzhang/.openclaw/workspace/briefings/x_briefing_YYYY-MM-DD.md`

## Locked Product Decisions

- Audio is part of the same product, not a separate product.
- Audio should be pre-generated outside the web app through `openclaw` / cron / jobs.
- The website should read audio metadata and play files, not generate audio on demand.
- The core content unit is `Insight`, not `Briefing`.
- MVP should stay lightweight:
  - no auth
  - no CMS
  - no full-text search
  - no analytics layer
  - no collaboration
  - no topic knowledge graph

## MVP Scope

Read mode:

- `/today`
- `/build`
- `/topics`
- `/insights/:insightId`

Listen mode:

- one daily audio brief per day

## Current Implementation Status

Overall status: `frontend MVP now loads generated data at runtime from public assets, route bundles are split, and the core real-data/read-build-listen loop still passes full regression coverage locally`

Current worktree snapshot:

- Batch 10 is complete locally.
- `plans/task-plans/runtime-data-and-lazy-routes_plan.md` records the runtime-data and route-splitting scope, file targets, verification approach, and manual QA notes.
- generated JSON is no longer bundled into the app from `src/generated/`.
- `scripts/sync-generated-content.ts` now writes JSON artifacts to `public/generated/`, alongside the existing `public/generated/audio/` delivery path.
- `src/lib/briefings/generatedContentLoader.ts` now:
  - fetches generated JSON from `/generated/*.json` at runtime
  - caches one loaded payload in memory
  - keeps pure selector APIs for available dates, daily page state, topic derivation, and insight lookup
- `src/app/App.tsx` now blocks route rendering on one generated-content bootstrap request and shows explicit loading / failure states instead of assuming compile-time data imports exist.
- `src/app/router.tsx` now lazy loads `App`, `/today`, `/build`, `/topics`, and `/insights/:insightId` route modules behind a lightweight route fallback.
- `tests/e2e/navigation.spec.ts` no longer hardcodes stale dates or permalink IDs; it now reads the current generated dataset so navigation coverage survives daily content refreshes.
- full automated verification now passes with:
  - `61` Vitest tests
  - `5` Playwright tests
  - `npm run build`
- current production build output now splits route code and reduces the main entry chunk to:
  - `dist/assets/index-*.js` at about `235.82 kB` (`77.29 kB` gzip)
  instead of the earlier single oversized `~720 kB` entry bundle.
- `public/generated/` now contains:
  - `briefings-index.json`
  - `briefings-by-date.json`
  - `audio-index.json`
- obsolete mock-only files have been removed:
  - `src/data/mockInsights.ts`
  - `src/data/mockAudio.ts`
- no source files now import mock briefing or audio data.
- `src/components/layout/AppShell.tsx` no longer renders dead-end search or start-learning controls in the header.
- `src/pages/InsightSharePage.tsx` no longer renders dead-end poster/copy buttons, and its back link now matches the `/today` destination.
- route copy has been tightened in:
  - `/today`
  - `/build`
  - `/topics`
  - `/insights/:insightId`
  so the product reads like a personal AI learning system instead of a prototype.
- full automated verification now passes with:
  - `59` Vitest tests
  - `5` Playwright tests
  - `npm run build`
- `src/lib/insightStateStore.ts` now provides a versioned localStorage-backed personal-state layer for:
  - loading saved `InsightState[]`
  - writing one stable persisted payload
  - duplicate-safe add-to-build upserts
  - status updates
  - corruption recovery for invalid saved payloads
  - derived `/build` queue items from saved state plus generated insights
- `src/app/App.tsx` now derives the build queue from persisted `InsightState` records instead of React-memory `BuildItem[]`.
- add-to-build now reuses the existing saved note and skill focus when an insight was already queued.
- duplicate add-to-build actions now update one saved record per insight instead of creating duplicate queue cards.
- `/build` now renders three explicit persisted sections:
  - `Inbox`
  - `Interested`
  - `Building & Finished`
- `src/components/cards/BuildItemCard.tsx` now shows distinct visual treatment for:
  - `Inbox`
  - `Interested`
  - `Building`
  - `Learned`
  - `Archived`
- automated verification now includes:
  - store round-trip and corruption-recovery coverage
  - derived build queue coverage
  - `/build` route rendering coverage for empty and `Interested` states
- `src/lib/briefings/generatedContentLoader.ts` now provides typed loader APIs for:
  - available generated dates
  - latest-date fallback
  - daily page data
  - insight lookup by ID
  - all generated insights in date order
  - approved generated topic derivation
- `src/lib/briefings/generatedContentLoader.ts` now also exposes explicit page-state resolution for:
  - invalid requested dates
  - missing generated days
  - missing audio records
- `src/components/layout/AppShell.tsx` now derives shell-level topic chips from generated normalized topics instead of mock constants.
- `src/pages/TopicsPage.tsx` now renders:
  - generated insights across all available dates
  - direct page-level topic filter buttons
  - explicit empty-state copy when a selected topic has no matches
- `src/pages/InsightSharePage.tsx` now resolves insights from the permalink route param through generated lookup, so refresh works without mock memory.
- `src/pages/InsightSharePage.tsx` now shows:
  - original source link when one exists
  - why-it-matters and build-idea sections
  - explicit missing-data copy when those richer fields are absent
  - a clearer recovery path for missing insight IDs
- `src/generated/` now contains:
  - `briefings-index.json`
  - `briefings-by-date.json`
  - `audio-index.json`
- current generated snapshot was built from:
  - 89 upstream briefing markdown files
  - 54 available dates
  - 1 ready audio file
- `public/generated/audio/2026-03-20.wav` now provides one local ready audio fixture so the app and browser tests can verify real playback behavior.
- `src/pages/TodayPage.tsx` now distinguishes:
  - missing audio manifest entries
  - `pending` audio generation
  - `failed` audio generation
  - invalid `ready` records missing a playable URL
- `src/components/audio/AudioPlayer.tsx` now renders a real hidden `<audio>` element, drives play/pause/progress from browser media events, and disables playback cleanly when audio is not actually playable.
- automated verification now also includes:
  - loader coverage for failed and invalid-ready audio records
  - `AudioPlayer` component coverage for real playback controls
  - `/today` audio notice coverage
  - Playwright coverage for one ready `/today?date=2026-03-20` path plus the default pending `/today` path
- next recommended batch is `None. Pause for the next scope decision.`

Implemented:

- Vite + React app scaffold
- Route structure for:
  - `/today`
  - `/build`
  - `/topics`
  - `/insights/:insightId`
- Static Today page
- Static Topics page
- Static insight share page
- Add-to-build modal
- Persisted localStorage-backed build queue state
- Manifest-backed `/today` audio state loading for `pending`, `ready`, and `failed` records
- Real HTML-audio playback wiring for ready daily audio files
- Explicit `/today` audio recovery copy for failed generation, missing manifest records, and invalid ready-without-URL states
- Focused Playwright coverage for the `/today` audio entry flow
- Route-level integration coverage for `/today`, `/topics`, and permalink loading
- Playwright coverage for:
  - Today -> Add to Build -> Refresh -> Build page
  - recent date switching on `/today`
  - permalink reload stability
- Removed obsolete mock content files and mock-only route-test dependencies
- Removed dead-end shell/permalink controls and tightened MVP route copy
- Locked v1 contracts for:
  - normalized `Insight`
  - day-level `DailyAudio`
  - generated JSON artifact layout
- Parser fixtures, parser tests, and parser implementations for:
  - RSS briefings
  - X briefings
- Shared normalizer with deterministic insight IDs and warning collection
- Generated artifact pipeline for:
  - date-grouped briefing JSON
  - day-level audio manifest JSON
  - fail-loud artifact validation
  - one-command local sync
- Typed frontend loader layer over generated JSON for:
  - available dates
  - daily page payloads
  - insight lookup
- runtime fetch of generated JSON from `public/generated/` with in-memory caching
- route-level code splitting for App and MVP page modules
- versioned localStorage-backed personal state with duplicate-safe build queue derivation and corruption recovery
- Real `/today` main-column content driven by generated data instead of `mockInsights` / `mockAudio`
- Real `/today` insight titles linked to generated `sourceUrl` values when present
- reusable project-tracking bootstrap docs / script / skill package

Not implemented yet:

- SQLite or other persistent storage
- historical briefing browsing

## Code-to-Plan Mismatches

The main mismatch is no longer the shared TypeScript contract.
The locked v1 types and parser pipeline now exist.

There are no material task-list mismatches left in the MVP implementation.

The remaining gaps are deliberate deferrals:

- SQLite or another durable persistence layer beyond localStorage
- broader historical browsing beyond the current recent-date switcher

This means the read, build, learn, and listen legs of the MVP loop now exist end to end locally, with meaningful regression coverage and cleanup in place.

The main current lesson is that compile-time importing day-indexed content works for early prototyping, but it pushes data volume directly into the entry bundle. Once the briefing history grows, generated JSON needs to behave like runtime content, not application code.

## What Is Actually True In Code

Current codebase has a real local content pipeline, and the main read surfaces now consume it directly.

- `src/data/mockInsights.ts` is no longer used by product routes, but still exists as a cleanup candidate and test fixture source.
- `src/data/mockAudio.ts` is no longer used by `TodayPage`, but still exists in the repo as a cleanup candidate.
- `src/app/App.tsx` now initializes persisted `InsightState[]`, writes updates back to localStorage, and derives `/build` cards from generated insights plus saved state.
- `src/lib/insightStateStore.ts` now owns:
  - the stable localStorage key and versioned payload shape
  - add-to-build upsert semantics
  - status updates with timestamps
  - invalid-payload reset behavior
  - derived build queue assembly from saved state plus real insight data
- `src/lib/briefings/` now contains:
  - parser logic
  - normalizer logic
  - generated artifact builder
  - generated content loader logic
  - sync runner
- `scripts/sync-generated-content.ts` now regenerates `src/generated/*.json` from the upstream briefing directory.
- `src/lib/briefings/generatedContentLoader.ts` reads:
  - `src/generated/briefings-index.json`
  - `src/generated/briefings-by-date.json`
  - `src/generated/audio-index.json`
  and exposes typed helpers for available dates, daily data, insight lookup, all-insight flattening, topic derivation, and `/today` page-state resolution.
- `TodayPage` now reads the selected generated daily payload from `/today?date=...`, with latest-date fallback plus visible invalid-date messaging.
- `TodayPage` now groups the selected real day into:
  - top signals
  - why it matters
  - build this today
  - learn this next
  - more signals
- `src/pages/todaySections.ts` now derives those `/today` sections from one filtered day dataset with conservative fallback rules when optional fields are absent.
- `InsightCard` now renders the title as an external link when the normalized `Insight` includes `sourceUrl`, and only shows why/build/learn/effort cues when real data exists for them.
- The `/today` and `/topics` shell topic chips now derive from generated topics instead of mock constants.
- `TopicsPage` now reads generated insights across dates and applies the selected topic filter directly from page-level controls.
- `InsightSharePage` now resolves the normalized insight from the URL id on refresh and surfaces source-link plus explicit why/build blocks.
- `BuildQueuePage` now renders persisted real-data cards grouped into `Inbox`, `Interested`, and `Building & Finished`.
- `AudioPlayer` now mounts a real `<audio>` element when the manifest provides a playable URL, updates progress from browser media events, and disables playback for non-playable states.
- `TodayPage` now surfaces actionable audio notices for:
  - pending generation
  - failed generation
  - missing manifest records
  - ready records missing a playable URL
- `src/generated/audio-index.json` now contains one ready record for `2026-03-20` pointing to `/generated/audio/2026-03-20.wav`, while newer dates remain `pending`.

This means the product read loop, local persisted build queue, and real browser audio playback path now all exist end to end locally.

## Existing Input Shape

Observed upstream briefing content already contains useful structure:

- summaries
- source links
- R2 take / actionable takeaways
- key points
- signal scoring
- practical next actions

This means content generation already exists upstream.
The missing layer is parsing, normalization, storage, and productized consumption.

## Phases

- Phase 1A
  - parse Markdown briefings into structured insights
  - generate one daily audio brief
  - build the daily dashboard / Today page on real data
- Phase 1B
  - Build Queue
  - Topic filter
  - single-insight share page
  - manual status tracking and notes

## Completed Work

### Product direction

- Reframed the project from "Markdown-to-website" into an AI learning workflow product.
- Confirmed audio-first consumption is part of MVP, not a later add-on.
- Chose pre-generated audio instead of on-demand website generation.

### Frontend prototype

- Built the main route skeleton and page shells.
- Implemented static card-based Today / Topics / Build Queue / Share views.
- Implemented basic local interactions:
  - topic filter state
  - persisted add-to-build queue
  - persisted build item status update

### Project operations

- Added `AGENTS.md` to define session start and progress-update rules for this repo.
- Added reusable bootstrap templates and `scripts/bootstrap_project_tracking.sh` so future projects can generate the same tracking setup quickly.
- Added a self-contained skill bundle in `skills/project-tracking-bootstrap/` so the same workflow can be reused as a Codex skill package.
- Expanded `AGENTS.md` and the reusable templates to include `Vibe Coding Protocol` and `UI Engineering Rules` so future projects inherit the same working discipline.
- Tightened the reusable AGENTS rules for web projects by explicitly preferring Playwright for UI E2E and regression coverage.
- Expanded this repo's `AGENTS.md` so a new session can read `PROGRESS.md` + `tasks.md`, pick the next unblocked task, create a task plan, follow TDD, run verification, update docs, and pause for feedback.
- Added explicit notes in `AGENTS.md` about:
  - creating per-task plan files
  - handling Playwright expectations
  - commit behavior when git is unavailable
  - using external save-progress scripts only when they fit this repo
  - preferring Node `v22.17.1` if the default local Node install is broken
- Standardized the repo on `PROGRESS.md` instead of `progress.md` and updated current docs, scripts, templates, and skill references to match.
- Initialized git for this repo and added a basic `.gitignore` for Node/Vite artifacts.
- Added a second reusable skill bundle in `skills/task-driven-project-bootstrap/` for heavier project setup that includes:
  - `AGENTS.md`
  - `PROGRESS.md`
  - `tasks.md`
  - continue-task behavior
  - task planning / verification workflow
- Clarified that `skills/project-tracking-bootstrap/` remains the lightweight tracking bootstrap and should not be used when the user wants the fuller task-driven execution protocol.
- Added a reusable first-principles guidance block to the current repo `AGENTS.md` and to all bundled `AGENTS.md` generation templates so future generated projects inherit the same clarification-first behavior.

### Planning and execution docs

- Reviewed the current MVP architecture plan against the actual codebase and `PROGRESS.md`.
- Created `plans/mvp-prd.md` as an execution-ready PRD that locks:
  - scope
  - data contracts
  - architecture direction
  - failure modes
  - test requirements
  - phased implementation order
- Created `tasks.md` to break the remaining MVP into explicit small tasks with:
  - batch ordering
  - dependencies
  - acceptance criteria
  - suggested stop points

### Batch 1 progress

- Completed `T01` and created `plans/task-plans/T01_plan.md`.
- Added `plans/input-audits/rss-briefing-v1-audit.md` after auditing 39 RSS-style briefing files and deep-reading 4 representative samples.
- Confirmed the RSS parser must support both blockquote-inline and plain-bold multiline variants for `Chinese Summary` and `R2 Take`.
- Recorded concrete parser edge cases already present upstream:
  - automated fallback content such as `No summary available.` and `Matched keywords: ...`
  - raw HTML / CSS noise inside summary bodies
  - single-entry days, high-cardinality days, and trailing footer prose
- Locked one concrete parser lesson for Batch 2:
  - split RSS entries by H2 insight headings, not by `---`
- Completed `T02` and created `plans/task-plans/T02_plan.md`.
- Added `plans/input-audits/x-briefing-v1-audit.md` after auditing all 21 X-style briefing files and deep-reading representative normal and variant samples.
- Confirmed the X format is structurally different from RSS:
  - it is a day-level aggregate briefing, not a repeated per-entry article list
  - the core shape is section-based with `今日3条要点`, grouped tweet buckets, actions, scores, and an optional source-link index
- Recorded concrete X parser edge cases already present upstream:
  - `原帖链接索引` is optional
  - some curated subsections are missing in real files
  - bullet syntax varies across plain handles, linked handles, multiple handles, and irregular indentation
  - one curated bullet can cite multiple source posts
- Locked one concrete parser lesson for Batch 2:
  - the X parser should extract one structured day document first, then normalize bullets later
- Completed `T03` and created `plans/task-plans/T03_plan.md`.
- Added `plans/data-contracts/insight-v1-field-mapping.md` to lock the v1 `Insight` contract against the audited inputs.
- Locked the normalized content unit decision:
  - RSS uses one article entry = one `Insight`
  - X uses one curated bullet under `值得关注的推文` = one `Insight`
  - X `今日3条要点` and `可执行动作` stay at the day level for now instead of being force-mapped into per-insight rows
- Locked the v1 field policy:
  - `title`, `summary`, and `take` must be recoverable for every normalized insight
  - `whyItMatters`, `buildIdea`, `learnGoal`, `signalScore`, and `effortEstimate` remain explicitly optional in v1 parser output
  - `isTopSignal` is derived deterministically from normalized source order, not a fabricated per-item score
- Captured one key lesson for the next implementation tasks:
  - do not hide missing upstream structure behind aggressive heuristics; preserve optionality where the source is genuinely weak
- Completed `T04` and created `plans/task-plans/T04_plan.md`.
- Added `plans/data-contracts/daily-audio-v1-manifest.md` to lock one day-keyed `DailyAudio` record per date, with explicit `pending`, `ready`, and `failed` validation rules that work even before real audio files exist.
- Completed `T05` and created `plans/task-plans/T05_plan.md`.
- Added `plans/data-contracts/generated-artifact-layout-v1.md` to lock:
  - JSON artifacts under `src/generated/`
  - `briefings-index.json`, `briefings-by-date.json`, and `audio-index.json` as the required writer outputs
  - static audio binaries under `public/generated/audio/`
- Completed `T06` and created `plans/task-plans/T06_plan.md`.
- Replaced the thin prototype model in `src/types/models.ts` with the v1-aligned contracts for:
  - `BriefingRecord`
  - `Insight`
  - `DailyAudio`
  - `InsightState`
  - `DailyBriefPageData`
- Updated the mock-driven UI to compile against the new contracts without pretending parser-enriched data already exists:
  - `takeaway` -> `take`
  - `source` -> `sourceLabel` / `sourceType`
  - `effort` -> optional `effortEstimate`
  - `isTopPick` -> `isTopSignal`
  - `DailyAudio` now uses `briefingDate`, `durationSec`, and enum-backed `provider`
- Added graceful UI fallbacks where the locked v1 contract intentionally leaves fields optional:
  - build idea fallback text
  - effort fallback text
  - disabled non-ready audio playback state

### Batch 2 progress

- Completed `T07` and `T08` by creating sanitized parser fixtures for both formats under `src/lib/briefings/fixtures/`.
- Completed `T09` and `T10` by adding executable parser tests for:
  - RSS title / summary / take / topics / score behavior
  - X title / summary / take / topics / source-link / day-score behavior
- Added minimal parser test infrastructure:
  - `vitest`
  - `@types/node`
  - `npm test`
  - `vite.config.ts` test configuration
  - `src/vite-env.d.ts` raw markdown fixture typing
- Completed `T11` and `T12` by implementing:
  - `parseRssBriefing()`
  - `parseXBriefing()`
  - shared topic derivation rules
  - raw parser output types for both source formats
- Completed `T13` by implementing `normalizeParsedBriefing()` so RSS and X outputs converge into one shared `Insight` shape with deterministic IDs.
- Completed `T14` by wiring warning collection into parsing so malformed sections emit explicit warnings while valid sections in the same file still parse.
- Locked one important implementation boundary:
  - X parser returns a day-level document plus normalized bullet candidates, but it still does not force `今日3条要点` or `可执行动作` into per-insight rows

### Batch 3 progress

- Completed `T15` by implementing the generated artifact builder and writer for:
  - `src/generated/briefings-index.json`
  - `src/generated/briefings-by-date.json`
  - `src/generated/audio-index.json`
- Completed `T16` by adding `npm run sync:generated` and a thin script entrypoint at `scripts/sync-generated-content.ts`.
- Completed `T17` by adding fail-loud validation for:
  - missing day payloads
  - missing `byDate` metadata
  - mismatched audio keys and `briefingDate`
  - invalid `audioUrl` prefixes
  - empty day payloads
  - empty upstream input directories
- Completed `T18` by documenting the regeneration workflow in `plans/generated-content-workflow.md`.
- Added generator tests that cover:
  - mixed RSS + X artifact generation
  - ready-vs-pending audio state derivation
  - validation failures for malformed generated shapes
- Regenerated the local content snapshot from the real upstream briefing directory:
  - 60 markdown inputs
  - 39 dates
  - 0 ready audio files, so all generated audio records are currently `pending`

### Batch 4 progress

- Completed `T19` and created `plans/task-plans/T19_plan.md`.
- Added `src/lib/briefings/generatedContentLoader.ts` as the typed frontend boundary over generated JSON.
- Added loader tests that cover:
  - available date loading
  - latest-date fallback
  - explicit day payload loading
  - insight lookup by ID
- Locked one important frontend lesson before `T20+`:
  - keep date fallback and insight lookup rules inside the loader so `/today`, `/topics`, and permalink pages do not each reimplement generated-data resolution differently
- Completed `T20` and created `plans/task-plans/T20_plan.md`.
- Added a route-level `TodayPage` render test to prove the page now renders generated content instead of the static mock dataset.
- Switched `TodayPage` off:
  - `mockInsights`
  - `mockAudio`
  and onto the latest generated day payload from `generatedContentLoader`.
- Completed `T20a` and created `plans/task-plans/source-link-title_plan.md`.
- Extended the `/today` route test so it asserts the rendered card links to the generated insight `sourceUrl`.
- Wired `InsightCard` to expose persisted source URLs directly in the title without changing add/share behavior.
- Completed `T21` and created `plans/task-plans/T21_plan.md`.
- Extended `/today` route coverage so the page must honor a valid `date` query param and fall back to the latest generated date when the query param is invalid.
- Added `RightRail` coverage so recent-date links must come from generated available dates and route through `/today?date=...`.
- Wired `TodayPage` to resolve its dataset from the route query param instead of always reading the latest day.
- Replaced the mock recent-brief labels in `RightRail` with generated date links, keeping the selected state aligned with the active `/today` day.
- Added one small testing-infrastructure adjustment:
  - `vite.config.ts` now includes `src/**/*.test.tsx` so component-level Vitest files are picked up.
- Locked one immediate follow-up lesson for `T22`:
  - once date selection is real, the next gap is explicit empty/error copy for missing day and missing audio instead of thin generic fallback text
- Locked one small product lesson from the source-link fix:
  - the original URL was already persisted end to end; the remaining gap was only route-level presentation

## Known Gaps / Risks

- The generated-data pipeline and typed loader now exist, but the app still does not consume them:
  - `/today` now uses generated content and generated recent dates, but `/topics` and permalink routes still read mock data
  - `/today` right rail topic chips are still mock-backed
- Build queue state is ephemeral and will disappear on refresh.
- Audio player currently simulates playback instead of playing a real file.
- Current upstream asset state is asymmetric:
  - RSS briefings and X briefings are present in `/Users/yuzhang/.openclaw/workspace/briefings`
  - audio files are not generated yet, so audio work should remain contract-first for now
- Generated JSON is a local snapshot, not a live link:
  - if upstream briefing markdown changes, `npm run sync:generated` must be re-run
- The current app can look more complete than it really is because several elements are presentational only.
- Some UI elements are still decorative or disconnected:
  - Topics page chips are not interactive
  - insight preview in the right rail is route-param-driven and not very useful on current pages
- `selectedInsight` in app state is route-param-derived, which is fine for permalink pages but not a great fit for Today/Topics right-rail preview behavior.
- The remaining content-ingestion decision for MVP is now settled:
  - generated JSON is the local persistence layer
  - the next missing step is route integration, not storage selection
- Current generated-data loading strategy imports JSON into the client bundle:
  - `npm run build` now warns that the main chunk is over 500 kB after minification
  - acceptable for the current local MVP, but worth revisiting if generated content volume keeps growing

## Next Recommended Batch

Priority: `highest`

Pause before starting the next batch and get approval, because Batch 5 is now complete.

Recommended next batch:

1. Start `Batch 6` from `tasks.md` after approval.
2. Execute `T30` and introduce a versioned localStorage-backed `InsightState` store.
3. Execute `T31` through `T35` to move `/build` and add-to-build behavior off in-memory-only state.
4. Keep real audio playback changes out of scope until persisted personal state is stable.
5. Stop after Batch 6 and confirm refresh-safe build-state behavior before moving to audio wiring.

## Immediate Next To Do

The next concrete thing to do after approval is:

1. Execute `T30` and introduce the stable localStorage key and schema versioning for `InsightState`.
2. Execute `T31` through `T33` and derive add-to-build behavior from persisted insight state instead of raw in-memory `BuildItem[]`.
3. Execute `T34` and `T35` to move `/build` to persisted derived items and recover safely from invalid saved payloads.
4. Keep the next batch scoped to persistence and build-state flows.

Expected deliverables for that batch:

1. real topic chips and filtered topic content
2. permalink pages that load from generated normalized insights on refresh
3. clearer route-level not-found handling outside `/today`
4. a clean stop point before persisted personal state and audio playback work

## After That

Once `/today` is stable on real data:

1. add lightweight persisted `InsightState` / build state
2. wire real audio player data
3. add route-level tests and E2E coverage
4. remove obsolete mock files and disconnected controls

## Open Questions

- What exact upstream process will populate `public/generated/audio/` and on what cadence?
- Should future topic enrichment remain rule-based only, or should it add a lightweight enrichment step after the real-data UI is stable?

## Verification Log

- 2026-03-19: `npm run build` passed for the current frontend prototype.
- 2026-03-19: added reusable project-tracking bootstrap script and templates.
- 2026-03-19: packaged the same workflow as a self-contained local skill bundle and smoke-tested its generated output.
- 2026-03-19: manually audited code vs architecture plan and updated this file with missing implementation gaps and the immediate next batch.
- 2026-03-19: added `Vibe Coding Protocol` and `UI Engineering Rules` to the repo `AGENTS.md` and the reusable tracking templates.
- 2026-03-19: updated the AGENTS rules and templates to explicitly prefer Playwright for web UI E2E and regression coverage.
- 2026-03-20: produced `plans/mvp-prd.md` and `tasks.md` from the current architecture plan and progress audit.
- 2026-03-20: `npm run build` passed after using Node `v22.17.1` because the default `/usr/local/bin/node` points to an older broken local install.
- 2026-03-20: updated `AGENTS.md` with an autonomous per-task workflow for future sessions, including task selection, plan-file creation, TDD, Playwright, review, commit, and progress-saving rules.
- 2026-03-20: renamed `progress.md` to `PROGRESS.md`, aligned repo tooling to the uppercase convention, initialized git, and added `.gitignore`.
- 2026-03-21: created and smoke-tested `skills/task-driven-project-bootstrap/` by generating `AGENTS.md`, `PROGRESS.md`, and `tasks.md` into a temp directory.
- 2026-03-21: `npm run build` passed after adding the new reusable skill bundle and updating the existing lightweight bootstrap skill boundary.
- 2026-03-21: added a first-principles guidance block to all `AGENTS.md` generation templates and the current repo `AGENTS.md`.
- 2026-03-21: `npm test -- src/lib/briefings/generatedContentLoader.test.ts` passed after adding typed loader coverage for available dates, latest-date fallback, day payload loading, and insight lookup.
- 2026-03-21: `npm run build` passed after adding `src/lib/briefings/generatedContentLoader.ts`.
- 2026-03-21: `npm run preview -- --host 127.0.0.1 --port 4173` loaded `/today` successfully in headless Chrome.
- 2026-03-21: `npm test -- src/pages/TodayPage.test.tsx` passed after switching the Today route to generated content.
- 2026-03-21: `npm run build` passed after removing `mockInsights` and `mockAudio` from `TodayPage`, with a chunk-size warning because generated JSON is bundled client-side.
- 2026-03-21: `npm run preview -- --host 127.0.0.1 --port 4173` loaded `/today` successfully after the real-data Today wiring.
- 2026-03-22: `npm run test -- src/pages/TodayPage.test.tsx` passed after asserting `/today` renders the generated `sourceUrl` as a title link.
- 2026-03-22: `npm run build` passed after wiring `InsightCard` to open real source URLs in a new tab when available.
- 2026-03-22: `npm test -- src/pages/TodayPage.test.tsx src/components/layout/RightRail.test.tsx` failed first for missing `/today?date=...` selection and mock recent-brief links, then passed after wiring real date switching.
- 2026-03-22: `npm test` passed with 7 test files / 18 tests after completing `T21`.
- 2026-03-22: `npm run build` passed after wiring `/today` query-param date selection and generated recent-date links, with the same chunk-size warning because generated JSON is still bundled client-side.
- 2026-03-22: `npm run dev -- --host 127.0.0.1 --port 5173` loaded `/today?date=2026-03-20` successfully in headless Chrome, and the dumped DOM showed the selected date plus generated recent-date links.
- 2026-03-22: `npm test -- src/lib/briefings/generatedContentLoader.test.ts src/pages/TodayPage.test.tsx` failed first for missing explicit empty/error state handling, then passed after adding `/today` page-state resolution plus visible invalid-date and pending-audio copy.
- 2026-03-22: `npm test -- src/components/cards/InsightCard.test.tsx src/pages/TodayPage.test.tsx` failed first for missing richer cue rendering and fake placeholder copy, then passed after refactoring `InsightCard`.
- 2026-03-22: `npm test -- src/pages/todaySections.test.ts src/pages/TodayPage.test.tsx` failed first for the missing Today section builder and planned section layout, then passed after adding `src/pages/todaySections.ts` and restructuring `/today`.
- 2026-03-22: `npm test` passed with 9 test files / 29 tests after completing `T22` through `T24`.
- 2026-03-22: `npm run build` passed after completing Batch 4, with the same chunk-size warning because generated JSON is still bundled client-side.
- 2026-03-22: `npm test -- src/lib/briefings/generatedContentLoader.test.ts src/pages/TopicsPage.test.tsx src/pages/InsightSharePage.test.tsx` failed first for missing generated topic APIs, page-level topic controls, and permalink route-param lookup, then passed after completing `T25` through `T29`.
- 2026-03-22: `npm test` passed with 11 test files / 36 tests after completing Batch 5.
- 2026-03-22: `npm run build` passed after completing Batch 5, with the same chunk-size warning because generated JSON is still bundled client-side.
- 2026-03-22: `npm run dev -- --host 127.0.0.1 --port 5173` loaded `/topics` successfully in headless Chrome, and the dumped DOM showed generated topic chips plus generated insight cards.
- 2026-03-22: `npm run dev -- --host 127.0.0.1 --port 5173` loaded `/insights/rss-2026-03-21-01-opencode-open-source-ai-coding-agent` successfully in headless Chrome, and the dumped DOM showed route-param lookup plus source-link / why-it-matters / build-idea sections.
- 2026-03-21: completed `T01` by auditing the RSS briefing format and documenting the stable section markers, variants, and parser edge cases in `plans/input-audits/rss-briefing-v1-audit.md`.
- 2026-03-21: `npm run build` passed after the `T01` planning and audit documentation updates using Node `v22.17.1`.
- 2026-03-21: completed `T02` by auditing the X briefing format and documenting the stable section markers, optional subsections, bullet variants, and parser edge cases in `plans/input-audits/x-briefing-v1-audit.md`.
- 2026-03-21: `npm run build` passed after the `T02` planning and audit documentation updates using Node `v22.17.1`.
- 2026-03-21: completed `T03` by locking the v1 `Insight` field mapping and source-specific normalization rules in `plans/data-contracts/insight-v1-field-mapping.md`.
- 2026-03-21: `npm run build` passed after the `T03` mapping-contract documentation updates using Node `v22.17.1`.
- 2026-03-21: completed `T04` by locking the `DailyAudio` manifest contract in `plans/data-contracts/daily-audio-v1-manifest.md`.
- 2026-03-21: completed `T05` by locking the generated artifact layout in `plans/data-contracts/generated-artifact-layout-v1.md`.
- 2026-03-21: completed `T06` by aligning `src/types/models.ts` and the current mock-driven UI with the locked v1 contracts.
- 2026-03-21: `npm run build` passed after completing `T04` through `T06` using Node `v22.17.1`.
- 2026-03-21: completed `T07` and `T08` by creating sanitized RSS and X parser fixtures under `src/lib/briefings/fixtures/`.
- 2026-03-21: completed `T09` through `T14` by adding parser tests, implementing both parsers, implementing the shared normalizer, and preserving warning collection for malformed sections.
- 2026-03-21: `npm test` passed with 3 test files / 6 tests covering RSS parsing, X parsing, and normalization behavior.
- 2026-03-21: `npm run build` passed after completing Batch 2 using Node `v22.17.1`.
- 2026-03-21: started Batch 3 preparation by adding `tsx` to `devDependencies` so the upcoming local generation script can run without relying on Node's fragile TypeScript ESM support; Batch 3 implementation is still incomplete and has not been re-verified yet.
- 2026-03-21: completed `T15` through `T18` by adding the generated artifact builder, writer, validator, sync script, workflow docs, and real generated JSON outputs under `src/generated/`.
- 2026-03-21: `npm run sync:generated` passed against `/Users/yuzhang/.openclaw/workspace/briefings`, producing 3 JSON artifacts from 60 markdown files across 39 dates.
- 2026-03-21: `BRIEFINGS_DIR=/tmp/daily-brief-missing npm run sync:generated` failed non-zero with an explicit missing-input error as intended.
- 2026-03-21: `npm test` passed with 4 test files / 9 tests covering parsing, normalization, generated artifact writing, and validation behavior.
- 2026-03-21: `npm run build` passed after completing Batch 3 using Node `v22.17.1`.

## Update Rule

Whenever a batch is completed, update this file with:

- what changed
- what was verified
- what remains blocked or incomplete
- the next recommended batch
