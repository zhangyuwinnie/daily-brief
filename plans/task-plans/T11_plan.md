# T11 Plan

Last updated: 2026-03-21

## Scope

Implement the RSS briefing parser against the locked fixture and test expectations.

## Files Expected To Change

- `plans/task-plans/T11_plan.md`
- `src/lib/briefings/parseRssBriefing.ts`
- `src/lib/briefings/topicRules.ts`
- `src/lib/briefings/types.ts`

## Test Strategy

1. Make the RSS tests pass.
2. Preserve warning collection for malformed sections.
3. Re-run the full parser suite.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the parser splits on H2 entries, not on `---`.
