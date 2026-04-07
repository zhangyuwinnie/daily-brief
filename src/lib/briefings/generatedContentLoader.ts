import type { DailyBriefPageData, Insight } from "../../types/models";
import type {
  GeneratedAudioIndex,
  GeneratedBriefingsByDate,
  GeneratedBriefingsIndex
} from "./generatedArtifacts";

export type GeneratedContentSources = {
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

const GENERATED_BRIEFINGS_INDEX_PATH = "/generated/briefings-index.json";
const GENERATED_BRIEFINGS_BY_DATE_PATH = "/generated/briefings-by-date.json";
const GENERATED_AUDIO_INDEX_PATH = "/generated/audio-index.json";
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

let cachedGeneratedContentSources: GeneratedContentSources | null = null;
let cachedGeneratedContentPromise: Promise<GeneratedContentSources> | null = null;

const allInsightsCache = new WeakMap<GeneratedContentSources, Insight[]>();
const insightsByIdCache = new WeakMap<GeneratedContentSources, Map<string, Insight>>();
const availableTopicsCache = new WeakMap<GeneratedContentSources, string[]>();

function getFetchImplementation(fetchImpl?: typeof fetch) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch === "function") {
    return fetch;
  }

  throw new Error("Fetch API is unavailable, so generated content cannot be loaded at runtime.");
}

async function fetchGeneratedJson<T>(path: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(path);

  if (!response.ok) {
    throw new Error(`Failed to load generated content from ${path}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function requireGeneratedContentSources(
  dataSources: GeneratedContentSources | undefined
): GeneratedContentSources {
  if (dataSources) {
    return dataSources;
  }

  if (cachedGeneratedContentSources) {
    return cachedGeneratedContentSources;
  }

  throw new Error("Generated content has not been loaded yet.");
}

function getAllInsightsForSources(dataSources: GeneratedContentSources) {
  const cachedInsights = allInsightsCache.get(dataSources);

  if (cachedInsights) {
    return cachedInsights;
  }

  const allInsights = dataSources.briefingsIndex.availableDates.flatMap(
    (date) => dataSources.briefingsByDate[date]?.insights ?? []
  );
  allInsightsCache.set(dataSources, allInsights);
  return allInsights;
}

function getInsightsByIdForSources(dataSources: GeneratedContentSources) {
  const cachedInsightsById = insightsByIdCache.get(dataSources);

  if (cachedInsightsById) {
    return cachedInsightsById;
  }

  const nextInsightsById = new Map<string, Insight>(
    getAllInsightsForSources(dataSources).map((insight) => [insight.id, insight] as const)
  );
  insightsByIdCache.set(dataSources, nextInsightsById);
  return nextInsightsById;
}

function getAvailableTopicsForSources(dataSources: GeneratedContentSources) {
  const cachedTopics = availableTopicsCache.get(dataSources);

  if (cachedTopics) {
    return cachedTopics;
  }

  const derivedTopics = new Set(getAllInsightsForSources(dataSources).flatMap((insight) => insight.topics));
  const orderedTopics = approvedTopicOrder.filter((topic) => derivedTopics.has(topic));
  availableTopicsCache.set(dataSources, orderedTopics);
  return orderedTopics;
}

function resolveBriefingDate(requestedDate: string | undefined, dataSources: GeneratedContentSources) {
  if (requestedDate && dataSources.briefingsByDate[requestedDate]) {
    return requestedDate;
  }

  return dataSources.briefingsIndex.availableDates[0] ?? null;
}

export async function loadGeneratedContentSources(
  fetchImpl?: typeof fetch
): Promise<GeneratedContentSources> {
  if (cachedGeneratedContentSources) {
    return cachedGeneratedContentSources;
  }

  if (cachedGeneratedContentPromise) {
    return cachedGeneratedContentPromise;
  }

  const nextFetch = getFetchImplementation(fetchImpl);
  cachedGeneratedContentPromise = Promise.all([
    fetchGeneratedJson<GeneratedBriefingsIndex>(GENERATED_BRIEFINGS_INDEX_PATH, nextFetch),
    fetchGeneratedJson<GeneratedBriefingsByDate>(GENERATED_BRIEFINGS_BY_DATE_PATH, nextFetch),
    fetchGeneratedJson<GeneratedAudioIndex>(GENERATED_AUDIO_INDEX_PATH, nextFetch)
  ])
    .then(([briefingsIndex, briefingsByDate, audioIndex]) => {
      const nextSources = {
        briefingsIndex,
        briefingsByDate,
        audioIndex
      } satisfies GeneratedContentSources;

      cachedGeneratedContentSources = nextSources;
      return nextSources;
    })
    .catch((error) => {
      cachedGeneratedContentPromise = null;
      throw error;
    });

  return cachedGeneratedContentPromise;
}

export function primeGeneratedContentSources(dataSources: GeneratedContentSources) {
  cachedGeneratedContentSources = dataSources;
  cachedGeneratedContentPromise = Promise.resolve(dataSources);
}

export function resetGeneratedContentSources() {
  cachedGeneratedContentSources = null;
  cachedGeneratedContentPromise = null;
}

export function getAvailableBriefingDates(dataSources?: GeneratedContentSources) {
  return requireGeneratedContentSources(dataSources).briefingsIndex.availableDates;
}

export function getLatestBriefingDate(dataSources?: GeneratedContentSources) {
  return requireGeneratedContentSources(dataSources).briefingsIndex.availableDates[0] ?? null;
}

export function getAllInsights(dataSources?: GeneratedContentSources) {
  return getAllInsightsForSources(requireGeneratedContentSources(dataSources));
}

export function getAvailableTopics(dataSources?: GeneratedContentSources) {
  return getAvailableTopicsForSources(requireGeneratedContentSources(dataSources));
}

export function resolveDailyBriefPageState(
  requestedDate?: string,
  dataSources?: GeneratedContentSources
): DailyBriefPageState {
  const resolvedSources = requireGeneratedContentSources(dataSources);
  const resolvedDate = resolveBriefingDate(requestedDate, resolvedSources);
  const requestedDateWasUnavailable = Boolean(requestedDate && !resolvedSources.briefingsByDate[requestedDate]);

  if (!resolvedDate) {
    return {
      requestedDate,
      resolvedDate: null,
      requestedDateWasUnavailable,
      missingAudio: false,
      pageData: null
    };
  }

  const day = resolvedSources.briefingsByDate[resolvedDate];

  if (!day) {
    return {
      requestedDate,
      resolvedDate,
      requestedDateWasUnavailable,
      missingAudio: false,
      pageData: null
    };
  }

  const resolvedAudio = resolvedSources.audioIndex[resolvedDate];

  return {
    requestedDate,
    resolvedDate,
    requestedDateWasUnavailable,
    missingAudio: !resolvedAudio,
    pageData: {
      date: resolvedDate,
      availableDates: resolvedSources.briefingsIndex.availableDates,
      briefings: day.briefings,
      insights: day.insights,
      audio: resolvedAudio
    }
  };
}

export function getDailyBriefPageState(
  requestedDate?: string,
  dataSources?: GeneratedContentSources
) {
  return resolveDailyBriefPageState(requestedDate, dataSources);
}

export function getDailyBriefPageData(
  requestedDate?: string,
  dataSources?: GeneratedContentSources
): DailyBriefPageData | null {
  return getDailyBriefPageState(requestedDate, dataSources).pageData;
}

export function getInsightById(insightId: string, dataSources?: GeneratedContentSources) {
  return getInsightsByIdForSources(requireGeneratedContentSources(dataSources)).get(insightId) ?? null;
}
