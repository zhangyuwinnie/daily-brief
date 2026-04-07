import type { DailyBriefPageData } from "../../types/models";
import type {
  GeneratedAudioIndex,
  GeneratedBriefingsByDate,
  GeneratedBriefingsIndex,
  GeneratedDayRecord
} from "./generatedArtifacts";

export type GeneratedContentSources = {
  briefingsIndex: GeneratedBriefingsIndex;
  audioIndex: GeneratedAudioIndex;
  briefingsByDate?: GeneratedBriefingsByDate;
};

export type DailyBriefPageState = {
  requestedDate?: string;
  resolvedDate: string | null;
  requestedDateWasUnavailable: boolean;
  missingAudio: boolean;
  pageData: DailyBriefPageData | null;
};

const GENERATED_BRIEFINGS_INDEX_PATH = "/generated/briefings-index.json";
const GENERATED_AUDIO_INDEX_PATH = "/generated/audio-index.json";
const GENERATED_BRIEFINGS_DIRECTORY_PATH = "/generated/briefings";
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

const insightDateLookups = new WeakMap<GeneratedContentSources, Map<string, string>>();

let cachedGeneratedContentSources: GeneratedContentSources | null = null;
let cachedGeneratedContentPromise: Promise<GeneratedContentSources> | null = null;
let cachedDayRecords = new Map<string, GeneratedDayRecord>();
let cachedDayRecordPromises = new Map<string, Promise<GeneratedDayRecord>>();
let cachedFetchImplementation: typeof fetch | null = null;
const generatedContentListeners = new Set<() => void>();

function notifyGeneratedContentListeners() {
  generatedContentListeners.forEach((listener) => {
    listener();
  });
}

function hydrateCachedDayRecords(dataSources: GeneratedContentSources) {
  if (!dataSources.briefingsByDate) {
    return;
  }

  for (const [date, dayRecord] of Object.entries(dataSources.briefingsByDate)) {
    cachedDayRecords.set(date, dayRecord);
  }
}

function getFetchImplementation(fetchImpl?: typeof fetch) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (cachedFetchImplementation) {
    return cachedFetchImplementation;
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
    hydrateCachedDayRecords(cachedGeneratedContentSources);
    return cachedGeneratedContentSources;
  }

  throw new Error("Generated content has not been loaded yet.");
}

async function ensureGeneratedContentSources(
  dataSources?: GeneratedContentSources,
  fetchImpl?: typeof fetch
) {
  if (dataSources) {
    return dataSources;
  }

  return loadGeneratedContentSources(fetchImpl);
}

function getInsightDateLookup(dataSources: GeneratedContentSources) {
  const cachedLookup = insightDateLookups.get(dataSources);

  if (cachedLookup) {
    return cachedLookup;
  }

  const nextLookup = new Map<string, string>();

  for (const [date, metadata] of Object.entries(dataSources.briefingsIndex.byDate)) {
    metadata.insightIds.forEach((insightId) => {
      nextLookup.set(insightId, date);
    });
  }

  insightDateLookups.set(dataSources, nextLookup);
  return nextLookup;
}

function getCachedDayRecord(date: string, dataSources: GeneratedContentSources) {
  if (dataSources.briefingsByDate?.[date]) {
    return dataSources.briefingsByDate[date];
  }

  if (dataSources !== cachedGeneratedContentSources) {
    return null;
  }

  hydrateCachedDayRecords(dataSources);
  return cachedDayRecords.get(date) ?? null;
}

function getAllInsightsForSources(dataSources: GeneratedContentSources) {
  return dataSources.briefingsIndex.availableDates.flatMap(
    (date) => getCachedDayRecord(date, dataSources)?.insights ?? []
  );
}

function getAvailableTopicsForSources(dataSources: GeneratedContentSources) {
  const derivedTopics = new Set(getAllInsightsForSources(dataSources).flatMap((insight) => insight.topics));
  return approvedTopicOrder.filter((topic) => derivedTopics.has(topic));
}

function resolveBriefingDate(requestedDate: string | undefined, dataSources: GeneratedContentSources) {
  if (requestedDate && dataSources.briefingsIndex.byDate[requestedDate]) {
    return requestedDate;
  }

  return dataSources.briefingsIndex.availableDates[0] ?? null;
}

function createDailyBriefPageData(
  date: string,
  dataSources: GeneratedContentSources
): DailyBriefPageData | null {
  const day = getCachedDayRecord(date, dataSources);

  if (!day) {
    return null;
  }

  return {
    date,
    availableDates: dataSources.briefingsIndex.availableDates,
    briefings: day.briefings,
    insights: day.insights,
    audio: dataSources.audioIndex[date]
  };
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
  cachedFetchImplementation = nextFetch;
  cachedGeneratedContentPromise = Promise.all([
    fetchGeneratedJson<GeneratedBriefingsIndex>(GENERATED_BRIEFINGS_INDEX_PATH, nextFetch),
    fetchGeneratedJson<GeneratedAudioIndex>(GENERATED_AUDIO_INDEX_PATH, nextFetch)
  ])
    .then(([briefingsIndex, audioIndex]) => {
      const nextSources = {
        briefingsIndex,
        audioIndex
      } satisfies GeneratedContentSources;

      cachedGeneratedContentSources = nextSources;
      notifyGeneratedContentListeners();
      return nextSources;
    })
    .catch((error) => {
      cachedGeneratedContentPromise = null;
      throw error;
    });

  return cachedGeneratedContentPromise;
}

