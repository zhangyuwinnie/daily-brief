# T13 Plan

Last updated: 2026-03-21

## Scope

Implement the shared normalizer that converts parsed RSS and X outputs into final `Insight` records with deterministic IDs.

## Files Expected To Change

- `plans/task-plans/T13_plan.md`
- `src/lib/briefings/normalizeParsedBriefing.ts`
- `src/lib/briefings/normalizeParsedBriefing.test.ts`

## Test Strategy

1. Assert both parser outputs normalize into the same final `Insight` shape.
2. Assert IDs are deterministic and source-specific.
3. Re-run the full parser suite.

## Playwright Impact

Not applicable.

## Manual QA Notes

- Confirm the normalizer respects the locked `T03` mapping and does not invent missing fields.
