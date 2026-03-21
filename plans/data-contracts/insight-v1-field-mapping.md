# Insight V1 Field Mapping

Last updated: 2026-03-21
Task: `T03`

## Scope

Lock the v1 normalized mapping from current RSS and X briefing inputs into the shared `Insight` contract defined in `plans/mvp-prd.md`.

Target contract:

```ts
type Insight = {
  id: string;
  briefingId: string;
  date: string;
  sourceType: "rss" | "x";
  sourceLabel: string;
  sourceName?: string;
  sourceUrl?: string;
  title: string;
  summary: string;
  take: string;
  whyItMatters?: string;
  buildIdea?: string;
  learnGoal?: string;
  topics: string[];
  entities: string[];
  signalScore?: number;
  effortEstimate?: "30m" | "2h" | "weekend";
  isTopSignal: boolean;
};
```

## First Decision: What Counts As One Insight

### RSS

One RSS briefing entry maps to one `Insight`.

Reason:

- RSS files are already entry-first
- each entry has a title, source, summary, and take
- this is the natural content unit already used by the product

### X

One curated bullet under `## 值得关注的推文` maps to one `Insight`.

Reason:

- X files are day-level aggregate documents, not repeated article entries
- the curated tweet bullets are the smallest stable units that already carry topical content and source-link provenance
- `今日3条要点` and `可执行动作` are day-level sections and should not be forced into one-to-one per-insight mappings

Explicit non-decision for v1:

- do not create separate `Insight` records from `今日3条要点`
- do not create separate `Insight` records from `可执行动作`

Those sections should stay available for later page-level/day-level data structures rather than being overfit into the `Insight` schema.

## Normalization Principles

1. Prefer stable extraction over ambitious inference.
2. Do not hallucinate fields that the current sources do not reliably provide.
3. Use deterministic derived rules only where the result is predictable and testable.
4. If a field has no stable source in v1, keep it optional.
5. Preserve future upgrade room for heuristic enrichment without changing the core contract.

## Field Mapping Table

| Field | RSS v1 rule | X v1 rule | Decision |
| --- | --- | --- | --- |
| `id` | Deterministic slug from `sourceType`, `date`, and entry ordinal, plus title slug | Deterministic slug from `sourceType`, `date`, subsection key, bullet ordinal, and derived title slug | derived |
| `briefingId` | `rss-YYYY-MM-DD` | `x-YYYY-MM-DD` | derived |
| `date` | Canonical date from filename; use H1 only as validation | Canonical date from filename; use H1 only as validation | derived |
| `sourceType` | `"rss"` | `"x"` | direct/derived |
| `sourceLabel` | constant `"RSS Briefing"` | constant `"X Briefing"` | derived |
| `sourceName` | `**Source:**` line | first handle text from the curated bullet; if multiple handles, join in source order with `, ` | direct/derived |
| `sourceUrl` | H2 markdown link URL | first inline `原帖` link in the bullet; if absent, fall back to matching index URL only when one unambiguous match exists | direct/derived |
| `title` | H2 link text | derived from cleaned curated-bullet text using deterministic first-clause extraction | direct/derived |
| `summary` | `Chinese Summary` body | cleaned curated-bullet text without handles and inline `原帖` link markup | direct/derived |
| `take` | `R2 Take` body | same as cleaned curated-bullet text in v1 | direct/derived |
| `whyItMatters` | absent in stable upstream labels; keep undefined in parser output | absent in stable upstream labels; keep undefined in parser output | optional in v1 |
| `buildIdea` | absent as a dedicated stable label; keep undefined in parser output | do not force-map from `可执行动作`; keep undefined in parser output | optional in v1 |
| `learnGoal` | absent as a dedicated stable label; keep undefined in parser output | do not force-map from `可执行动作`; keep undefined in parser output | optional in v1 |
| `topics` | controlled-vocabulary tagging over `title + summary + take` | controlled-vocabulary tagging over `title + summary + take`; subsection may be a weak hint, not the sole topic source | derived |
| `entities` | initialize from extracted named entities if parser gets them later; otherwise `[]` | initialize from extracted named entities if parser gets them later; otherwise `[]` | derived with empty default |
| `signalScore` | no stable per-entry score observed; keep undefined | do not copy day-level `信号评分` onto each insight; keep undefined | optional in v1 |
| `effortEstimate` | no stable upstream field; keep undefined | no stable upstream field; keep undefined | optional in v1 |
| `isTopSignal` | mark first 3 normalized RSS insights of the day by source order as `true`, remainder `false` | mark first 3 normalized X insights of the day by subsection order then bullet order as `true`, remainder `false` | derived |

## Required Fields: Locked Rules

### `id`

Rule:

- deterministic
- lowercase
- ascii slug
- stable across reruns on the same input

Recommended shape:

```text
rss-2026-03-20-04-how-we-monitor-internal-coding-agents
x-2026-03-14-tools-02-agentic-reviewer
```

Why:

- stable IDs are required for permalinks and local state
- the ordinal protects against same-title collisions within one day

