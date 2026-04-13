# Daily Brief

A React + Vite static app that displays AI-generated daily briefings and plays audio podcasts.

## Architecture

- **Content source**: Markdown briefing files in repo-local `briefings/`
- **Automation pipeline**: GitHub Actions runs `.github/workflows/daily-brief.yml` on a daily cron or manual dispatch
- **Generated JSON**: `sync:generated` reads the briefings and outputs JSON indexes to `public/generated/`
- **Audio hosting**: MP3 files are uploaded to Cloudflare R2 (not stored in git)
- **Static deploy**: Cloudflare Pages builds from this repo and serves the Vite app

## Project Directory Structure

| Directory | Purpose | In Git? |
|-----------|---------|---------|
| `briefings/` | Raw source input — markdown, links, and audio files produced by the daily briefing pipeline (`npm run daily`). Read by `npm run sync:generated` to produce the processed JSON. | No (gitignored) |
| `public/generated/` | Processed JSON output — structured data files that the app serves at runtime. Produced by `npm run sync:generated` from `briefings/`. **Note:** we plan to move this data to a database in the future so the app no longer relies on these static files. | Yes (committed, required for deployment) |
| `dist/` | Vite build output — `vite build` bundles `src/` into hashed JS/CSS under `dist/assets/` and copies `public/` into `dist/` as-is. This is the complete deployable artifact. | No (gitignored, rebuilt from source) |

Data flow: `briefings/` (raw) → `sync:generated` → `public/generated/` (JSON) → `vite build` → `dist/` (deployable)

## Automation Runbook

The repo-local automation workflow and its verification flow are documented in [docs/automation-runbook.md](docs/automation-runbook.md).

## Daily Content Update (Manual)

```bash
# Run the full repo-local pipeline for today
GOOGLE_API_KEY=xxx npm run daily:all

# Or run the steps individually
npm run daily
npm run daily:follow-builders
npm run daily:audio
npm run sync:generated
npm run publish:audio
```

### What each step does

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `npm run daily` | Fetches the RSS and HTML sources, ranks them, summarizes them, and writes `briefings/YYYY-MM-DD.md` |
| 2 | `npm run daily:follow-builders` | Fetches the public follow-builders feeds and appends same-day sections to the existing briefing markdown |
| 3 | `npm run daily:audio` | Best-effort NotebookLM audio generation into `briefings/` for the selected date |
| 4 | `npm run sync:generated` | Reads repo-local `briefings/`, republishes selected audio into `public/generated/audio/`, and writes JSON indexes |
| 5 | `npm run publish:audio` | Uploads MP3/M4A/WAV files from `public/generated/audio/` to the Cloudflare R2 bucket |

## Environment Files

| File | Committed | Purpose |
|------|-----------|---------|
| `.env.production` | Yes | `VITE_AUDIO_BASE_URL` — R2 public URL prefix used in production builds |
| `.env.local` | No | Local automation secrets such as `GOOGLE_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` |

## Development

```bash
npm install
npm run dev          # Start dev server (audio plays from local public/generated/audio/)
npm test             # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run build        # Production build
```

In local dev, audio plays directly from `public/generated/audio/` since `VITE_AUDIO_BASE_URL` is not set.
