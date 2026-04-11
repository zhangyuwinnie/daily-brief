# Daily Brief Active Tasks

Last updated: 2026-04-10

Source docs:

- `plans/automation/daily-brief-automation-phase0.md`
- `PROGRESS.md`
- `plans/archive/tasks.completed-batches-01-13.md`

Execution rule:

- complete one batch at a time
- run verification before marking a batch done
- update `PROGRESS.md` after each finished batch
- pause between batches for user approval

Archived MVP work:

- Completed MVP batches 01-13 now live in `plans/archive/tasks.completed-batches-01-13.md`
- Keep this file focused on the active automation workstream

## Batch 14: Automation Pipeline Scripts

- [x] `T55` Copy the reviewed automation plan into the repo and lock it as the automation source plan.
  Acceptance: `plans/automation/daily-brief-automation-phase0.md` exists and matches the reviewed plan.
- [ ] `T56` Add `scripts/daily-briefing.js` as a repo-local RSS briefing generator without SQLite.
  Depends on: `T55`
  Acceptance: script writes `briefings/YYYY-MM-DD.md`, uses repo-relative paths, and does not require sqlite deps.
- [ ] `T57` Add `scripts/prepare-follow-builders.js` and `scripts/remix-follow-builders.js`.
  Depends on: `T55`
  Acceptance: follow-builders remix appends RSS-format sections to the existing daily markdown and preserves the parser label contract.
- [ ] `T58` Add targeted regression coverage for appended follow-builders content.
  Depends on: `T57`
  Acceptance: parser and generated-artifact tests cover appended follow-builders entries and ID uniqueness in a merged same-day file.
- [ ] `T59` Add `scripts/generate-audio.sh` for NotebookLM generation from the merged daily markdown.
  Depends on: `T56`, `T57`
  Acceptance: audio output lands in `briefings/`, not `public/generated/audio/`, and the script handles missing/expired auth as best-effort.
- [ ] `T60` Update repo-local pipeline defaults and ignores for automation inputs.
  Depends on: `T55`
  Acceptance: `scripts/sync-generated-content.ts` defaults `BRIEFINGS_DIR` to repo-local `briefings/`, and `.gitignore` excludes `briefings/` and `logs/`.

## Batch 15: Workflow And Repo Wiring

- [ ] `T61` Add package scripts and dependencies for the local automation pipeline.
  Depends on: `T56`, `T57`, `T59`
  Acceptance: `daily`, `daily:follow-builders`, `daily:audio`, and `daily:all` scripts exist and run with the declared dependencies.
- [ ] `T62` Add `.github/workflows/daily-brief.yml` with schedule, artifacts, permissions, and push guard.
  Depends on: `T56`, `T57`, `T59`, `T61`
  Acceptance: workflow includes `workflow_dispatch`, scheduled cron, `permissions: contents: write`, no-diff commit guard, and artifact uploads for debugging.
- [ ] `T63` Document the automation runbook and verification flow.
  Depends on: `T62`
  Acceptance: repo docs explain local dry-run commands, manual workflow trigger, expected outputs, and known risks.

## Suggested Stop Points

- Stop after Batch 14 to validate the repo-local pipeline and targeted tests before adding CI automation.
- Stop after Batch 15 to validate the first manual GitHub Actions run before any Phase 1 expansion.

## Verification By Batch

- Batch 14:
  - targeted follow-builders parser / artifact tests
  - strongest relevant local script smoke checks
  - `npm run build`
- Batch 15:
  - relevant targeted tests
  - workflow YAML sanity review
  - local command verification
  - `npm run build`
