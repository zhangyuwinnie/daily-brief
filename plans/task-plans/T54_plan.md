# T54 Plan

Last updated: 2026-04-07

## Scope

Fix generated daily audio publishing so `/today` can play real podcast files that already exist in the briefing source directory.

This task will:

- discover source audio files from the briefing input directory
- select the best source file per date with explicit duplicate and language preference rules
- publish the selected files into `public/generated/audio/` with web-stable date-based filenames that preserve the source extension
- regenerate `audio-index.json` so ready dates point at publicly served URLs
- keep browser tests resilient to daily content refreshes

This task will not:

- add on-demand audio generation
- introduce CDN uploads yet
- redesign the `AudioPlayer` UI

## Files Expected To Change

- `plans/task-plans/T54_plan.md`
- `tasks.md`
- `src/lib/briefings/syncGeneratedContent.ts`
- `src/lib/briefings/generatedArtifacts.ts`
- `src/lib/briefings/generatedArtifacts.test.ts`
- `src/lib/briefings/syncGeneratedContent.test.ts`
- `tests/e2e/today-audio.spec.ts`
- `public/generated/audio-index.json`
- `public/generated/briefings-index.json`
- `public/generated/briefings-by-date.json`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add artifact tests for non-normalized audio names and preference ordering.
2. Add sync tests that prove source audio files are discovered from `inputDir`, published into `audioDir`, and exposed as ready entries.
3. Confirm the new tests fail for the intended reason.
4. Implement source-audio discovery and publishing.
5. Run `npm run sync:generated`.
6. Run `npm test`.
7. Run `npm run test:e2e`.
8. Run `npm run build`.

## Playwright Impact

Playwright coverage is applicable.

The `/today` audio flow is user-facing, and the current browser test should be updated to derive its ready date from generated content instead of assuming one hardcoded fixture date.

## Manual QA Notes

- Open `/today` for a date whose generated audio entry is `ready`.
- Confirm the player shows `Ready`, the play button is enabled, and the browser `<audio>` element points at a published `/generated/audio/...` URL.
- Confirm the default `/today` route still behaves correctly when the latest date has no published audio.
