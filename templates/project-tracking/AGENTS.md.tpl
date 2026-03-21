# Session Start

- Read `__PROGRESS_FILE__` before doing any work.
- Treat `__PLAN_PATH__` as the source plan when product scope or data model is unclear.

# Vibe Coding Protocol

1. Batch Execution: Work in explicit batches. Do not jump ahead to future phases unless the user asks.
2. Verification First: Before marking a batch complete, run the strongest available verification for the touched area.
3. UI E2E Thinking: For UI-facing work, verify the core user flow end-to-end, not just isolated component rendering. Prefer Playwright for browser-based verification and add or update Playwright coverage when the project has it.
4. State Management: When a batch finishes, update `__PROGRESS_FILE__` with:
   - what changed
   - what was verified
   - what remains
   - the next recommended batch
5. Handoff and QA: On substantial UI changes, provide concrete manual QA steps for the user.
6. Mandatory Pause Between Batches: Finish the requested batch cleanly before starting the next one. Do not silently roll into future work without user approval.

# Working Protocol

1. Keep the product scope narrow until the critical path is working end-to-end.
2. Before polishing UI, prioritize the path that makes the product actually usable.

# Project Guardrails

- Project: `__PROJECT_NAME__`
- Product thesis: `__PROJECT_THESIS__`
- Default implementation order:
  - data/input path
  - normalization / core model
  - persistence
  - app wiring
  - polish

# Code Conventions

- Keep components and modules single-purpose.
- Prefer incremental refactors over wholesale rewrites.
- Avoid locking important product logic inside mock files once real data work begins.

# UI Engineering Rules

1. Design Tokens First: Prefer reusable semantic styles and shared component patterns over one-off hardcoded presentation decisions.
2. Mobile-First Reliability: Ensure critical UI remains usable on small screens before considering the desktop version "done."
3. Interaction Layout Requirements: Keep important controls reachable and visible during common interactions, especially on long or scrollable screens.
4. Regression Protection: Add or update Playwright coverage when the project has it and the change materially affects interaction flow.
5. Consistency With Existing System: Prefer incremental improvements that preserve the repo's established visual and interaction language.

# Current Runbook

- Dev command: `__DEV_COMMAND__`
- Verification command: `__BUILD_COMMAND__`
