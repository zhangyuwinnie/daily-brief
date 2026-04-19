import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_BRIEFING_ITEMS = 12;

export const DEFAULT_KEYWORDS = [
  "Agent",
  "Agentic",
  "Workflow",
  "Automation",
  "Productivity",
  "RAG",
  "LLM",
  "Tooling",
  "System Design",
  "Engineering",
  "Open Source",
  "MCP",
  "Model Context Protocol",
  "Reinforcement Learning",
  "Planning",
  "Reasoning",
  "Coding Agent",
  "DevTools",
  "LangChain",
  "LlamaIndex",
  "AutoGen",
  "CrewAI",
  "OpenAI",
  "Anthropic",
  "Gemini",
  "Claude",
  "Codex",
  "Cursor"
];

export const DEFAULT_SOURCES = [
  "https://blog.langchain.dev/rss/",
  "https://medium.com/feed/llamaindex-blog",
  "https://openai.com/news/rss.xml",
  "https://deepmind.google/blog/rss.xml",
  "https://research.google/blog/rss/",
  "https://lilianweng.github.io/index.xml",
  "https://eugeneyan.com/rss/",
  "https://simonwillison.net/atom/everything/",
  "https://github.blog/feed/",
  "https://news.ycombinator.com/rss",
  "https://huggingface.co/blog/feed.xml",
  "https://vercel.com/atom",
  "https://bair.berkeley.edu/blog/feed.xml",
  "https://ai.stanford.edu/blog/feed.xml",
  "https://www.microsoft.com/en-us/research/feed/",
  "https://www.interconnects.ai/feed",
  "https://magazine.sebastianraschka.com/feed"
];

export const DEFAULT_HTML_SOURCES = [
  {
    name: "Cursor Blog",
    url: "https://cursor.com/blog"
  }
];

const SOURCE_PRIORITY = {
  openai: 1,
  anthropic: 1,
  "google deepmind": 1,
  deepmind: 1,
  "google ai blog": 1,
  "google research": 1,
  langchain: 1,
  llamaindex: 1,
  "hugging face": 1,
  "lil'log": 2,
  "eugene yan": 2,
  "simon willison": 2,
  interconnects: 2,
  "sebastian raschka": 2,
  "cursor blog": 2,
  cursor: 2,
  bair: 2,
  "stanford ai": 2,
  "microsoft research": 2,
  vercel: 3,
  "github blog": 3,
  "the github blog": 3,
  "hacker news": 4
};

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, text/html, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive"
};
const REQUEST_TIMEOUT_MS = 20_000;

function getScriptDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

export function getRepoRoot() {
  return path.resolve(getScriptDir(), "..");
}

export function getLADate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function getBriefingPaths({ repoRoot = getRepoRoot(), date = getLADate(), outputDir } = {}) {
  const briefingsDir = outputDir ?? path.join(repoRoot, "briefings");

  return {
    repoRoot,
    briefingsDir,
    filePath: path.join(briefingsDir, `${date}.md`)
  };
}

function decodeHtmlEntities(text = "") {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(text = "") {
  return decodeHtmlEntities(text).replace(/<[^>]+>/g, " ");
}

function collapseWhitespace(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function cleanInline(text = "") {
  return collapseWhitespace(stripTags(text));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSourcePriority(sourceName = "") {
  const normalized = sourceName.toLowerCase().trim();

  for (const [key, priority] of Object.entries(SOURCE_PRIORITY)) {
    if (normalized.includes(key)) {
      return priority;
    }
  }

  return 3;
}

function tokenizeTitle(title = "") {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter((item) => setB.has(item)));
  const union = new Set([...setA, ...setB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

function containmentSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }

  const smaller = setA.size <= setB.size ? setA : setB;
  const larger = setA.size <= setB.size ? setB : setA;
  const overlap = [...smaller].filter((item) => larger.has(item)).length;

  return overlap / smaller.size;
}

export function deduplicateByTopic(items, jaccardThreshold = 0.5, containmentThreshold = 0.8) {
  if (items.length <= 1) {
    return items;
  }

  const tokenized = items.map((item) => ({
    item,
    tokens: tokenizeTitle(item.title || ""),
    priority: getSourcePriority(item.source || "")
  }));
  const clusterOf = tokenized.map((_, index) => index);

  function find(index) {
    let value = index;
    while (clusterOf[value] !== value) {
      clusterOf[value] = clusterOf[clusterOf[value]];
      value = clusterOf[value];
    }
    return value;
  }

  function union(left, right) {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft !== rootRight) {
      clusterOf[rootRight] = rootLeft;
    }
  }

  for (let i = 0; i < tokenized.length; i += 1) {
    for (let j = i + 1; j < tokenized.length; j += 1) {
      const jaccard = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      const containment = containmentSimilarity(tokenized[i].tokens, tokenized[j].tokens);

      if (jaccard >= jaccardThreshold || containment >= containmentThreshold) {
        union(i, j);
      }
    }
  }

  const clusters = new Map();
  for (let index = 0; index < tokenized.length; index += 1) {
    const root = find(index);
    const group = clusters.get(root) ?? [];
    group.push(tokenized[index]);
    clusters.set(root, group);
  }

  return [...clusters.values()].map((members) => {
    members.sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return (right.item.matchedKeywords?.length || 0) - (left.item.matchedKeywords?.length || 0);
    });
    return members[0].item;
  });
}

