import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InsightCard } from "./InsightCard";
import type { Insight } from "../../types/models";

const noop = () => {};

function renderInsightCard(insight: Insight) {
  return renderToStaticMarkup(<InsightCard insight={insight} onAdd={noop} onShare={noop} />);
}

describe("InsightCard", () => {
  it("renders richer v1 fields when they are present", () => {
    const html = renderInsightCard({
      id: "insight-rich",
      briefingId: "briefing-rich",
      date: "2026-03-22",
      sourceType: "rss",
      sourceLabel: "RSS Briefing",
      sourceName: "Agent Weekly",
      sourceUrl: "https://example.com/insight-rich",
      title: "Rich insight",
      summary: "Summary copy",
      take: "Take copy",
      whyItMatters: "Why this matters copy",
      buildIdea: "Build this workflow next",
      learnGoal: "Study the orchestration pattern",
      topics: ["Agents", "Tooling"],
      entities: ["Agent Weekly"],
      effortEstimate: "2h",
      isTopSignal: true
    });

    expect(html).toContain("Why It Matters");
    expect(html).toContain("Why this matters copy");
    expect(html).toContain("Build Cue");
    expect(html).toContain("Build this workflow next");
    expect(html).toContain("Learn Next");
    expect(html).toContain("Study the orchestration pattern");
    expect(html).toContain("Agent Weekly");
    expect(html).toContain("2h");
  });

  it("avoids fake placeholders when optional fields are missing", () => {
    const html = renderInsightCard({
      id: "insight-sparse",
      briefingId: "briefing-sparse",
      date: "2026-03-22",
      sourceType: "rss",
      sourceLabel: "RSS Briefing",
      title: "Sparse insight",
      summary: "Summary copy",
      take: "Take copy",
      topics: ["Agents"],
      entities: [],
      isTopSignal: false
    });

    expect(html).not.toContain("Why It Matters");
    expect(html).not.toContain("Build Cue");
    expect(html).not.toContain("Learn Next");
    expect(html).not.toContain("TBD");
    expect(html).not.toContain("Explore this signal and turn it into a concrete build.");
    expect(html).toContain("Take copy");
    expect(html).toContain("Agents");
  });
});
