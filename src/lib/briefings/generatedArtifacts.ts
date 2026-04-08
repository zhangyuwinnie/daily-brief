import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { AudioProvider, BriefingRecord, DailyAudio, Insight, SourceType } from "../../types/models";
import { normalizeParsedBriefing } from "./normalizeParsedBriefing";
import { parseRssBriefing } from "./parseRssBriefing";
import { parseXBriefing } from "./parseXBriefing";
import { findBestAudioFileForDate } from "./audioFileSelection";
import type { ParsedBriefing, ParserWarning } from "./types";

export type GeneratedBriefingsIndex = {
  availableDates: string[];
  byDate: Record<
    string,
    {
      briefingIds: string[];
      insightIds: string[];
      hasAudio: boolean;
      sourceTypes: SourceType[];
    }
  >;
};

export type GeneratedDayRecord = {
  date: string;
  briefings: BriefingRecord[];
  insights: Insight[];
  xToplines?: string[];
  xActionItems?: string[];
};

export type GeneratedBriefingsByDate = Record<string, GeneratedDayRecord>;
export type GeneratedAudioIndex = Record<string, DailyAudio>;

export type GeneratedArtifacts = {
  briefingsIndex: GeneratedBriefingsIndex;
  briefingsByDate: GeneratedBriefingsByDate;
  audioIndex: GeneratedAudioIndex;
  warnings: ParserWarning[];
};

export type BriefingInput = {
  filePath: string;
  text: string;
};

export type BuildGeneratedArtifactsOptions = {
  briefingInputs: BriefingInput[];
  audioFilePaths: string[];
  defaultAudioProvider?: AudioProvider;
};

type PreparedBriefing = {
  sourceType: SourceType;
  date: string;
  record: BriefingRecord;
  insights: Insight[];
  warnings: ParserWarning[];
  xToplines?: string[];
  xActionItems?: string[];
};

const OUTPUT_FILE_NAMES = [
  "briefings-index.json",
  "briefings-by-date.json",
  "audio-index.json"
] as const;

function sourceTypeOrder(sourceType: SourceType) {
  return sourceType === "rss" ? 0 : 1;
}

function inferSourceType(filePath: string): SourceType {
  return basename(filePath).startsWith("x_briefing_") ? "x" : "rss";
}

function buildBriefingTitle(parsed: ParsedBriefing) {
  return parsed.sourceType === "rss" ? `Daily Briefing: ${parsed.date}` : `X Morning Briefing - ${parsed.date}`;
}

function buildSummaryTopline(parsed: ParsedBriefing, insights: Insight[]) {
  if (parsed.sourceType === "x") {
    return parsed.toplines[0] ?? insights[0]?.title;
  }

  return insights[0]?.title;
}

function prepareBriefing(input: BriefingInput): PreparedBriefing {
  const sourceType = inferSourceType(input.filePath);
  const parsed = sourceType === "rss" ? parseRssBriefing(input.text) : parseXBriefing(input.text);
  const normalized = normalizeParsedBriefing(parsed);
  const date = parsed.date;

  const record: BriefingRecord = {
    id: `${sourceType}-${date}`,
    date,
    sourceType,
    title: buildBriefingTitle(parsed),
    filePath: basename(input.filePath),
    summaryTopline: buildSummaryTopline(parsed, normalized.insights),
    insightIds: normalized.insights.map((insight) => insight.id)
  };

  return {
    sourceType,
    date,
    record,
    insights: normalized.insights,
    warnings: normalized.warnings,
    xToplines: parsed.sourceType === "x" && parsed.toplines.length > 0 ? parsed.toplines : undefined,
    xActionItems: parsed.sourceType === "x" && parsed.actionItems.length > 0 ? parsed.actionItems : undefined
  };
}

function compareDateDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function comparePreparedBriefings(left: PreparedBriefing, right: PreparedBriefing) {
  const dateComparison = compareDateDesc(left.date, right.date);
  if (dateComparison !== 0) {
    return dateComparison;
  }

  return sourceTypeOrder(left.sourceType) - sourceTypeOrder(right.sourceType);
}

function findMatchingAudioFile(date: string, audioFilePaths: string[]) {
  return findBestAudioFileForDate(date, audioFilePaths);
}

function buildAudioRecord(date: string, audioFilePaths: string[], provider: AudioProvider): DailyAudio {
  const matchedAudio = findMatchingAudioFile(date, audioFilePaths);

  if (matchedAudio) {
    return {
      id: `audio-${date}`,
      briefingDate: date,
      status: "ready",
      provider,
      title: `Daily Brief for ${date}`,
      audioUrl: `/generated/audio/${basename(matchedAudio)}`
    };
  }

  return {
    id: `audio-${date}`,
    briefingDate: date,
    status: "pending",
    provider,
    title: `Daily Brief for ${date}`
  };
}

