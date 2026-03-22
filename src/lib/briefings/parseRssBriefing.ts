import { deriveTopics } from "./topicRules";
import type { ParsedRssBriefing, ParsedRssItem, ParserWarning } from "./types";

function extractDate(text: string) {
  const headingMatch = text.match(/^#\s+Daily Briefing:\s+(\d{4}-\d{2}-\d{2})/m);
  return headingMatch?.[1];
}

function extractLabeledBlock(block: string, label: string) {
  const lines = block.split("\n");
  const collected: string[] = [];
  let capturing = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const normalized = line.replace(/^>\s*/, "");
    const labelMatch = normalized.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.*)$`));

    if (labelMatch) {
      capturing = true;
      const inlineValue = labelMatch[1]?.trim();
      if (inlineValue) {
        collected.push(inlineValue);
      }
      continue;
    }

    if (capturing && /^\*{2}[^*]+:\*{2}/.test(normalized)) {
      break;
    }

    if (capturing) {
      if (!normalized || normalized === "---") {
        if (collected.length > 0) {
          break;
        }
        continue;
      }

      collected.push(normalized);
    }
  }

  return collected.join(" ").trim();
}

function extractSignalScore(block: string) {
  const scoreMatch = block.match(/(?:Signal Score|信号评分):\s*(\d{1,2})\/10/i);
  return scoreMatch ? Number(scoreMatch[1]) : undefined;
}

function splitEntries(text: string) {
  const matches = [...text.matchAll(/^##\s+\[(.+?)\]\((.+?)\)\s*$/gm)];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? text.length;

    return {
      block: text.slice(start, end).trim(),
      title: match[1].trim(),
      sourceUrl: match[2].trim(),
      entryIndex: index
    };
  });
}

export function parseRssBriefing(text: string): ParsedRssBriefing {
  const date = extractDate(text) ?? "unknown-date";
  const warnings: ParserWarning[] = [];
  const items: ParsedRssItem[] = [];

  if (date === "unknown-date") {
    warnings.push({
      code: "missing_date",
      message: "RSS briefing is missing a parseable date heading.",
      sourceType: "rss",
      date
    });
  }

  for (const entry of splitEntries(text)) {
    const sourceMatch = entry.block.match(/^\*\*Source:\*\*\s+(.+)$/m);
    const sourceName = sourceMatch?.[1]?.trim();
    const summary = extractLabeledBlock(entry.block, "Chinese Summary");
    const take = extractLabeledBlock(entry.block, "R2 Take");

    if (!sourceName) {
      warnings.push({
        code: "missing_source",
        message: `RSS entry ${entry.entryIndex + 1} is missing a Source line.`,
        sourceType: "rss",
        date,
        itemIndex: entry.entryIndex
      });
    }

    if (!entry.title) {
      warnings.push({
        code: "missing_title",
        message: `RSS entry ${entry.entryIndex + 1} is missing a title.`,
        sourceType: "rss",
        date,
        itemIndex: entry.entryIndex
      });
      continue;
    }

    if (!summary) {
      warnings.push({
        code: "missing_summary",
        message: `RSS entry ${entry.entryIndex + 1} is missing a Chinese Summary.`,
        sourceType: "rss",
        date,
        itemIndex: entry.entryIndex
      });
      continue;
    }

    if (!take) {
      warnings.push({
        code: "missing_take",
        message: `RSS entry ${entry.entryIndex + 1} is missing an R2 Take.`,
        sourceType: "rss",
        date,
        itemIndex: entry.entryIndex
      });
      continue;
    }

    items.push({
      sourceType: "rss",
      date,
      entryIndex: entry.entryIndex,
      title: entry.title,
      sourceName,
      sourceUrl: entry.sourceUrl,
      summary,
      take,
      topics: deriveTopics([entry.title, summary, take]),
      signalScore: extractSignalScore(entry.block)
    });
  }

  return {
    sourceType: "rss",
    date,
    items,
    warnings
  };
}
