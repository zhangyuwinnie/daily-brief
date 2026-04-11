# Daily Brief Automation — Phase 0 Plan

## Context

The daily brief pipeline currently runs via openclaw on the local Mac. It's unstable
and hard to debug. The goal is to move the entire pipeline to GitHub Actions so it runs
automatically every day without depending on the local machine being awake.

The pipeline: scrape RSS feeds, summarize with Gemini, generate follow-builders digest,
create NotebookLM audio, sync JSON indexes, publish audio to R2, commit and push to
trigger Cloudflare Pages auto-deploy.

## Architecture

```
GitHub Actions (6am PT / 1pm UTC daily)
│
├── Step 1: RSS Briefing
│   └── scripts/daily-briefing.js
│       ├── Fetch RSS feeds (17 sources + Cursor blog)
│       ├── Filter by date + keywords
│       ├── Rank + summarize via Gemini API
│       └── Output: briefings/YYYY-MM-DD.md
│
├── Step 2: Follow Builders
│   ├── scripts/prepare-follow-builders.js
│   │   └── Fetch feeds from zarazhangrui/follow-builders (public)
│   ├── scripts/remix-follow-builders.js
│   │   ├── Read JSON from prepare step
│   │   ├── Call Gemini API with prompts from JSON
│   │   └── APPEND to existing briefings/YYYY-MM-DD.md
│   └── No API keys needed for data fetch, only Gemini for remix
│
├── Step 3: Audio (NotebookLM) — skippable
│   ├── scripts/generate-audio.sh
│   │   ├── Extract URLs from briefing markdowns
│   │   ├── Build NotebookLM request JSON
│   │   └── Run notebooklm-audio-overview CLI
│   │   └── Output mp3 to briefings/ (NOT public/generated/audio/)
│   ├── Auth: NOTEBOOKLM_AUTH_JSON secret (Google cookies)
│   └── If auth expired: skip, log warning, continue
│
├── Step 4: Sync + Publish
│   ├── npm run sync:generated
│   │   └── Reads markdown+audio from briefings/ (inputDir)
│   │   └── Copies best audio to public/generated/audio/
│   │   └── Builds JSON indexes
│   └── npm run publish:audio (upload from public/generated/audio/ to R2)
│
└── Step 5: Commit + Push (only if changes exist)
    ├── git add public/generated/ src/generated/
    ├── git diff --cached --quiet && exit 0
    ├── git commit -m "daily brief YYYY-MM-DD"
    ├── git pull --rebase origin main
    └── git push -> Cloudflare auto-deploy
```

## Key Design Decisions

### 1. Strip SQLite entirely

`daily_briefing.js` uses SQLite (`briefing.db`) to dedup URLs across days.
SQLite requires native module compilation in CI and persistent storage.
The 2-day date filter already provides basic dedup.

**Decision:** Remove all SQLite code from the copied script. No sqlite3/sqlite
deps. Rely on date filter + topic dedup (already in the script). Add persistent
dedup in Phase 1 if duplicate articles become a problem.

### 2. Bring scripts into the repo

Currently `daily_briefing.js` lives in `~/.openclaw/workspace/`. For CI,
copy it into `scripts/` with minimal modifications:
- Change output dir to `./briefings/` (relative to repo root)
- Make db path configurable, skip db init when `--no-dedup`
- Remove hardcoded paths

For follow-builders: `prepare-digest.js` fetches from public GitHub URLs.
Copy it as `scripts/prepare-follow-builders.js` (no external deps needed,
just `fetch` which is built-in Node 22).

### 3. New script: remix-follow-builders.js

Standalone Node script that:
1. Reads prepare-digest JSON from stdin or file arg
2. Extracts content (tweets, podcasts, blogs) from the JSON
3. Builds a first-principles prompt: extract signal, discard noise,
   analyze WHY things matter for builders, merge themes
4. Calls Gemini 2.5 Pro (deeper reasoning for quality remix)
   NOTE: User wants Gemini 3 Pro when available; start with 2.5 Pro for now,
   upgrade model string when Gemini 3 Pro is released
5. Appends output to existing `briefings/YYYY-MM-DD.md`

Uses `@google/generative-ai` (same as daily-briefing).

