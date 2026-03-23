# T44-T46 Plan

Last updated: 2026-03-23

## Scope

Implement Batch 9 by removing leftover mock-only files, deleting or reworking disconnected controls, and tightening user-facing copy so the MVP reads like a personal AI learning system rather than a prototype.

This batch should:

- delete obsolete mock content files that are no longer used by product routes
- update tests that still rely on those mock fixtures
- remove dead-end UI controls that imply out-of-scope features such as search or poster download
- tighten route copy and empty-state copy where it still sounds generic, internal, or prototype-specific

This batch does not:

- add search
- add poster generation
- add link analytics
- expand the MVP beyond the current routes and local-first scope

## Files Expected To Change

- `plans/task-plans/T44-T46_plan.md`
- `src/app/App.integration.test.tsx`
- `src/components/layout/AppShell.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/TodayPage.test.tsx`
- `src/pages/TopicsPage.tsx`
- `src/pages/TopicsPage.test.tsx`
- `src/pages/BuildQueuePage.tsx`
- `src/pages/BuildQueuePage.test.tsx`
- `src/pages/InsightSharePage.tsx`
- `src/pages/InsightSharePage.test.tsx`
- `src/data/mockInsights.ts`
- `src/data/mockAudio.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Add or update tests to assert:
   - no disconnected search / start-learning shell controls remain
   - the permalink page no longer renders dead-end poster/copy buttons
   - route copy reflects the product loop instead of prototype/internal language
2. Confirm the new tests fail for the intended reasons before implementation.
3. Make the minimum UI and file-deletion changes required.
4. Re-run the affected tests, then run `npm run build`.
5. Do a manual regression sweep across `/today`, `/build`, `/topics`, and `/insights/:insightId`.

## Playwright Impact

Playwright changes are likely not required for this batch.

Batch 8 already covers the core loop and key navigation flows in a real browser. Batch 9 is mainly cleanup/copy work, so existing browser coverage plus a manual regression sweep should be enough unless the cleanup changes materially alter a covered interaction.

## Manual QA Notes

- Open `/today` and confirm the header no longer exposes dead-end search/start actions.
- Open `/build` and confirm the empty state still points the user back into the daily brief loop.
- Open `/topics` and confirm the page copy reads like topic tracking for a personal learning system.
- Open a permalink page and confirm the back link copy is accurate and no dead-end poster/copy actions remain.
