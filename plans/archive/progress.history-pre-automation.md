# Archived Progress History: MVP Through Batch 13

Archived from the active `PROGRESS.md` on 2026-04-10 before switching the active
progress surface to the automation workstream.

## Archive Purpose

This file preserves the long-form MVP implementation history that previously lived in
`PROGRESS.md`, so the active progress file can stay short and useful for `continue task`.

## Historical Snapshot

- Product thesis locked: personal AI learning system for agent builders
- Core loop locked: `brief -> build -> learn -> reflect`
- MVP read surfaces delivered:
  - `/today`
  - `/build`
  - `/topics`
  - `/insights/:insightId`
- MVP listen surface delivered:
  - one daily audio brief per day
- Completed implementation track:
  - Batch 1 through Batch 13

## Major Completed Areas

### Data Contracts And Parsing

- Locked v1 contracts for:
  - normalized `Insight`
  - day-level `DailyAudio`
  - generated artifact layout
- Audited real RSS and X input shapes
- Added fixtures and parser tests for RSS and X briefing formats
- Implemented shared normalization and warning collection

### Generated Data Pipeline

- Implemented generated artifact writer and validation
- Added `npm run sync:generated`
- Documented generated-content workflow
- Moved generated runtime JSON to `public/generated/`
- Added per-date day payloads under `public/generated/briefings/`

### Real Data Product Surfaces

- Removed mock content from product routes
- Wired `/today` to generated content
- Wired `/topics` to normalized topics and historical insights
- Wired permalink route to real insight lookup
- Added persisted localStorage-backed build state

### Audio

- Replaced mock audio metadata with generated manifest loading
- Added real HTML audio playback for ready audio dates
- Added pending / failed / invalid-ready recovery states
- Published discovered source audio into generated web-audio paths

### Testing And Hardening

- Added parser, loader, state-store, and route integration coverage
- Added Playwright coverage for:
  - core build-loop flow
  - date switching
  - permalink reload stability
  - `/today` audio readiness and pending states

### Performance And Delivery

- Moved generated content to runtime fetches
- Lazy-loaded route modules
- Lazy-loaded per-date day payloads
- Measured and reduced `/today` render/compositor cost

## Latest Archived MVP Status

At the point of archiving, the repo had a working local MVP with:

- runtime-generated content loading
- persisted build queue state
- route-level lazy loading
- real generated audio playback from published daily podcast files
- passing local regression coverage for the touched MVP surfaces

## Archived Verification Highlights

- `npm run sync:generated`
- `npm test`
- `npm run test:e2e`
- `npm run build`

Additional focused passes recorded in the old progress log included:

- `/today` production render trace before/after comparison
- targeted app integration checks
- manual browser smoke checks for ready audio dates

## Archived Lessons And Risks

- local `public/generated/audio/` publishing works for static hosting, but public-domain
  deployment should eventually swap to CDN or object storage without changing the UI contract
- audio freshness remains dependent on upstream briefing-side podcast generation
- `/topics` intentionally pays a larger cost when loading all historical day payloads
- stacked transparency and animation remain future suspects if `/today` feels heavy again

## Archived Source Files

- Completed task ledger: `plans/archive/tasks.completed-batches-01-13.md`
- Historical source plans:
  - `plans/mvp-prd.md`
  - `plans/mvp-architecture.md`
  - `plans/task-plans/`

## Archive Note

If a future task needs the detailed pre-automation MVP implementation log, use git history
plus the task plans and archived task ledger above. The active `PROGRESS.md` now tracks the
automation workstream instead of repeating the full MVP history.
