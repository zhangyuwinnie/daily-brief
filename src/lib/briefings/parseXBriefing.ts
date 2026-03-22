import { deriveTopics } from "./topicRules";
import type { ParsedSourceIndexEntry, ParsedXBriefing, ParsedXItem, ParserWarning, XCuratedSection } from "./types";

const CURATED_SECTIONS = ["热门趋势", "工具与项目", "观点洞察", "新闻动态"] as const;

function extractDate(text: string) {
  const headingMatch = text.match(/^#\s+🐦\s+X Morning Briefing - (\d{4}-\d{2}-\d{2})/m);
  return headingMatch?.[1];
}

function splitH2Sections(text: string) {
  const matches = [...text.matchAll(/^##\s+(.+)$/gm)];

  return new Map(
    matches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      return [match[1].trim(), text.slice(start, end).trim()] as const;
    })
  );
}

function parseBulletLines(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, "").trim());
}

function splitCuratedSections(sectionText: string) {
  const matches = [...sectionText.matchAll(/^###\s+(.+)$/gm)];

  return new Map(
    matches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? sectionText.length;
      return [match[1].trim(), sectionText.slice(start, end).trim()] as const;
    })
  );
}

function extractInlineSourceUrls(line: string) {
  return [...line.matchAll(/原帖:\s*\[链接\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
}

function extractHandles(line: string) {
  return [...line.matchAll(/\[(@[^\]]+)\](?:\((https?:\/\/[^)]+)\))?/g)].map((match) => match[1].trim());
}

function stripInlineSourceRefs(line: string) {
  return line
    .replace(/\s*[（(]原帖:\s*\[链接\]\((https?:\/\/[^)]+)\)[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingHandles(line: string) {
  return line
    .replace(
      /^(?:\s*\[@[^\]]+\](?:\((https?:\/\/[^)]+)\))?\s*(?:[、,&，]\s*|\s*&\s*)?)+(?:[:：]\s*)?/,
      ""
    )
    .trim();
}

function deriveTitleFromSummary(summary: string) {
  const delimiters = ["。", "；", "！", "？", ":", "：", "，", "、"];
  const positions = delimiters
    .map((delimiter) => summary.indexOf(delimiter))
    .filter((position) => position >= 0);

  if (positions.length === 0) {
    return summary.slice(0, 80).trim();
  }

  return summary.slice(0, Math.min(...positions)).trim();
}

function parseScores(sectionText: string, date: string, warnings: ParserWarning[]) {
  const scores = {
    heat: undefined as number | undefined,
    value: undefined as number | undefined,
    conclusion: undefined as string | undefined
  };

  for (const bullet of parseBulletLines(sectionText)) {
    if (bullet.startsWith("🔥")) {
      const match = bullet.match(/(\d{1,2})\/10/);
      if (match) {
        scores.heat = Number(match[1]);
      } else {
        warnings.push({
          code: "invalid_score",
          message: "X briefing heat score could not be parsed.",
          sourceType: "x",
          date,
          section: "信号评分"
        });
      }
    } else if (bullet.startsWith("🧠")) {
      const match = bullet.match(/(\d{1,2})\/10/);
      if (match) {
        scores.value = Number(match[1]);
      } else {
        warnings.push({
          code: "invalid_score",
          message: "X briefing value score could not be parsed.",
          sourceType: "x",
          date,
          section: "信号评分"
        });
      }
    } else if (bullet.startsWith("一句话结论")) {
      scores.conclusion = bullet.replace(/^一句话结论[:：]\s*/, "").trim();
    }
  }

  return scores;
}

function parseSourceIndex(sectionText: string) {
  const lines = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const entries: ParsedSourceIndexEntry[] = [];

  for (let index = 0; index < lines.length; index += 2) {
    const bulletLine = lines[index];
    const urlLine = lines[index + 1];

    if (!bulletLine?.startsWith("- ") || !urlLine?.startsWith("http")) {
      continue;
    }

    const match = bulletLine.match(/^- \[(@[^\]]+)\]\s+(.*)$/);
    if (!match) {
      continue;
    }

    entries.push({
      handle: match[1],
      snippet: match[2].trim(),
      url: urlLine
    });
  }

  return entries;
}

export function parseXBriefing(text: string): ParsedXBriefing {
  const date = extractDate(text) ?? "unknown-date";
  const warnings: ParserWarning[] = [];
  const sections = splitH2Sections(text);
  const toplines = parseBulletLines(sections.get("今日3条要点") ?? "");
  const actions = parseBulletLines(sections.get("可执行动作") ?? "");
  const curated = splitCuratedSections(sections.get("值得关注的推文") ?? "");
  const items: ParsedXItem[] = [];

  if (date === "unknown-date") {
    warnings.push({
      code: "missing_date",
      message: "X briefing is missing a parseable date heading.",
      sourceType: "x",
      date
    });
  }

  if (toplines.length === 0) {
    warnings.push({
      code: "missing_toplines",
      message: "X briefing is missing 今日3条要点 bullets.",
      sourceType: "x",
      date,
      section: "今日3条要点"
    });
  }

  if (!sections.has("值得关注的推文")) {
    warnings.push({
      code: "missing_section",
      message: "X briefing is missing 值得关注的推文.",
      sourceType: "x",
      date,
      section: "值得关注的推文"
    });
  }

  for (const sectionName of CURATED_SECTIONS) {
    const sectionBody = curated.get(sectionName);
    if (!sectionBody) {
      continue;
    }

    const bullets = parseBulletLines(sectionBody);

    bullets.forEach((bullet, itemIndex) => {
      const handles = extractHandles(bullet);
      const sourceUrls = extractInlineSourceUrls(bullet);
      const withoutSources = stripInlineSourceRefs(bullet);
      const summary = stripLeadingHandles(withoutSources);

      if (!summary) {
        warnings.push({
          code: "missing_bullet_content",
          message: `X ${sectionName} bullet ${itemIndex + 1} has no curated content after stripping handles and source refs.`,
          sourceType: "x",
          date,
          itemIndex,
          section: sectionName
        });
        return;
      }

      const title = deriveTitleFromSummary(summary);

      items.push({
        sourceType: "x",
        date,
        section: sectionName as XCuratedSection,
        itemIndex,
        handles,
        sourceName: handles.length > 0 ? handles.join(", ") : undefined,
        sourceUrl: sourceUrls[0],
        sourceUrls,
        title,
        summary,
        take: summary,
        topics: deriveTopics([title, summary, summary]),
        signalScore: undefined
      });
    });
  }

  return {
    sourceType: "x",
    date,
    toplines,
    actionItems: actions,
    scores: parseScores(sections.get("信号评分") ?? "", date, warnings),
    items,
    sourceIndex: parseSourceIndex(sections.get("原帖链接索引") ?? ""),
    warnings
  };
}
