import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { remixFollowBuilders } from "../../../scripts/remix-follow-builders.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function setupRepo(date: string) {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "remix-follow-builders-"));
  tempDirs.push(repoRoot);

  const briefingsDir = path.join(repoRoot, "briefings");
  await mkdir(briefingsDir, { recursive: true });
  const briefingFilePath = path.join(briefingsDir, `${date}.md`);
  await writeFile(briefingFilePath, `# Daily Briefing: ${date}\n\nNo new updates found matching keywords today.\n`, "utf8");

  const generatedDir = path.join(repoRoot, "public", "generated", "briefings");
  await mkdir(generatedDir, { recursive: true });

  return { repoRoot, briefingFilePath, generatedDir };
}

const passthroughSummarize = async (candidate: { title: string }) => ({
  summary: `${candidate.title} 的中文摘要。`,
  take: `${candidate.title} 的影响。`
});

describe("remix-follow-builders", () => {
  it("drops blogs already published in recent generated history and keeps fresh ones", async () => {
    const date = "2026-05-19";
    const { repoRoot, briefingFilePath, generatedDir } = await setupRepo(date);

    await writeFile(
      path.join(generatedDir, "2026-05-10.json"),
      JSON.stringify({
        date: "2026-05-10",
        insights: [
          {
            id: "rss-2026-05-10-06-builder-theme",
            sourceUrl: "https://www.anthropic.com/engineering/april-23-postmortem"
          }
        ]
      }),
      "utf8"
    );

    const payload = {
      blogs: [
        {
          name: "Anthropic Engineering",
          title: "An update on recent Claude Code quality reports",
          url: "https://www.anthropic.com/engineering/april-23-postmortem",
          publishedAt: null,
          content: "A stale April postmortem that keeps reappearing in daily briefs."
        },
        {
          name: "Vercel News",
          title: "Fresh AI gateway controls",
          url: "https://vercel.com/blog/fresh-ai-gateway",
          publishedAt: "May 19, 2026",
          content: "A genuinely fresh post that should be included today."
        }
      ],
      podcasts: [],
      x: []
    };

    const result = await remixFollowBuilders({
      repoRoot,
      date,
      briefingFilePath,
      inputText: JSON.stringify(payload),
      summarizeCandidate: passthroughSummarize,
      now: new Date("2026-05-19T18:30:00Z")
    });

    expect(result.appendedCount).toBe(1);

    const written = await readFile(briefingFilePath, "utf8");
    expect(written).toContain("https://vercel.com/blog/fresh-ai-gateway");
    expect(written).toContain("**Published:** 2026-05-19");
    expect(written).not.toContain("april-23-postmortem");
  });

  it("drops blogs whose publish date is older than the recency window", async () => {
    const date = "2026-05-19";
    const { repoRoot, briefingFilePath } = await setupRepo(date);

    const payload = {
      blogs: [
        {
          name: "Anthropic Engineering",
          title: "An old dated postmortem",
          url: "https://www.anthropic.com/engineering/old-postmortem",
          publishedAt: "Apr 01, 2026",
          content: "This blog has a real but very old publish date."
        }
      ],
      podcasts: [],
      x: []
    };

    const result = await remixFollowBuilders({
      repoRoot,
      date,
      briefingFilePath,
      inputText: JSON.stringify(payload),
      summarizeCandidate: passthroughSummarize,
      now: new Date("2026-05-19T18:30:00Z"),
      maxAgeDays: 14
    });

    expect(result.appendedCount).toBe(0);
    const written = await readFile(briefingFilePath, "utf8");
    expect(written).not.toContain("old-postmortem");
  });
});
