#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBriefingPaths, getLADate, defaultSummarizeCandidate } from "./daily-briefing.js";
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

async function summarizeCandidates(candidates, { apiKey, logger }) {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      const summaryCandidate = {
        title: candidate.title,
        source: candidate.sourceName,
        link: candidate.url,
        contentSnippet: candidate.excerpt || "",
        matchedKeywords: ["AI builders", candidate.kind]
      };

      const { summary, take } = await defaultSummarizeCandidate(summaryCandidate, {
        apiKey,
        logger
      });

      return {
        title: candidate.title,
        url: candidate.url,
        sourceName: candidate.sourceName,
        summary,
        take
      };
    })
  );

  return results;
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
  const apiKey = options.apiKey ?? process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  const parsedItems = await summarizeCandidates(remixCandidates, { apiKey, logger });
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
