#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const USER_DIR = join(homedir(), ".follow-builders");
const CONFIG_PATH = join(USER_DIR, "config.json");

const FEED_X_URL =
  "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json";
const FEED_PODCASTS_URL =
  "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json";
const FEED_BLOGS_URL =
  "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json";

const PROMPTS_BASE =
  "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/prompts";
const PROMPT_FILES = [
  "summarize-podcast.md",
  "summarize-tweets.md",
  "summarize-blogs.md",
  "digest-intro.md",
  "translate.md"
];

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  return response.text();
}

export async function prepareFollowBuildersDigest() {
  const errors = [];
  let config = {
    language: "en",
    frequency: "daily",
    delivery: { method: "stdout" }
  };

  if (existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
    } catch (error) {
      errors.push(`Could not read config: ${error.message}`);
    }
  }

  const [feedX, feedPodcasts, feedBlogs] = await Promise.all([
    fetchJSON(FEED_X_URL),
    fetchJSON(FEED_PODCASTS_URL),
    fetchJSON(FEED_BLOGS_URL)
  ]);

  if (!feedX) {
    errors.push("Could not fetch tweet feed");
  }
  if (!feedPodcasts) {
    errors.push("Could not fetch podcast feed");
  }
  if (!feedBlogs) {
    errors.push("Could not fetch blog feed");
  }

  const prompts = {};
  const scriptDir = decodeURIComponent(new URL(".", import.meta.url).pathname);
  const localPromptsDir = join(scriptDir, "..", "prompts");
  const userPromptsDir = join(USER_DIR, "prompts");

  for (const filename of PROMPT_FILES) {
    const key = filename.replace(".md", "").replace(/-/g, "_");
    const userPath = join(userPromptsDir, filename);
    const localPath = join(localPromptsDir, filename);

    if (existsSync(userPath)) {
      prompts[key] = await readFile(userPath, "utf8");
      continue;
    }

    const remotePrompt = await fetchText(`${PROMPTS_BASE}/${filename}`);
    if (remotePrompt) {
      prompts[key] = remotePrompt;
      continue;
    }

    if (existsSync(localPath)) {
      prompts[key] = await readFile(localPath, "utf8");
      continue;
    }

    errors.push(`Could not load prompt: ${filename}`);
  }

  return {
    status: "ok",
    generatedAt: new Date().toISOString(),
    config: {
      language: config.language || "en",
      frequency: config.frequency || "daily",
      delivery: config.delivery || { method: "stdout" }
    },
    podcasts: feedPodcasts?.podcasts || [],
    x: feedX?.x || [],
    blogs: feedBlogs?.blogs || [],
    stats: {
      podcastEpisodes: feedPodcasts?.podcasts?.length || 0,
      xBuilders: feedX?.x?.length || 0,
      totalTweets: (feedX?.x || []).reduce((sum, author) => sum + author.tweets.length, 0),
      blogPosts: feedBlogs?.blogs?.length || 0,
      feedGeneratedAt:
        feedX?.generatedAt || feedPodcasts?.generatedAt || feedBlogs?.generatedAt || null
    },
    prompts,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function main() {
  const payload = await prepareFollowBuildersDigest();
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    })
  );
  process.exitCode = 1;
});
