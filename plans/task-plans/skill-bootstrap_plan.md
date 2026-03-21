# Skill Bootstrap Plan

Last updated: 2026-03-21

## Scope

Create a new reusable skill that bootstraps a task-driven project workflow across repos.

The new skill should generate:

- `AGENTS.md`
- `PROGRESS.md`
- `tasks.md`

It should preserve the existing `project-tracking-bootstrap` skill and only tighten its scope description so the two skills do not overlap ambiguously.

## Files Expected To Change

- `skills/project-tracking-bootstrap/SKILL.md`
- `skills/task-driven-project-bootstrap/SKILL.md`
- `skills/task-driven-project-bootstrap/scripts/bootstrap_task_driven_project.sh`
- `skills/task-driven-project-bootstrap/templates/AGENTS.md.tpl`
- `skills/task-driven-project-bootstrap/templates/PROGRESS.md.tpl`
- `skills/task-driven-project-bootstrap/templates/tasks.md.tpl`
- `PROGRESS.md`

## Test Strategy

This task is mostly skill packaging and templating, so strict TDD is not a strong fit.

Executable verification instead:

1. Run the new bootstrap script against a temp directory.
2. Verify the generated files exist and contain the key expected sections.
3. Run `npm run build` for repo-level regression protection.

## Playwright Impact

Not applicable. This task does not change the product UI.

## Manual QA Notes

- Inspect the generated temp skill output for clarity and completeness.
- Confirm the old and new skill boundaries are understandable from their `SKILL.md` files.