export function applySourceDiversityLimit(
  rankedItems,
  allCandidates,
  maxPerSource = 2,
  targetCount = MAX_BRIEFING_ITEMS
) {
  const result = [];
  const sourceCount = new Map();
  const usedLinks = new Set();

  for (const item of rankedItems) {
    if (result.length >= targetCount) {
      break;
    }

    const currentCount = sourceCount.get(item.source) || 0;
    if (currentCount < maxPerSource) {
      result.push(item);
      sourceCount.set(item.source, currentCount + 1);
      usedLinks.add(item.link);
    }
  }

  if (result.length < targetCount) {
    const remaining = allCandidates
      .filter((item) => !usedLinks.has(item.link))
      .sort((left, right) => fallbackRankScore(right) - fallbackRankScore(left));

    for (const item of remaining) {
      if (result.length >= targetCount) {
        break;
      }

      const currentCount = sourceCount.get(item.source) || 0;
      if (currentCount < maxPerSource) {
        result.push(item);
        sourceCount.set(item.source, currentCount + 1);
      }
    }
  }

  return result;
}

function parseFeedDate(value) {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === "null") {
    return undefined;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function extractFirst(xmlBlock, regexes) {
  for (const regex of regexes) {
    const match = xmlBlock.match(regex);
    if (match?.[1]) {
      return cleanInline(match[1]);
    }
  }
  return "";
}

function extractLink(xmlBlock, sourceUrl) {
  const hrefMatch = xmlBlock.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (hrefMatch?.[1]) {
    return new URL(hrefMatch[1], sourceUrl).toString();
  }

  const textMatch = xmlBlock.match(/<link>([\s\S]*?)<\/link>/i);
  if (textMatch?.[1]) {
    try {
      return new URL(cleanInline(textMatch[1]), sourceUrl).toString();
    } catch {
      return cleanInline(textMatch[1]);
    }
  }

  const guidMatch = xmlBlock.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  if (guidMatch?.[1]) {
    const guid = cleanInline(guidMatch[1]);
    if (/^https?:\/\//i.test(guid)) {
      return guid;
    }
  }

  return "";
}

function extractXmlBlocks(xml, tagName) {
  const blocks = [];
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let cursor = 0;

  while (cursor < xml.length) {
    const start = xml.indexOf(openTag, cursor);
    if (start === -1) {
      break;
    }

    const end = xml.indexOf(closeTag, start);
    if (end === -1) {
      break;
    }

    blocks.push(xml.slice(start, end + closeTag.length));
    cursor = end + closeTag.length;
  }

  return blocks;
}

function extractHtmlAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}=["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}

function extractParagraphs(htmlBlock) {
  return [...htmlBlock.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)].map((match) => ({
    className: extractHtmlAttribute(match[1] ?? "", "class"),
    text: cleanInline(match[2] ?? "")
  }));
}

function pickCursorTitle(paragraphs) {
  const titleCandidate = paragraphs.find(({ className }) => {
    const normalized = className.toLowerCase();
    return normalized.includes("text-theme-text") && !normalized.includes("text-theme-text-sec");
  });

  if (titleCandidate?.text) {
    return titleCandidate.text;
  }

  return paragraphs.find(({ text }) => text.length > 20)?.text ?? "";
}

