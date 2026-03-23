# Daily Brief MVP Tasks

Last updated: 2026-03-23
Source docs:

- `plans/mvp-prd.md`
- `plans/mvp-architecture.md`
- `PROGRESS.md`

Execution rule:

- complete one batch at a time
- run verification before marking a batch done
- update `PROGRESS.md` after each finished batch
- pause between batches for user approval

## Batch 1: Data Contract and Sample Audit

- [x] `T01` Audit 2-4 real RSS briefing files and record exact section patterns.
  Acceptance: documented section names, repeated patterns, and edge cases for RSS inputs.
- [x] `T02` Audit 2-4 real X briefing files and record exact section patterns.
  Acceptance: documented section names, repeated patterns, and edge cases for X inputs.
- [x] `T03` Decide the v1 normalized field mapping from raw sections to `Insight`.
  Acceptance: every target field has a source rule or explicit `optional` decision.
- [x] `T04` Decide the v1 audio metadata manifest shape.
  Acceptance: fields for status, url, duration, provider, and failure reason are specified.
- [x] `T05` Decide the generated artifact layout.
  Acceptance: exact file names and whether output lives under `src/generated/` or `public/generated/` are locked.
- [x] `T06` Expand `src/types/models.ts` or replace it with the v1 normalized model.
  Depends on: `T03`, `T04`
  Acceptance: `Insight`, `DailyAudio`, `InsightState`, and page-level loader types compile.

## Batch 2: Parser and Normalizer

- [x] `T07` Create sanitized parser fixtures from real RSS briefing examples.
  Depends on: `T01`
  Acceptance: fixture files cover at least one normal case and one edge case.
- [x] `T08` Create sanitized parser fixtures from real X briefing examples.
  Depends on: `T02`
  Acceptance: fixture files cover at least one normal case and one edge case.
- [x] `T09` Add parser tests for RSS briefing extraction.
  Depends on: `T07`, `T06`
  Acceptance: tests assert title, summary, take, topics, and score extraction behavior.
- [x] `T10` Add parser tests for X briefing extraction.
  Depends on: `T08`, `T06`
  Acceptance: tests assert title, summary, take, topics, and source link extraction behavior.
- [x] `T11` Implement RSS briefing parser.
  Depends on: `T09`
  Acceptance: parser returns structured intermediate records and passes tests.
- [x] `T12` Implement X briefing parser.
  Depends on: `T10`
  Acceptance: parser returns structured intermediate records and passes tests.
- [x] `T13` Implement shared normalizer to produce final `Insight` records.
  Depends on: `T11`, `T12`
  Acceptance: both raw parser outputs normalize into one shared shape with deterministic IDs.
- [x] `T14` Implement warning collection for malformed sections.
  Depends on: `T11`, `T12`, `T13`
  Acceptance: parsing a broken section reports warnings without crashing the whole run.

## Batch 3: Generated Data Pipeline

- [x] `T15` Implement generated artifact writer for briefing index, daily records, and audio index.
  Depends on: `T13`, `T14`, `T05`
  Acceptance: command writes valid JSON files in the agreed location.
- [x] `T16` Add a sync command to package scripts.
  Depends on: `T15`
  Acceptance: one documented npm script regenerates content artifacts locally.
- [x] `T17` Fail loudly when expected generated artifacts are missing or invalid.
  Depends on: `T15`
  Acceptance: broken generation exits non-zero and explains what file or shape is wrong.
- [x] `T18` Document the external input paths and generation workflow.
  Depends on: `T16`
  Acceptance: another engineer can regenerate local content without reading source code.

## Batch 4: Real Data on `/today`

- [x] `T19` Create frontend loaders for daily data, available dates, and insight lookup.
  Depends on: `T15`, `T06`
  Acceptance: loader APIs return typed data without importing mock files.
- [x] `T20` Remove `mockInsights` and `mockAudio` from `/today`.
  Depends on: `T19`
  Acceptance: `/today` renders from generated data only.
- [x] `T20a` Link `/today` insight titles to persisted `sourceUrl` values when present.
  Depends on: `T20`
  Acceptance: cards open the original source in a new tab without reintroducing mock content.
- [x] `T21` Add recent date switching backed by available generated dates.
  Depends on: `T19`
  Acceptance: switching date updates audio and insight content together.
- [x] `T22` Add explicit empty and error states for missing day or missing audio.
  Depends on: `T20`, `T21`
  Acceptance: the page never silently renders fake content.
- [x] `T23` Refactor `InsightCard` to use the richer v1 fields where available.
  Depends on: `T20`, `T06`
  Acceptance: card supports summary, take, why-it-matters/build idea cues, topics, and effort cleanly.
- [x] `T24` Implement `/today` sections for top signals, why it matters, build this today, and learn this next.
  Depends on: `T20`, `T23`
  Acceptance: the page structure matches the PRD and real data drives each section.

## Batch 5: Real Data on `/topics` and `/insights/:insightId`

