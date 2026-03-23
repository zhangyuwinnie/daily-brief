# T36-T38 Plan

Last updated: 2026-03-23

## Scope

Implement Batch 7 by completing the real audio path on `/today`.

This batch should:

- make `/today` consume the generated `DailyAudio` manifest as the source of truth for pending, ready, and failed day states
- replace the simulated `AudioPlayer` behavior with real browser audio playback behavior when a playable URL exists
- make non-ready and invalid-ready states explicit in the UI, including failed generation and ready-with-missing-URL cases
- add focused automated coverage for loader state resolution, `/today` audio messaging, and browser-level audio UX

This batch does not yet implement:

- broad route hardening coverage outside the audio slice
- cleanup of obsolete mock files
- the larger Batch 8 core-loop E2E coverage

## Files Expected To Change

- `plans/task-plans/T36-T38_plan.md`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/components/audio/AudioPlayer.tsx`
- `src/components/audio/AudioPlayer.test.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/TodayPage.test.tsx`
- `src/lib/briefings/generatedContentLoader.ts`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `playwright.config.ts`
- `tests/e2e/today-audio.spec.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Expand loader tests to cover:
   - pending audio passthrough
   - failed audio passthrough
   - ready audio passthrough
   - ready status with a missing URL remaining visible instead of silently behaving as playable
2. Add component or route tests for:
   - ready audio showing playback metadata without the pending/failed warning copy
   - failed audio showing explicit recovery guidance
   - invalid ready-without-URL state showing actionable copy
3. Add focused browser coverage for the `/today` audio entry point.
4. Confirm the new tests fail for the intended reason before implementation.
5. Re-run targeted tests, the Playwright spec, and `npm run build`.

## Playwright Impact

Playwright is required in this batch.

This is a user-facing audio interaction change and the repo does not currently have browser coverage installed. The minimal acceptable change is to add Playwright now and cover the `/today` audio experience rather than silently deferring browser verification to a later batch.

## Manual QA Notes

- Load `/today` in the browser and confirm the current generated day renders an audio card without simulated fake progress.
- If a generated day is `pending`, confirm the player is visibly disabled and the pending explanation is shown.
- If a generated day is `failed`, confirm the failure copy is visible and actionable.
- If a day is marked `ready` with a valid URL, confirm play/pause and progress tracking work against the real `<audio>` element.
- If a day is marked `ready` without a URL, confirm the UI explains that metadata is inconsistent instead of pretending playback works.
