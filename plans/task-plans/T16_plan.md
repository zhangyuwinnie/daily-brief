# T16 Plan

Last updated: 2026-03-21

## Scope

Add one documented local sync command that regenerates content artifacts from the upstream briefing directory.

This task should:

- wrap the generator in one stable npm script
- make the script work under the repo's preferred Node `v22.17.1` setup
- keep the script explicit about input and output locations

## Files Expected To Change

- `plans/task-plans/T16_plan.md`
- `package.json`
- `scripts/sync-generated-content.ts`
- `src/lib/briefings/syncGeneratedContent.ts`

## Test Strategy

1. Use the generator tests from `T15` for functional coverage.
2. Run the actual npm sync command against the real local briefing directory.
3. Confirm the required JSON artifacts are written successfully.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Run the sync command manually and inspect `src/generated/`.
- Confirm the command output is explicit about what it read and wrote.
