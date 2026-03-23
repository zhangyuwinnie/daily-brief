import type { BuildItem, BuildStatus, Insight, InsightState, SkillFocus } from "../types/models";

export const INSIGHT_STATE_STORAGE_KEY = "daily-brief:insight-state:v1";

const INSIGHT_STATE_STORAGE_VERSION = 1;
const buildQueueDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC"
});
const VALID_BUILD_STATUSES: ReadonlySet<BuildStatus> = new Set([
  "Inbox",
  "Interested",
  "Building",
  "Learned",
  "Archived"
]);
const VALID_SKILL_FOCI: ReadonlySet<SkillFocus> = new Set([
  "agents",
  "evals",
  "rag",
  "tooling",
  "security"
]);

type PersistedInsightStateEnvelope = {
  version: number;
  items: InsightState[];
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type SaveInsightForBuildInput = {
  insightId: string;
  note?: string;
  personalTakeaway?: string;
  skillFocus: SkillFocus;
};

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function resetInvalidSavedState(storage: StorageLike | null) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(INSIGHT_STATE_STORAGE_KEY);
  } catch {
    // Ignore storage reset failures so the app can still render with an empty state.
  }
}

function isInsightState(candidate: unknown): candidate is InsightState {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const value = candidate as Partial<InsightState>;

  return (
    typeof value.insightId === "string" &&
    VALID_BUILD_STATUSES.has(value.status as BuildStatus) &&
    (value.skillFocus === undefined || VALID_SKILL_FOCI.has(value.skillFocus)) &&
    (value.note === undefined || typeof value.note === "string") &&
    (value.personalTakeaway === undefined || typeof value.personalTakeaway === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.lastTouchedAt === "string"
  );
}

function formatBuildQueueDate(timestamp: string) {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return buildQueueDateFormatter.format(parsedDate);
}

function getNextStatusForSavedBuild(existingState?: InsightState): BuildStatus {
  if (!existingState) {
    return "Inbox";
  }

  if (existingState.status === "Learned" || existingState.status === "Archived") {
    return "Inbox";
  }

  return existingState.status;
}

export function inferSkillFocusFromInsight(insight: Insight): SkillFocus {
  const normalizedTopics = insight.topics.map((topic) => topic.toLowerCase());

  if (normalizedTopics.includes("security")) {
    return "security";
  }

  if (normalizedTopics.includes("evals")) {
    return "evals";
  }

  if (normalizedTopics.includes("rag") || normalizedTopics.includes("retrieval")) {
    return "rag";
  }

  if (normalizedTopics.includes("tooling")) {
    return "tooling";
  }

  return "agents";
}

export function readInsightStates(storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) {
    return [];
  }

  const savedValue = storage.getItem(INSIGHT_STATE_STORAGE_KEY);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<PersistedInsightStateEnvelope>;

    if (
      parsedValue.version !== INSIGHT_STATE_STORAGE_VERSION ||
      !Array.isArray(parsedValue.items) ||
      !parsedValue.items.every(isInsightState)
    ) {
      resetInvalidSavedState(storage);
      return [];
    }

    return parsedValue.items;
  } catch {
    resetInvalidSavedState(storage);
    return [];
  }
}

export function writeInsightStates(
  insightStates: InsightState[],
  storage: StorageLike | null = getBrowserStorage()
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      INSIGHT_STATE_STORAGE_KEY,
      JSON.stringify({
        version: INSIGHT_STATE_STORAGE_VERSION,
        items: insightStates
      } satisfies PersistedInsightStateEnvelope)
    );
  } catch {
    // Ignore storage write failures and keep the in-memory state alive for the current session.
  }
}

export function saveInsightForBuild(
  insightStates: InsightState[],
  input: SaveInsightForBuildInput,
  now: string = new Date().toISOString()
) {
  const existingState = insightStates.find((state) => state.insightId === input.insightId);
  const nextState: InsightState = {
    insightId: input.insightId,
    status: getNextStatusForSavedBuild(existingState),
    skillFocus: input.skillFocus,
    note: normalizeOptionalString(input.note),
    personalTakeaway: normalizeOptionalString(input.personalTakeaway) ?? existingState?.personalTakeaway,
    createdAt: existingState?.createdAt ?? now,
    lastTouchedAt: now
  };

  return [nextState, ...insightStates.filter((state) => state.insightId !== input.insightId)];
}

export function updateInsightStateStatus(
  insightStates: InsightState[],
  insightId: string,
  status: BuildStatus,
  now: string = new Date().toISOString()
) {
  return insightStates.map((state) =>
    state.insightId === insightId
      ? {
          ...state,
          status,
          lastTouchedAt: now
        }
      : state
  );
}

export function deriveBuildQueueFromInsightStates(insightStates: InsightState[], insights: Insight[]) {
  const insightsById = new Map(insights.map((insight) => [insight.id, insight] as const));

  return [...insightStates]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .flatMap((state): BuildItem[] => {
      const insight = insightsById.get(state.insightId);

      if (!insight) {
        return [];
      }

      return [
        {
          id: state.insightId,
          insight,
          skillFocus: state.skillFocus ?? inferSkillFocusFromInsight(insight),
          note: state.note ?? "",
          status: state.status,
          addedAt: formatBuildQueueDate(state.createdAt)
        }
      ];
    });
}
