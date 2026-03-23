import { describe, expect, it } from "vitest";
import { getAllInsights } from "./briefings/generatedContentLoader";
import {
  INSIGHT_STATE_STORAGE_KEY,
  deriveBuildQueueFromInsightStates,
  readInsightStates,
  saveInsightForBuild,
  writeInsightStates
} from "./insightStateStore";
import type { InsightState } from "../types/models";

type MemoryStorage = {
  dump: () => Record<string, string>;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

function createMemoryStorage(initialEntries: Record<string, string> = {}): MemoryStorage {
  const storage = { ...initialEntries };

  return {
    dump: () => ({ ...storage }),
    getItem: (key) => storage[key] ?? null,
    removeItem: (key) => {
      delete storage[key];
    },
    setItem: (key, value) => {
      storage[key] = value;
    }
  };
}

function createInsightState(overrides: Partial<InsightState> = {}): InsightState {
  return {
    insightId: "insight-1",
    status: "Inbox",
    skillFocus: "agents",
    note: "Test note",
    personalTakeaway: "Test takeaway",
    createdAt: "2026-03-20T12:00:00.000Z",
    lastTouchedAt: "2026-03-20T12:00:00.000Z",
    ...overrides
  };
}

describe("insightStateStore", () => {
  it("returns an empty list when no saved state exists", () => {
    expect(readInsightStates(createMemoryStorage())).toEqual([]);
  });

  it("writes and reads versioned insight state under one stable key", () => {
    const storage = createMemoryStorage();
    const states = [
      createInsightState(),
      createInsightState({
        insightId: "insight-2",
        status: "Interested",
        skillFocus: "rag",
        note: undefined
      })
    ];

    writeInsightStates(states, storage);

    expect(storage.dump()).toEqual({
      [INSIGHT_STATE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        items: states
      })
    });
    expect(readInsightStates(storage)).toEqual(states);
  });

  it("upserts one saved record per insight instead of creating duplicates", () => {
    const initialStates = [
      createInsightState({
        insightId: "insight-1",
        note: "Original note",
        skillFocus: "agents"
      })
    ];

    const nextStates = saveInsightForBuild(
      initialStates,
      {
        insightId: "insight-1",
        note: "Updated note",
        skillFocus: "security"
      },
      "2026-03-21T08:30:00.000Z"
    );

    expect(nextStates).toHaveLength(1);
    expect(nextStates[0]).toMatchObject({
      insightId: "insight-1",
      status: "Inbox",
      note: "Updated note",
      skillFocus: "security",
      createdAt: initialStates[0].createdAt,
      lastTouchedAt: "2026-03-21T08:30:00.000Z"
    });
  });

  it("derives persisted build queue items from saved state plus generated insights", () => {
    const [firstInsight, secondInsight] = getAllInsights();
    const states: InsightState[] = [
      createInsightState({
        insightId: secondInsight.id,
        status: "Interested",
        skillFocus: "security",
        note: "Watch this first",
        createdAt: "2026-03-21T10:00:00.000Z",
        lastTouchedAt: "2026-03-21T10:00:00.000Z"
      }),
      createInsightState({
        insightId: firstInsight.id,
        status: "Inbox",
        skillFocus: "rag",
        note: undefined,
        createdAt: "2026-03-20T09:00:00.000Z",
        lastTouchedAt: "2026-03-20T09:00:00.000Z"
      })
    ];

    expect(deriveBuildQueueFromInsightStates(states, getAllInsights())).toEqual([
      {
        id: secondInsight.id,
        insight: secondInsight,
        skillFocus: "security",
        note: "Watch this first",
        status: "Interested",
        addedAt: "Mar 21"
      },
      {
        id: firstInsight.id,
        insight: firstInsight,
        skillFocus: "rag",
        note: "",
        status: "Inbox",
        addedAt: "Mar 20"
      }
    ]);
  });

  it("resets invalid saved payloads safely", () => {
    const storage = createMemoryStorage({
      [INSIGHT_STATE_STORAGE_KEY]: "{not-json"
    });

    expect(readInsightStates(storage)).toEqual([]);
    expect(storage.dump()).toEqual({});
  });

  it("resets structurally invalid saved payloads safely", () => {
    const storage = createMemoryStorage({
      [INSIGHT_STATE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        items: [
          {
            insightId: "insight-1",
            status: "Unknown"
          }
        ]
      })
    });

    expect(readInsightStates(storage)).toEqual([]);
    expect(storage.dump()).toEqual({});
  });
});
