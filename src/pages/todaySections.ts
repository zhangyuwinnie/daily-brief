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

export function buildTodaySections(insights: Insight[]): TodaySections {
  const topSignals = insights.filter((insight) => insight.isTopSignal).slice(0, 3);
  const spotlightInsights = (topSignals.length > 0 ? topSignals : insights.slice(0, 3)).slice(0, 3);
  const spotlightIds = new Set(spotlightInsights.map((insight) => insight.id));

  return {
    topSignals: spotlightInsights,
    whyItMatters: spotlightInsights.map((insight) =>
      toSectionItem(insight, insight.whyItMatters ?? insight.summary)
    ),
    buildThisToday: spotlightInsights.map((insight) =>
      toSectionItem(insight, insight.buildIdea ?? insight.take)
    ),
    learnThisNext: spotlightInsights.map((insight) =>
      toSectionItem(insight, insight.learnGoal ?? insight.summary)
    ),
    moreSignals: insights.filter((insight) => !spotlightIds.has(insight.id))
  };
}
