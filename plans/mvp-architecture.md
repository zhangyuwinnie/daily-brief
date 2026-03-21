# AI Briefing MVP Architecture

## Product Definition

This MVP is not a content site, blog, or generic knowledge base.

It is a personal AI learning system that turns daily AI briefings into an actionable loop:

`brief -> build -> learn -> reflect`

The goal is to help the user:

- understand the most important AI and agent-related signals of the day
- consume the daily brief in either listening mode or reading mode
- decide what to build next
- decide what to learn next
- leave a lightweight record of progress and takeaways

The product should support two primary consumption modes built on the same daily brief:

- `listen mode`: a daily audio brief or podcast
- `read mode`: Today, Build Queue, Topics, and shareable insights

## Scope

The MVP includes:

- ingest Markdown briefing files and parse them into structured data
- a `Daily Audio Brief`
- a `Today` page
- a `Build Queue` page
- a `Topic` filter
- a shareable single-insight page

The MVP does not include:

- a complex topic knowledge graph
- full-text search
- multi-user collaboration
- comments or social features
- complex analytics or auto-tracking
- newsletter or email distribution
- a full CMS

## Content Inputs

The current content inputs are local Markdown files, including:

- daily briefing files from RSS-derived sources
- X briefing files from X-derived sources

Examples:

- `/Users/yuzhang/.openclaw/workspace/briefings/2026-03-14.md`
- `/Users/yuzhang/.openclaw/workspace/briefings/x_briefing_2026-03-15.md`

The MVP should support the existing Markdown formats first. The cron job does not need to be rewritten before the website can exist.

## Product Principles

- optimize for daily decision-making, not passive archive reading
- treat audio as a first-class consumption path
- structure insights, not just documents
- keep the learning loop visible
- keep the state model lightweight
- preserve shareability through permalinks
- avoid overbuilding v1

## Information Architecture

### `/`

Purpose:

- act as the daily front door
- let the user immediately listen to or scan today's brief

Core sections:

- play today's brief
- today's top signals
- build this today
- quick topic filters

This can redirect to `/today`, but product-wise it should behave as the primary daily dashboard.

### `Daily Audio Brief`

Purpose:

- make the product useful when the user has little time or does not want to read
- turn the daily brief into a personalized AI podcast-like experience

Version 1 should support:

- one generated audio brief per day
- generation from the day's structured insights and source links
- simple audio states: `pending`, `ready`, `failed`
- playback from the main daily page

Version 1 should not support:

- multiple audio variants per day
- custom prompting UI
- full podcast feed distribution
- topic-level or insight-level audio generation

### `/today`

Purpose:

- give a 5-minute view of the most important signals for the day
- help the user decide what is worth building and learning today

Core sections:

- daily audio brief player
- top signals
- why it matters
- build this today
- learn this next
- recent date switcher

Each insight card should show:

- title
- one-line summary
- take or actionable takeaway
- topics
- effort estimate
- share action
- add-to-build-queue action

### `/build`

Purpose:

- turn briefing-derived signals into an action queue

Each build item should show:

- build title
- linked source insight
- skill focus
- effort estimate
- status
- one-line learning outcome
- note

### `/topics`

Purpose:

- filter insights by topic without requiring a complex topic-site architecture

Initial controlled topics:

- Agents
- Coding Agents
- Evals
- RAG
- Retrieval
- Security
- Tooling
- Learning Resource

This is a filter-first experience in v1, not a fully developed topic landing system.

### `/insights/[id]`

Purpose:

- provide a shareable permalink for a single insight

This page is generated from an existing insight, not manually authored in advance.

It should show:

- title
- summary
- why it matters
- source link
- user takeaway
- possible build idea
- topic tags

### `/briefings/[date]`

Purpose:

- preserve historical context and allow the user to read the original daily brief

This page is useful, but not the center of the product.

## Data Model

The core model should center on `Insight`, not `Briefing`.

`Briefing` is a container. `Insight` is the unit that is browsed, filtered, queued, and shared.

```ts
Briefing {
  id: string
  date: string
  sourceType: "rss" | "x"
  title: string
  filePath: string
  summaryTopline?: string
  createdAt: string
}

Insight {
  id: string
  briefingId: string
  date: string
  sourceType: "rss" | "x"
  title: string
  sourceName?: string
  sourceUrl?: string
  summaryZh?: string
  take?: string
  whyItMatters?: string
  buildIdea?: string
  learnGoal?: string
  topics: string[]
  entities?: string[]
  signalScore?: number
  effortEstimate?: "30m" | "2h" | "weekend"
}

DailyAudio {
  id: string
  briefingDate: string
  status: "pending" | "ready" | "failed"
  provider: "notebooklm"
  audioUrl?: string
  durationSec?: number
  transcript?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

InsightState {
  insightId: string
  status: "Inbox" | "Interested" | "Building" | "Learned" | "Archived"
  note?: string
  personalTakeaway?: string
  lastTouchedAt?: string
}

BuildItem {
  id: string
  insightId: string
  title: string
  skillFocus: "agents" | "evals" | "retrieval" | "security" | "tooling"
  effortEstimate?: "30m" | "2h" | "weekend"
  reasonToBuild?: string
}
```

