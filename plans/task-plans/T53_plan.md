# T53 Plan

Last updated: 2026-04-07

## Scope

Measure the remaining `/today` interaction jank on a production build and land only the smallest style change justified by the trace.

This task will:

- capture a production baseline for `/today`
- confirm whether paint/compositing remains the dominant bottleneck after the recent lazy-loading work
- target the most likely expensive surfaces first:
  - `src/components/layout/AppShell.tsx`
  - `src/components/cards/InsightCard.tsx`
- keep the first pass narrowly scoped to `/today`-relevant presentation costs

This task will not:

- broaden into `/topics` loading or unrelated route work
- redesign the app beyond performance-motivated simplification
- chase secondary suspects unless the primary change is clearly insufficient

## Files Expected To Change

- `plans/task-plans/T53_plan.md`
- `tasks.md`
- `src/components/layout/AppShell.tsx`
- `src/components/cards/InsightCard.tsx`
- `PROGRESS.md`

Additional files only if verification or trace notes require them.

## Test Strategy

1. Run `npm run build` to establish a production baseline.
2. Start a local preview server from the production output.
3. Capture a before trace for `/today` covering:
   - initial render
   - one steady scroll through visible cards
   - one hover interaction on a card CTA
4. If the trace indicates paint/composite pressure from the shell/cards, apply the smallest reduction.
5. Rebuild and capture an after trace for the same interaction path.
6. Run `npm test`.
7. Run `npm run test:e2e` only if the landed visual change plausibly affects browser interaction flows.

## Playwright Impact

Playwright is secondary for this task.

The primary evidence is the production trace. Existing Playwright coverage will be rerun only if the landing change materially affects visible route interaction.

## Manual QA Notes

- Open `/today` on the production build in a real browser.
- Compare perceived scroll smoothness before and after the change.
- Check that cards still read clearly and the shell still fits the existing visual system.
- Verify the right rail and CTA controls remain visually coherent after the blur reduction.
