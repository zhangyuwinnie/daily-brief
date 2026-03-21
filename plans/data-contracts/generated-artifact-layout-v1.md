# Generated Artifact Layout V1

Last updated: 2026-03-21
Task: `T05`

## Scope

Lock the exact generated artifact layout the pipeline and frontend will use in v1.

This decision must serve:

- parser output
- normalized `Insight` output
- date-based frontend loading
- day-level audio metadata
- future static serving of actual audio files

## Primary Decision

Generated JSON artifacts live under `src/generated/`.

Actual audio binary files live under `public/generated/audio/`.

Why this split is correct:

- JSON wants typed local imports in the Vite app
- audio binaries want stable URL serving, not JS bundling
- this matches the PRD bias toward `src/generated/` while keeping media delivery simple

## Locked Layout

### JSON artifacts

```text
src/generated/
  briefings-index.json
  briefings-by-date.json
  audio-index.json
```

### Audio files

```text
public/generated/audio/
  YYYY-MM-DD.mp3
  YYYY-MM-DD.m4a
  ...
```

## File Responsibilities

### `src/generated/briefings-index.json`

Purpose:

- catalog what dates and briefing containers exist
- provide fast top-level date discovery without loading every day payload first

Recommended shape:

```ts
type BriefingsIndex = {
  availableDates: string[];
  byDate: Record<
    string,
    {
      briefingIds: string[];
      insightIds: string[];
      hasAudio: boolean;
      sourceTypes: ("rss" | "x")[];
    }
  >;
};
```

Reason:

- `/today` and date switchers need available dates quickly
- this avoids re-scanning full day documents at runtime

### `src/generated/briefings-by-date.json`

Purpose:

- hold the actual day payloads the UI will render
- serve as the main source for `Insight[]` and briefing metadata

Recommended shape:

```ts
type BriefingsByDate = Record<
  string,
  {
    date: string;
    briefings: BriefingRecord[];
    insights: Insight[];
    xToplines?: string[];
    xActionItems?: string[];
  }
>;
```

Decision notes:

- keep `briefings` and `insights` together by date
- reserve optional day-level X fields so we do not lose `今日3条要点` and `可执行动作`

Reason:

- date is the primary route-level lookup key
- the X audit already proved some useful content is day-level rather than per-insight

### `src/generated/audio-index.json`

Purpose:

- map `briefingDate` to one `DailyAudio` record
- keep audio metadata independent from insight payloads

Recommended shape:

```ts
type AudioIndex = Record<string, DailyAudio>;
```

Reason:

- audio generation cadence may differ from text generation
- keeping audio separate lets the app treat missing audio as `undefined` cleanly

## Why Not Put JSON Under `public/generated/`

Rejected option:

- `public/generated/*.json`

Reason for rejection:

- would force fetch-style runtime loading or manual URL handling
- weakens compile-time imports and local type coupling
- makes missing-file failures show up later in runtime instead of earlier in build/integration work

## Why Not Put Audio Binaries Under `src/generated/`

Rejected option:

- `src/generated/audio/*.mp3`

Reason for rejection:

- binary media should not ride the JS/TS bundling path
- static URL serving is simpler and more inspectable
- manifest `audioUrl` wants to point at a public path, not an imported module artifact

## Audio URL Convention

The `audioUrl` stored in `audio-index.json` should point into `public/generated/audio/` via a public-relative URL:

Examples:

- `/generated/audio/2026-03-21.mp3`
- `/generated/audio/2026-03-21.m4a`

Reason:

- deterministic
- easy to validate
- independent of local absolute filesystem paths

## Writer Responsibilities For T15

The future generated artifact writer should:

1. create `src/generated/` if missing
2. write valid JSON to:
   - `src/generated/briefings-index.json`
   - `src/generated/briefings-by-date.json`
   - `src/generated/audio-index.json`
3. never silently skip one of the required JSON outputs
4. write audio URLs that point to public-serving paths, not local machine paths

## Loader Responsibilities For T19

Frontend loaders should:

- import JSON from `src/generated/*`
- treat `briefings-by-date.json` as the source of day payloads
- treat `briefings-index.json` as the source of available dates and coarse metadata
- treat `audio-index.json` as optional day-level audio metadata

## Validation Rules For T17

The future validator should fail loudly when:

1. any required JSON artifact is missing
2. `availableDates` contains a date absent from `briefings-by-date.json`
3. an `audio-index.json` key disagrees with `DailyAudio.briefingDate`
4. an `audioUrl` does not start with `/generated/audio/`
5. a day payload lacks both `briefings` and `insights`

## Relationship To Locked Contracts

### With `T03`

- `briefings-by-date.json` must be able to store the locked `Insight` records exactly as mapped
- optional day-level X fields remain outside `Insight[]`, which preserves the `T03` decision not to force-map them into per-insight rows

### With `T04`

- `audio-index.json` stores the locked `DailyAudio` manifest records exactly
- manifest URLs point to `public/generated/audio/`

## Final Locked Answer

- JSON output location: `src/generated/`
- JSON file names:
  - `src/generated/briefings-index.json`
  - `src/generated/briefings-by-date.json`
  - `src/generated/audio-index.json`
- static audio file location: `public/generated/audio/`

This is the v1 artifact layout the rest of the implementation should target.