## Parsing Strategy

Version 1 should parse the current Markdown formats directly.

Two parser paths are enough:

- daily briefing parser
- X briefing parser

The parser should extract these fields when available:

- title
- source
- source URL
- Chinese summary
- take or R2 take
- key points
- actionable actions
- signal score

After extraction, a normalization step should map everything into the shared `Insight` model.

## Topic Strategy

Topic pages do not require the cron job to be rebuilt first.

Version 1 should:

- backfill topics from historical Markdown
- use a small controlled vocabulary
- rely on parsing plus lightweight tagging

Future versions can move topic generation into the cron pipeline, but that is not required for the MVP.

## Share Strategy

Share should happen at the insight level, not the full-briefing level.

Why:

- people share a specific signal or takeaway more often than a full daily brief
- a single-insight permalink is cleaner and easier to consume
- the product can include the user's own takeaway on top of the original insight

The share page is a dedicated route, but it is generated dynamically from the chosen insight.

## Audio Strategy

Audio is part of the same product, not a separate product.

The product model should be:

```text
Daily Brief
  -> text experience
  -> audio experience
  -> build suggestions
  -> learning actions
```

This keeps the user on one system with one source of truth.

The initial audio feature should be narrowly scoped:

- generate one audio brief per day
- use the same parsed daily insights already powering the site
- present the audio player on the daily dashboard
- keep sharing centered on text insights, not audio episodes

If NotebookLM integration is unavailable or blocked, the product should still function fully in text mode.

## Progress Tracking Strategy

Progress tracking should be intentionally lightweight.

Version 1 should only support a manual status dropdown:

- Inbox
- Interested
- Building
- Learned
- Archived

Optional lightweight fields:

- note
- personal takeaway
- last touched timestamp

Do not build complex automation, analytics, or time tracking in v1.

## Core Loop

```text
Markdown briefings
  ->
Parser + Normalizer
  ->
Structured insights
  ->
Topic tagging + build suggestion extraction
  ->
Daily audio generation
  ->
Today page surfaces top signals
  ->
User marks an item as Interested or Building
  ->
Build Queue becomes today's action list
  ->
User leaves a note or takeaway
  ->
Learning context improves over time
```

The intended user loop is:

```text
Brief
What happened today?

Build
What is the most worthwhile small project to build from today's signals?

Learn
What concept, tool, or pattern should be learned to build it well?

Reflect
What did I build or learn, and what should I revisit later?
```

In the MVP:

- `Brief` is handled by parsed insights
- `Consume` is handled by audio playback plus the Today page
- `Build` is handled by the Build Queue
- `Learn` is handled by `learnGoal`, `whyItMatters`, and build framing
- `Reflect` is handled by `status + note`

## MVP Keep vs Cut

Keep:

- direct ingestion from existing Markdown files
- normalized structured insights
- one daily audio brief
- Today page
- Build Queue page
- topic filter
- insight permalink
- manual status dropdown
- notes and personal takeaway
- effort estimate

Cut:

- complex topic landing pages
- full-text search
- auth
- comments
- collaboration
- newsletters
- advanced dashboards
- complex progress analytics
- knowledge graph visualization
- elaborate recommendation systems
- multiple audio versions per day
- podcast feed distribution
- per-topic audio generation
- audio editing controls

## Recommended Implementation Shape

A minimal implementation can use:

- a local or self-hosted Next.js app
- SQLite for structured content cache and state
- a parser job that runs on app start or on a schedule
- an async daily audio generation job

The first deployment can live on the same machine or server where the briefing files already exist. This avoids introducing sync complexity too early.

## Product Boundary

This MVP should be evaluated by two questions:

Can the user listen to or scan the daily brief in minutes?

Can the user leave with one better decision about what to build and what to learn?

If yes, the MVP is working.

## Delivery Phases

### Phase 1A

- parse Markdown briefings into structured insights
- generate one daily audio brief
- build the daily dashboard / Today page

### Phase 1B

- Build Queue page
- topic filter
- single-insight share page
- manual status tracking and notes
