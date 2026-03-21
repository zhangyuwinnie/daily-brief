# Daily Brief Explore - Progress

Last updated: 2026-03-20

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

Overall status: `frontend prototype working, data layer not started`

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
- reusable project-tracking bootstrap docs / script / skill package

Not implemented yet:

- Markdown parser for daily briefings
- normalization layer into shared `Insight` model
- SQLite or other persistent storage
- real audio metadata ingestion
- real audio playback URL
- persisted build/learning state
- historical briefing browsing
- date switching backed by real data
- any backend or local data-serving layer for real brief content

## Code-to-Plan Mismatches

The architecture plan is ahead of the current TypeScript model and UI.

- Current `Insight` type is still minimal:
  - has `title`, `summary`, `takeaway`, `buildIdea`, `effort`, `topics`
  - does not yet include planned fields such as:
    - `sourceUrl`
    - `whyItMatters`
    - `learnGoal`
    - `signalScore`
    - `sourceType`
- Current `DailyAudio` type is also thinner than planned:
  - no `audioUrl`
  - no `durationSec`
  - no `transcript`
  - no `errorMessage`
- Current build state model is thinner than planned:
  - no `Interested` state
  - no `personalTakeaway`
  - no `lastTouchedAt`
  - build items are still stored as nested `insight` objects in frontend state instead of persisted records

This means the UI prototype is useful for product shaping, but not yet aligned with the planned MVP data model.

## What Is Actually True In Code

Current codebase is still mock-data driven.

- `src/data/mockInsights.ts` is the main content source.
- `src/data/mockAudio.ts` is the current audio source.
- `src/app/App.tsx` stores build queue state only in React memory.
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

## Known Gaps / Risks

- The most important architecture work has not started yet: parser + normalized data model.
- Current TS types are thinner than the planned model.
- Build queue state is ephemeral and will disappear on refresh.
- Audio player currently simulates playback instead of playing a real file.
- The current app can look more complete than it really is because several elements are presentational only.
- Some UI elements are still decorative or disconnected:
  - Topics page chips are not interactive
  - recent briefs in the right rail are static
  - insight preview in the right rail is route-param-driven and not very useful on current pages
- `selectedInsight` in app state is route-param-derived, which is fine for permalink pages but not a great fit for Today/Topics right-rail preview behavior.
- There is still no decision implemented for how real data reaches the frontend:
  - direct file read during build/startup
  - JSON cache
  - SQLite-backed loader
  - API layer

## Next Recommended Batch

Priority: `highest`

Build the real data foundation before any more UI expansion.

Recommended next batch:

1. Execute `Batch 1` from `tasks.md`.
2. Inspect both upstream Markdown formats using real sample files.
3. Lock the v1 normalized schema for:
   - `Insight`
   - `DailyAudio`
   - `InsightState`
4. Lock the generated artifact shape and output location.
5. Do not start UI refactors until the parser contract is agreed.

## Immediate Next To Do

The next concrete thing to do is:

1. Open 2-4 real briefing files from `/Users/yuzhang/.openclaw/workspace/briefings/`.
2. Document the exact section patterns for both formats.
3. Confirm the v1 schema and generated artifact layout from `plans/mvp-prd.md`.
4. Implement the parser contract before touching more UI.

Expected deliverables for that batch:

- one documented sample audit for daily briefings
- one documented sample audit for X briefings
- one shared normalized model definition
- one locked generated output contract the frontend can read next

## After That

Once the parser path works:

1. finalize persistence shape
2. wire `/topics` and `/insights/:insightId` to real data
3. add lightweight persisted `InsightState` / build state
4. define audio metadata schema
5. wire real audio player data

## Open Questions

- What is the exact normalized schema for v1:
  - only fields needed by current UI
  - or the fuller architecture-plan model?
- Should storage start with JSON cache for speed or go directly to SQLite?
- Where should pre-generated audio files live, and what exact metadata file should the web app read?
- Should topic tagging be rule-based only in v1, or allow some lightweight enrichment step?

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

## Update Rule

Whenever a batch is completed, update this file with:

- what changed
- what was verified
- what remains blocked or incomplete
- the next recommended batch
