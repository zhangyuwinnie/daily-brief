# T18 Plan

Last updated: 2026-03-21

## Scope

Document the upstream input paths and the local regeneration workflow for generated content.

This task should:

- explain where briefing markdown files live
- explain where generated JSON and audio files are expected to live
- document the one-command sync flow and expected output
- explain the current no-audio-yet behavior

## Files Expected To Change

- `plans/task-plans/T18_plan.md`
- `plans/generated-content-workflow.md`
- `PROGRESS.md`
- `tasks.md`

## Test Strategy

Strict TDD is not the right fit for documentation.

Executable verification instead:

1. Run the documented sync command exactly as written.
2. Run `npm run build`.
3. Confirm the generated files and command output match the documented workflow.

## Playwright Impact

Not applicable. Batch 3 is data-pipeline work, not a UI behavior change.

## Manual QA Notes

- Another engineer should be able to regenerate artifacts without reading parser source files.
