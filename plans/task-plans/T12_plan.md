# T12 Plan

Last updated: 2026-03-21

## Scope

Implement the X briefing parser against the locked fixture and test expectations.

## Files Expected To Change

- `plans/task-plans/T12_plan.md`
- `src/lib/briefings/parseXBriefing.ts`
- `src/lib/briefings/topicRules.ts`
- `src/lib/briefings/types.ts`

## Test Strategy

1. Make the X tests pass.
2. Preserve support for optional sections and bullet syntax variants.
3. Re-run the full parser suite.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the parser emits one structured day document, not fake RSS-style entries.
