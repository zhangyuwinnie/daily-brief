# T49-T52 Plan

Last updated: 2026-04-07

## Scope

Implement a focused performance batch that removes the monolithic day-payload fetch from app startup and switches generated briefing content to per-date lazy loading.

This batch should:

- emit one generated briefing JSON file per date under `public/generated/briefings/`
- keep `briefings-index.json` and `audio-index.json` as the lightweight startup manifests
- preserve `briefings-by-date.json` during the transition so existing artifacts remain inspectable
- lazy load individual day payloads for `/today`, permalink lookup, and queued build items
- load topic browsing data asynchronously without blocking initial app render on all dates
- keep runtime tests, route integration tests, Playwright coverage, and the production build green

This batch does not:

- add a backend or API layer
- redesign the UI beyond lightweight loading states needed for lazy data fetches
- change the MVP route structure or persistence model

## Files Expected To Change

- `plans/task-plans/T49-T52_plan.md`
- `src/lib/briefings/generatedArtifacts.ts`
- `src/lib/briefings/generatedArtifacts.test.ts`
- `src/lib/briefings/syncGeneratedContent.ts`
- `src/lib/briefings/generatedContentLoader.ts`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/app/App.tsx`
- `src/app/App.integration.test.tsx`
- `src/app/outlet-context.ts`
- `src/components/layout/RightRail.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/TopicsPage.tsx`
- `src/pages/TopicsPage.test.tsx`
- `src/pages/InsightSharePage.tsx`
- `src/pages/InsightSharePage.test.tsx`
- `scripts/sync-generated-content.ts`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD where practical.

1. Extend artifact tests so generated sync output is required to include per-date files.
2. Extend loader tests so startup fetches only the index and audio manifests, while day payloads are fetched lazily and cached.
3. Update integration tests for the new lazy route behavior on `/today`, `/topics`, and `/insights/:insightId`.
4. Run the new targeted tests first and confirm they fail for the intended missing behavior.
5. Implement the minimum runtime changes required, then rerun targeted tests, full `npm test`, `npm run test:e2e`, and `npm run build`.

## Playwright Impact

Playwright is applicable.

The user-visible route flow changes from one blocking monolithic fetch to route-level data loading, so existing browser coverage must still prove:

- `/today` loads the selected day correctly
- recent-date navigation still works
- permalink reload still works
- the build flow still survives refresh

The goal is to keep the current Playwright suite passing; new Playwright specs are only needed if the lazy-loading change introduces a gap.

## Manual QA Notes

- Run `npm run sync:generated` and confirm `public/generated/briefings/<date>.json` files are present.
- Open `/today` and confirm the app shell appears before all historical data is loaded.
- Check the network panel and confirm `/today` fetches `briefings-index.json`, `audio-index.json`, and only the selected date file.
- Open `/topics` and confirm the page loads then fills with signals after the date files are fetched.
- Open `/insights/:insightId` directly and confirm the permalink resolves after its day payload loads.
- Open `/build` with saved items and confirm queued insight cards still resolve from lazy-loaded data.
