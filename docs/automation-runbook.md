# Daily Brief Automation Runbook

This repo now has a repo-local automation pipeline plus a GitHub Actions workflow at `.github/workflows/daily-brief.yml`.

## Secrets

The workflow expects these GitHub Actions secrets:

- `GOOGLE_API_KEY`
- `NOTEBOOKLM_AUTH_JSON`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

`NOTEBOOKLM_AUTH_JSON` is optional in practice because the audio step is best-effort, but the workflow is wired to load it into `~/.notebooklm/storage_state.json` when present.

## Local Dry Runs

Run the full local pipeline:

```bash
GOOGLE_API_KEY=xxx npm run daily:all
```

Run the steps individually:

```bash
# RSS + HTML sources -> briefings/YYYY-MM-DD.md
npm run daily

# Append follow-builders content into the same-day markdown
npm run daily:follow-builders

# Generate NotebookLM audio into briefings/
npm run daily:audio

# Rebuild public/generated/ and republish selected audio locally
npm run sync:generated

# Upload public/generated/audio/* to R2
npm run publish:audio
```

Run a one-day dry run with an explicit date:

```bash
npm run daily -- --date 2026-04-13
npm run daily:follow-builders -- --date 2026-04-13
npm run daily:audio -- 2026-04-13
npm run sync:generated
```

For a safer smoke test that avoids real NotebookLM work, use temporary mock binaries and temp output directories:

```bash
PATH=/tmp/mock-bin:$PATH GENERATED_CONTENT_DIR=/tmp/daily-brief-generated GENERATED_AUDIO_DIR=/tmp/daily-brief-generated/audio npm run daily:all
```

## GitHub Actions Manual Trigger

Trigger the workflow from the GitHub UI with `Run workflow`, or from the CLI:

```bash
gh workflow run daily-brief.yml
```

Skip audio generation for a manual replay:

```bash
gh workflow run daily-brief.yml -f generate_audio=false
```

Override the date for a manual replay:

```bash
gh workflow run daily-brief.yml -f run_date=2026-04-13
```

Combine both options:

```bash
gh workflow run daily-brief.yml -f run_date=2026-04-13 -f generate_audio=false
```

Watch the run:

```bash
gh run watch
```

## Expected Outputs

When the workflow succeeds:

- `briefings/YYYY-MM-DD.md` exists in the workflow workspace
- follow-builders sections are appended into the same markdown file
- audio may be generated in `briefings/` if NotebookLM auth is valid
- `public/generated/briefings-index.json`
- `public/generated/briefings-by-date.json`
- `public/generated/audio-index.json`
- `public/generated/briefings/YYYY-MM-DD.json`
- workflow artifacts include both `briefings/` and `logs/`
- if `public/generated/` changed, the workflow commits and pushes the diff

If there is no generated diff after `git add public/generated`, the workflow exits the commit step without creating an empty commit.

## Verification Flow

After a manual or scheduled workflow run:

1. Open the Actions run and confirm all five pipeline steps completed:
   - RSS briefing
   - Follow builders
   - Audio generation when enabled
   - Sync + publish
   - Commit + push
2. For a manual run with `generate_audio=false`, confirm:
   - `Prepare NotebookLM auth` is skipped
   - `Step 3 - Audio generation` is skipped
   - `Step 4 - Sync generated content and publish audio` still runs, but logs that audio publish was skipped
3. Download the uploaded artifact bundle and inspect:
   - `briefings/`
   - `logs/workflow/*.log`
4. Confirm the generated date appears in `public/generated/briefings-index.json`.
5. Confirm the site loads the new day under `/today`.
6. If audio was expected, confirm `public/generated/audio-index.json` marks the date as `ready`.

## Known Risks

- NotebookLM auth can expire unpredictably, so the audio step may skip or produce no output even when the rest of the pipeline succeeds.
- The cron is fixed at `0 13 * * *`, which means the local PT start time drifts by one hour outside DST.
- RSS and HTML sources are network-dependent and can fail or slow down independently.
- `publish:audio` requires valid R2 secrets; missing credentials fail the sync-and-publish step.
- The workflow only commits `public/generated`, so repo-local `briefings/` and `logs/` remain debug artifacts rather than committed source.
