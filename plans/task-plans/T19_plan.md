# T19 Plan

Last updated: 2026-03-21

## Scope

Create typed frontend loaders for generated daily content so the app can read:

- available generated dates
- one selected daily dataset with latest-date fallback
- one insight by ID without touching mock data

This task does not yet switch `/today`, `/topics`, or permalink UI components over to the new loader. That belongs to `T20+`.

## Files Expected To Change

- `plans/task-plans/T19_plan.md`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/lib/briefings/generatedContentLoader.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add loader tests first for:
   - available date loading
   - explicit date lookup
   - latest-date fallback when date is missing or absent
   - insight lookup by ID
2. Run the new targeted Vitest file and confirm it fails before implementation.
3. Implement the loader APIs.
4. Re-run the targeted tests and then run `npm run build`.

## Playwright Impact

Not applicable for `T19`.

This task adds a data-loading boundary only. UI behavior and route interaction stay unchanged until `T20+`.

## Manual QA Notes

- Import the new loader into a small local script or the browser app and confirm it returns the latest available day from generated JSON.
- Confirm the loader returns `null` for an unknown insight ID instead of falling back to mock data.
