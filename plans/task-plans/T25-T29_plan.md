# T25-T29 Plan

Last updated: 2026-03-22

## Scope

Implement Batch 5 by replacing remaining mock-backed read surfaces with generated normalized data.

This batch should:

- replace shell and `/topics` topic sourcing with generated normalized topics
- make `/topics` chips directly control the visible filter state
- replace permalink lookup with generated insight lookup by route param
- expand the permalink page to surface source-link and richer field blocks with explicit missing-data copy
- harden missing-insight handling so stale URLs have a clear recovery path

This batch does not yet implement:

- persisted personal state (`T30+`)
- real audio playback wiring (`T36+`)
- deletion of obsolete mock files (`T44+`)
- Playwright coverage (`T41+`)

## Files Expected To Change

- `plans/task-plans/T25-T29_plan.md`
- `src/lib/briefings/generatedContentLoader.ts`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/app/App.tsx`
- `src/app/outlet-context.ts`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/RightRail.tsx`
- `src/pages/TopicsPage.tsx`
- `src/pages/TopicsPage.test.tsx`
- `src/pages/InsightSharePage.tsx`
- `src/pages/InsightSharePage.test.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Extend generated-content loader tests to cover real topic derivation and ordering.
2. Add route rendering tests for `/topics`:
   - generated insights render instead of mock content
   - topic-filtered states respond to context changes
   - topic chips render as page-level controls
3. Add route rendering tests for `/insights/:insightId`:
   - lookup succeeds by URL param after refresh-like routing
   - source link and richer field sections render
   - unknown ids show a recovery state
4. Run the targeted tests first and confirm failure.
5. Implement the minimal wiring changes, then re-run targeted tests and `npm run build`.

## Playwright Impact

Not applicable in this batch.

These changes materially affect `/topics` and permalink flows, but Playwright is still not installed in this repo. The strongest available verification remains route-level rendering tests, loader tests, `npm run build`, and a real browser smoke test for final handoff.

## Manual QA Notes

- Open `/topics` and confirm topic chips come from generated content, not mocks.
- Toggle several topic chips on `/topics` and confirm the card list updates directly from the page.
- Open a known permalink URL and refresh it to confirm the same generated insight still renders.
- Open an invalid permalink URL and confirm the page offers a clear path back to `/today` or `/topics`.
