# T02 Plan

Last updated: 2026-03-21

## Scope

Audit real X briefing inputs from `/Users/yuzhang/.openclaw/workspace/briefings/x_briefing_*.md` and document the exact section patterns the v1 parser must support.

This task should answer:

- what the stable X briefing envelope looks like
- which sections are truly required versus optional in practice
- what bullet and source-link variants already exist
- what parser assumptions are safe before fixture and parser work starts

## Files Expected To Change

- `plans/task-plans/T02_plan.md`
- `plans/input-audits/x-briefing-v1-audit.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

This is an input-audit documentation task, so strict TDD is not a fit.

Executable verification instead:

1. Read 2-4 real X briefing files in full, including at least one variant file.
2. Run `rg` and a small dataset scan across the X briefing set to confirm repeated section markers and identify missing/optional sections.
3. Run `npm run build` for repo-level regression protection before closing the task.

## Playwright Impact

Not applicable. This task does not change user-facing product behavior.

## Manual QA Notes

- Re-open the audit doc and confirm each claimed variant is backed by a real file.
- Confirm the audit clearly distinguishes day-level aggregate sections from item-level tweet bullets.
- Confirm the parser implications are concrete enough to guide `T08`, `T10`, and `T12`.