function pickCursorSnippet(paragraphs, title) {
  const snippetCandidate = paragraphs.find(({ className }) =>
    className.toLowerCase().includes("text-theme-text-sec")
  );

  if (snippetCandidate?.text) {
    return snippetCandidate.text;
  }

  return (
    paragraphs.find(({ text }) => text && text !== title && text.length > 40)?.text ??
    ""
  );
}

export function parseFeedXml(xml, sourceUrl) {
  const feedTitle =
    extractFirst(xml, [
      /<channel\b[\s\S]*?<title>([\s\S]*?)<\/title>/i,
      /<feed\b[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i
    ]) || new URL(sourceUrl).host;
  const itemBlocks = extractXmlBlocks(xml, "item");
  const entryBlocks = extractXmlBlocks(xml, "entry");
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  return blocks
    .map((block) => {
      const title = extractFirst(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
      const contentSnippet = extractFirst(block, [
        /<description[^>]*>([\s\S]*?)<\/description>/i,
        /<summary[^>]*>([\s\S]*?)<\/summary>/i,
        /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i,
        /<content[^>]*>([\s\S]*?)<\/content>/i
      ]);
      const isoDate = parseFeedDate(
        extractFirst(block, [
          /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i,
          /<updated[^>]*>([\s\S]*?)<\/updated>/i,
          /<published[^>]*>([\s\S]*?)<\/published>/i,
          /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i
        ])
      );
      const link = extractLink(block, sourceUrl);

      return {
        title,
        link,
        contentSnippet,
        source: feedTitle,
        isoDate
      };
    })
    .filter((item) => item.title && item.link);
}

export function parseCursorBlogHtml(html, source) {
  const articleBlocks = extractXmlBlocks(html, "article");
  const items = [];
  const seenLinks = new Set();

  for (const articleBlock of articleBlocks) {
    const linkMatch = articleBlock.match(/<a\b[^>]*href="(\/blog\/[^"#?]+)"[^>]*>/i);
    const relativeLink = linkMatch?.[1];

    if (!relativeLink || seenLinks.has(relativeLink)) {
      continue;
    }

    const paragraphs = extractParagraphs(articleBlock);
    const title = pickCursorTitle(paragraphs);

    if (!title) {
      continue;
    }

    seenLinks.add(relativeLink);

    const isoDate =
      parseFeedDate(articleBlock.match(/<time[^>]*dateTime="([^"]+)"/i)?.[1]) ?? new Date().toISOString();

    items.push({
      title,
      link: new URL(relativeLink, source.url).toString(),
      contentSnippet: pickCursorSnippet(paragraphs, title),
      source: source.name,
      isoDate
    });
  }

  return items;
}

async function readResponseText(response) {
  let timeoutId;

  try {
    return await Promise.race([
      response.text(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Response body timed out after ${REQUEST_TIMEOUT_MS}ms`));
        }, REQUEST_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function fetchTextWithTimeout(url, { fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await readResponseText(response);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function defaultFetchFeedItems(sourceUrl, { fetchImpl = fetch, logger = console } = {}) {
  try {
    const xml = await fetchTextWithTimeout(sourceUrl, { fetchImpl });
    return parseFeedXml(xml, sourceUrl);
  } catch (error) {
    logger.warn(`Failed to fetch feed ${sourceUrl}: ${error.message}`);
    return [];
  }
}

export async function defaultFetchHtmlItems(source, { fetchImpl = fetch, logger = console } = {}) {
  try {
    const html = await fetchTextWithTimeout(source.url, { fetchImpl });
    return parseCursorBlogHtml(html, source);
  } catch (error) {
    logger.warn(`Failed to fetch HTML source ${source.url}: ${error.message}`);
    return [];
  }
}

function fallbackRankScore(item) {
  const keywordScore = (item.matchedKeywords?.length || 0) * 5;
  const sourceScore = Math.max(0, 5 - getSourcePriority(item.source || ""));
  const titleBoost = /agent|workflow|mcp|tool|coding|reason/i.test(item.title || "") ? 2 : 0;
  return keywordScore + sourceScore + titleBoost;
}

function extractJsonSnippet(text = "") {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0];
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  return arrayMatch?.[0];
}

async function callGeminiText(prompt, { apiKey, modelName, logger, maxRetries = 3 }) {
  if (!apiKey) {
    return null;
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      const isRetryable = /503|429|overloaded|high demand/i.test(error.message);
      if (isRetryable && attempt < maxRetries - 1) {
        const delay = 2000 * 2 ** attempt; // 2s, 4s, 8s
        logger.warn(`Gemini call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay / 1000}s: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.warn(`Gemini call failed (attempt ${attempt + 1}/${maxRetries}): ${error.message}`);
        return null;
      }
    }
  }

  return null;
}

function buildRankingPrompt(candidates, maxItems) {
  const listing = candidates
    .map((item, index) => {
      const keywords = item.matchedKeywords.join(", ");
      return `[${index}] ${item.title} | source=${item.source} | keywords=${keywords}`;
    })
    .join("\n");

  return `You are ranking daily AI briefing candidates for agent builders.

Goal:
- prioritize changes that alter what builders can do
- prioritize changes that alter workflows, tooling, or agent capability
- prefer non-obvious technical signal over hype or generic launch coverage
- deprioritize press releases without practical implications

Return only a JSON array of up to ${maxItems} integer indexes, ordered best to worst.

Candidates:
${listing}`;
}

function parseRankingResponse(text, maxItems, totalCandidates) {
  const json = extractJsonSnippet(text);
  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const deduped = [...new Set(parsed)]
      .filter((value) => Number.isInteger(value) && value >= 0 && value < totalCandidates)
      .slice(0, maxItems);

    return deduped.length > 0 ? deduped : null;
  } catch {
    return null;
  }
}

export async function defaultRankCandidates(
  candidates,
  {
    maxItems = MAX_BRIEFING_ITEMS,
    apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    logger = console
  } = {}
) {
  if (candidates.length <= maxItems) {
    return [...candidates];
  }

  const prompt = buildRankingPrompt(candidates, maxItems);
  const responseText = await callGeminiText(prompt, {
    apiKey,
    modelName: "gemini-2.5-flash",
    logger
  });
  const indices = responseText
    ? parseRankingResponse(responseText, maxItems, candidates.length)
    : null;

  if (indices) {
    return indices.map((index) => candidates[index]);
  }

  return [...candidates].sort((left, right) => fallbackRankScore(right) - fallbackRankScore(left));
}

function parseSummaryResponse(text) {
  const json = extractJsonSnippet(text);
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed?.summary === "string" && typeof parsed?.take === "string") {
        return {
          summary: collapseWhitespace(parsed.summary),
          take: collapseWhitespace(parsed.take)
        };
      }
    } catch {
      // fall through to label parsing
    }
  }

  const summaryPattern = new RegExp(
    `(?:^|\\n)>?\\s*\\*\\*${escapeRegExp("Chinese Summary")}:\\*\\*\\s*(.+)$`,
    "im"
  );
  const takePattern = new RegExp(`(?:^|\\n)>?\\s*\\*\\*${escapeRegExp("R2 Take")}:\\*\\*\\s*(.+)$`, "im");
  const summary = responseTextMatch(text, summaryPattern);
  const take = responseTextMatch(text, takePattern);

  if (summary && take) {
    return { summary, take };
  }

  return null;
}

