import { describe, expect, it } from "vitest";
import { buildTodaySections } from "./todaySections";
import type { Insight } from "../types/models";

function createInsight(overrides: Partial<Insight> & Pick<Insight, "id" | "title">): Insight {
  return {
    id: overrides.id,
    briefingId: overrides.briefingId ?? `briefing-${overrides.id}`,
    date: overrides.date ?? "2026-03-22",
    sourceType: overrides.sourceType ?? "rss",
    sourceLabel: overrides.sourceLabel ?? "RSS Briefing",
    sourceName: overrides.sourceName,
    sourceUrl: overrides.sourceUrl,
    title: overrides.title,
    summary: overrides.summary ?? `${overrides.title} summary`,
    take: overrides.take ?? `${overrides.title} take`,
    whyItMatters: overrides.whyItMatters,
    buildIdea: overrides.buildIdea,
    learnGoal: overrides.learnGoal,
    topics: overrides.topics ?? ["Agents"],
    entities: overrides.entities ?? [],
    signalScore: overrides.signalScore,
    effortEstimate: overrides.effortEstimate,
    isTopSignal: overrides.isTopSignal ?? false
  };
}

describe("buildTodaySections", () => {
  it("prioritizes top signals and separates the remaining insights", () => {
    const sections = buildTodaySections([
      createInsight({ id: "1", title: "One", isTopSignal: true }),
      createInsight({ id: "2", title: "Two", isTopSignal: true }),
      createInsight({ id: "3", title: "Three", isTopSignal: false }),
      createInsight({ id: "4", title: "Four", isTopSignal: true }),
      createInsight({ id: "5", title: "Five", isTopSignal: false })
    ]);

    expect(sections.topSignals.map((insight) => insight.id)).toEqual(["1", "2", "4"]);
    expect(sections.moreSignals.map((insight) => insight.id)).toEqual(["3", "5"]);
  });

  it("falls back to summary and take when richer fields are absent", () => {
    const sections = buildTodaySections([
      createInsight({ id: "1", title: "One", isTopSignal: true, summary: "One summary", take: "One take" }),
      createInsight({ id: "2", title: "Two", isTopSignal: true, summary: "Two summary", take: "Two take" })
    ]);

    expect(sections.whyItMatters.map((item) => item.content)).toEqual(["One summary", "Two summary"]);
    expect(sections.buildThisToday.map((item) => item.content)).toEqual(["One take", "Two take"]);
    expect(sections.learnThisNext.map((item) => item.content)).toEqual(["One summary", "Two summary"]);
  });

  it("uses richer why/build/learn fields when available", () => {
    const sections = buildTodaySections([
      createInsight({
        id: "1",
        title: "One",
        isTopSignal: true,
        whyItMatters: "Why one matters",
        buildIdea: "Build one",
        learnGoal: "Learn one"
      })
    ]);

    expect(sections.whyItMatters[0].content).toBe("Why one matters");
    expect(sections.buildThisToday[0].content).toBe("Build one");
    expect(sections.learnThisNext[0].content).toBe("Learn one");
  });

  it("falls back to the first insights when no top signal is available", () => {
    const sections = buildTodaySections([
      createInsight({ id: "1", title: "One", isTopSignal: false }),
      createInsight({ id: "2", title: "Two", isTopSignal: false }),
      createInsight({ id: "3", title: "Three", isTopSignal: false }),
      createInsight({ id: "4", title: "Four", isTopSignal: false })
    ]);

    expect(sections.topSignals.map((insight) => insight.id)).toEqual(["1", "2", "3"]);
    expect(sections.moreSignals.map((insight) => insight.id)).toEqual(["4"]);
  });
});
