# T30-T35 Plan

Last updated: 2026-03-22

## Scope

Implement Batch 6 by replacing the in-memory build queue with persisted personal insight state.

This batch should:

- add a versioned localStorage-backed store for `InsightState`
- derive build queue cards from generated `Insight` data plus saved personal state
- make add-to-build upsert one saved record per insight instead of creating duplicates
- preserve queue membership and status across refresh
- recover safely from invalid saved payloads
- represent the `Interested` status explicitly in the build flow

This batch does not yet implement:

- real audio playback wiring (`T36+`)
- broader loader and UI hardening coverage from Batch 8
- cleanup of obsolete mock files (`T44+`)

## Files Expected To Change

- `plans/task-plans/T30-T35_plan.md`
- `src/types/models.ts`
- `src/lib/insightStateStore.ts`
- `src/lib/insightStateStore.test.ts`
- `src/app/App.tsx`
- `src/app/outlet-context.ts`
- `src/pages/BuildQueuePage.tsx`
- `src/pages/BuildQueuePage.test.tsx`
- `src/components/cards/BuildItemCard.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Add pure store tests for:
   - empty read
   - versioned write/read round-trip
   - duplicate-safe upsert behavior
   - derived build queue output from saved state plus generated insights
   - corruption recovery for invalid JSON and invalid item shapes
2. Add a route rendering test for `/build`:
   - empty state still renders
   - `Interested` items render in their own section
3. Run the targeted tests first and confirm failure.
4. Implement the minimal store and UI wiring changes, then re-run targeted tests and `npm run build`.

## Playwright Impact

Not applicable in this batch.

This work changes local persistence and build-queue rendering, but Playwright is not installed in the repo yet. The strongest available verification remains store-level tests, route rendering tests, `npm run build`, and a real browser smoke test for final handoff.

## Manual QA Notes

- Add one insight from `/today`, refresh, and confirm it remains on `/build`.
- Add the same insight again and confirm the queue still contains only one card.
- Change an item status to `Interested`, refresh, and confirm it remains in the `Interested` section.
- Manually place invalid JSON under the saved state key in localStorage, reload, and confirm the app recovers to an empty saved state instead of crashing.
