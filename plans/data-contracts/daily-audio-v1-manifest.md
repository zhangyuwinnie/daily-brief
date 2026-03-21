# DailyAudio V1 Manifest

Last updated: 2026-03-21
Task: `T04`

## Scope

Lock the v1 audio metadata manifest shape the frontend will read for each day.

Current real-world constraint:

- briefing markdown files already exist under `/Users/yuzhang/.openclaw/workspace/briefings`
- audio files are not guaranteed to exist yet

This contract must therefore represent:

- a day with no generated audio yet
- a day whose generation failed
- a day whose audio is ready and playable

## Decision Summary

Use one day-keyed `DailyAudio` record per briefing date.

The manifest record shape should match the PRD `DailyAudio` contract closely and stay JSON-friendly:

```ts
type DailyAudio = {
  id: string;
  briefingDate: string;
  status: "pending" | "ready" | "failed";
  provider: "notebooklm" | "manual";
  title?: string;
  audioUrl?: string;
  durationSec?: number;
  transcript?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};
```

## Record Semantics

### One record per date

Rule:

- there is at most one `DailyAudio` record for one `briefingDate` in v1

Reason:

- the MVP supports one audio brief per day
- this keeps loaders and UI state simple

### Day identity

Locked fields:

- `id`: deterministic, recommended shape `audio-YYYY-MM-DD`
- `briefingDate`: canonical `YYYY-MM-DD`

Reason:

- loader lookup is date-first
- deterministic IDs make regeneration stable

## Required Fields By Status

### Common required fields

Required for every record:

- `id`
- `briefingDate`
- `status`
- `provider`

### `pending`

Required:

- `id`
- `briefingDate`
- `status: "pending"`
- `provider`

Optional:

- `title`
- `createdAt`
- `updatedAt`

Must be absent:

- `audioUrl`
- `durationSec`
- `transcript`
- `errorMessage`

Reason:

- `pending` means generation has not produced a playable artifact yet

### `ready`

Required:

- `id`
- `briefingDate`
- `status: "ready"`
- `provider`
- `audioUrl`

Optional:

- `title`
- `durationSec`
- `transcript`
- `createdAt`
- `updatedAt`

Must be absent:

- `errorMessage`

Reason:

- `ready` without `audioUrl` is an invalid manifest state

### `failed`

Required:

- `id`
- `briefingDate`
- `status: "failed"`
- `provider`

Optional but strongly recommended:

- `errorMessage`
- `createdAt`
- `updatedAt`
- `title`

Must be absent:

- `audioUrl`
- `durationSec`
- `transcript`

Reason:

- failure should be visible even if only a coarse error reason exists

## Field Rules

### `provider`

Allowed values in v1:

- `notebooklm`
- `manual`

Decision:

- keep the enum narrow
- do not use free-form provider strings in v1

Reason:

- predictable values simplify UI copy and validation

### `title`

Decision:

- optional in v1
- recommended default when present: `Daily Brief for YYYY-MM-DD`

Reason:

- the player can render without a custom title
- a generated default is deterministic if needed later

### `audioUrl`

Decision:

- relative URL string in v1
- examples:
  - `/generated/audio/2026-03-21.mp3`
  - `/generated/audio/2026-03-21.m4a`

Reason:

- PRD already recommends relative URL strings
- keeps hosting and path resolution simple

Validation:

- must be present when `status === "ready"`
- must be absent otherwise

### `durationSec`

Decision:

- optional integer number of seconds

Reason:

- some generators may not know exact duration at first
- the UI can still function without it

Validation:

- if present, must be a positive integer

### `transcript`

Decision:

- optional raw transcript string

Reason:

- transcript is useful but not required to unblock playback

### `errorMessage`

Decision:

- optional short diagnostic string
- only meaningful for `failed`

Examples:

- `generation timeout`
- `provider returned no audio file`
- `manifest entry missing output path`

Reason:

- visible failure copy should be actionable without exposing stack traces

### `createdAt` and `updatedAt`

Decision:

- optional ISO timestamp strings in v1

Reason:

- useful for debugging and future refresh logic
- not required for first playback wiring

## JSON Manifest Shape

Use a date-keyed object for direct lookup by day.

Recommended shape:

```json
{
  "2026-03-20": {
    "id": "audio-2026-03-20",
    "briefingDate": "2026-03-20",
    "status": "ready",
    "provider": "notebooklm",
    "title": "Daily Brief for 2026-03-20",
    "audioUrl": "/generated/audio/2026-03-20.mp3",
    "durationSec": 324,
    "updatedAt": "2026-03-20T14:12:03Z"
  },
  "2026-03-21": {
    "id": "audio-2026-03-21",
    "briefingDate": "2026-03-21",
    "status": "pending",
    "provider": "notebooklm",
    "updatedAt": "2026-03-21T14:05:00Z"
  }
}
```

Reason:

- the frontend needs direct day lookup more often than list iteration
- object lookup keeps loader code simple

## Validation Rules For T15/T17

The future generator/validator should enforce:

1. every key must match `briefingDate`
2. every record must include `id`, `briefingDate`, `status`, and `provider`
3. `ready` must include `audioUrl`
4. `pending` and `failed` must not include `audioUrl`
5. `failed` may include `errorMessage`; if absent, UI should still show a generic failure state
6. `durationSec`, if present, must be a positive integer
7. unknown `status` or `provider` values are invalid

## Why This Contract Is The Right v1 Shape

- matches the PRD and architecture intent closely
- supports the real current state where audio may not exist yet
- fails loudly on the most important mismatch: `ready` without a playable URL
- keeps room for richer metadata later without changing the core loader contract

## Downstream Implications

### For `T05`

- the audio manifest should live in the generated artifact set, not in ad hoc handwritten data files

### For `T06`

- `DailyAudio` in `src/types/models.ts` should align to this contract
- current fields `date`, `duration`, and free-form `provider` are too weak

### For `T36` and `T37`

- loader logic should accept missing audio entry as `undefined`
- if an entry exists, UI behavior is fully determined by `status`

## Open Questions Left For Later

- exact filesystem location of the final audio files
- whether transcript should stay inline or move to a separate generated file when it gets large
