# Daily Brief Explore - Progress

Last updated: 2026-03-21

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

Overall status: `frontend prototype working, Batch 3 generated-data pipeline complete`

Current worktree snapshot:

- Batch 3 is complete locally and ready to commit.
- `src/generated/` now contains:
  - `briefings-index.json`
  - `briefings-by-date.json`
  - `audio-index.json`
- current generated snapshot was built from:
  - 60 upstream briefing markdown files
  - 39 available dates
  - 0 ready audio files
- audio records are currently `pending` for every date because `public/generated/audio/` is empty.

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
- In-memory build queue state
- Mock audio player UI
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
- reusable project-tracking bootstrap docs / script / skill package

Not implemented yet:

- SQLite or other persistent storage
- real audio metadata ingestion from generated manifest
- real audio playback URL
- persisted build/learning state
- historical briefing browsing
- date switching backed by real generated data
- frontend loaders that read generated content

## Code-to-Plan Mismatches

The main mismatch is no longer the shared TypeScript contract.
The locked v1 types and parser pipeline now exist.

The real gap is now the missing frontend consumption layer for generated content:

- no frontend loaders consuming `src/generated/*.json` yet
- product routes still render mock content instead of normalized real data
- audio metadata exists in generated form, but the UI still reads mock audio

This means the codebase is now contract- and parser-ready, but the product loop is still not wired end to end.

## What Is Actually True In Code

Current codebase has a real local content pipeline, but the UI is still mock-data driven.

- `src/data/mockInsights.ts` is the main content source.
- `src/data/mockAudio.ts` is the current audio source.
- `src/app/App.tsx` stores build queue state only in React memory.
- `src/lib/briefings/` now contains:
  - parser logic
  - normalizer logic
  - generated artifact builder
  - sync runner
- `scripts/sync-generated-content.ts` now regenerates `src/generated/*.json` from the upstream briefing directory.
- UI flows exist, but they are not connected to real brief files yet.
- `Today` currently renders only:
  - audio card
  - filtered insight list
  and does not yet implement planned sections like:
  - why it matters
  - learn this next
  - recent date switcher
- `Topics` page top chips are display-only; actual topic switching currently happens from the right rail, not the page itself.
- `InsightSharePage` is visually present, but still does not surface the full planned share payload:
  - no source link
  - no why-it-matters section
  - no explicit build idea block
- `AudioPlayer` simulates progress locally instead of playing a real audio file.

This means the product shell exists, but the actual product loop does not yet exist end-to-end.

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
  - add to build queue
  - build item status update

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

## Known Gaps / Risks

- The generated-data pipeline now exists, but the app still does not consume it:
  - no frontend loaders yet
  - `/today`, `/topics`, and permalink routes still read mock data
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
  - recent briefs in the right rail are static
  - insight preview in the right rail is route-param-driven and not very useful on current pages
- `selectedInsight` in app state is route-param-derived, which is fine for permalink pages but not a great fit for Today/Topics right-rail preview behavior.
- The remaining content-ingestion decision for MVP is now settled:
  - generated JSON is the local persistence layer
  - the next missing step is typed loader wiring, not storage selection

## Next Recommended Batch

Priority: `highest`

Use the generated data path on the first real user-facing route before any more polish.

Recommended next batch:

1. Start `Batch 4` from `tasks.md`.
2. Implement typed frontend loaders over `src/generated/*.json`.
3. Move `/today` off `mockInsights` and `mockAudio`.
4. Add recent-date switching and explicit missing-day / missing-audio states.
5. Keep `/topics` and permalink pages on mocks until `/today` is stable.

## Immediate Next To Do

The next concrete thing to do is:

1. Execute `T19` and implement typed loaders for daily data, available dates, and insight lookup.
2. Execute `T20` and move `/today` off `mockInsights` and `mockAudio`.
3. Execute `T21` and add generated-date switching.
4. Execute `T22` and add explicit empty/error states for missing day or audio.

Expected deliverables for that batch:

1. one typed generated-data loader layer
2. one real-data `/today` page
3. recent-date switching backed by generated dates
4. visible empty/error states instead of silent mock fallback

## After That

Once `/today` is stable on real data:

1. wire `/topics` and `/insights/:insightId` to real data
2. add lightweight persisted `InsightState` / build state
3. wire real audio player data
4. add route-level tests and E2E coverage

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
