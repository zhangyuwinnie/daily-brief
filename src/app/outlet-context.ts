import type { BuildItem, BuildStatus, Insight } from "../types/models";

export type AppOutletContext = {
  buildQueue: BuildItem[];
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onAddToBuild: (insight: Insight) => void;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
  onUpdateStatus: (itemId: string, status: BuildStatus) => void;
};
