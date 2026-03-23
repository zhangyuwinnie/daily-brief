# T24 Plan

Last updated: 2026-03-22

## Scope

Restructure `/today` so it matches the PRD sections and drives each section from real generated insight data.

This task should:

- add visible sections for `Top Signals`, `Why It Matters`, `Build This Today`, and `Learn This Next`
- derive those sections from the selected real day dataset
- use conservative fallback rules when optional fields like `whyItMatters`, `buildIdea`, and `learnGoal` are absent
- keep topic filtering, audio state handling, share, and add-to-build behavior working

This task does not yet implement:

- topic route rewiring (`T25+`)
- permalink field expansion (`T27+`)
- persisted build state (`T30+`)
- real audio playback changes (`T36+`)

## Files Expected To Change

- `plans/task-plans/T24_plan.md`
- `src/pages/todaySections.ts`
- `src/pages/todaySections.test.ts`
- `src/pages/TodayPage.tsx`
- `src/pages/TodayPage.test.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add pure-function tests for the Today section builder:
   - top-signal selection
   - fallback ordering when richer fields are missing
   - stable handling when filtered insights are sparse
2. Extend `/today` route tests to assert the four planned section headings render from generated data.
3. Run the targeted tests first and confirm failure.
4. Implement the section builder and page layout changes.
5. Re-run targeted tests, then run `npm run build`.

## Playwright Impact

Not applicable yet.

This changes page structure materially, but Playwright is still not installed in this repo. The strongest current verification remains pure-function tests plus route-level rendering tests and a real browser smoke test.

## Manual QA Notes

- Open `/today` and confirm the page is structured into the four planned sections.
- Check a filtered `/today` state and confirm section content updates from the same filtered day dataset.
- Confirm top-signal cards, compact section cards, and any remaining signal list still read well on mobile.
