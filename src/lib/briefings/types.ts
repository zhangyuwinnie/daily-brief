import type { Insight, SourceType } from "../../types/models";

export type ParserWarningCode =
  | "missing_date"
  | "missing_title"
  | "missing_summary"
  | "missing_take"
  | "missing_source"
  | "missing_toplines"
  | "missing_section"
  | "missing_bullet_content"
  | "invalid_score";

export type ParserWarning = {
  code: ParserWarningCode;
  message: string;
  sourceType: SourceType;
  date: string;
  itemIndex?: number;
  section?: string;
};

export type ParsedRssItem = {
  sourceType: "rss";
  date: string;
  entryIndex: number;
  title: string;
  sourceName?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  summary: string;
  take: string;
  topics: string[];
  signalScore?: number;
};

export type ParsedRssBriefing = {
  sourceType: "rss";
  date: string;
  items: ParsedRssItem[];
  warnings: ParserWarning[];
};

export type XCuratedSection = "热门趋势" | "工具与项目" | "观点洞察" | "新闻动态";

export type ParsedSourceIndexEntry = {
  handle: string;
  snippet: string;
  url: string;
};

export type ParsedXItem = {
  sourceType: "x";
  date: string;
  section: XCuratedSection;
  itemIndex: number;
  handles: string[];
  sourceName?: string;
  sourceUrl?: string;
  sourceUrls: string[];
  title: string;
  summary: string;
  take: string;
  topics: string[];
  signalScore?: number;
};

export type ParsedXBriefing = {
  sourceType: "x";
  date: string;
  toplines: string[];
  actionItems: string[];
  scores: {
    heat?: number;
    value?: number;
    conclusion?: string;
  };
  items: ParsedXItem[];
  sourceIndex: ParsedSourceIndexEntry[];
  warnings: ParserWarning[];
};

export type ParsedBriefing = ParsedRssBriefing | ParsedXBriefing;

export type NormalizeParsedBriefingResult = {
  insights: Insight[];
  warnings: ParserWarning[];
};
