# T09 Plan

Last updated: 2026-03-21

## Scope

Add parser tests for RSS briefing extraction before finalizing the RSS parser behavior.

## Files Expected To Change

- `plans/task-plans/T09_plan.md`
- `src/lib/briefings/parseRssBriefing.test.ts`

## Test Strategy

This task is itself the test-first step.

Executable verification:

1. Assert title, summary, take, topics, and score extraction behavior.
2. Assert malformed RSS sections produce warnings instead of crashing the whole parse.
3. Run the parser test suite.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the tests encode the audited format variants, not invented formats.
