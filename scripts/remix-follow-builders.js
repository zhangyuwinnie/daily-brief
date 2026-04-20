#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBriefingPaths, getLADate } from "./daily-briefing.js";

const DEFAULT_MODEL = "gemini-2.5-pro";
const DEFAULT_MAX_ITEMS = 4;
const MAX_SOURCE_EXCERPT_LENGTH = 900;

function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function cleanWhitespace(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function stripUrls(text = "") {
  return text.replace(/https?:\/\/\S+/gi, "").trim();
}

function clipText(text = "", maxLength = MAX_SOURCE_EXCERPT_LENGTH) {
  const normalized = cleanWhitespace(text);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function sanitizeHeadingText(text = "") {
  const withoutUrls = stripUrls(text);
  const sanitized = cleanWhitespace(withoutUrls).replace(/[\[\]]/g, "").replace(/\|/g, "-");
  return sanitized || "Builder Theme";
}

function normalizeRenderedLine(text = "") {
  return cleanWhitespace(text)
    .replace(/^>+\s*/, "")
    .replace(/^\*\*(?:Chinese Summary|R2 Take):\*\*\s*/i, "")
    .trim();
}

function parseCliArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--input" && next) {
      args.inputPath = path.resolve(next);
      index += 1;
    } else if (current === "--date" && next) {
      args.date = next;
      index += 1;
    } else if (current === "--repo-root" && next) {
      args.repoRoot = path.resolve(next);
      index += 1;
    } else if (current === "--briefing-file" && next) {
      args.briefingFilePath = path.resolve(next);
      index += 1;
    } else if (current === "--max-items" && next) {
      args.maxItems = Number.parseInt(next, 10);
      index += 1;
    }
  }

  return args;
}

async function readJsonInput(inputPath) {
  if (inputPath) {
    return fs.readFile(inputPath, "utf8");
  }

  if (process.stdin.isTTY) {
    throw new Error("Expected follow-builders JSON via --input <path> or stdin.");
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(String(chunk));
  }

  const inputText = chunks.join("").trim();
  if (!inputText) {
    throw new Error("Follow-builders JSON input was empty.");
  }

  return inputText;
}

function buildSourceLabel(candidate) {
  switch (candidate.kind) {
    case "blog":
      return `${candidate.sourceName} 博客`;
    case "podcast":
      return `${candidate.sourceName} 播客`;
    case "x":
      return `${candidate.sourceName} 在 X 上的讨论`;
    default:
      return "Follow Builders";
  }
}

function buildFallbackSummary(candidate) {
  const sourceLabel = buildSourceLabel(candidate);
  const excerpt = clipText(stripUrls(candidate.excerpt), 180);

  if (candidate.kind === "x") {
    return `社区讨论聚焦于 ${sourceLabel} 的最新信号：${excerpt || candidate.title}。这类一线表达更适合拿来判断 builder 叙事是否正在从概念走向可执行工作流。`;
  }

  if (candidate.kind === "podcast") {
    return `${sourceLabel} 围绕「${candidate.title}」展开长谈，核心信号是 ${excerpt || "产品能力、工作流和分发逻辑正在一起变化"}。对 builder 来说，重要的不是逐段复述，而是识别哪些能力已经足以重写现有协作流程。`;
  }

  return `${sourceLabel} 提供了一个值得追踪的工程或产品信号：${excerpt || candidate.title}。相比表层新闻，更应该关注它是否改变了 agent、工具链或团队协作的默认做法。`;
}

function buildFallbackTake(candidate) {
  if (candidate.kind === "x") {
    return "把高信号推文当作需求和分发雷达，而不是结论本身。真正要落地的是：这背后暴露了哪些 API、工作流、部署和商业模式会率先被重写。";
  }

  if (candidate.kind === "podcast") {
    return "长对话最适合提炼成产品判断和执行清单。优先记录其中反复出现的约束、能力边界和组织变化，再决定哪些值得在本周实验。";
  }

  return "优先把这类工程信号转成可验证动作，例如补一个评测、做一次工作流重构，或检查你现有产品里最脆弱的环节是否已经被新范式替代。";
}

