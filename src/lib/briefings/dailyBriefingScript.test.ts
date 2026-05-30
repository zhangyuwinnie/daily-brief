import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseRssBriefing } from "./parseRssBriefing";
import {
  getBriefingPaths,
  runDailyBriefing,
  extractPublishedDateFromHtml,
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

  it("suppresses recently published links from generated briefing history", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);
    const generatedBriefingsDir = path.join(repoRoot, "public", "generated", "briefings");

    await mkdir(generatedBriefingsDir, { recursive: true });
    await writeFile(
      path.join(generatedBriefingsDir, "2026-04-14.json"),
      JSON.stringify(
        {
          date: "2026-04-14",
          insights: [
            {
              id: "rss-2026-04-14-01-agentic-infrastructure",
              sourceUrl: "https://vercel.com/blog/agentic-infrastructure/"
            }
          ]
        },
        null,
        2
      ),
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

  it("only checks generated history from the previous one day", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);
    const generatedBriefingsDir = path.join(repoRoot, "public", "generated", "briefings");

    await mkdir(generatedBriefingsDir, { recursive: true });
    await writeFile(
      path.join(generatedBriefingsDir, "2026-04-13.json"),
      JSON.stringify(
        {
          date: "2026-04-13",
          insights: [
            {
              id: "rss-2026-04-13-01-agentic-infrastructure",
              sourceUrl: "https://vercel.com/blog/agentic-infrastructure"
            }
          ]
        },
        null,
        2
      ),
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
          link: "https://vercel.com/blog/agentic-infrastructure",
          contentSnippet: "Two-day-old history should not suppress this item anymore.",
          source: "Vercel News",
          isoDate: "2026-04-15T08:00:00.000Z"
        }
      ],
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.link).toBe("https://vercel.com/blog/agentic-infrastructure");
  });

  it("extracts article publish dates from common HTML metadata", () => {
    const ogHtml = `<head><meta property="article:published_time" content="2026-04-15T08:00:00Z"></head>`;
    expect(extractPublishedDateFromHtml(ogHtml)).toMatch(/^2026-04-15/);

    const ldHtml = `<script type="application/ld+json">{"@type":"Article","datePublished":"2026-04-23T10:00:00Z"}</script>`;
    expect(extractPublishedDateFromHtml(ldHtml)).toMatch(/^2026-04-23/);

    expect(extractPublishedDateFromHtml("<html><body>no date here</body></html>")).toBeUndefined();
  });

  it("uses the article's real publish date for Hacker News items and drops stale resubmissions", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);

    const result = await runDailyBriefing({
      now: new Date("2026-05-29T18:30:00Z"),
      repoRoot,
      sources: ["https://news.ycombinator.com/rss"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Claude Code – Everything You Can Configure That the Docs Don't Tell You",
          link: "https://buildingbetter.tech/p/i-read-the-claude-code-source-code",
          contentSnippet: "An old article resubmitted to HN today.",
          source: "Hacker News",
          isoDate: "2026-05-29T08:00:00.000Z"
        },
        {
          title: "Fresh Agent Tooling Released Today",
          link: "https://example.com/fresh-agent-tooling",
          contentSnippet: "A genuinely fresh article that HN linked today.",
          source: "Hacker News",
          isoDate: "2026-05-29T09:00:00.000Z"
        }
      ],
      resolveArticlePublishedDate: async (url: string) => {
        if (url.includes("buildingbetter.tech")) return "2026-04-15T00:00:00.000Z";
        if (url.includes("fresh-agent-tooling")) return "2026-05-29T07:00:00.000Z";
        return undefined;
      },
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.link).toBe("https://example.com/fresh-agent-tooling");
    expect(result.markdown).not.toContain("buildingbetter.tech");
    expect(result.markdown).toContain("**Published:** 2026-05-29");
  });

  it("drops Hacker News items whose article publish date cannot be resolved", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);

    const result = await runDailyBriefing({
      now: new Date("2026-05-29T18:30:00Z"),
      repoRoot,
      sources: ["https://news.ycombinator.com/rss"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Mystery Origin Article",
          link: "https://example.com/no-meta-date",
          contentSnippet: "No meta tags, no JSON-LD.",
          source: "Hacker News",
          isoDate: "2026-05-29T08:00:00.000Z"
        }
      ],
      resolveArticlePublishedDate: async () => undefined,
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(0);
  });

  it("emits the Published line in markdown for non-aggregator RSS items", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "daily-briefing-"));
    tempDirs.push(repoRoot);

    const result = await runDailyBriefing({
      now: new Date("2026-05-29T18:30:00Z"),
      repoRoot,
      sources: ["https://vercel.com/atom"],
      htmlSources: [],
      fetchFeedItems: async () => [
        {
          title: "Vercel Ships Fresh Feature",
          link: "https://vercel.com/blog/fresh-feature",
          contentSnippet: "A fresh post from Vercel about AI agents.",
          source: "Vercel News",
          isoDate: "2026-05-28T08:00:00.000Z"
        }
      ],
      rankCandidates: async (candidates: BriefingCandidate[]) => candidates,
      summarizeCandidate: async (candidate: BriefingCandidate) => ({
        summary: `${candidate.title} 的中文摘要。`,
        take: `${candidate.title} 的影响。`
      })
    });

    expect(result.items).toHaveLength(1);
    expect(result.markdown).toContain("**Published:** 2026-05-28");
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
