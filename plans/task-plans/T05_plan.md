# T05 Plan

Last updated: 2026-03-21

## Scope

Decide the v1 generated artifact layout for parsed content and audio metadata.

This task should answer:

- whether generated artifacts live under `src/generated/` or `public/generated/`
- the exact file names the writer and loaders will target
- what each generated file is responsible for
- where actual audio binary files should live relative to the manifest

## Files Expected To Change

- `plans/task-plans/T05_plan.md`
- `plans/data-contracts/generated-artifact-layout-v1.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

This is a layout decision task, so strict TDD is not a fit.

Executable verification instead:

1. Re-read the PRD recommendations for generated JSON.
2. Confirm the chosen layout matches the locked `Insight` and `DailyAudio` contracts.
3. Confirm the layout cleanly separates typed JSON artifacts from static audio file serving.
4. Run `npm run build` for repo-level regression protection before closing the task.

## Playwright Impact

Not applicable. This task does not change user-facing product behavior.

## Manual QA Notes

- Re-open the layout doc and verify every expected generated file has one clear responsibility.
- Confirm the frontend can import JSON directly without runtime directory scanning.
- Confirm audio binary paths remain URL-friendly and do not rely on bundling binary files into `src/`.