function renderFollowBuildersMarkdown(items) {
  return items
    .map((item) => {
      const title = sanitizeHeadingText(item.title);
      const summary = normalizeRenderedLine(item.summary);
      const take = normalizeRenderedLine(item.take);

      return [
        `## [${title}](${item.url})`,
        `**Source:** ${item.sourceName || "Follow Builders"}`,
        "**Source Label:** Follow Builders",
        "",
        `> **Chinese Summary:** ${summary}`,
        `> **R2 Take:** ${take}`,
        "",
        "---",
        ""
      ].join("\n");
    })
    .join("\n");
}

function topTweetByBuilder(author) {
  return [...(author.tweets || [])].sort((left, right) => {
    const leftScore = (left.likes || 0) + (left.retweets || 0) * 3 + (left.replies || 0) * 2;
    const rightScore = (right.likes || 0) + (right.retweets || 0) * 3 + (right.replies || 0) * 2;
    return rightScore - leftScore;
  })[0];
}

function collectCandidates(payload, maxItems = DEFAULT_MAX_ITEMS) {
  const candidates = [];

  for (const blog of payload.blogs || []) {
    candidates.push({
      kind: "blog",
      title: `Builder Theme: ${blog.title}`,
      url: blog.url,
      sourceName: blog.name || "Builder Blog",
      excerpt: blog.content || blog.description || blog.title,
      score: 400 + (blog.content?.length || 0)
    });
  }

  for (const podcast of payload.podcasts || []) {
    candidates.push({
      kind: "podcast",
      title: `Builder Theme: ${stripUrls(podcast.title)}`,
      url: podcast.url,
      sourceName: podcast.name || "Builder Podcast",
      excerpt: podcast.transcript || podcast.title,
      score: 300 + (podcast.transcript?.length || 0)
    });
  }

  for (const author of payload.x || []) {
    const tweet = topTweetByBuilder(author);
    if (!tweet?.url) {
      continue;
    }

    candidates.push({
      kind: "x",
      title: `Builder Theme: ${author.name} on ${clipText(stripUrls(tweet.text || author.bio || "AI builders"), 70)}`,
      url: tweet.url,
      sourceName: author.name || author.handle || "Builder",
      excerpt: tweet.text || author.bio || "",
      score: (tweet.likes || 0) + (tweet.retweets || 0) * 3 + (tweet.replies || 0) * 2
    });
  }

  candidates.sort((left, right) => right.score - left.score);

  const selected = [];
  const usedUrls = new Set();
  const kindCounts = new Map();

  for (const candidate of candidates) {
    if (!candidate.url || usedUrls.has(candidate.url)) {
      continue;
    }

    if ((kindCounts.get(candidate.kind) || 0) >= 2) {
      continue;
    }

    selected.push(candidate);
    usedUrls.add(candidate.url);
    kindCounts.set(candidate.kind, (kindCounts.get(candidate.kind) || 0) + 1);

    if (selected.length >= maxItems) {
      break;
    }
  }

  return selected;
}

