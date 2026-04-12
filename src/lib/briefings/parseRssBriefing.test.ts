import { describe, expect, it } from "vitest";
import rssEdge from "./fixtures/rss-edge.md?raw";
import rssFollowBuildersMerged from "./fixtures/rss-follow-builders-merged.md?raw";
import rssNormal from "./fixtures/rss-normal.md?raw";
import { parseRssBriefing } from "./parseRssBriefing";

describe("parseRssBriefing", () => {
  it("extracts RSS titles, summaries, takes, topics, and score behavior", () => {
    const parsed = parseRssBriefing(rssNormal);

    expect(parsed.date).toBe("2026-03-20");
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]).toMatchObject({
      title: "Open-Source Agent Dashboard for Repository Workflows",
      sourceName: "Example Engineering Blog",
      sourceUrl: "https://example.com/agent-dashboard"
    });
    expect(parsed.items[0].summary).toContain("统一面板");
    expect(parsed.items[0].take).toContain("上下文");
    expect(parsed.items[0].topics).toEqual(expect.arrayContaining(["Agents", "Tooling"]));
    expect(parsed.items[0].signalScore).toBeUndefined();
    expect(parsed.warnings).toHaveLength(0);
  });

  it("supports plain-bold multiline fields and collects warnings for malformed RSS entries", () => {
    const parsed = parseRssBriefing(rssEdge);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].title).toBe("Compiler-Friendly Agent Harness Notes");
    expect(parsed.items[0].summary).toContain("测试前置");
    expect(parsed.items[0].take).toContain("Matched keywords");
    expect(parsed.items[0].topics).toEqual(expect.arrayContaining(["Agents", "Coding Agents"]));
    expect(parsed.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing_take",
          sourceType: "rss",
          date: "2026-03-21"
        })
      ])
    );
  });

  it("parses appended follow-builders entries from a merged same-day briefing file", () => {
    const parsed = parseRssBriefing(rssFollowBuildersMerged);

    expect(parsed.date).toBe("2026-04-11");
    expect(parsed.items).toHaveLength(4);
    expect(parsed.items[2]).toMatchObject({
      sourceName: "Follow Builders",
      sourceUrl: "https://x.com/levie/status/2042759653281456218"
    });
    expect(parsed.items[2].summary).toContain("API");
    expect(parsed.items[3].take).toContain("职责分层");
    expect(parsed.warnings).toHaveLength(0);
  });
});