### `title`

#### RSS

Use the H2 link text verbatim after trim normalization.

#### X

Use this deterministic derivation rule:

1. start from the curated bullet text
2. strip handle prefix and inline `原帖` link segments
3. trim whitespace and markdown artifacts
4. take the first clause ending at the earliest of:
   - `。`
   - `；`
   - `！`
   - `？`
   - `:`
   - `：`
   - `，`
5. if no delimiter is found, use the first 80 characters
6. trim again

Reason:

- X bullets do not provide a dedicated title field
- first-clause extraction is deterministic and testable
- it avoids inventing a separate summary-generation step during parsing

### `summary`

#### RSS

Use `Chinese Summary` as the summary body.

#### X

Use the curated bullet body after:

- removing the leading handle tokens
- removing inline `原帖` link wrappers
- preserving the core descriptive sentence text

Reason:

- the curated bullet itself is already a compressed summary

### `take`

#### RSS

Use `R2 Take` directly.

#### X

Set `take = summary` in v1.

Reason:

- X files do not carry a dedicated per-bullet takeaway field
- the curated bullet is already an editorialized takeaway
- duplicating `summary` into `take` is preferable to inventing a second heuristic field prematurely

## Optional Fields: Explicit v1 Decisions

### `whyItMatters`

Decision:

- optional in v1 parser output for both RSS and X

Reason:

- no stable upstream section label currently maps to this field
- forcing a heuristic now would hide the fact that the source does not really provide it

### `buildIdea`

Decision:

- optional in v1 parser output for both RSS and X

Reason:

- RSS `R2 Take` often contains build cues, but not in a stable dedicated subfield
- X `可执行动作` is a day-level action list and should not be force-joined to individual tweet bullets

Future upgrade path:

- later enrichment can extract project-like suggestions from RSS `R2 Take`
- later day-to-insight linking can connect X `可执行动作` to specific insights when evidence is strong enough

### `learnGoal`

Decision:

- optional in v1 parser output for both RSS and X

Reason:

- current upstream does not expose a stable dedicated learn-goal field
- this matches the PRD default recommendation that `learnGoal` remains optional when absent

### `signalScore`

Decision:

- optional in v1 parser output for both RSS and X

Reason:

- RSS audit did not find a stable per-entry score label
- X `信号评分` is day-level, not per-insight
- copying one day-level score to every insight would imply false precision

### `effortEstimate`

Decision:

- optional in v1 parser output for both RSS and X

Reason:

- no audited source provides a stable effort field
- v1 should not invent effort from vague wording

## Derived Fields: Locked Rules

### `topics`

Rule:

- derive from a controlled vocabulary over normalized text
- primary text window:
  - `title`
  - `summary`
  - `take`
- X subsection name can be a weak hint only when it clearly maps to a controlled topic

Explicit topic policy:

- do not use X subsection labels like `热门趋势` or `新闻动态` as topics directly
- `工具与项目` may contribute a weak `Tooling` hint, but only alongside text evidence

Reason:

- section labels describe editorial grouping, not always domain topic

### `entities`

Rule:

- initialize to `[]` in v1 if no extractor runs
- later parser/normalizer work can populate this field without changing the contract

Reason:

- the contract should reserve the field now, but the source audit does not justify a brittle extractor yet

### `isTopSignal`

Rule:

- derive from normalized source order, not from a separate score field
- RSS ordering:
  - file entry order
- X ordering:
  - subsection order within `值得关注的推文`
  - then bullet order within subsection
- mark first 3 normalized insights of the day as `true`
- mark the remainder `false`

Reason:

- `/today` needs a deterministic top-signals cut
- the current upstream data does not provide stable per-insight scoring
- source order is inspectable and testable

## Source-Specific Mapping Notes

### RSS Notes

- RSS is the stronger source for:
  - explicit titles
  - explicit summaries
  - explicit editorial takeaways
- RSS is weaker for:
  - dedicated build ideas
  - dedicated learn goals
  - explicit per-entry score labels in the currently audited files

### X Notes

- X is the stronger source for:
  - source-link provenance
  - current-trend signal discovery
  - grouped curated tweet summaries
- X is weaker for:
  - dedicated titles
  - dedicated per-item takeaways separate from summaries
  - safe per-insight mapping for day-level action bullets and day-level scores

## Decisions That Constrain T06

For `T06`, the TypeScript model should:

1. move from `source` to `sourceType + sourceLabel + sourceName?`
2. rename `takeaway` to `take`
3. keep `whyItMatters`, `buildIdea`, `learnGoal`, `signalScore`, and `effortEstimate` optional
4. include `briefingId`, `entities`, and `isTopSignal`
5. stop requiring fields that current audited inputs do not reliably provide

## Open Questions Left For T04/T05/T06+

- whether page-level loader data should also expose day-level X sections such as `今日3条要点` and `可执行动作`
- whether future enrichment should create `buildIdea` from RSS `R2 Take`
- whether X `原帖链接索引` should be used only for provenance or also for deduplication/backfilling missing inline URLs