async function callGeminiMarkdown(candidates, { apiKey, model = DEFAULT_MODEL, logger = console }) {
  if (!apiKey || candidates.length === 0) {
    return null;
  }

  const prompt = `You are remixing follow-builders source material into a same-day Daily Briefing appendix for AI builders.

Goals:
- extract the highest-signal themes only
- merge related sources when possible instead of listing everything
- explain why the theme matters for builders, workflows, tooling, or agent capability
- write in concise Chinese
- avoid hype, marketing filler, and bullet lists

Return ONLY markdown entries in this exact repeated format:
## [Title](URL)
**Source:** {sourceName from the source material}
**Source Label:** Follow Builders

> **Chinese Summary:** ...
> **R2 Take:** ...

---

Rules:
- produce at most ${candidates.length} entries
- every URL must come from the provided source data
- use one URL per entry
- do not include a top-level date heading
- do not wrap the response in code fences

Source material:
${JSON.stringify(
  candidates.map((candidate) => ({
    kind: candidate.kind,
    title: candidate.title,
    url: candidate.url,
    sourceName: candidate.sourceName,
    excerpt: clipText(candidate.excerpt)
  })),
  null,
  2
)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    );

    if (!response.ok) {
      logger.warn(`Gemini remix call failed with HTTP ${response.status}. Falling back.`);
      return null;
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (
      typeof text === "string" &&
      text.includes("## [") &&
      text.includes("**Chinese Summary:**") &&
      text.includes("**R2 Take:**")
    ) {
      return text;
    }
  } catch (error) {
    logger.warn(`Gemini remix call failed: ${error.message}`);
  }

  return null;
}

function buildFallbackItems(payload, maxItems) {
  return collectCandidates(payload, maxItems).map((candidate) => ({
    title: candidate.title,
    url: candidate.url,
    sourceName: candidate.sourceName,
    summary: buildFallbackSummary(candidate),
    take: buildFallbackTake(candidate)
  }));
}

function dedupeAgainstExistingMarkdown(items, existingMarkdown) {
  return items.filter((item) => !existingMarkdown.includes(`](${item.url})`));
}

export async function remixFollowBuilders(options = {}) {
  const logger = options.logger ?? console;
  const repoRoot = options.repoRoot ?? getRepoRoot();
  const date = options.date ?? getLADate();
  const briefingFilePath =
    options.briefingFilePath ?? getBriefingPaths({ repoRoot, date }).filePath;
  const inputText = options.inputText ?? (await readJsonInput(options.inputPath));
  const payload = JSON.parse(inputText);

  let existingMarkdown;
  try {
    existingMarkdown = await fs.readFile(briefingFilePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      logger.warn(
        `[remix-follow-builders] Skipping ${date} because the base briefing does not exist at ${briefingFilePath}.`
      );
      return {
        status: "skipped",
        date,
        briefingFilePath,
        appendedCount: 0
      };
    }

    throw error;
  }

  const maxItems = Number.isFinite(options.maxItems) ? options.maxItems : DEFAULT_MAX_ITEMS;
  const remixCandidates = collectCandidates(payload, maxItems);
  const geminiMarkdown = await callGeminiMarkdown(remixCandidates, {
    apiKey: options.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
    logger
  });
  const parsedItems = geminiMarkdown
    ? geminiMarkdown
        .split(/\n(?=##\s+\[)/)
        .map((block) => {
          const titleMatch = block.match(/^##\s+\[(.+?)\]\((.+?)\)/m);
          const sourceMatch = block.match(/^\*\*Source:\*\*\s*(.+)$/m);
          const summaryMatch = block.match(/\*\*Chinese Summary:\*\*\s*(.+)$/m);
          const takeMatch = block.match(/\*\*R2 Take:\*\*\s*(.+)$/m);
          return titleMatch && summaryMatch && takeMatch
            ? {
                title: titleMatch[1],
                url: titleMatch[2],
                sourceName: sourceMatch?.[1]?.trim() || undefined,
                summary: summaryMatch[1],
                take: takeMatch[1]
              }
            : null;
        })
        .filter(Boolean)
        .map((item) => {
          if (!item.sourceName) {
            const match = remixCandidates.find((c) => c.url === item.url);
            if (match) {
              item.sourceName = match.sourceName;
            }
          }
          return item;
        })
    : buildFallbackItems(payload, maxItems);
  const dedupedItems = dedupeAgainstExistingMarkdown(parsedItems, existingMarkdown);

  if (dedupedItems.length === 0) {
    logger.log(`[remix-follow-builders] No new follow-builders entries to append for ${date}.`);
    return {
      status: "ok",
      date,
      briefingFilePath,
      appendedCount: 0
    };
  }

  const appendix = renderFollowBuildersMarkdown(dedupedItems);
  const separator = existingMarkdown.endsWith("\n\n")
    ? ""
    : existingMarkdown.endsWith("\n")
      ? "\n"
      : "\n\n";

  await fs.writeFile(briefingFilePath, `${existingMarkdown}${separator}${appendix}`, "utf8");

  logger.log(
    `[remix-follow-builders] Appended ${dedupedItems.length} follow-builders entries to ${briefingFilePath}.`
  );

  return {
    status: "ok",
    date,
    briefingFilePath,
    appendedCount: dedupedItems.length
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  await remixFollowBuilders(args);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
