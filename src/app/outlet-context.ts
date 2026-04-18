import type { Insight } from "../types/models";

export type AppOutletContext = {
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
};