function responseTextMatch(text, pattern) {
  const match = text.match(pattern);
  return match?.[1] ? collapseWhitespace(match[1]) : "";
}

function fallbackSummary(candidate) {
  const snippet = cleanInline(candidate.contentSnippet).slice(0, 180);
  const summary =
    snippet || `${candidate.title} 带来了值得关注的新变化，需要从工作流和能力边界重新评估。`;
  const takeKeywords =
    candidate.matchedKeywords && candidate.matchedKeywords.length > 0
      ? candidate.matchedKeywords.join("、")
      : "AI builders";

  return {
    summary: summary.endsWith("。") ? summary : `${summary}。`,
    take: `这件事与 ${takeKeywords} 直接相关，值得优先评估它是否改变了构建 agent、工具链或自动化流程的可行边界。`
  };
}

function buildSummaryPrompt(candidate) {
  const snippet = cleanInline(candidate.contentSnippet).slice(0, 800);
  const keywords = candidate.matchedKeywords.join(", ");

  return `You are a Senior Technical Architect and an expert Information Extraction Engine curating a high-density daily briefing for AI builders. Your objective is to filter out noise and extract the raw, actionable engineering signal.

# Core Principles
- First Principles Thinking: Strip away surface-level narrative. Identify the underlying technical mechanism, architectural pattern, or paradigm shift.
- Builder-Centric: Focus strictly on what changes for developers, toolchains, AI workflows, or agentic capabilities.
- Anti-Hype (Strict): ZERO marketing filler, buzzwords, generic advice, or exaggerated claims. 
- Extreme Brevity: Be concise, specific, and direct.

# Output Requirements
Generate a JSON object with exactly two keys. All values MUST be written in professional Chinese.

1. "summary": A single, high-density sentence explaining the core event or mechanism (e.g., "Who achieved what, using what specific method or architecture").
2. "take": 1 to 3 sentences defining the core engineering takeaway. Focus purely on actionable insights, new paradigms in workflows, or shifts in agent capabilities.

# Source Material
Title: ${candidate.title}
Source: ${candidate.source}
URL: ${candidate.link}
Keywords Context: ${keywords}
Content Snippet: ${snippet}

Return ONLY valid JSON with this exact shape, without markdown formatting or code blocks:
{"summary":"...","take":"..."}`;
}

