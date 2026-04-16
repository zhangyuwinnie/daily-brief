import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseRssBriefing } from "./parseRssBriefing";
import {
  getBriefingPaths,
  runDailyBriefing,
  type BriefingCandidate
} from "../../../scripts/daily-briefing.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((dir) =>
      rm(dir, {
        recursive: true,
        force: true
      })
    )
  );
  tempDirs.length = 0;
});

describe("daily-briefing script", () => {
  it("writes parser-compatible markdown into the repo-local briefings directory", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);

    const result = await runDailyBriefing({
      now: new Date("2026-04-10T18:30:00Z"),
      repoRoot,
      sources: ["https://example.com/feed.xml"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Agent Runtime Adds Replayable Workflow Graphs",
          link: "https://example.com/agent-runtime",
          contentSnippet: "The release adds workflow observability for agent builders.",
          source: "Example Engineering Blog",
          isoDate: "2026-04-10T08:00:00.000Z"
        },
        {
          title: "Tool Calling Sandbox Improves MCP Debugging",
          link: "https://example.com/mcp-sandbox",
          contentSnippet: "A new sandbox helps debug MCP tool failures and retries.",
          source: "Example Engineering Blog",
          isoDate: "2026-04-10T09:00:00.000Z"
        }
      ],
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要，强调工作流变化。`,
        take: `${candidate.title} 对 AI builders 的直接影响。`
      })
    });

    expect(result.filePath).toBe(path.join(repoRoot, "briefings", "2026-04-10.md"));

    const written = await readFile(result.filePath, "utf8");
    const parsed = parseRssBriefing(written);

    expect(parsed.date).toBe("2026-04-10");
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({
      sourceName: "Example Engineering Blog"
    });
    expect(parsed.items[0].summary).toContain("中文摘要");
    expect(parsed.items[0].take).toContain("AI builders");
  });

  it("resolves repo-relative briefing output paths", () => {
    const paths = getBriefingPaths({
      repoRoot: "/tmp/daily-brief-repo",
      date: "2026-04-11"
    });

    expect(paths.briefingsDir).toBe("/tmp/daily-brief-repo/briefings");
    expect(paths.filePath).toBe("/tmp/daily-brief-repo/briefings/2026-04-11.md");
  });

  it("does not treat invalid feed dates as recent", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);

    const result = await runDailyBriefing({
      now: new Date("2026-04-15T18:30:00Z"),
      repoRoot,
      sources: ["https://example.com/feed.xml"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Agentic Infrastructure",
          link: "https://vercel.com/blog/agentic-infrastructure",
          contentSnippet: "An invalid feed date should not make this item evergreen.",
          source: "Vercel News",
          isoDate: undefined
        }
      ],
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(0);
    expect(result.markdown).toContain("No new updates found matching keywords today.");
  });

  it("suppresses recently published links from repo-local briefing history", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);
    const briefingsDir = path.join(repoRoot, "briefings");

    await mkdir(briefingsDir, { recursive: true });
    await writeFile(
      path.join(briefingsDir, "2026-04-14.md"),
      [
        "# Daily Briefing: 2026-04-14",
        "",
        "## [Agentic Infrastructure](https://vercel.com/blog/agentic-infrastructure/)",
        "**Source:** Vercel News",
        "",
        "> **Chinese Summary:** 已经收录。",
        "> **R2 Take:** 不应该跨天重复。",
        "",
        "---",
        ""
      ].join("\n"),
      "utf8"
    );

    const result = await runDailyBriefing({
      now: new Date("2026-04-15T18:30:00Z"),
      repoRoot,
      sources: ["https://example.com/feed.xml"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Agentic Infrastructure",
          link: "https://vercel.com/blog/agentic-infrastructure#top",
          contentSnippet: "This is a trivial URL variant of yesterday's article.",
          source: "Vercel News",
          isoDate: "2026-04-15T08:00:00.000Z"
        },
        {
          title: "AI Gateway Routing Controls Improve Agent Reliability",
          link: "https://vercel.com/blog/ai-gateway-routing-controls",
          contentSnippet: "A genuinely new article should still be included.",
          source: "Vercel News",
          isoDate: "2026-04-15T09:00:00.000Z"
        }
      ],
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.link).toBe("https://vercel.com/blog/ai-gateway-routing-controls");
    expect(result.markdown).not.toContain("agentic-infrastructure");
  });

  it("does not reintroduce sqlite references into the repo-local script", async () => {
    const scriptSource = await readFile(
      path.join(import.meta.dirname, "../../../scripts/daily-briefing.js"),
      "utf8"
    );

    expect(scriptSource).not.toMatch(/sqlite/i);
    expect(scriptSource).not.toMatch(/briefing\.db/i);
  });
});
