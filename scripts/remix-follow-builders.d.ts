export type FollowBuildersSummarize = (
  candidate: {
    title: string;
    source?: string;
    link?: string;
    contentSnippet?: string;
    matchedKeywords?: string[];
  },
  context?: { apiKey?: string; logger?: Console }
) => Promise<{ summary: string; take: string }> | { summary: string; take: string };

export type RemixFollowBuildersOptions = {
  logger?: Console;
  repoRoot?: string;
  date?: string;
  briefingFilePath?: string;
  inputPath?: string;
  inputText?: string;
  maxItems?: number;
  now?: Date;
  maxAgeDays?: number;
  lookbackDays?: number;
  apiKey?: string;
  summarizeCandidate?: FollowBuildersSummarize;
};

export type RemixFollowBuildersResult = {
  status: "ok" | "skipped";
  date: string;
  briefingFilePath: string;
  appendedCount: number;
};

export function parsePublishedDate(value?: string | null): string | undefined;
export function remixFollowBuilders(
  options?: RemixFollowBuildersOptions
): Promise<RemixFollowBuildersResult>;
