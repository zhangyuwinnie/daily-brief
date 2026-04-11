# Archive Automation Tracking Plan

## Scope

- Copy the reviewed automation plan into the repo under `plans/`.
- Archive completed MVP task and progress history into `plans/archive/`.
- Replace the active `tasks.md` and `PROGRESS.md` with shorter, automation-focused versions.
- Add a minimal `AGENTS.md` note so archive location is discoverable without changing the active workflow.

## Files Expected To Change

- `AGENTS.md`
- `PROGRESS.md`
- `tasks.md`
- `plans/automation/daily-brief-automation-phase0.md`
- `plans/archive/tasks.completed-batches-01-13.md`
- `plans/archive/progress.history-pre-automation.md`

## Test Strategy

- Documentation-only task, so TDD is not a real fit.
- Verify all new files exist and contain the expected sections.
- Verify active `tasks.md` still presents one current batch flow.
- Verify active `PROGRESS.md` still presents one current status + next batch flow.
- Verify `AGENTS.md` still points to active `PROGRESS.md` / `tasks.md` and only adds archive discoverability.

## Playwright Impact

- Not applicable. No UI or browser behavior changes.

## Manual QA Notes

- Open the active `tasks.md` and confirm it is short and clearly points at the automation plan.
- Open the active `PROGRESS.md` and confirm historical MVP detail moved to archive.
- Open the archive files and confirm prior MVP context remains recoverable.
