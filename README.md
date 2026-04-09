# Daily Brief

A React + Vite static app that displays AI-generated daily briefings and plays audio podcasts.

## Architecture

- **Content source**: Markdown briefing files in `~/.openclaw/workspace/briefings/`
- **Generated JSON**: `sync:generated` reads the briefings and outputs JSON indexes to `public/generated/` and `src/generated/`
- **Audio hosting**: MP3 files are uploaded to Cloudflare R2 (not stored in git)
- **Static deploy**: Cloudflare Pages builds from this repo and serves the Vite app

## Daily Content Update (Manual)

```bash
# 1. Sync briefing markdown → JSON indexes + detect audio files
npm run sync:generated

# 2. Upload any new/updated audio files to R2
npm run publish:audio

# 3. Commit the updated JSON indexes (audio files are gitignored)
git add src/generated/ public/generated/briefings/ public/generated/*.json
git commit -m "Daily brief YYYY-MM-DD"

# 4. Push to trigger Cloudflare Pages deploy
git push
```

### What each step does

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `npm run sync:generated` | Reads briefing markdown from `~/.openclaw/workspace/briefings/`, scans `public/generated/audio/` for audio files, and writes JSON indexes (`briefings-index.json`, `briefings-by-date.json`, `audio-index.json`, per-date JSON) |
| 2 | `npm run publish:audio` | Uploads MP3/M4A/WAV files from `public/generated/audio/` to the Cloudflare R2 bucket. Reads credentials from `.env.local` |
| 3 | `git add` + `commit` | Commits the updated JSON files. Audio files are excluded by `.gitignore` |
| 4 | `git push` | Triggers Cloudflare Pages auto-deploy (~30 sec) |

## Environment Files

| File | Committed | Purpose |
|------|-----------|---------|
| `.env.production` | Yes | `VITE_AUDIO_BASE_URL` — R2 public URL prefix used in production builds |
| `.env.local` | No | R2 upload credentials: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |

## Development

```bash
npm install
npm run dev          # Start dev server (audio plays from local public/generated/audio/)
npm test             # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run build        # Production build
```

In local dev, audio plays directly from `public/generated/audio/` since `VITE_AUDIO_BASE_URL` is not set.
