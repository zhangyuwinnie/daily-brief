# RSS Briefing V1 Audit

Last updated: 2026-03-21
Task: `T01`

## Scope

Audit the current RSS-derived briefing Markdown files under `/Users/yuzhang/.openclaw/workspace/briefings/[0-9]*.md` and record the exact section patterns the v1 parser must support.

Primary deep-read samples:

- `2026-02-17.md`
- `2026-02-21.md`
- `2026-02-27.md`
- `2026-03-20.md`

Broader structure scan:

- all 39 RSS-style files currently present in the directory

## Stable File Envelope

Observed top-level file pattern:

1. A single H1 heading in the form `# Daily Briefing: YYYY-MM-DD`
2. One or more insight entries
3. Entries usually separated by `---`
4. An optional trailing note after the final separator

Observed entry-count range in the current RSS set:

- minimum: 1 entry (`2026-02-17.md`, `2026-03-21.md`)
- maximum: 12 entries (`2026-02-27.md`)

## Stable Entry Pattern

The dominant entry shape is:

```md
## [Title](url)
**Source:** Source Name

> **Chinese Summary:** ...
> **R2 Take:** ...
```

Stable fields observed in every deep-read sample:

- title inside a Markdown link on the H2 line
- source on a dedicated `**Source:**` line
- `Chinese Summary`
- `R2 Take`

The v1 RSS parser can safely assume those four fields are the main content units, but it must treat the last two as format-variant labels rather than one exact line shape.

## Repeated Section Labels

Observed repeated labels across the RSS file set:

- `# Daily Briefing:`
- `## [`
- `**Source:**`
- `**Chinese Summary:**`
- `**R2 Take:**`
- `---`

No additional stable section labels such as `Key Points`, `Why It Matters`, or `Build Idea` were observed in the RSS files audited for v1.

## Formatting Variants The Parser Must Support

### Variant A: blockquote inline labels

This is the most common shape.

```md
> **Chinese Summary:** text...
> **R2 Take:** text...
```

Observed in:

- `2026-02-17.md`
- `2026-02-27.md`

### Variant B: plain bold multiline labels

Some files drop the blockquote marker and put the label on one line with the body on the next line.

```md
**Chinese Summary:**
text...

**R2 Take:**
text...
```

Observed in:

- `2026-02-21.md`
- `2026-03-20.md`

### Variant C: optional blank lines inside an entry

Blank lines can appear:

- between `Source` and `Chinese Summary`
- between `Chinese Summary` and `R2 Take`
- before the trailing `---`

Observed in:

- `2026-02-17.md`
- `2026-02-27.md`

The parser should normalize extra blank lines instead of using fixed line offsets.

## Content Edge Cases Already Present

### Fallback summaries and takes

Some entries contain fallback content rather than a real summary/take:

- `No summary available.`
- `(Automated Snippet)`
- `(Automated Snippet - LLM Timeout)`
- `Matched keywords: ...`

Observed in:

- `2026-02-10.md`
- `2026-03-18.md`

Implication:

- v1 should preserve these values as raw content or flag them later during normalization/warning collection
- the parser should not reject an entry just because the content looks machine-generated or low quality

### Raw HTML or page-noise inside summaries

Some summaries include HTML tags, CSS, or scraped page noise.

Observed in:

- `2026-02-10.md` with inline HTML such as `<CODE>` and `<WBR>`
- `2026-02-12.md` and `2026-02-13.md` with CSS / page-fragment noise in the summary body

Implication:

- the parser should extract the labeled field reliably first
- content sanitization should happen as a later concern, not by making the line matcher brittle

### Single-entry files

Some days contain only one insight.

Observed in:

- `2026-02-17.md`
- `2026-03-21.md`

Implication:

- do not rely on multiple separators or a minimum item count

### High-cardinality days

Some days contain many insight entries.

Observed in:

- `2026-02-27.md` with 12 entries

Implication:

- v1 parsing should iterate until EOF and not assume a small bounded count

### Trailing file note outside the last entry

An out-of-band footer can appear after the final separator.

Observed in:

- `2026-02-17.md` with `*(Auto-generated via manual intervention due to script latency)*`

Implication:

- the parser should ignore unmatched trailing prose once the final entry is closed

## Safe V1 Parsing Assumptions

Safe assumptions:

- file date can be derived from the H1 or filename
- each entry starts at `## [`
- `Source`, `Chinese Summary`, and `R2 Take` are the core labeled fields
- entry separators are usually `---` but should not be required after the final item

Unsafe assumptions:

- summary and take are always blockquoted
- summary and take always live on one physical line
- content is always clean natural language text
- every file has multiple entries
- every file ends immediately after the last entry

## Parser Guidance For T07/T09/T11

Fixture coverage should include:

1. a normal blockquote-style file
2. a plain-bold multiline file
3. an automated-snippet fallback entry
4. a file with trailing footer noise or noisy HTML in a summary

Recommended extraction order:

1. split file into entries by H2 headings, not by `---`
2. parse the H2 link into `title` and `sourceUrl`
3. parse the `Source` label
4. parse `Chinese Summary` and `R2 Take` with support for both blockquote and plain-bold variants
5. tolerate extra blank lines and preserve raw text bodies

## Open Questions Left For Later Tasks

- whether fallback phrases such as `Matched keywords:` should map to warnings only or also to nullable normalized fields
- whether HTML cleanup belongs in the parser stage or the normalizer stage
- whether the H1 date or the filename should be treated as the canonical date source when they ever disagree
