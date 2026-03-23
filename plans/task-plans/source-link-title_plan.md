# Source Link Title Plan

Last updated: 2026-03-22

## Scope

Expose the persisted `Insight.sourceUrl` on `/today` by rendering the insight title as an external link when a real source URL is available.

This task should:

- keep `/today` on generated real data
- link the title to the original source only when `sourceUrl` exists
- preserve the existing card layout and actions

This task does not:

- complete the broader `T23` richer-card work
- change permalink source-link behavior on `/insights/:insightId`
- add date switching or other `/today` structural work

## Files Expected To Change

- `plans/task-plans/source-link-title_plan.md`
- `src/pages/TodayPage.test.tsx`
- `src/components/cards/InsightCard.tsx`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Extend the `/today` route test to assert the rendered card links to the generated insight `sourceUrl`.
2. Confirm the test fails before the UI change.
3. Update `InsightCard` to render a linked title when `sourceUrl` is present.
4. Re-run the targeted test and `npm run build`.

## Playwright Impact

Not applicable for this small UI fix.

The repo still does not have Playwright wired in, and this change does not introduce a new flow beyond exposing an already-persisted field.

## Manual QA Notes

- Open `/today`.
- Confirm clicking a title with a source URL opens the real source in a new tab.
- Confirm cards without a `sourceUrl` still show a non-linked title.
