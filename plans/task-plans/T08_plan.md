# T08 Plan

Last updated: 2026-03-21

## Scope

Create sanitized parser fixtures from real X briefing examples.

## Files Expected To Change

- `plans/task-plans/T08_plan.md`
- `src/lib/briefings/fixtures/x-normal.md`
- `src/lib/briefings/fixtures/x-edge.md`

## Test Strategy

Fixture task, so strict TDD is not the primary fit.

Executable verification:

1. Use the X audit as the source of truth.
2. Ensure fixtures cover normal grouped sections and real bullet syntax variants.
3. Verify later parser tests load these fixtures successfully.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the fixtures preserve day-level X structure instead of faking RSS-like entries.
