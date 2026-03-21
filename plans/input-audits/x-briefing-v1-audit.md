# X Briefing V1 Audit

Last updated: 2026-03-21
Task: `T02`

## Scope

Audit the current X-derived briefing Markdown files under `/Users/yuzhang/.openclaw/workspace/briefings/x_briefing_*.md` and record the exact section patterns the v1 parser must support.

Primary deep-read samples:

- `x_briefing_2026-02-24.md`
- `x_briefing_2026-03-03.md`
- `x_briefing_2026-03-05.md`
- `x_briefing_2026-03-14.md`
- `x_briefing_2026-03-17.md`
- `x_briefing_2026-03-20.md`

Broader structure scan:

- all 21 X-style files currently present in the directory

## Core Structural Finding

The X format is not shaped like the RSS format.

RSS files are entry-first and article-oriented.
X files are day-level aggregate briefings with curated sections and grouped tweet bullets.

That means the X parser should first extract one day-level structured document, then decide later how or whether to normalize individual bullets into `Insight` records.

## Stable File Envelope

Observed top-level file pattern:

1. An H1 heading in the form `# 🐦 X Morning Briefing - YYYY-MM-DD`
2. `## 今日3条要点`
3. `## 值得关注的推文`
4. `## 可执行动作`
5. `## 信号评分`
6. optionally `## 原帖链接索引`

Across the current 21 X files:

- `今日3条要点`: present in 21/21
- `值得关注的推文`: present in 21/21
- `可执行动作`: present in 21/21
- `信号评分`: present in 21/21
- `原帖链接索引`: present in 20/21

Observed in:

- missing `原帖链接索引` only in `x_briefing_2026-02-24.md`

## Stable Section Pattern

The dominant X file shape is:

```md
# 🐦 X Morning Briefing - YYYY-MM-DD

## 今日3条要点
- ...
- ...
- ...

## 值得关注的推文
### 热门趋势
- ...
### 工具与项目
- ...
### 观点洞察
- ...
### 新闻动态
- ...

## 可执行动作
- ...

## 信号评分
- 🔥 热度：8/10
- 🧠 含金量：9/10
- 一句话结论：...

## 原帖链接索引
- [@handle] text...
  https://x.com/...
```

The parser can safely treat the file as sectioned markdown with nested bullet lists, not as repeated H2 insight entries.

## Required And Optional Subsections

Within `## 值得关注的推文`, the common subsection set is:

- `### 热门趋势`
- `### 工具与项目`
- `### 观点洞察`
- `### 新闻动态`

Observed optionality across the current X set:

- `### 热门趋势`: present in 21/21
- `### 工具与项目`: present in 21/21
- `### 观点洞察`: present in 20/21
- `### 新闻动态`: present in 17/21

Observed in:

- missing `### 观点洞察` in `x_briefing_2026-03-17.md`
- missing `### 新闻动态` in:
  - `x_briefing_2026-03-02.md`
  - `x_briefing_2026-03-05.md`
  - `x_briefing_2026-03-07.md`
  - `x_briefing_2026-03-10.md`

Implication:

- the parser should preserve subsection order when present
- it must not require every subsection to exist in every file

## Bullet Variants The Parser Must Support

### Variant A: plain handle bullet

```md
- [@Min Choi] text... (原帖: [链接](https://x.com/...))
```

Observed in:

- `x_briefing_2026-03-03.md`
- `x_briefing_2026-03-14.md`

### Variant B: linked handle bullet

```md
- [@Andrew Ng](https://x.com/...): text...（原帖: [链接](https://x.com/...)）
```

Observed in:

- `x_briefing_2026-03-05.md`

### Variant C: multiple handles in one bullet

```md
- [@stash]、[@Rohan Paul] & [@Alex Finn] text...
```

Observed in:

- `x_briefing_2026-03-03.md`
- `x_briefing_2026-03-03.md` also contains multiple `(原帖: [链接](...))` segments in one bullet

### Variant D: irregular bullet indentation

Some files indent the bullet marker with extra spaces.

```md
-   [@Sen. Bernie Sanders] ...
```

Observed in:

- `x_briefing_2026-03-20.md`

Implication:

- the parser should trim leading bullet whitespace and not rely on one exact indentation style

## Stable Page-Level Sections

### `今日3条要点`

Observed behavior:

