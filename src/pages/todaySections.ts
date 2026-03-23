import type { Insight } from "../types/models";

export type TodaySectionItem = {
  id: string;
  title: string;
  content: string;
  sourceLabel: string;
  sourceName?: string;
  sourceUrl?: string;
  topics: string[];
};

export type TodaySections = {
  topSignals: Insight[];
  whyItMatters: TodaySectionItem[];
  buildThisToday: TodaySectionItem[];
  learnThisNext: TodaySectionItem[];
  moreSignals: Insight[];
};

function toSectionItem(insight: Insight, content: string): TodaySectionItem {
  return {
    id: insight.id,
    title: insight.title,
    content,
    sourceLabel: insight.sourceLabel,
    sourceName: insight.sourceName,
    sourceUrl: insight.sourceUrl,
    topics: insight.topics
  };
}

function normalizeContent(value: string | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function isDistinctContent(candidate: string | undefined, ...existingValues: Array<string | undefined>) {
  const normalizedCandidate = normalizeContent(candidate);

  if (!normalizedCandidate) {
    return false;
  }

  return existingValues.every((value) => normalizeContent(value) !== normalizedCandidate);
}

export function buildTodaySections(insights: Insight[]): TodaySections {
  const topSignals = insights.filter((insight) => insight.isTopSignal).slice(0, 3);
  const spotlightInsights = (topSignals.length > 0 ? topSignals : insights.slice(0, 3)).slice(0, 3);
  const spotlightIds = new Set(spotlightInsights.map((insight) => insight.id));

  return {
    topSignals: spotlightInsights,
    whyItMatters: spotlightInsights.flatMap((insight) =>
      isDistinctContent(insight.whyItMatters, insight.summary, insight.take)
        ? [toSectionItem(insight, insight.whyItMatters!)]
        : []
    ),
    buildThisToday: spotlightInsights.flatMap((insight) =>
      isDistinctContent(insight.buildIdea, insight.take, insight.summary, insight.whyItMatters)
        ? [toSectionItem(insight, insight.buildIdea!)]
        : []
    ),
    learnThisNext: spotlightInsights.flatMap((insight) =>
      isDistinctContent(insight.learnGoal, insight.summary, insight.take, insight.whyItMatters, insight.buildIdea)
        ? [toSectionItem(insight, insight.learnGoal!)]
        : []
    ),
    moreSignals: insights.filter((insight) => !spotlightIds.has(insight.id))
  };
}