- [x] `T25` Replace mock topic sourcing with normalized topics from generated data.
  Depends on: `T19`
  Acceptance: topic chips and filtered content use real data.
- [x] `T26` Make topic chips on `/topics` directly interactive.
  Depends on: `T25`
  Acceptance: topic changes can be triggered from the page itself, not just the right rail.
- [x] `T27` Replace permalink page mock dependency with real insight lookup.
  Depends on: `T19`
  Acceptance: refresh on `/insights/:insightId` still loads the insight.
- [x] `T28` Add missing permalink fields: source link, why it matters, build idea.
  Depends on: `T27`, `T06`
  Acceptance: permalink page exposes the full MVP share payload.
- [x] `T29` Improve not-found handling for missing insight IDs.
  Depends on: `T27`
  Acceptance: invalid URLs produce a clear recovery path.

## Batch 6: Persisted Personal State

- [x] `T30` Introduce a localStorage-backed `InsightState` store.
  Depends on: `T06`
  Acceptance: state can be read, written, and versioned under one stable key.
- [x] `T31` Replace in-memory `BuildItem[]` state with `InsightState`-driven derived build data.
  Depends on: `T30`, `T19`
  Acceptance: refresh preserves queue membership and status.
- [x] `T32` Add the `Interested` status to the state model and UI flows.
  Depends on: `T31`
  Acceptance: the model supports all planned statuses even if the UI only emphasizes a subset initially.
- [x] `T33` Update add-to-build behavior to create or update `InsightState`.
  Depends on: `T31`
  Acceptance: duplicate adds do not create duplicate queue records.
- [x] `T34` Update `/build` to render from persisted derived items.
  Depends on: `T31`, `T33`
  Acceptance: build queue cards come from real insight data plus local personal state.
- [x] `T35` Add corruption recovery for invalid saved state.
  Depends on: `T30`
  Acceptance: invalid local storage resets safely without breaking the app.

## Batch 7: Real Audio Wiring

- [x] `T36` Replace mock audio metadata with generated audio manifest loading.
  Depends on: `T19`, `T04`
  Acceptance: `/today` reads real `pending`, `ready`, and `failed` audio states.
- [x] `T37` Update `AudioPlayer` to support real playback URL and non-ready states.
  Depends on: `T36`
  Acceptance: no simulated progress remains when audio is not actually playable.
- [x] `T38` Add visible copy for failed audio generation and missing URLs.
  Depends on: `T37`
  Acceptance: audio issues are explicit and actionable.

## Batch 8: Testing and Hardening

- [x] `T39` Add tests for generated data loaders and date fallback behavior.
  Depends on: `T19`, `T21`, `T22`
  Acceptance: latest-date fallback and missing-date handling are covered.
- [x] `T40` Add tests for the `InsightState` store and corruption recovery.
  Depends on: `T30`, `T35`
  Acceptance: invalid payload, missing payload, and upgrade cases are covered.
- [x] `T41` Add UI integration tests for `/today`, `/topics`, and permalink loading.
  Depends on: `T24`, `T26`, `T28`
  Acceptance: tests cover core real-data rendering and basic user interaction.
- [x] `T42` Add E2E coverage for the core loop: Today -> Add to Build -> Refresh -> Build page.
  Depends on: `T34`, `T37`
  Acceptance: the core user flow passes in a browser test.
- [x] `T43` Add E2E coverage for date switching and permalink reloads.
  Depends on: `T21`, `T27`
  Acceptance: changing dates and reloading permalink pages remain stable.

## Batch 9: Cleanup and Deletion

- [ ] `T44` Remove obsolete mock content files and mock-only code paths.
  Depends on: `T20`, `T25`, `T27`, `T36`
  Acceptance: no product page imports mock briefing or audio data.
- [ ] `T45` Remove or rework presentational-only controls that remain disconnected.
  Depends on: `T24`, `T26`, `T34`
  Acceptance: all visible controls on MVP routes are either working or intentionally removed.
- [ ] `T46` Audit copy and empty states against the MVP positioning.
  Depends on: `T22`, `T29`, `T38`
  Acceptance: user-facing copy reflects the product as a personal AI learning system, not a generic content app.

## Suggested Stop Points

- Stop after Batch 1 to confirm the schema and file layout.
- Stop after Batch 3 to inspect generated artifacts before wiring the UI.
- Stop after Batch 4 to validate the first real end-to-end read flow.
- Stop after Batch 6 to confirm the local persistence model before polishing.

## Verification By Batch

- Batch 1: typecheck if model files changed
- Batch 2: parser test suite
- Batch 3: sync command + `npm run build`
- Batch 4: `npm run build` and manual `/today` smoke test
- Batch 5: `npm run build` and permalink/topic smoke test
- Batch 6: state-store tests + `npm run build`
- Batch 7: targeted audio tests + `npm run test:e2e` + `npm run build` and manual audio state smoke test
- Batch 8: full automated test pass + `npm run build`
- Batch 9: `npm run build` and manual regression sweep
