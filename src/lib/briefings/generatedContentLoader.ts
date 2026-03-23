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
const generatedContentSources = {
  briefingsIndex,
  briefingsByDate,
  audioIndex
};
const approvedTopicOrder = [
  "Agents",
  "Coding Agents",
  "Evals",
  "RAG",
  "Retrieval",
  "Security",
  "Tooling",
  "Learning Resource"
] as const;
const allInsights = briefingsIndex.availableDates.flatMap(
  (date) => briefingsByDate[date]?.insights ?? []
);

const insightsById = new Map<string, Insight>(
  allInsights.map((insight) => [insight.id, insight] as const)
);

type GeneratedContentSources = {
  briefingsIndex: GeneratedBriefingsIndex;
  briefingsByDate: GeneratedBriefingsByDate;
  audioIndex: GeneratedAudioIndex;
};

export type DailyBriefPageState = {
  requestedDate?: string;
  resolvedDate: string | null;
  requestedDateWasUnavailable: boolean;
  missingAudio: boolean;
  pageData: DailyBriefPageData | null;
};

function resolveBriefingDate(requestedDate: string | undefined, dataSources: GeneratedContentSources) {
  if (requestedDate && dataSources.briefingsByDate[requestedDate]) {
    return requestedDate;
  }

  return dataSources.briefingsIndex.availableDates[0] ?? null;
}

export function getAvailableBriefingDates() {
  return briefingsIndex.availableDates;
}

export function getLatestBriefingDate() {
  return briefingsIndex.availableDates[0] ?? null;
}

export function getAllInsights() {
  return allInsights;
}

export function getAvailableTopics() {
  const derivedTopics = new Set(allInsights.flatMap((insight) => insight.topics));

  return approvedTopicOrder.filter((topic) => derivedTopics.has(topic));
}

export function resolveDailyBriefPageState(
  requestedDate?: string,
  dataSources: GeneratedContentSources = generatedContentSources
): DailyBriefPageState {
  const resolvedDate = resolveBriefingDate(requestedDate, dataSources);
  const requestedDateWasUnavailable = Boolean(requestedDate && !dataSources.briefingsByDate[requestedDate]);

  if (!resolvedDate) {
    return {
      requestedDate,
      resolvedDate: null,
      requestedDateWasUnavailable,
      missingAudio: false,
      pageData: null
    };
  }

  const day = dataSources.briefingsByDate[resolvedDate];

  if (!day) {
    return {
      requestedDate,
      resolvedDate,
      requestedDateWasUnavailable,
      missingAudio: false,
      pageData: null
    };
  }

  const resolvedAudio = dataSources.audioIndex[resolvedDate];

  return {
    requestedDate,
    resolvedDate,
    requestedDateWasUnavailable,
    missingAudio: !resolvedAudio,
    pageData: {
      date: resolvedDate,
      availableDates: dataSources.briefingsIndex.availableDates,
      briefings: day.briefings,
      insights: day.insights,
      audio: resolvedAudio
    }
  };
}

export function getDailyBriefPageState(requestedDate?: string) {
  return resolveDailyBriefPageState(requestedDate, generatedContentSources);
}

export function getDailyBriefPageData(requestedDate?: string): DailyBriefPageData | null {
  return getDailyBriefPageState(requestedDate).pageData;
}

export function getInsightById(insightId: string) {
  return insightsById.get(insightId) ?? null;
}
