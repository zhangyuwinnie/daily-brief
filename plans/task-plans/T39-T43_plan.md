# T39-T43 Plan

Last updated: 2026-03-23

## Scope

Implement Batch 8 by hardening the MVP with broader automated coverage around generated data loading, persisted personal state, route-level integration, and browser-level core flows.

This batch should:

- expand generated-data loader coverage around latest-date fallback, explicit missing-day handling, and empty-source edge cases
- expand `InsightState` store coverage around missing payloads, invalid payloads, unsupported version payloads, and safe persistence behavior
- add router-level UI integration tests that exercise real app loading for `/today`, `/topics`, and `/insights/:insightId`
- add Playwright coverage for:
  - Today -> Add to Build -> Refresh -> Build page persistence
  - date switching from the recent-brief UI
  - permalink reload stability

This batch does not:

- remove obsolete mock files
- rework disconnected presentational controls
- add new product functionality outside the current MVP loop

## Files Expected To Change

- `plans/task-plans/T39-T43_plan.md`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/lib/insightStateStore.test.ts`
- `src/app/App.integration.test.tsx`
- `src/components/cards/InsightCard.tsx`
- `tests/e2e/core-loop.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Add or tighten unit tests for loader fallback and empty-data edge cases.
2. Add store tests for unsupported-version payloads and no-op persistence behavior when storage is unavailable.
3. Add jsdom-backed router integration tests for:
   - `/today` loading generated data
   - `/topics` topic-filter interaction
   - navigating from `/today` into a real permalink route
4. Add Playwright specs for:
   - persisted add-to-build flow across reloads
   - date switching stability
   - permalink reload stability
5. Run the new tests first and confirm failures line up with the missing coverage or missing accessibility hooks.
6. Make the minimum implementation/test-support changes required, then rerun targeted tests, full tests, Playwright, and `npm run build`.

## Playwright Impact

Playwright is required in this batch.

Batch 8 is explicitly about hardening the core user flow, and the current browser coverage only proves the audio slice. The batch is not complete unless the persisted build loop and route navigation remain stable in a real browser.

## Manual QA Notes

- Start the app and open `/today`.
- Add a real insight to the build queue, confirm the modal saves, and verify the item remains on `/build` after a refresh.
- Use the recent briefs rail to switch dates and confirm the page content and date badge update together.
- Open a real insight permalink and refresh the browser to confirm the same insight still loads.
- Smoke-test `/topics` topic filtering to confirm the visible cards update without errors.
