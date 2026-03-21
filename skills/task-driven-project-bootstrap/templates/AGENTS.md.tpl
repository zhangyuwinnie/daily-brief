# Session Start

- Read `__PROGRESS_FILE__` before doing any work.
- Read `__TASKS_FILE__` before doing any work.
- Treat `__PLAN_PATH__` as the source plan when product scope or data model is unclear.
- If the user says `continue task` or similar:
  - inspect `__PROGRESS_FILE__` for the active batch
  - inspect `__TASKS_FILE__`
  - choose the first unchecked and unblocked task in the approved batch
  - stop between batches unless the user approves continuing

# First Principles

请使用第一性原理思考。你不能总是假设我非常清楚自己想要什么和该怎么得到。请保持审慎，从原始需求和问题出发，如果动机和目标不清晰，停下来和我讨论。如果目标清晰但是路径不是最短，告诉我，并且建议更好的办法。

# Task Execution Protocol

1. Create `plans/task-plans/<TASK_ID>_plan.md` before implementation.
2. Prefer TDD where practical; if not practical, state why and use the strongest executable verification available.
3. Implement the minimum change that satisfies the task.
4. Run the relevant tests and then run `__BUILD_COMMAND__` unless a stronger verification supersedes it.
5. For UI-facing changes, add or update Playwright coverage and run `__E2E_COMMAND__` or the affected subset.
6. List user-runnable verification commands and test them yourself.
7. Run `__REVIEW_COMMAND__` or perform an equivalent manual review.
8. If the repo is a git repo and the task is complete, create a concise commit.
9. Update `__TASKS_FILE__`.
10. Update `__PROGRESS_FILE__` with:
   - what changed
   - what was verified
   - lesson learned
   - what remains
   - next recommended task or batch
11. Open or run the app and wait for user feedback before starting the next task.

# Working Protocol

1. Work in explicit batches.
2. Do not jump into a future batch without approval.
3. Prefer shipping the real data path before polishing.
4. Keep the MVP narrow unless the user explicitly expands scope.

# Project Guardrails

- Project: `__PROJECT_NAME__`
- Product thesis: `__PROJECT_THESIS__`
- Default implementation order:
  - data/input path
  - normalization / core model
  - persistence
  - app wiring
  - E2E coverage
  - polish

# Current Runbook

- Dev command: `__DEV_COMMAND__`
- Verification command: `__BUILD_COMMAND__`
- E2E command: `__E2E_COMMAND__`
- Review command: `__REVIEW_COMMAND__`
