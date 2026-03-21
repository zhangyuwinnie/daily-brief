export type SkillFocus = "agents" | "evals" | "rag" | "tooling" | "security";

export type Insight = {
  id: string;
  date: string;
  source: string;
  title: string;
  summary: string;
  takeaway: string;
  buildIdea: string;
  effort: "30m" | "2h" | "weekend";
  topics: string[];
  skillFocus: SkillFocus;
  isTopPick?: boolean;
};

export type DailyAudio = {
  id: string;
  date: string;
  status: "pending" | "ready" | "failed";
  duration: string;
  provider: string;
};

export type BuildStatus = "Inbox" | "Building" | "Learned" | "Archived";

export type BuildItem = {
  id: string;
  insight: Insight;
  skillFocus: SkillFocus;
  note: string;
  status: BuildStatus;
  addedAt: string;
};
