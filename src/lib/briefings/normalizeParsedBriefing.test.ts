import { describe, expect, it } from "vitest";
import rssEdge from "./fixtures/rss-edge.md?raw";
import rssNormal from "./fixtures/rss-normal.md?raw";
import xEdge from "./fixtures/x-edge.md?raw";
import xNormal from "./fixtures/x-normal.md?raw";
import { normalizeParsedBriefing } from "./normalizeParsedBriefing";
import { parseRssBriefing } from "./parseRssBriefing";
import { parseXBriefing } from "./parseXBriefing";

describe("normalizeParsedBriefing", () => {
  it("normalizes RSS and X parser outputs into one shared Insight shape with deterministic ids", () => {
    const rss = normalizeParsedBriefing(parseRssBriefing(rssNormal));
    const x = normalizeParsedBriefing(parseXBriefing(xNormal));

    expect(rss.insights[0]).toMatchObject({
      briefingId: "rss-2026-03-20",
      sourceType: "rss",
      sourceLabel: "RSS Briefing",
      isTopSignal: true
    });
    expect(rss.insights[0].id).toBe("rss-2026-03-20-01-open-source-agent-dashboard-for-repository-workflows");

    expect(x.insights[0]).toMatchObject({
      briefingId: "x-2026-03-14",
      sourceType: "x",
      sourceLabel: "X Briefing",
      isTopSignal: true
    });
    expect(x.insights[0].id).toBe("x-2026-03-14-trend-01-benchmark");
  });

  it("carries the article publish date onto the normalized insight when present", () => {
    const text = [
      "# Daily Briefing: 2026-05-19",
      "",
      "## [Builder Theme: April postmortem](https://www.anthropic.com/engineering/april-23-postmortem)",
      "**Source:** Anthropic Engineering",
      "**Source Label:** Follow Builders",
      "**Published:** 2026-04-23",
      "",
      "> **Chinese Summary:** 摘要。",
      "> **R2 Take:** 观点。",
      "",
      "---",
      ""
    ].join("\n");

    const normalized = normalizeParsedBriefing(parseRssBriefing(text));

    expect(normalized.insights[0].date).toBe("2026-05-19");
    expect(normalized.insights[0].publishedDate).toBe("2026-04-23");
  });

  it("preserves parser warnings so malformed sections fail loudly without crashing the whole run", () => {
    const rss = normalizeParsedBriefing(parseRssBriefing(rssEdge));
    const x = normalizeParsedBriefing(parseXBriefing(xEdge));

    expect(rss.insights).toHaveLength(1);
    expect(rss.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "missing_take" })])
    );
    expect(x.insights).toHaveLength(4);
    expect(x.warnings).toHaveLength(0);
  });
});
