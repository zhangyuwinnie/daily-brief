# T03 Plan

Last updated: 2026-03-21

## Scope

Decide the v1 normalized field mapping from audited RSS and X briefing inputs into the shared `Insight` model.

This task should answer:

- what the normalized `Insight` unit is for RSS versus X
- which fields are required, derived, optional, or intentionally deferred
- how each target field maps from real source sections
- what deterministic fallback rules are acceptable for v1

## Files Expected To Change

- `plans/task-plans/T03_plan.md`
- `plans/data-contracts/insight-v1-field-mapping.md`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

This is a schema and mapping decision task, so strict TDD is not a fit.

Executable verification instead:

1. Re-read the audited RSS and X input docs.
2. Re-read the target `Insight` contract in `plans/mvp-prd.md` and the current `src/types/models.ts`.
3. Confirm every normalized field has one of:
   - direct source mapping
   - deterministic derived rule
   - explicit `optional in v1` decision
4. Run `npm run build` for repo-level regression protection before closing the task.

## Playwright Impact

Not applicable. This task does not change user-facing product behavior.

## Manual QA Notes

- Re-open the mapping doc and verify there are no unmapped `Insight` fields.
- Confirm the X mapping does not pretend the file is shaped like RSS.
- Confirm fields without stable upstream support are explicitly marked optional instead of guessed.
