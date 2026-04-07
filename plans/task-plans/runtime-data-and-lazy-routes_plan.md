# Runtime Data And Lazy Routes Plan

## Scope

- move generated JSON consumption from compile-time imports under `src/generated/` to runtime fetches from `public/generated/`
- keep the existing page behavior and typed selectors intact after the data source move
- lazy load route modules so non-active pages stop inflating the initial JavaScript bundle
- preserve existing local sync workflow so upstream briefing refresh still rewrites the frontend-readable generated JSON

## Files Expected To Change

- `scripts/sync-generated-content.ts`
- `src/lib/briefings/generatedArtifacts.ts`
- `src/lib/briefings/generatedContentLoader.ts`
- `src/lib/briefings/generatedContentLoader.test.ts`
- `src/app/App.tsx`
- `src/app/router.tsx`
- `src/app/outlet-context.ts`
- `src/app/App.integration.test.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/RightRail.tsx`
- `src/pages/TodayPage.tsx`
- `src/pages/TopicsPage.tsx`
- `src/pages/InsightSharePage.tsx`
- `plans/generated-content-workflow.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

- update loader tests to cover runtime fetch of the three generated JSON files
- update app integration tests to mock `fetch` and verify the existing read/build/permalink flows still work after async data loading
- run targeted Vitest suites for loader and app integration
- run full `npm test`
- run `npm run build` and confirm bundle splitting improves the current oversized entry chunk

## Playwright Impact

- no user-facing flow changes are intended, so existing Playwright coverage should remain valid
- Playwright updates are not expected unless the async loading change introduces a visible regression in route boot or navigation timing

## Manual QA Notes

- load `/today` and confirm it shows a loading state briefly, then renders the latest generated brief
- open `/topics` and confirm the page still filters correctly while the initial JS payload is reduced
- open `/insights/:insightId` directly and confirm the permalink still resolves after a hard refresh
- inspect the network tab and confirm generated JSON is fetched from `/generated/*.json` rather than bundled into the main app chunk