export async function defaultSummarizeCandidate(
  candidate,
  {
    apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    logger = console
  } = {}
) {
  const prompt = buildSummaryPrompt(candidate);
  const responseText = await callGeminiText(prompt, {
    apiKey,
    modelName: "gemini-2.5-flash",
    logger
  });
  const parsed = responseText ? parseSummaryResponse(responseText) : null;

  return parsed ?? fallbackSummary(candidate);
}

function enrichKeywordMatches(items, keywords) {
  return items
    .map((item) => {
      const haystack = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
      const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));

      if (matchedKeywords.length === 0) {
        return null;
      }

      return {
        ...item,
        matchedKeywords
      };
    })
    .filter(Boolean);
}

function filterRecentItems(items, { now = new Date(), maxAgeDays = 2 } = {}) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - maxAgeDays);

  return items.filter((item) => {
    if (!item.isoDate) {
      return false;
    }

    const itemDate = new Date(item.isoDate);
    if (Number.isNaN(itemDate.getTime())) {
      return false;
    }

    return itemDate >= cutoff;
  });
}

function normalizeDedupeUrl(value = "") {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (
        key.startsWith("utm_") ||
        key === "fbclid" ||
        key === "gclid" ||
        key === "ref" ||
        key === "ref_src"
      ) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return value.trim().replace(/#.*$/, "").replace(/\/+$/, "");
  }
}

function dedupeByLink(items) {
  return [...new Map(items.map((item) => [normalizeDedupeUrl(item.link), item])).values()];
}

function shiftDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function getGeneratedBriefingsDir(repoRoot) {
  return path.join(repoRoot, "public", "generated", "briefings");
}

