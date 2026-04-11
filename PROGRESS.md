# Daily Brief Explore - Progress

Last updated: 2026-04-11

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
- Active implementation plan for MVP product behavior:
  - `plans/mvp-architecture.md`
  - `plans/mvp-prd.md`
- Active implementation plan for pipeline automation:
  - `plans/automation/daily-brief-automation-phase0.md`
- Active task ledger:
  - `tasks.md`
- Archived MVP history:
  - `plans/archive/tasks.completed-batches-01-13.md`
  - `plans/archive/progress.history-pre-automation.md`

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

## Current Implementation Status

Overall status:

`product MVP work is archived as completed through Batch 13, and the active execution surface now shifts to Daily Brief Automation Phase 0`

Current worktree snapshot:

- MVP batches 01-13 are archived and no longer clutter the active task ledger.
- The reviewed automation plan now lives in `plans/automation/daily-brief-automation-phase0.md`.
- Active `tasks.md` now tracks only the automation workstream.
- Active `PROGRESS.md` now tracks only current status, locked decisions, verification, and next batch.
- Historical MVP implementation detail now lives in:
  - `plans/archive/tasks.completed-batches-01-13.md`
  - `plans/archive/progress.history-pre-automation.md`
- Unrelated worktree changes were already present and were left untouched:
  - modified generated JSON under `public/generated/`
  - untracked `brief_generation.md`
  - untracked `public/generated/briefings/2026-04-10.json`

## Automation Decisions Locked

- Use `plans/automation/daily-brief-automation-phase0.md` as the source plan for CI / automation work.
- Follow-builders content appends to the existing `briefings/YYYY-MM-DD.md`; do not create a separate same-day RSS file.
- Follow-builders appended sections must preserve the current RSS parser label contract:
  - `**Chinese Summary:**`
  - `**R2 Take:**`
- NotebookLM-generated audio lands in `briefings/`, then `sync:generated` republishes the selected file into `public/generated/audio/`.
- GitHub Actions cron accepts the DST drift for now.
- Workflow push path must explicitly request `permissions: contents: write`.

## What Changed

- Added repo-local `scripts/daily-briefing.js` for RSS briefing generation with repo-relative `briefings/YYYY-MM-DD.md` output and no DB dependency.
- Kept the markdown output aligned with the existing RSS parser contract: `# Daily Briefing`, `## [Title](URL)`, `**Source:**`, `**Chinese Summary:**`, and `**R2 Take:**`.
- Added `scripts/daily-briefing.d.ts` so the JS script can be imported from tests without breaking the repo TypeScript build.
- Added targeted regression coverage in `src/lib/briefings/dailyBriefingScript.test.ts` for repo-local output paths, parser-compatible markdown, and the no-DB guardrail.

## What Was Verified

- `npm test -- src/lib/briefings/dailyBriefingScript.test.ts src/lib/briefings/parseRssBriefing.test.ts`
- `node --input-type=module -e 'import { runDailyBriefing } from "./scripts/daily-briefing.js"; ...'` against the live `https://openai.com/news/rss.xml` feed, writing `/var/folders/bp/g0pw41dj7ybbzjvqq3vg22lw0000gn/T/tmp.v5byOtLUBi/2026-04-11.md`
- `node --import tsx --input-type=module -e 'import { parseRssBriefing } from "./src/lib/briefings/parseRssBriefing.ts"; ...'` on that generated markdown, which parsed with `2` items and `0` warnings
- `npm run build`

## Key Lesson / Risk

- Full-network runs across every configured source are still a pipeline-risk area because heterogeneous feeds can be slow or malformed; the script now avoids DB coupling and catastrophic XML matching, but later workflow work should keep artifact uploads and source-level observability.
- The repo can ship this script before adding automation package wiring because the runtime path is self-contained and the build-safe contract lives in the new declaration file.

## Next Recommended Batch

- `Batch 14: Automation Pipeline Scripts`

The first recommended task is now `T57`.
