# T23 Plan

Last updated: 2026-03-22

## Scope

Refactor `InsightCard` so it presents the richer normalized insight fields cleanly when they exist, without inventing fake content when they do not.

This task should:

- keep summary and take as the primary always-on card content
- surface `whyItMatters`, `buildIdea`, `learnGoal`, and `effortEstimate` when present
- avoid low-signal placeholders like `TBD` on cards that do not have richer metadata yet
- preserve existing add/share/source-link behavior

This task does not yet implement:

- Today page section-level restructuring (`T24`)
- topic route rewiring or permalink expansion (`T25+`)
- persistence changes or audio playback changes

## Files Expected To Change

- `plans/task-plans/T23_plan.md`
- `src/components/cards/InsightCard.tsx`
- `src/components/cards/InsightCard.test.tsx`
- `src/pages/TodayPage.test.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Use TDD.

1. Add `InsightCard` render tests that assert richer optional fields render when present.
2. Add a fallback test that cards without optional metadata do not show fake `TBD` effort or generic filler copy.
3. Run the targeted card/page Vitest files first and confirm failure.
4. Refactor the card layout with minimal behavior change outside the new fields.
5. Re-run targeted tests, then keep the route-level tests green for `/today`.

## Playwright Impact

Not applicable yet.

This is a presentational card refactor within an existing route. Route/component Vitest coverage remains the strongest practical protection until the repo adds Playwright in the later testing batch.

## Manual QA Notes

- Open `/today` on a generated date and confirm cards still read well on mobile and desktop.
- Check that cards with sparse generated fields do not show fake placeholder content.
- Confirm source links, add-to-build, and share controls still behave as before.
