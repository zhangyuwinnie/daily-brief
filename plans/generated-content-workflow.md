# Generated Content Workflow

Last updated: 2026-04-07
Batch: `Batch 10`

## Scope

This document explains how local briefing markdown turns into frontend-readable generated JSON.

## Upstream Inputs

Expected briefing source directory:

- `/Users/yuzhang/.openclaw/workspace/briefings`

Expected file naming:

- RSS briefing: `YYYY-MM-DD.md`
- X briefing: `x_briefing_YYYY-MM-DD.md`

The generator scans that directory directly.

## Generated Outputs

Generated JSON artifacts:

- `public/generated/briefings-index.json`
- `public/generated/briefings-by-date.json`
- `public/generated/audio-index.json`

Expected audio file directory:

- `public/generated/audio/`

Audio URL convention:

- `/generated/audio/YYYY-MM-DD.mp3`
- `/generated/audio/YYYY-MM-DD.m4a`

## Sync Command

Run:

```bash
env PATH=/Users/yuzhang/.nvm/versions/node/v22.17.1/bin:$PATH npm run sync:generated
```

What the command does:

1. reads briefing markdown from `/Users/yuzhang/.openclaw/workspace/briefings`
2. parses RSS and X files with the shared parser pipeline
3. normalizes all entries into the locked v1 `Insight` shape
4. groups data by date
5. generates one `DailyAudio` record per date
6. validates the generated artifact shapes
7. writes the three JSON files under `public/generated/`

## Current Audio Behavior

Right now audio files have not been generated yet.

The sync flow therefore emits:

- `status: "pending"` for dates with no matching audio file
- `status: "ready"` only when a matching file exists in `public/generated/audio/`

The current implementation prefers:

- `YYYY-MM-DD.mp3`
- then `YYYY-MM-DD.m4a`
- then any other matching `YYYY-MM-DD.*` file

## Validation Rules

The sync command fails loudly when:

- no briefing markdown files are found in the upstream input directory
- a required generated day payload is missing
- a day payload key does not match its internal `date`
- an audio record key disagrees with `DailyAudio.briefingDate`
- a ready audio record has no `audioUrl`
- an `audioUrl` does not start with `/generated/audio/`
- a day payload has neither `briefings` nor `insights`

## Optional Environment Overrides

The sync script supports these environment variables:

- `BRIEFINGS_DIR`
- `GENERATED_CONTENT_DIR`
- `GENERATED_AUDIO_DIR`

These are useful if another machine stores the upstream briefings or generated audio in different locations.

## Runtime Consumption

The frontend no longer imports generated JSON at build time.

Instead:

1. `App` fetches `/generated/briefings-index.json`
2. `App` fetches `/generated/briefings-by-date.json`
3. `App` fetches `/generated/audio-index.json`
4. the loader caches the combined payload in memory for the session
5. pages read from that cached payload through the shared selector helpers

This keeps date-indexed content out of the main JavaScript bundle and allows daily briefing refreshes to update static hosting more cleanly.

## Verification

Recommended local verification sequence:

```bash
env PATH=/Users/yuzhang/.nvm/versions/node/v22.17.1/bin:$PATH npm run sync:generated
env PATH=/Users/yuzhang/.nvm/versions/node/v22.17.1/bin:$PATH npm test
env PATH=/Users/yuzhang/.nvm/versions/node/v22.17.1/bin:$PATH npm run build
```

## Notes For Next Batch

- `briefings-index.json` is the fast path for available dates.
- `briefings-by-date.json` is the source of daily briefing and insight content.
- `audio-index.json` is the source of day-level audio state.
- route bundles are lazy loaded so non-active pages do not enlarge the entry chunk.
