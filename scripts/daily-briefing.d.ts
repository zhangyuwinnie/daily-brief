export type BriefingCandidate = {
  title: string;
  link: string;
  contentSnippet?: string;
  source: string;
  isoDate?: string;
  matchedKeywords?: string[];
};

export type SummarizedBriefingItem = BriefingCandidate & {
  summary: string;
  take: string;
};

export type HtmlSource = {
  name: string;
  url: string;
};

export type BriefingPaths = {
  repoRoot: string;
  briefingsDir: string;
  filePath: string;
};

export type RunDailyBriefingOptions = {
  now?: Date;
  date?: string;
  repoRoot?: string;
  outputDir?: string;
  sources?: string[];
  htmlSources?: HtmlSource[];
  keywords?: string[];
  maxAgeDays?: number;
  maxItems?: number;
  logger?: Console;
  fetchImpl?: typeof fetch;
  fetchFeedItems?: (
    sourceUrl: string,
    context?: { fetchImpl?: typeof fetch; logger?: Console }
  ) => Promise<BriefingCandidate[]>;
  fetchHtmlItems?: (
    source: HtmlSource,
    context?: { fetchImpl?: typeof fetch; logger?: Console }
  ) => Promise<BriefingCandidate[]>;
  rankCandidates?: (
    candidates: BriefingCandidate[],
    context?: { maxItems?: number; logger?: Console }
  ) => Promise<BriefingCandidate[]> | BriefingCandidate[];
  summarizeCandidate?: (
    candidate: BriefingCandidate,
    context?: { logger?: Console }
  ) => Promise<{ summary: string; take: string }> | { summary: string; take: string };
};

export type RunDailyBriefingResult = {
  date: string;
  filePath: string;
  briefingsDir: string;
  markdown: string;
  items: SummarizedBriefingItem[];
  candidateCount: number;
};

export const MAX_BRIEFING_ITEMS: number;
export const DEFAULT_KEYWORDS: string[];
export const DEFAULT_SOURCES: string[];
export const DEFAULT_HTML_SOURCES: HtmlSource[];

export function getRepoRoot(): string;
export function getLADate(now?: Date): string;
export function getBriefingPaths(args?: {
  repoRoot?: string;
  date?: string;
  outputDir?: string;
}): BriefingPaths;
export function parseFeedXml(
  xml: string,
  sourceUrl: string
): Array<Required<Pick<BriefingCandidate, "title" | "link" | "source">> & BriefingCandidate>;
export function parseCursorBlogHtml(
  html: string,
  source: HtmlSource
): Array<Required<Pick<BriefingCandidate, "title" | "link" | "source">> & BriefingCandidate>;
export function deduplicateByTopic(
  items: BriefingCandidate[],
  jaccardThreshold?: number,
  containmentThreshold?: number
): BriefingCandidate[];
export function applySourceDiversityLimit(
  rankedItems: BriefingCandidate[],
  allCandidates: BriefingCandidate[],
  maxPerSource?: number,
  targetCount?: number
): BriefingCandidate[];
export function defaultFetchFeedItems(
  sourceUrl: string,
  context?: { fetchImpl?: typeof fetch; logger?: Console }
): Promise<BriefingCandidate[]>;
export function defaultFetchHtmlItems(
  source: HtmlSource,
  context?: { fetchImpl?: typeof fetch; logger?: Console }
): Promise<BriefingCandidate[]>;
export function defaultRankCandidates(
  candidates: BriefingCandidate[],
  context?: { maxItems?: number; apiKey?: string; logger?: Console }
): Promise<BriefingCandidate[]>;
export function defaultSummarizeCandidate(
  candidate: BriefingCandidate,
  context?: { apiKey?: string; logger?: Console }
): Promise<{ summary: string; take: string }>;
export function renderBriefingMarkdown(args: {
  date: string;
  items: SummarizedBriefingItem[];
}): string;
export function runDailyBriefing(options?: RunDailyBriefingOptions): Promise<RunDailyBriefingResult>;
