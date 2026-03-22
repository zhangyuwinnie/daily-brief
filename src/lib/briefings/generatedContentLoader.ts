import audioIndexJson from "../../generated/audio-index.json";
import briefingsByDateJson from "../../generated/briefings-by-date.json";
import briefingsIndexJson from "../../generated/briefings-index.json";
import type { DailyBriefPageData, Insight } from "../../types/models";
import type {
  GeneratedAudioIndex,
  GeneratedBriefingsByDate,
  GeneratedBriefingsIndex
} from "./generatedArtifacts";

const briefingsIndex = briefingsIndexJson as GeneratedBriefingsIndex;
const briefingsByDate = briefingsByDateJson as GeneratedBriefingsByDate;
const audioIndex = audioIndexJson as GeneratedAudioIndex;

const insightsById = new Map<string, Insight>(
  Object.values(briefingsByDate).flatMap((day) => day.insights.map((insight) => [insight.id, insight] as const))
);

function resolveBriefingDate(requestedDate?: string) {
  if (requestedDate && briefingsByDate[requestedDate]) {
    return requestedDate;
  }

  return briefingsIndex.availableDates[0] ?? null;
}

export function getAvailableBriefingDates() {
  return briefingsIndex.availableDates;
}

export function getLatestBriefingDate() {
  return briefingsIndex.availableDates[0] ?? null;
}

export function getDailyBriefPageData(requestedDate?: string): DailyBriefPageData | null {
  const resolvedDate = resolveBriefingDate(requestedDate);

  if (!resolvedDate) {
    return null;
  }

  const day = briefingsByDate[resolvedDate];

  if (!day) {
    return null;
  }

  return {
    date: resolvedDate,
    availableDates: briefingsIndex.availableDates,
    briefings: day.briefings,
    insights: day.insights,
    audio: audioIndex[resolvedDate]
  };
}

export function getInsightById(insightId: string) {
  return insightsById.get(insightId) ?? null;
}
