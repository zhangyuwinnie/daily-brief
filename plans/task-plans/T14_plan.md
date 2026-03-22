# T14 Plan

Last updated: 2026-03-21

## Scope

Implement warning collection so malformed sections report issues without crashing the whole parse.

## Files Expected To Change

- `plans/task-plans/T14_plan.md`
- `src/lib/briefings/types.ts`
- `src/lib/briefings/parseRssBriefing.ts`
- `src/lib/briefings/parseXBriefing.ts`
- `src/lib/briefings/normalizeParsedBriefing.test.ts`

## Test Strategy

1. Assert malformed sections emit warnings.
2. Assert valid sections in the same file still parse and normalize.
3. Re-run the parser suite and production build.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm warnings are explicit enough to fail loudly later in generator and sync flows.
