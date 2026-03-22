# T17 Plan

Last updated: 2026-03-21

## Scope

Fail loudly when generated artifacts are missing or invalid.

This task should:

- validate the in-memory generated shapes before writing
- stop the sync command with a non-zero exit when required artifacts are invalid
- report which file or field failed validation

## Files Expected To Change

- `plans/task-plans/T17_plan.md`
- `src/lib/briefings/generatedArtifacts.ts`
- `src/lib/briefings/generatedArtifacts.test.ts`
- `src/lib/briefings/syncGeneratedContent.ts`
- `scripts/sync-generated-content.ts`

## Test Strategy

1. Add failing validation tests for missing day payloads, mismatched audio dates, invalid audio URLs, and empty day content.
2. Confirm the sync command exits non-zero when validation fails.
3. Re-run the generator suite after the validator is wired in.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the sync command prints a human-readable failure reason instead of silently skipping bad data.