Prompt approach (all three scripts share the same philosophy):
- First-principles: "Why it matters" + "Why it matters for builders"
- Actionable: "What can a builder DO with this? What can they learn?"
- Quality over quantity: fewer items, higher signal
- Merge related items into themes instead of listing individually
- Output in Chinese

### 4. Audio output goes to briefings/, not public/generated/audio/

`sync:generated` reads audio from BRIEFINGS_DIR (the input dir), selects
the best file per date, copies it to `public/generated/audio/`, and DELETES
any managed audio not in its selection set (syncGeneratedContent.ts:79-88).

If audio were generated directly to `public/generated/audio/`, sync would
delete it. Fix: `generate-audio.sh` outputs mp3 to `briefings/`, then sync
picks it up correctly and copies it to the publish directory.

### 5. Follow-builders appends to existing daily briefing (no separate file)

Writing a separate `follow_builders_YYYY-MM-DD.md` causes ID collisions:
- briefing ID `rss-${date}` would be identical for both files
  (generatedArtifacts.ts:95, normalizeParsedBriefing.ts:41)
- Adding a third SourceType touches 6+ files across the data model

**Fix: remix-follow-builders.js APPENDS to the existing YYYY-MM-DD.md.**

The script appends its sections using the same markdown format. The RSS
parser handles them. Each insight gets a unique ID via `entryIndex` (which
continues incrementing). `sourceName: "Follow Builders"` distinguishes them.

```
# Daily Briefing: YYYY-MM-DD    <-- already exists from daily-briefing.js

## [RSS Article 1](URL)
**Source:** Simon Willison
> **Chinese Summary:** ...
> **R2 Take:** ...
---

## [Builder Theme: X](URL)      <-- appended by remix-follow-builders.js
**Source:** Follow Builders
> **Chinese Summary:** ...
> **R2 Take:** ...
---
```

Zero data model changes. Zero type changes. Zero parser changes.
Ordering dependency (remix after daily-briefing) already guaranteed by workflow.
A proper third SourceType can be added in Phase 1 if needed.

### 6. Cron schedule and DST

`cron: '0 13 * * *'` = 6am PT during DST, but 5am PT during standard time
(Nov-Mar). GitHub Actions cron is UTC-only. For this use case, 5am vs 6am
doesn't matter (just needs to finish by 7:30am). Accept the 1-hour drift.

### 7. Audio generation is best-effort

NotebookLM cookies expire unpredictably. The workflow:
1. Check auth: `notebooklm auth check --test`
2. If OK: generate audio
3. If expired: skip, log warning, rest of pipeline continues
4. User runs `notebooklm login` locally, copies cookies to GitHub secret

### 8. Secrets needed in GitHub Actions

| Secret | Source | Purpose |
|--------|--------|---------|
| GOOGLE_API_KEY | Gemini API | RSS summarization + follow-builders remix |
| NOTEBOOKLM_AUTH_JSON | `~/.notebooklm/storage_state.json` | Audio generation (optional) |
| R2_ACCOUNT_ID | Cloudflare R2 | Audio upload |
| R2_ACCESS_KEY_ID | Cloudflare R2 | Audio upload |
| R2_SECRET_ACCESS_KEY | Cloudflare R2 | Audio upload |
| R2_BUCKET_NAME | Cloudflare R2 | Audio upload |

Git push uses the default `GITHUB_TOKEN` (auto-provided).

## Files to Create

### 1. `scripts/daily-briefing.js`
Copy from `~/.openclaw/workspace/daily_briefing.js` with changes:
- Strip all SQLite code (imports, initDB, filterNewUrls, markAsSeen, cleanupOldEntries)
- Remove sqlite3/sqlite deps entirely
- Output to `./briefings/` relative to repo root
- Remove personal references (e.g. "Dayu") — make prompts generic for AI builders
- Rewrite ranking prompt: first-principles ranking — does this change what's possible?
  does this change how builders work? is this non-obvious? Deprioritize hype/press releases.
- Rewrite summary prompt content (first-principles, "why it matters for builders")
  but keep output labels as `**Chinese Summary:**` and `**R2 Take:**` to match
  existing parser contract (parseRssBriefing.ts:85-86)
