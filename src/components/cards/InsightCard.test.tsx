// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "../../lib/analytics";
import { InsightCard } from "./InsightCard";
import type { Insight } from "../../types/models";

vi.mock("../../lib/analytics", () => ({
  trackEvent: vi.fn()
}));

const noop = () => {};

function renderInsightCard(insight: Insight) {
  return renderToStaticMarkup(<InsightCard insight={insight} onShare={noop} />);
}

const interactiveInsight: Insight = {
  id: "insight-interactive",
  briefingId: "briefing-interactive",
  date: "2026-03-22",
  sourceType: "rss",
  sourceLabel: "RSS Briefing",
  sourceName: "Agent Weekly",
  sourceUrl: "https://example.com/insight-interactive",
  title: "Interactive insight",
  summary: "Summary copy",
  take: "Take copy",
  topics: ["Agents"],
  entities: [],
  isTopSignal: false
};

let container: HTMLDivElement;
let root: Root;

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(trackEvent).mockClear();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

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

  it("tracks source-link clicks with the insight id", () => {
    act(() => {
      root.render(<InsightCard insight={interactiveInsight} onShare={noop} />);
    });

    const sourceLink = container.querySelector('[data-testid="insight-card-source-link"]');
    expect(sourceLink).not.toBeNull();

    act(() => {
      sourceLink!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(trackEvent).toHaveBeenCalledWith({
      event: "card_click",
      category: "insight_card",
      label: "insight-interactive"
    });
  });

  it("tracks share clicks before invoking the share callback", () => {
    const onShare = vi.fn();
    act(() => {
      root.render(<InsightCard insight={interactiveInsight} onShare={onShare} />);
    });

    const shareButton = container.querySelector('[data-testid="insight-card-share"]');
    expect(shareButton).not.toBeNull();

    act(() => {
      (shareButton as HTMLButtonElement).click();
    });

    expect(trackEvent).toHaveBeenCalledWith({
      event: "card_share",
      category: "insight_card",
      label: "insight-interactive"
    });
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
