# T04 Plan

Last updated: 2026-03-21

## Scope

Decide the v1 audio metadata manifest shape the frontend will consume.

This task should answer:

- what one audio manifest record looks like
- which fields are required for `pending`, `ready`, and `failed`
- how the manifest works before any actual audio files exist
- what validation rules the future generator and loaders must enforce

## Files Expected To Change

- `plans/task-plans/T04_plan.md`
- `plans/data-contracts/daily-audio-v1-manifest.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

This is a contract decision task, so strict TDD is not a fit.

Executable verification instead:

1. Re-read the target `DailyAudio` contract in `plans/mvp-prd.md`.
2. Confirm the manifest supports all required states: `pending`, `ready`, `failed`.
3. Confirm the contract does not depend on already-generated audio files.
4. Run `npm run build` for repo-level regression protection before closing the task.

## Playwright Impact

Not applicable. This task does not change user-facing product behavior.

## Manual QA Notes

- Re-open the manifest doc and verify each field has a clear meaning and validation rule.
- Confirm `ready` requires a URL while `pending` and `failed` do not.
- Confirm the contract can represent today's real state: briefings exist, audio may still be missing.
