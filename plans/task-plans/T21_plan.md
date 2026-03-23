# T21 Plan

Last updated: 2026-03-22

## Scope

Add real recent-date switching to `/today` using the generated briefing dates.

This task should:

- read the selected date from `/today?date=YYYY-MM-DD`
- fall back to the latest generated date when the query param is missing or invalid
- update the `/today` page content and audio together when the date changes
- replace the mock recent-brief list in the `/today` shell with generated dates

This task does not yet implement:

- explicit missing-day or missing-audio/error empty states beyond the existing fallback (`T22`)
- richer `InsightCard` field presentation (`T23`)
- new Today sections like why-it-matters/build-this-today/learn-this-next (`T24`)
- `/topics` or permalink data rewiring (`T25+`)

## Files Expected To Change

- `plans/task-plans/T21_plan.md`
- `src/pages/TodayPage.test.tsx`
- `src/pages/TodayPage.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/RightRail.tsx`
- `src/app/App.tsx`
- `src/app/outlet-context.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add route-level tests that render `/today` with and without a `date` query param.
2. Confirm the selected valid date renders that day while an invalid date falls back to the latest generated day.
3. Add a render test that the recent-date switcher links to generated dates instead of mock labels.
4. Run the targeted Vitest files and confirm failure before implementation.
5. Implement the query-param and recent-date wiring.
6. Re-run targeted tests and `npm run build`.

## Playwright Impact

Not yet.

This task changes a UI interaction flow, but this repo still does not have Playwright installed. Browser automation remains a later batch concern, so the strongest executable verification here is route-level Vitest coverage plus a manual browser smoke test.

## Manual QA Notes

- Open `/today` and confirm the latest generated date renders by default.
- Open `/today?date=<older-generated-date>` and confirm both the insight list and audio card switch to that day.
- Click a recent date chip in the right rail and confirm the URL query param and main content stay in sync.
