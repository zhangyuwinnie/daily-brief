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

export type DailyBriefPageData = {
  date: string;
  availableDates: string[];
  briefings: BriefingRecord[];
  insights: Insight[];
  audio?: DailyAudio;
};
