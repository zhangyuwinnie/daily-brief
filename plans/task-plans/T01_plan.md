# T01 Plan

Last updated: 2026-03-21

## Scope

Audit real RSS briefing inputs from `/Users/yuzhang/.openclaw/workspace/briefings` and document the exact section patterns the v1 parser must support.

This task should answer:

- what the stable RSS briefing envelope looks like
- what section labels repeat across files
- what formatting variants and malformed content already exist
- what parser assumptions are safe for Batch 2 fixture and parser work

## Files Expected To Change

- `plans/task-plans/T01_plan.md`
- `plans/input-audits/rss-briefing-v1-audit.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

This is an input-audit documentation task, so strict TDD is not a fit.

Executable verification instead:

1. Read 2-4 real RSS briefing files in full.
2. Run `rg` across the RSS briefing set to confirm repeated section markers and identify format variants.
3. Run `npm run build` for repo-level regression protection before closing the task.

## Playwright Impact

Not applicable. This task does not change user-facing product behavior.

## Manual QA Notes

- Re-open the audit doc and confirm every documented pattern is backed by a real sample file.
- Confirm the edge-case list is concrete enough to drive sanitized fixtures in `T07`.
- Confirm the parser implications stay within the existing MVP scope and do not assume generated audio already exists.
