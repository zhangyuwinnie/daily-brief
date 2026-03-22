# T20 Plan

Last updated: 2026-03-21

## Scope

Remove `mockInsights` and `mockAudio` from the `/today` route so the page renders its main content from the generated-content loader.

This task should:

- switch `TodayPage` to the typed generated loader
- render the latest generated day by default
- keep existing topic filtering working against the real day dataset
- keep the route scoped to `/today` only

This task does not yet implement:

- recent date switching (`T21`)
- explicit missing-day or missing-audio states (`T22`)
- richer Today sections (`T23`, `T24`)

## Files Expected To Change

- `plans/task-plans/T20_plan.md`
- `src/pages/TodayPage.test.tsx`
- `src/pages/TodayPage.tsx`
- `vite.config.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add a route-level render test for `TodayPage`.
2. Confirm the test fails while `TodayPage` still imports mock content.
3. Update `TodayPage` to read from `generatedContentLoader`.
4. Re-run the targeted test and `npm run build`.
5. Smoke-test `/today` in the preview app.

## Playwright Impact

Not yet.

`T20` changes one UI route, but this repo does not have Playwright wired in yet. A stronger browser regression pass belongs later in the testing/hardening batch.

## Manual QA Notes

- Open `/today` and confirm the headline cards come from the latest generated date, not the static mock dataset.
- Confirm the audio card shows the generated status for the same day dataset.