- usually exactly 3 bullets
- each bullet is a condensed topline, sometimes with bold lead-in text

Observed in:

- `x_briefing_2026-02-24.md`
- `x_briefing_2026-03-14.md`

Parser implication:

- model this as an ordered list of toplines, not as tweet bullets

### `可执行动作`

Observed behavior:

- typically 2-3 actionable bullets
- action lines are already summary-level recommendations, not raw tweets

Observed in:

- `x_briefing_2026-02-24.md`
- `x_briefing_2026-03-20.md`

Parser implication:

- these should likely map later to build/learn cues at the day or insight level

### `信号评分`

Observed behavior:

- almost always three bullets:
  - `🔥 热度`
  - `🧠 含金量`
  - `一句话结论`
- some files add parenthetical explanation text after the numeric score

Observed in:

- no-parenthetical style: `x_briefing_2026-03-14.md`
- parenthetical style: `x_briefing_2026-03-05.md`

Parser implication:

- parse score numbers leniently from the leading numeric `x/10`
- treat the rest of the line as optional explanation text

### `原帖链接索引`

Observed behavior:

- each index item is a two-line pair:
  - bullet line with handle and snippet
  - following raw URL line
- the index can contain posts not referenced in the curated summary sections
- the index can include `analytics` URLs, ad/promoted-looking posts, and `photo/1` suffixes

Observed in:

- `x_briefing_2026-03-03.md`
- `x_briefing_2026-03-14.md`

Parser implication:

- treat this section as optional raw source inventory
- do not assume every indexed post maps to a curated bullet
- do not assume every URL is a clean canonical tweet URL

## Content Edge Cases Already Present

### Curated bullets can summarize more than one post

One curated bullet can cite multiple source links.

Observed in:

- `x_briefing_2026-03-03.md`

Implication:

- do not assume one bullet equals one source tweet

### Inline source link syntax varies

The inline reference can appear as:

- Chinese full-width punctuation `（原帖: [链接](...)）`
- ASCII punctuation `(原帖: [链接](...))`
- multiple repeated inline source references on the same line

Observed in:

- `x_briefing_2026-03-03.md`
- `x_briefing_2026-03-14.md`
- `x_briefing_2026-03-05.md`

Implication:

- parse inline raw source links by pattern, not exact punctuation

### Handle tokenization is not normalized

Handles can include:

- spaces
- punctuation
- Chinese characters
- mixed casing

Observed in:

- `[@Kaito | 海斗]`
- `[@Matt Dancho (Business Science)]`
- `[@Sen. Bernie Sanders]`

Implication:

- do not validate handle text too strictly

### Some sections contain more raw inventory than curated content

`原帖链接索引` often includes many more links than the curated summary bullets.

Observed range in the current X set:

- minimum indexed links: 4 in `x_briefing_2026-02-27.md`
- maximum indexed links: 20 in `x_briefing_2026-02-25.md`

Implication:

- treat curation and source inventory as separate structures

## Safe V1 Parsing Assumptions

Safe assumptions:

- file date can be derived from the H1 or filename
- the file is organized by labeled H2 sections
- `值得关注的推文` contains subsection-grouped tweet bullets
- `信号评分` contains structured score lines even if formatting details vary

Unsafe assumptions:

- every file has `原帖链接索引`
- every curated subsection exists
- every bullet cites exactly one tweet
- every handle is a single simple token
- every bullet uses the same markdown link syntax

## Parser Guidance For T08/T10/T12

Fixture coverage should include:

1. a normal X file with all core sections and raw index
2. a file with linked handles in bullets
3. a file with multiple handles and multiple inline source links
4. a file missing one curated subsection
5. a file missing `原帖链接索引`
6. a file with extra bullet indentation

Recommended extraction order:

1. parse the H1 into briefing date and source type
2. split the file by H2 sections
3. parse `今日3条要点` as ordered summary bullets
4. parse `值得关注的推文` into subsection buckets with raw bullet text plus extracted inline source links
5. parse `可执行动作`
6. parse `信号评分`
7. parse optional `原帖链接索引` as source inventory records

## Open Questions Left For Later Tasks

- whether normalized `Insight` records should be created from curated tweet bullets, from toplines, or both
- whether the original-link index should be used only for provenance or also for enrichment and deduplication
- whether score lines belong at the day level only or should influence per-insight `signalScore`