export function buildGeneratedArtifacts(options: BuildGeneratedArtifactsOptions): GeneratedArtifacts {
  const provider = options.defaultAudioProvider ?? "notebooklm";
  const prepared = options.briefingInputs.map(prepareBriefing).sort(comparePreparedBriefings);
  const briefingsByDate: GeneratedBriefingsByDate = {};
  const warnings = prepared.flatMap((briefing) => briefing.warnings);

  for (const briefing of prepared) {
    if (!briefingsByDate[briefing.date]) {
      briefingsByDate[briefing.date] = {
        date: briefing.date,
        briefings: [],
        insights: []
      };
    }

    const day = briefingsByDate[briefing.date];
    day.briefings.push(briefing.record);
    day.insights.push(...briefing.insights);

    if (briefing.xToplines) {
      day.xToplines = briefing.xToplines;
    }

    if (briefing.xActionItems) {
      day.xActionItems = briefing.xActionItems;
    }
  }

  const availableDates = Object.keys(briefingsByDate).sort(compareDateDesc);
  const audioIndex = Object.fromEntries(
    availableDates.map((date) => [date, buildAudioRecord(date, options.audioFilePaths, provider)])
  ) as GeneratedAudioIndex;

  const briefingsIndex: GeneratedBriefingsIndex = {
    availableDates,
    byDate: Object.fromEntries(
      availableDates.map((date) => {
        const day = briefingsByDate[date];

        return [
          date,
          {
            briefingIds: day.briefings.map((briefing) => briefing.id),
            insightIds: day.insights.map((insight) => insight.id),
            hasAudio: audioIndex[date]?.status === "ready",
            sourceTypes: day.briefings.map((briefing) => briefing.sourceType)
          }
        ];
      })
    )
  };

  return {
    briefingsIndex,
    briefingsByDate,
    audioIndex,
    warnings
  };
}

export function validateGeneratedArtifacts(artifacts: GeneratedArtifacts) {
  for (const date of artifacts.briefingsIndex.availableDates) {
    if (!artifacts.briefingsByDate[date]) {
      throw new Error(
        `briefings-index.json availableDates references ${date}, but briefings-by-date.json is missing that day payload.`
      );
    }

    if (!artifacts.briefingsIndex.byDate[date]) {
      throw new Error(`briefings-index.json is missing byDate metadata for ${date}.`);
    }
  }

  for (const [date, day] of Object.entries(artifacts.briefingsByDate)) {
    if (day.date !== date) {
      throw new Error(`briefings-by-date.json key ${date} does not match day.date ${day.date}.`);
    }

    if (day.briefings.length === 0 && day.insights.length === 0) {
      throw new Error(`briefings-by-date.json day ${date} lacks both \`briefings\` and \`insights\`.`);
    }
  }

  for (const [date, audio] of Object.entries(artifacts.audioIndex)) {
    if (!artifacts.briefingsByDate[date]) {
      throw new Error(`audio-index.json key ${date} does not exist in briefings-by-date.json.`);
    }

    if (audio.briefingDate !== date) {
      throw new Error(
        `audio-index.json key ${date} does not match DailyAudio.briefingDate ${audio.briefingDate}.`
      );
    }

    if (audio.status === "ready") {
      if (!audio.audioUrl) {
        throw new Error(`audio-index.json record ${date} is ready but missing audioUrl.`);
      }

      if (!audio.audioUrl.startsWith("/generated/audio/")) {
        throw new Error(
          `audio-index.json record ${date} has invalid audioUrl ${audio.audioUrl}; expected /generated/audio/...`
        );
      }
    } else if (audio.audioUrl) {
      throw new Error(`audio-index.json record ${date} must not include audioUrl unless status is ready.`);
    }
  }
}

export async function writeGeneratedArtifacts(artifacts: GeneratedArtifacts, outputDir: string) {
  await mkdir(outputDir, { recursive: true });
  const briefingsOutputDir = join(outputDir, "briefings");

  const payloads = [
    { fileName: OUTPUT_FILE_NAMES[0], data: artifacts.briefingsIndex },
    { fileName: OUTPUT_FILE_NAMES[1], data: artifacts.briefingsByDate },
    { fileName: OUTPUT_FILE_NAMES[2], data: artifacts.audioIndex }
  ];

  const writtenPaths: string[] = [];

  for (const payload of payloads) {
    const filePath = join(outputDir, payload.fileName);
    await writeFile(filePath, `${JSON.stringify(payload.data, null, 2)}\n`, "utf8");
    writtenPaths.push(filePath);
  }

  await rm(briefingsOutputDir, { recursive: true, force: true });
  await mkdir(briefingsOutputDir, { recursive: true });

  for (const date of artifacts.briefingsIndex.availableDates) {
    const dayRecord = artifacts.briefingsByDate[date];
    const filePath = join(briefingsOutputDir, `${date}.json`);
    await writeFile(filePath, `${JSON.stringify(dayRecord, null, 2)}\n`, "utf8");
    writtenPaths.push(filePath);
  }

  return writtenPaths;
}
