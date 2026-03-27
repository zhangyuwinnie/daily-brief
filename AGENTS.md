# Session Start

- Read `PROGRESS.md` before doing any work.
- Read `tasks.md` to understand the queued implementation work.
- Treat `plans/mvp-architecture.md` as the source plan when product scope or data model is unclear.
- Treat `plans/mvp-prd.md` as the execution-ready product and engineering plan when implementation order, architecture direction, or test scope is unclear.
- If the user says `continue task` or similar, do not ask what to do next by default:
  - inspect `PROGRESS.md` for the recommended batch
  - inspect `tasks.md`
  - choose the first unchecked and unblocked task in the current approved batch
  - if the current batch is fully done, stop and ask for approval before starting the next batch

# Task Execution Protocol

When taking a task from `tasks.md`, use this workflow:

1. Plan
   - Create a task plan file before implementation.
   - Preferred location: `plans/task-plans/<TASK_ID>_plan.md`.
   - The plan must include:
     - scope
     - files expected to change
     - test strategy
     - Playwright impact
     - manual QA notes
2. Tests first
   - Use TDD for code changes whenever practical.
   - Write or update automated tests first and confirm they fail for the intended reason before implementing.
   - If the task is documentation-only or otherwise not a real TDD fit, state the reason explicitly and use the strongest executable verification available instead.
3. Implement
   - Make the minimum change that satisfies the task and stays within the current batch.
4. Run tests
   - Run the relevant automated tests until they all pass.
   - In this repo, still run `npm run build` before calling the task complete unless a stronger targeted verification fully supersedes it.
5. Playwright
   - For UI-facing changes, add or update Playwright coverage and run the affected end-to-end tests.
   - If Playwright is not installed yet but the task materially changes the user flow, install or add it as part of the relevant batch instead of skipping browser coverage silently.
   - If the task is not UI-facing, explicitly say Playwright is not applicable.
6. User-runnable commands
   - List the commands the user can run to verify the task locally.
   - Test those commands yourself and make sure the app loads or the task behavior is observable.
7. Code review
   - Run a best-practices review before wrapping up.
   - Use an available review or best-practices skill if the environment provides one.
   - If no such skill exists in the environment, perform a manual review with the same standard.
8. Commit
   - If this directory is a git repo and the task is complete, create a concise commit message.
   - If this directory is not a git repo, note that commit was not possible instead of failing silently.
9. Update `tasks.md`
   - Mark completed work done.
   - Keep future tasks untouched unless the plan genuinely changed.
10. Update `PROGRESS.md`
   - Record:
     - what changed
     - what was verified
     - key lesson or risk
   - Do not duplicate task-by-task status already tracked in `tasks.md`.
   - If `tasks.md` already makes the next step obvious, do not restate it in detail here.
11. Final handoff
   - start app for the user
   - verify the target page loads in a real browser
   - do not use a sandboxed browser for final handoff verification
   - leave the server running
   - pause for feedback

# Vibe Coding Protocol

1. Batch Execution: Work in explicit batches. Do not jump ahead to future phases unless the user asks.
2. Verification First: Before marking a batch complete, run the strongest available verification for the touched area. In this repo, default to `npm run build` unless a better targeted check exists.
3. UI E2E Thinking: For UI-facing work, verify the core user flow end-to-end, not just isolated component rendering. Prefer Playwright for browser-based verification and add or update Playwright coverage when the project has it.
4. State Management: When a batch finishes, update `PROGRESS.md` with:
   - what changed
   - what was verified
   - what remains
   - the next recommended batch
5. Handoff and QA: On substantial UI changes, provide concrete manual QA steps for the user.
6. Mandatory Pause Between Batches: Finish the requested batch cleanly before starting the next one. Do not silently roll into future work without user approval.

# Task Selection Rules

1. Default to the first unchecked task in the active batch from `tasks.md`.
2. Respect dependencies. If a task is blocked, move to the next unblocked task in the same batch.
3. Do not jump into a future batch just because it looks easier.
4. If a task plan reveals that `tasks.md` ordering is wrong, update `tasks.md` before implementation and note why in `PROGRESS.md`.
5. One task at a time unless the user explicitly asks for a larger batch.

# Working Protocol

1. Prefer shipping the data path before polishing UI:
   - Markdown inputs
   - parser + normalizer
   - stored structured data
   - UI consuming real data
   - audio metadata hookup
2. Keep the MVP narrow. Do not add search, auth, CMS, analytics, or social features unless explicitly requested.
3. Audio is pre-generated outside the web app. The web app should read metadata and play files, not synthesize audio on demand.

# Project Guardrails

- Product thesis: personal AI learning system for agent builders, not a Markdown archive.
- Core loop: `brief -> build -> learn -> reflect`.
- Primary user value:
  - reduce AI information overload
  - consume quickly via audio or scan
  - convert signals into concrete build/learn actions
- MVP surfaces:
  - `/today`
  - `/build`
  - `/topics`
  - `/insights/:insightId`
- Preferred implementation order:
  - parser
  - normalized model
  - persistence
  - real-data UI
  - audio metadata integration

# Code Conventions

- Keep React components functional and single-purpose.
- Prefer semantic types over ad hoc object shapes.
- Avoid hardcoding product logic into mock files once real parsing starts.
- Do not replace working UI wholesale when an incremental refactor is enough.

# UI Engineering Rules

1. Design Tokens First: Prefer reusable semantic styles and shared component patterns over one-off hardcoded presentation decisions.
2. Mobile-First Reliability: Ensure critical UI remains usable on small screens before considering the desktop version "done."
3. Interaction Layout Requirements: Keep important controls reachable and visible during common interactions, especially on long or scrollable screens.
4. Regression Protection: Add or update Playwright coverage when the project has it and the change materially affects interaction flow.
5. Consistency With Existing System: Prefer incremental improvements that preserve the repo's established visual and interaction language.

# Current Runbook

- Dev server: `npm run dev`
- Production build check: `npm run build`
- If local `npm` uses a broken default Node install, prefer Node `v22.17.1` from `/Users/yuzhang/.nvm/versions/node/v22.17.1/bin` when running repo commands.
