export type SkillFocus = "agents" | "evals" | "rag" | "tooling" | "security";
export type EffortEstimate = "30m" | "2h" | "weekend";
export type SourceType = "rss" | "x";
export type AudioStatus = "pending" | "ready" | "failed";
export type AudioProvider = "notebooklm" | "manual";

export type BriefingRecord = {
  id: string;
  date: string;
  sourceType: SourceType;
  title: string;
  filePath: string;
  summaryTopline?: string;
  insightIds: string[];
};

export type Insight = {
  id: string;
  briefingId: string;
  date: string;
  sourceType: SourceType;
  sourceLabel: string;
  sourceName?: string;
  sourceUrl?: string;
  title: string;
  summary: string;
  take: string;
  whyItMatters?: string;
  buildIdea?: string;
  learnGoal?: string;
  topics: string[];
  entities: string[];
  signalScore?: number;
  effortEstimate?: EffortEstimate;
  isTopSignal: boolean;
};

export type DailyAudio = {
  id: string;
  briefingDate: string;
  status: AudioStatus;
  provider: AudioProvider;
  title?: string;
  audioUrl?: string;
  durationSec?: number;
  transcript?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InsightState = {
  insightId: string;
  status: "Inbox" | "Interested" | "Building" | "Learned" | "Archived";
  skillFocus?: SkillFocus;
  note?: string;
  personalTakeaway?: string;
  createdAt: string;
  lastTouchedAt: string;
};

export type DailyBriefPageData = {
  date: string;
  availableDates: string[];
  briefings: BriefingRecord[];
  insights: Insight[];
  audio?: DailyAudio;
};

export type BuildStatus = InsightState["status"];

export type BuildItem = {
  id: string;
  insight: Insight;
  skillFocus: SkillFocus;
  note: string;
  status: BuildStatus;
  addedAt: string;
};
