# T15 Plan

Last updated: 2026-03-21

## Scope

Implement the generated artifact writer for:

- `src/generated/briefings-index.json`
- `src/generated/briefings-by-date.json`
- `src/generated/audio-index.json`

This task should:

- read normalized RSS and X outputs
- aggregate them by date into one stable day payload
- emit deterministic JSON matching the locked v1 contract
- preserve day-level X toplines and action items
- produce one day-keyed audio record even when audio files do not exist yet

## Files Expected To Change

- `plans/task-plans/T15_plan.md`
- `src/lib/briefings/generatedArtifacts.ts`
- `src/lib/briefings/generatedArtifacts.test.ts`
- `src/lib/briefings/syncGeneratedContent.ts`

## Test Strategy

1. Add failing tests for mixed RSS + X generation into the three locked artifact shapes.
2. Assert deterministic dates, briefing IDs, insight IDs, and default pending audio records.
3. Re-run the new generator test file plus the existing parser suite.

## Playwright Impact

Not applicable. This task builds local content artifacts and does not change a browser flow yet.

## Manual QA Notes

- Open the generated JSON files and confirm the date keys and source-type grouping look correct.
- Confirm a date with no audio file still emits a visible `pending` audio record instead of disappearing.
