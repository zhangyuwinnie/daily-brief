import type { BuildItem, BuildStatus, Insight } from "../types/models";

export type AppOutletContext = {
  buildQueue: BuildItem[];
  buildQueueError: string | null;
  buildQueueStatus: "idle" | "loading" | "ready" | "error";
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onAddToBuild: (insight: Insight) => void;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
  onUpdateStatus: (itemId: string, status: BuildStatus) => void;
};