async function loadRecentBriefingUrls(repoRoot, date, lookbackDays = 1) {
  const seenUrls = new Set();
  const generatedBriefingsDir = getGeneratedBriefingsDir(repoRoot);

  for (let offset = 1; offset <= lookbackDays; offset += 1) {
    const previousDate = shiftDate(date, -offset);
    const previousPath = path.join(generatedBriefingsDir, `${previousDate}.json`);

    try {
      const previousDay = JSON.parse(await fs.readFile(previousPath, "utf8"));
      const insights = Array.isArray(previousDay?.insights) ? previousDay.insights : [];

      for (const insight of insights) {
        const normalized = normalizeDedupeUrl(insight?.sourceUrl);
        if (normalized) {
          seenUrls.add(normalized);
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return seenUrls;
}

function dedupeAcrossDays(items, seenUrls, logger = console) {
  if (seenUrls.size === 0) {
    return items;
  }

  const filteredItems = items.filter((item) => !seenUrls.has(normalizeDedupeUrl(item.link)));
  const filteredCount = items.length - filteredItems.length;

  if (filteredCount > 0) {
    logger.log(`${filteredCount} items were removed by cross-day URL dedupe`);
  }

  return filteredItems;
}

function normalizeRenderedLine(text = "") {
  return collapseWhitespace(text)
    .replace(/^>+\s*/, "")
    .replace(/^\*\*(?:Chinese Summary|R2 Take):\*\*\s*/i, "")
    .trim();
}

export function renderBriefingMarkdown({ date, items }) {
  let content = `# Daily Briefing: ${date}\n\n`;

  if (items.length === 0) {
    return `${content}No new updates found matching keywords today.\n`;
  }

  for (const item of items) {
    const summary = normalizeRenderedLine(item.summary);
    const take = normalizeRenderedLine(item.take);

    content += `## [${item.title}](${item.link})\n`;
    content += `**Source:** ${item.source}\n\n`;
    content += `> **Chinese Summary:** ${summary}\n`;
    content += `> **R2 Take:** ${take}\n\n`;
    content += `---\n\n`;
  }

  return content;
}

export async function runDailyBriefing(options = {}) {
  const logger = options.logger ?? console;
  const now = options.now ?? new Date();
  const date = options.date ?? getLADate(now);
  const repoRoot = options.repoRoot ?? getRepoRoot();
  const sources = options.sources ?? DEFAULT_SOURCES;
  const htmlSources = options.htmlSources ?? DEFAULT_HTML_SOURCES;
  const fetchFeedItems = options.fetchFeedItems ?? defaultFetchFeedItems;
  const fetchHtmlItems = options.fetchHtmlItems ?? defaultFetchHtmlItems;
  const rankCandidates = options.rankCandidates ?? defaultRankCandidates;
  const summarizeCandidate = options.summarizeCandidate ?? defaultSummarizeCandidate;
  const keywords = options.keywords ?? DEFAULT_KEYWORDS;
  const maxAgeDays = options.maxAgeDays ?? 2;
  const maxItems = options.maxItems ?? MAX_BRIEFING_ITEMS;
  const { briefingsDir, filePath } = getBriefingPaths({
    repoRoot,
    date,
    outputDir: options.outputDir
  });

  logger.log(`Starting RSS briefing generation for ${date}`);

  const rssResults = await Promise.all(
    sources.map((sourceUrl) => fetchFeedItems(sourceUrl, { logger, fetchImpl: options.fetchImpl }))
  );
  const htmlResults = await Promise.all(
    htmlSources.map((source) => fetchHtmlItems(source, { logger, fetchImpl: options.fetchImpl }))
  );
  const allItems = [...rssResults.flat(), ...htmlResults.flat()];
  logger.log(`Fetched ${allItems.length} raw items`);
  const recentItems = filterRecentItems(allItems, { now, maxAgeDays });
  logger.log(`${recentItems.length} items survived the recency filter`);
  const matchedItems = enrichKeywordMatches(recentItems, keywords);
  logger.log(`${matchedItems.length} items matched briefing keywords`);
  const uniqueByLink = dedupeByLink(matchedItems);
  const seenUrls = await loadRecentBriefingUrls(repoRoot, date, 1);
  const crossDayDeduped = dedupeAcrossDays(uniqueByLink, seenUrls, logger);
  const uniqueByTopic = deduplicateByTopic(crossDayDeduped);
  const rankedItems = await rankCandidates(uniqueByTopic, { maxItems, logger });
  const selectedItems = applySourceDiversityLimit(
    rankedItems.slice(0, maxItems),
    uniqueByTopic,
    2,
    maxItems
  );

  const summarizedItems = [];
  for (const candidate of selectedItems) {
    const summaryParts = await summarizeCandidate(candidate, { logger });
    summarizedItems.push({
      ...candidate,
      summary: summaryParts.summary,
      take: summaryParts.take
    });
  }

  const markdown = renderBriefingMarkdown({
    date,
    items: summarizedItems
  });

  await fs.mkdir(briefingsDir, { recursive: true });
  await fs.writeFile(filePath, markdown, "utf8");

  logger.log(`Briefing written to ${filePath} with ${summarizedItems.length} items`);

  return {
    date,
    filePath,
    briefingsDir,
    markdown,
    items: summarizedItems,
    candidateCount: uniqueByTopic.length
  };
}

function parseCliArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--date" && next) {
      args.date = next;
      index += 1;
    } else if (current === "--repo-root" && next) {
      args.repoRoot = path.resolve(next);
      index += 1;
    } else if (current === "--output-dir" && next) {
      args.outputDir = path.resolve(next);
      index += 1;
    } else if (current === "--max-items" && next) {
      args.maxItems = Number.parseInt(next, 10);
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  await runDailyBriefing(args);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
