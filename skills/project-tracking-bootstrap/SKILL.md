---
name: project-tracking-bootstrap
description: Create AGENTS.md and progress tracking docs for a new or existing software project. Use when the user wants a reusable setup for project tracking, session handoff, progress logging, or a standard AGENTS.md/PROGRESS.md workflow across repositories.
---

# Project Tracking Bootstrap

Use this skill when a user wants to:

- add `AGENTS.md` to a repo
- add `PROGRESS.md` or `progress.md` to a repo
- standardize project handoff / session-start tracking
- reuse the same tracking setup across multiple projects

Do not use this skill when the user wants `tasks.md`, strict `continue task` behavior, or a task execution protocol with TDD / E2E / commit workflow. Use `task-driven-project-bootstrap` for that.

## What This Skill Produces

A lightweight tracking system with:

- `AGENTS.md`:
  - session start rule
  - working protocol
  - project guardrails
  - runbook commands
- `PROGRESS.md` or `progress.md`:
  - current status
  - locked decisions
  - completed work
  - known gaps
  - next recommended batch
  - verification log

## Preferred Workflow

1. Identify the target project directory.
2. Gather or infer:
   - project name
   - main plan path
   - preferred progress filename
   - dev command
   - verification command
   - one-line product thesis
   - next recommended batch
3. Run the bundled bootstrap script:

```bash
bash skills/project-tracking-bootstrap/scripts/bootstrap_project_tracking.sh TARGET_DIR \
  --project-name "Project Name" \
  --plan-path "plans/mvp.md" \
  --progress-file "PROGRESS.md" \
  --dev-command "pnpm dev" \
  --build-command "pnpm build" \
  --thesis "One-line product thesis." \
  --next-batch "Highest-priority next implementation batch."
```

4. If the target repo already has tracking docs, do not overwrite blindly.
   - Read the current docs.
   - Merge useful project-specific content.
   - Use `--force` only when the replacement is clearly intended.
5. After creation, read the generated files and adapt them to the repo's actual state.

## Guidance

- Prefer `PROGRESS.md` when establishing the convention from scratch.
- Prefer `progress.md` only when the repo already has an established lowercase convention.
- Keep `Locked Decisions` short and durable.
- Keep `What Is Actually True In Code` factual.
- Keep `Next Recommended Batch` concrete and immediately actionable.
- Do not let the progress file turn into a vague product memo.

## Bundled Resources

- Bootstrap script:
  - `skills/project-tracking-bootstrap/scripts/bootstrap_project_tracking.sh`
- Templates:
  - `skills/project-tracking-bootstrap/templates/AGENTS.md.tpl`
  - `skills/project-tracking-bootstrap/templates/PROGRESS.md.tpl`
