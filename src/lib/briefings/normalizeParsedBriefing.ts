import type { NormalizeParsedBriefingResult, ParsedBriefing } from "./types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildRssInsightId(date: string, entryIndex: number, title: string) {
  return `rss-${date}-${String(entryIndex + 1).padStart(2, "0")}-${slugify(title)}`;
}

function sectionKey(section: string) {
  switch (section) {
    case "热门趋势":
      return "trend";
    case "工具与项目":
      return "tools";
    case "观点洞察":
      return "opinion";
    case "新闻动态":
      return "news";
    default:
      return "misc";
  }
}

function buildXInsightId(date: string, section: string, itemIndex: number, title: string) {
  return `x-${date}-${sectionKey(section)}-${String(itemIndex + 1).padStart(2, "0")}-${slugify(title)}`;
}

export function normalizeParsedBriefing(parsed: ParsedBriefing): NormalizeParsedBriefingResult {
  if (parsed.sourceType === "rss") {
    return {
      insights: parsed.items.map((item, index) => ({
        id: buildRssInsightId(item.date, item.entryIndex, item.title),
        briefingId: `rss-${item.date}`,
        date: item.date,
        sourceType: "rss",
        sourceLabel: item.sourceLabel ?? "RSS Briefing",
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        title: item.title,
        summary: item.summary,
        take: item.take,
        whyItMatters: undefined,
        buildIdea: undefined,
        learnGoal: undefined,
        topics: item.topics,
        entities: [],
        signalScore: item.signalScore,
        effortEstimate: undefined,
        isTopSignal: index < 3
      })),
      warnings: parsed.warnings
    };
  }

  return {
    insights: parsed.items.map((item, index) => ({
      id: buildXInsightId(item.date, item.section, item.itemIndex, item.title),
      briefingId: `x-${item.date}`,
      date: item.date,
      sourceType: "x",
      sourceLabel: "X Briefing",
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      title: item.title,
      summary: item.summary,
      take: item.take,
      whyItMatters: undefined,
      buildIdea: undefined,
      learnGoal: undefined,
      topics: item.topics,
      entities: [],
      signalScore: undefined,
      effortEstimate: undefined,
      isTopSignal: index < 3
    })),
    warnings: parsed.warnings
  };
}
