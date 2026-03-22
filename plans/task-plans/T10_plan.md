# T10 Plan

Last updated: 2026-03-21

## Scope

Add parser tests for X briefing extraction before finalizing the X parser behavior.

## Files Expected To Change

- `plans/task-plans/T10_plan.md`
- `src/lib/briefings/parseXBriefing.test.ts`

## Test Strategy

This task is itself the test-first step.

Executable verification:

1. Assert title, summary, take, topics, source-link, and day-score extraction behavior.
2. Assert optional X sections do not crash parsing.
3. Run the parser test suite.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the tests preserve the X day-level structure and real bullet variants.
