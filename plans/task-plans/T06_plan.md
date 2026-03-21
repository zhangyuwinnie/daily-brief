# T06 Plan

Last updated: 2026-03-21

## Scope

Align `src/types/models.ts` and the minimum dependent UI code with the locked v1 `Insight` and `DailyAudio` contracts.

This task should:

- replace the thin prototype model with the v1 normalized model
- add `BriefingRecord`, `InsightState`, and `DailyBriefPageData`
- keep the current mock-driven UI compiling with the new optional fields
- avoid introducing parser or loader logic ahead of later tasks

## Files Expected To Change

- `plans/task-plans/T06_plan.md`
- `src/types/models.ts`
- `src/data/mockInsights.ts`
- `src/data/mockAudio.ts`
- `src/app/App.tsx`
- `src/components/cards/InsightCard.tsx`
- `src/components/cards/BuildItemCard.tsx`
- `src/components/modals/AddToBuildModal.tsx`
- `src/components/audio/AudioPlayer.tsx`
- `src/pages/InsightSharePage.tsx`
- `tasks.md`
- `PROGRESS.md`

## Test Strategy

Strict TDD is not a strong fit here because the immediate value is contract alignment and compile safety rather than new behavioral logic.

Executable verification instead:

1. Update the model definitions first.
2. Fix all dependent compile errors in the mock-driven UI.
3. Run `npm run build` until it passes.

## Playwright Impact

Not applicable for this task. The work is contract and compile alignment, not a new end-to-end interaction flow.

## Manual QA Notes

- Verify the app still renders the current mock-driven routes after type alignment.
- Confirm optional fields now render with graceful fallbacks instead of assuming parser-enriched data exists.
- Confirm the new model names and field names match the locked docs from `T03`, `T04`, and `T05`.
