# T07 Plan

Last updated: 2026-03-21

## Scope

Create sanitized parser fixtures from real RSS briefing examples.

## Files Expected To Change

- `plans/task-plans/T07_plan.md`
- `src/lib/briefings/fixtures/rss-normal.md`
- `src/lib/briefings/fixtures/rss-edge.md`

## Test Strategy

Fixture task, so strict TDD is not the primary fit.

Executable verification:

1. Use the RSS audit as the source of truth.
2. Ensure fixtures cover one normal blockquote example and one edge multiline / malformed example.
3. Verify later parser tests load these fixtures successfully.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the fixtures preserve the real markdown structure while removing raw upstream specifics.