export async function loadDayData(
  date: string,
  dataSources?: GeneratedContentSources,
  fetchImpl?: typeof fetch
): Promise<GeneratedDayRecord> {
  const resolvedSources = await ensureGeneratedContentSources(dataSources, fetchImpl);

  if (!resolvedSources.briefingsIndex.byDate[date]) {
    throw new Error(`No generated day payload is indexed for ${date}.`);
  }

  const cachedDayRecord = getCachedDayRecord(date, resolvedSources);

  if (cachedDayRecord) {
    return cachedDayRecord;
  }

  const existingPromise = cachedDayRecordPromises.get(date);

  if (existingPromise) {
    return existingPromise;
  }

  const nextFetch = getFetchImplementation(fetchImpl);
  cachedFetchImplementation = nextFetch;
  const nextPromise = fetchGeneratedJson<GeneratedDayRecord>(
    `${GENERATED_BRIEFINGS_DIRECTORY_PATH}/${date}.json`,
    nextFetch
  )
    .then((dayRecord) => {
      cachedDayRecords.set(date, dayRecord);
      cachedDayRecordPromises.delete(date);
      notifyGeneratedContentListeners();
      return dayRecord;
    })
    .catch((error) => {
      cachedDayRecordPromises.delete(date);
      throw error;
    });

  cachedDayRecordPromises.set(date, nextPromise);
  return nextPromise;
}

export async function loadInsightById(
  insightId: string,
  dataSources?: GeneratedContentSources,
  fetchImpl?: typeof fetch
) {
  const resolvedSources = await ensureGeneratedContentSources(dataSources, fetchImpl);
  const insightDate = getInsightDateLookup(resolvedSources).get(insightId);

  if (!insightDate) {
    return null;
  }

  await loadDayData(insightDate, resolvedSources, fetchImpl);
  return getInsightById(insightId, resolvedSources);
}

export async function loadAllInsights(
  dataSources?: GeneratedContentSources,
  fetchImpl?: typeof fetch
) {
  const resolvedSources = await ensureGeneratedContentSources(dataSources, fetchImpl);

  await Promise.all(
    resolvedSources.briefingsIndex.availableDates.map((date) => loadDayData(date, resolvedSources, fetchImpl))
  );

  return getAllInsights(resolvedSources);
}

export function subscribeGeneratedContentUpdates(listener: () => void) {
  generatedContentListeners.add(listener);

  return () => {
    generatedContentListeners.delete(listener);
  };
}

export function primeGeneratedContentSources(dataSources: GeneratedContentSources) {
  cachedGeneratedContentSources = dataSources;
  cachedGeneratedContentPromise = Promise.resolve(dataSources);
  hydrateCachedDayRecords(dataSources);
  notifyGeneratedContentListeners();
}

export function resetGeneratedContentSources() {
  cachedGeneratedContentSources = null;
  cachedGeneratedContentPromise = null;
  cachedDayRecords = new Map<string, GeneratedDayRecord>();
  cachedDayRecordPromises = new Map<string, Promise<GeneratedDayRecord>>();
  cachedFetchImplementation = null;
  generatedContentListeners.clear();
}

export function getAvailableBriefingDates(dataSources?: GeneratedContentSources) {
  return requireGeneratedContentSources(dataSources).briefingsIndex.availableDates;
}

export function getLatestBriefingDate(dataSources?: GeneratedContentSources) {
  return requireGeneratedContentSources(dataSources).briefingsIndex.availableDates[0] ?? null;
}

export function getResolvedBriefingDate(
  requestedDate?: string,
  dataSources?: GeneratedContentSources
) {
  return resolveBriefingDate(requestedDate, requireGeneratedContentSources(dataSources));
}

export function getInsightDateById(insightId: string, dataSources?: GeneratedContentSources) {
  return getInsightDateLookup(requireGeneratedContentSources(dataSources)).get(insightId) ?? null;
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
  const requestedDateWasUnavailable = Boolean(
    requestedDate && !resolvedSources.briefingsIndex.byDate[requestedDate]
  );

  if (!resolvedDate) {
    return {
      requestedDate,
      resolvedDate: null,
      requestedDateWasUnavailable,
      missingAudio: false,
      pageData: null
    };
  }

  const pageData = createDailyBriefPageData(resolvedDate, resolvedSources);
  const resolvedAudio = resolvedSources.audioIndex[resolvedDate];

  return {
    requestedDate,
    resolvedDate,
    requestedDateWasUnavailable,
    missingAudio: !resolvedAudio,
    pageData
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
  return getAllInsightsForSources(requireGeneratedContentSources(dataSources)).find(
    (insight) => insight.id === insightId
  ) ?? null;
}