- All summaries in Chinese
- Keep all RSS sources, keyword filtering, Gemini ranking/summarization, topic dedup

### 2. `scripts/prepare-follow-builders.js`
Copy from `~/.agents/vendor/zarazhangrui-follow-builders/scripts/prepare-digest.js`.
Minimal changes:
- Remove dotenv/proper-lockfile deps (not needed)
- Output JSON to stdout (already does this)

### 3. `scripts/remix-follow-builders.js`
New file (~100 lines). Core logic:
```
read JSON from argv[1] or stdin
extract content (x tweets, podcasts, blogs)
build first-principles prompt:
  - extract signal, discard noise
  - "Why it matters" + "Why it matters for builders"
  - "What action can a builder take?" / "What can they learn?"
  - merge related items into themes
  - fewer items, higher quality
  - output in Chinese
  - output in RSS briefing markdown format:
    ## [Title](URL) + **Source:** + > **Chinese Summary:** + > **R2 Take:**
    (must match parseRssBriefing.ts:85-86 label contract)
call Gemini 2.5 Pro (gemini-2.5-pro)
APPEND result to existing briefings/YYYY-MM-DD.md (not a separate file)
  - if YYYY-MM-DD.md doesn't exist yet, skip (daily-briefing.js must run first)
```

### 4. `scripts/generate-audio.sh`
Adapted from `~/.openclaw/workspace/run_ai_links_podcast.sh`:
- Single input: the merged briefings/YYYY-MM-DD.md (contains both RSS + follow-builders)
- Output mp3 to `briefings/` (sync picks it up from there, see decision #4)
- NotebookLM request JSON based on tested config:
  ```json
  {
    "links": [...extracted from briefing markdowns...],
    "notebook_name": "AI Links Builder Briefing YYYY-MM-DD",
    "output_path": "briefings/ai_links_YYYY-MM-DD_audio_overview.mp3",
    "language": "zh",
    "audio_format": "deep-dive",
    "audio_length": "default",
    "episode_focus": "请用中文，以双主持人播客的形式，运用第一性原理分析...(full prompt below)",
    "reuse_notebook": false,
    "strict_mode": false,
    "source_timeout_seconds": 240,
    "audio_timeout_seconds": 1800,
    "poll_interval_seconds": 3,
    "overwrite": false
  }
  ```
- `episode_focus` (tested, works well):
  ```
  请用中文，以双主持人播客的形式，运用第一性原理分析这组 AI 领域的
  links/news/feed。不要逐条总结链接；请把相近事件归并成几个最关键的主题，
  只讨论真正重要的变化。对每个主题都回答：
  1. Why it matters
  2. Why it matters for builders
  3. 哪些变化是短期噪音，哪些是长期拐点
  4. 哪些二阶影响最容易被忽视
  5. 对创业者、产品团队和开发者最实际的机会是什么
  请少讲表面信息，多讲底层结构、能力约束、商业逻辑、分发逻辑和未来
  6-12 个月的判断。
  ```

### 5. `.github/workflows/daily-brief.yml`
GitHub Actions workflow with:
- Schedule: `cron: '0 13 * * *'` (6am PT = 1pm UTC)
- `workflow_dispatch` for manual trigger
- Node 22 + Python 3.10 setup
- `pip install notebooklm-py`
- All 5 steps with proper error handling
- Each step logs duration and exit code
- Artifacts: upload `briefings/` and logs as workflow artifacts for debugging

### 6. `package.json` changes
Add devDependencies:
- `rss-parser` (RSS feed parsing)
- `@google/generative-ai` (Gemini API)
- `dotenv` (env loading for local dev)

Add scripts:
- `"daily"`: `"node scripts/daily-briefing.js --no-dedup"`
- `"daily:follow-builders"`: runs prepare + remix
- `"daily:audio"`: runs audio generation
- `"daily:all"`: runs the full pipeline locally

## Files to Modify

### 1. `scripts/sync-generated-content.ts` (line 8)
Change default BRIEFINGS_DIR from hardcoded openclaw path to `./briefings`:
```
const inputDir = process.env.BRIEFINGS_DIR ?? resolve(repoRoot, "briefings");
```

### 2. `.github/workflows/daily-brief.yml` permissions
Add explicit write permissions for git push:
```yaml
permissions:
  contents: write
```

### 3. `.gitignore`
Add `briefings/` directory (generated content, not source code).
Add `logs/` directory.

## NOT in scope (Phase 0)

- **Retry logic** — if a step fails, the whole run fails. Check logs manually.
- **Notifications** — no Slack/email on failure. GitHub Actions shows failed runs.
- **Prompt versioning** — prompts are inline in scripts for now.
- **A/B testing** — Phase 2.
- **Run manifest JSON** — GitHub Actions UI provides this natively.
- **Persistent dedup** — using `--no-dedup`, rely on date filter.
- **Quality snapshots** — Phase 2.

## What already exists (reuse, don't rebuild)

| Component | Location | Reuse? |
|-----------|----------|--------|
| RSS scraper + Gemini summarizer | `~/.openclaw/workspace/daily_briefing.js` | Copy with minor mods |
| Follow-builders data fetcher | `~/.agents/vendor/.../prepare-digest.js` | Copy as-is |
| Follow-builders prompts | Fetched from GitHub at runtime | Reuse as-is |
| Audio URL extractor + NotebookLM | `~/.openclaw/workspace/run_ai_links_podcast.sh` | Adapt |
| Markdown -> JSON sync | `scripts/sync-generated-content.ts` | Use as-is |
| Audio -> R2 upload | `scripts/publish-audio.ts` | Use as-is |
| Cloudflare Pages deploy | Auto on git push | Use as-is |

## Verification

### E2E test (manual, one-time):
```bash
# 1. Trigger workflow manually
gh workflow run daily-brief.yml

# 2. Watch the run
gh run watch

# 3. Check outputs
# - GitHub Actions logs show each step's output
# - Check public/generated/briefings-index.json for new date
# - Check site for new content
# - Check R2 for new audio (if NotebookLM auth was valid)
```

### Local test:
```bash
# Run full pipeline locally
GOOGLE_API_KEY=xxx npm run daily:all

# Or individual steps
npm run daily              # RSS briefing only
npm run daily:follow-builders  # Follow builders only
```

## Risks

1. **NotebookLM cookies expire** — audio generation will skip silently. User
   must monitor and re-login periodically. Not a blocker for text content.

2. **Gemini API rate limits** — daily_briefing.js makes ~12 summary calls +
   1 ranking call. Well within free tier limits.

3. **RSS feeds go down** — individual feed failures are already handled
   (logged and skipped). Only fails if ALL feeds are down.

4. **GitHub Actions git push conflicts** — mitigated with `git pull --rebase`
   before push. Only fails if rebase conflicts (very unlikely with auto-generated files).

## Review Decisions (from eng review)

1. **SQLite:** Strip entirely, no native deps in CI ✓
2. **Git push:** Pull-rebase before push ✓
3. **Follow-builders language:** Chinese (zh) ✓
4. **Persona:** Generic "AI builders" audience, no personal names ✓
5. **Tests:** No unit tests for standalone scripts, but targeted tests for data model
   changes: (a) follow-builders content appended to RSS briefing parses correctly,
   (b) insight IDs remain unique when RSS + follow-builders content exist in same file.
   Existing app tests (sync, parsers, audio selection, Playwright E2E) must still pass.
6. **Audio path:** Output to briefings/, not public/generated/audio/ (sync handles copy) ✓
7. **Follow-builders ingest:** Append to existing YYYY-MM-DD.md (no separate file,
   avoids ID collision). sourceName "Follow Builders" for future UI distinction ✓
8. **Commit guard:** git diff --cached --quiet before commit ✓
9. **DST:** Accept 1-hour drift (5am vs 6am), not worth dual schedules ✓
10. **Workflow permissions:** Explicit `permissions: contents: write` for git push ✓

## Tests to Add

### 1. `src/lib/briefings/parseRssBriefing.test.ts` — follow-builders format
Test that a markdown file with both RSS articles and appended follow-builders
sections (using `**Source:** Follow Builders`) parses correctly with unique
entryIndex values for all items.

### 2. `src/lib/briefings/generatedArtifacts.test.ts` — ID uniqueness
Test that when a single YYYY-MM-DD.md contains both RSS and follow-builders
content, all briefing records and insight IDs are unique (no collisions).
