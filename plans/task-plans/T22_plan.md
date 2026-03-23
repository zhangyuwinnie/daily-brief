# T22 Plan

Last updated: 2026-03-22

## Scope

Add explicit `/today` empty and error states for missing day and missing audio so the page never silently falls back or implies fake readiness.

This task should:

- keep the existing latest-date fallback behavior from `T21`
- surface a visible warning when `/today?date=...` requests a date that is not available and the page falls back
- show a clear empty state when no generated day content exists at all
- show explicit copy when the selected day has no audio record
- make pending and failed audio states read clearly as real generation states, not fake playback

This task does not yet implement:

- richer `InsightCard` field rendering (`T23`)
- new Today content sections like why-it-matters / build-this-today / learn-this-next (`T24`)
- topic or permalink route rewiring (`T25+`)
- real media playback behavior changes (`T36+`)

## Files Expected To Change

- `plans/task-plans/T22_plan.md`
- `src/lib/briefings/generatedContentLoader.ts`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/pages/TodayPage.tsx`
- `src/pages/TodayPage.test.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Extend loader tests to assert explicit resolution metadata for valid, invalid, and missing generated-day states.
2. Extend route-level `TodayPage` tests to assert:
   - invalid requested dates show a visible fallback warning
   - missing generated content shows an explicit recovery message
   - missing audio records show explicit unavailable copy
3. Run the targeted Vitest files first and confirm they fail for the missing state behavior.
4. Implement loader/page state branches with the minimum data-shape change needed.
5. Re-run targeted tests, then run `npm run build`.

## Playwright Impact

Not applicable yet.

This is still a route-level UI task, but the repo does not yet include Playwright. Targeted Vitest coverage plus a real browser smoke test remains the strongest available verification for this batch.

## Manual QA Notes

- Open `/today` and confirm the latest generated date still renders by default.
- Open `/today?date=1900-01-01` and confirm the page warns that the requested date is unavailable while showing the latest generated day.
- Confirm the audio area clearly communicates pending, failed, or unavailable states without implying a ready player.
