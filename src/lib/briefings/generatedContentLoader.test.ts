import { describe, expect, it, vi } from "vitest";
import {
  getAvailableBriefingDates,
  getAvailableTopics,
  getAllInsights,
  getDailyBriefPageData,
  getDailyBriefPageState,
  getInsightById,
  getLatestBriefingDate,
  loadGeneratedContentSources,
  primeGeneratedContentSources,
  resetGeneratedContentSources,
  resolveDailyBriefPageState
} from "./generatedContentLoader";
import { generatedContentFixture } from "../../test/generatedContentFixture";

const { briefingsIndex, briefingsByDate, audioIndex } = generatedContentFixture;

describe("generatedContentLoader", () => {
  it("loads generated content from runtime public JSON endpoints and reuses the cached result", async () => {
    resetGeneratedContentSources();
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith("/generated/briefings-index.json")) {
        return {
          ok: true,
          json: async () => briefingsIndex
        };
      }

      if (url.endsWith("/generated/briefings-by-date.json")) {
        return {
          ok: true,
          json: async () => briefingsByDate
        };
      }

      if (url.endsWith("/generated/audio-index.json")) {
        return {
          ok: true,
          json: async () => audioIndex
        };
      }

      throw new Error(`Unexpected fetch request: ${url}`);
    });

    const firstLoad = await loadGeneratedContentSources(fetchMock as unknown as typeof fetch);
    const secondLoad = await loadGeneratedContentSources(fetchMock as unknown as typeof fetch);

    expect(firstLoad).toEqual(generatedContentFixture);
    expect(secondLoad).toBe(firstLoad);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "/generated/briefings-index.json",
      "/generated/briefings-by-date.json",
      "/generated/audio-index.json"
    ]);

    primeGeneratedContentSources(generatedContentFixture);
  });

  it("returns the available briefing dates from the generated index", () => {
    expect(getAvailableBriefingDates()).toEqual(briefingsIndex.availableDates);
  });

  it("returns the latest available date from the generated index", () => {
    expect(getLatestBriefingDate()).toBe(briefingsIndex.availableDates[0]);
  });

  it("returns explicit day payloads with typed audio when the selected date exists", () => {
    const selectedDate = briefingsIndex.availableDates[1];
    const day = briefingsByDate[selectedDate];

    expect(getDailyBriefPageData(selectedDate)).toEqual({
      date: selectedDate,
      availableDates: briefingsIndex.availableDates,
      briefings: day.briefings,
      insights: day.insights,
      audio: audioIndex[selectedDate]
    });
  });

  it("falls back to the latest day when the selected date is missing or omitted", () => {
    const latestDate = briefingsIndex.availableDates[0];
    const latestDay = briefingsByDate[latestDate];

    expect(getDailyBriefPageData("1900-01-01")).toEqual({
      date: latestDate,
      availableDates: briefingsIndex.availableDates,
      briefings: latestDay.briefings,
      insights: latestDay.insights,
      audio: audioIndex[latestDate]
    });

    expect(getDailyBriefPageData()).toEqual({
      date: latestDate,
      availableDates: briefingsIndex.availableDates,
      briefings: latestDay.briefings,
      insights: latestDay.insights,
      audio: audioIndex[latestDate]
    });
  });

  it("reports when a requested date is unavailable and the loader falls back", () => {
    const latestDate = briefingsIndex.availableDates[0];

    expect(getDailyBriefPageState("1900-01-01")).toMatchObject({
      requestedDate: "1900-01-01",
      resolvedDate: latestDate,
      requestedDateWasUnavailable: true,
      missingAudio: false,
      pageData: {
        date: latestDate
      }
    });
  });

  it("returns an explicit empty state when no generated dates exist", () => {
    expect(
      resolveDailyBriefPageState(undefined, {
        briefingsIndex: {
          availableDates: [],
          byDate: {}
        },
        briefingsByDate: {},
        audioIndex: {}
      })
    ).toEqual({
      requestedDate: undefined,
      resolvedDate: null,
      requestedDateWasUnavailable: false,
      missingAudio: false,
      pageData: null
    });
  });

  it("keeps the requested-date-unavailable flag when no generated dates exist", () => {
    expect(
      resolveDailyBriefPageState("1900-01-01", {
        briefingsIndex: {
          availableDates: [],
          byDate: {}
        },
        briefingsByDate: {},
        audioIndex: {}
      })
    ).toEqual({
      requestedDate: "1900-01-01",
      resolvedDate: null,
      requestedDateWasUnavailable: true,
      missingAudio: false,
      pageData: null
    });
  });

  it("returns a null page payload when the resolved latest date is missing its generated day record", () => {
    const selectedDate = "2026-03-20";

    expect(
      resolveDailyBriefPageState(undefined, {
        briefingsIndex: {
          availableDates: [selectedDate],
          byDate: {
            [selectedDate]: {
              briefingIds: ["briefing-1"],
              insightIds: ["insight-1"],
              hasAudio: true,
              sourceTypes: ["rss"]
            }
          }
        },
        briefingsByDate: {},
        audioIndex: {
          [selectedDate]: {
            id: "audio-2026-03-20",
            briefingDate: selectedDate,
            status: "ready",
            provider: "manual",
            audioUrl: "/generated/audio/2026-03-20.wav"
          }
        }
      })
    ).toEqual({
      requestedDate: undefined,
      resolvedDate: selectedDate,
      requestedDateWasUnavailable: false,
      missingAudio: false,
      pageData: null
    });
  });

  it("reports when a resolved day has no audio record", () => {
    const selectedDate = "2026-03-20";

    expect(
      resolveDailyBriefPageState(selectedDate, {
        briefingsIndex: {
          availableDates: [selectedDate],
          byDate: {
            [selectedDate]: {
              briefingIds: ["briefing-1"],
              insightIds: ["insight-1"],
              hasAudio: false,
              sourceTypes: ["rss"]
            }
          }
        },
        briefingsByDate: {
          [selectedDate]: {
            date: selectedDate,
            briefings: [
              {
                id: "briefing-1",
                date: selectedDate,
                sourceType: "rss",
                title: "Test Briefing",
                filePath: "/tmp/test.md",
                insightIds: ["insight-1"]
              }
            ],
            insights: [
              {
                id: "insight-1",
                briefingId: "briefing-1",
                date: selectedDate,
                sourceType: "rss",
                sourceLabel: "RSS",
                title: "Test Insight",
                summary: "Summary",
                take: "Take",
                topics: ["agents"],
                entities: [],
                isTopSignal: true
              }
            ]
          }
        },
        audioIndex: {}
      })
    ).toMatchObject({
      requestedDate: selectedDate,
      resolvedDate: selectedDate,
      requestedDateWasUnavailable: false,
      missingAudio: true,
      pageData: {
        date: selectedDate,
        audio: undefined
      }
    });
  });

  it("passes through failed audio records without collapsing them into a missing-audio state", () => {
    const selectedDate = "2026-03-20";

    expect(
      resolveDailyBriefPageState(selectedDate, {
        briefingsIndex: {
          availableDates: [selectedDate],
          byDate: {
            [selectedDate]: {
              briefingIds: ["briefing-1"],
              insightIds: ["insight-1"],
              hasAudio: false,
              sourceTypes: ["rss"]
            }
          }
        },
        briefingsByDate: {
          [selectedDate]: {
            date: selectedDate,
            briefings: [
              {
                id: "briefing-1",
                date: selectedDate,
                sourceType: "rss",
                title: "Test Briefing",
                filePath: "/tmp/test.md",
                insightIds: ["insight-1"]
              }
            ],
            insights: [
              {
                id: "insight-1",
                briefingId: "briefing-1",
                date: selectedDate,
                sourceType: "rss",
                sourceLabel: "RSS",
                title: "Test Insight",
                summary: "Summary",
                take: "Take",
                topics: ["Agents"],
                entities: [],
                isTopSignal: true
              }
            ]
          }
        },
        audioIndex: {
          [selectedDate]: {
            id: "audio-2026-03-20",
            briefingDate: selectedDate,
            status: "failed",
            provider: "notebooklm",
            title: "Daily Brief for 2026-03-20",
            errorMessage: "provider returned no audio file"
          }
        }
      })
    ).toMatchObject({
      requestedDate: selectedDate,
      resolvedDate: selectedDate,
      requestedDateWasUnavailable: false,
      missingAudio: false,
      pageData: {
        date: selectedDate,
        audio: {
          status: "failed",
          errorMessage: "provider returned no audio file"
        }
      }
    });
  });

  it("passes through ready audio records even when the URL is missing so the UI can fail visibly", () => {
    const selectedDate = "2026-03-20";

    const pageState = resolveDailyBriefPageState(selectedDate, {
      briefingsIndex: {
        availableDates: [selectedDate],
        byDate: {
          [selectedDate]: {
            briefingIds: ["briefing-1"],
            insightIds: ["insight-1"],
            hasAudio: true,
            sourceTypes: ["rss"]
          }
        }
      },
      briefingsByDate: {
        [selectedDate]: {
          date: selectedDate,
          briefings: [
            {
              id: "briefing-1",
              date: selectedDate,
              sourceType: "rss",
              title: "Test Briefing",
              filePath: "/tmp/test.md",
              insightIds: ["insight-1"]
            }
          ],
          insights: [
            {
              id: "insight-1",
              briefingId: "briefing-1",
              date: selectedDate,
              sourceType: "rss",
              sourceLabel: "RSS",
              title: "Test Insight",
              summary: "Summary",
              take: "Take",
              topics: ["Agents"],
              entities: [],
              isTopSignal: true
            }
          ]
        }
      },
      audioIndex: {
        [selectedDate]: {
          id: "audio-2026-03-20",
          briefingDate: selectedDate,
          status: "ready",
          provider: "notebooklm",
          title: "Daily Brief for 2026-03-20"
        }
      }
    });

    expect(pageState).toMatchObject({
      requestedDate: selectedDate,
      resolvedDate: selectedDate,
      requestedDateWasUnavailable: false,
      missingAudio: false,
      pageData: {
        date: selectedDate,
        audio: {
          status: "ready"
        }
      }
    });
    expect(pageState.pageData?.audio ? "audioUrl" in pageState.pageData.audio : false).toBe(false);
  });

  it("returns one insight by id and null for unknown ids", () => {
    const latestDate = briefingsIndex.availableDates[0];
    const expectedInsight = briefingsByDate[latestDate].insights[0];

    expect(getInsightById(expectedInsight.id)).toEqual(expectedInsight);
    expect(getInsightById("missing-insight-id")).toBeNull();
  });

  it("returns all generated insights in available-date order", () => {
    const expectedInsights = briefingsIndex.availableDates.flatMap(
      (date) => briefingsByDate[date]?.insights ?? []
    );

    expect(getAllInsights()).toEqual(expectedInsights);
  });

  it("returns topics derived from normalized insights in approved MVP order", () => {
    expect(getAvailableTopics()).toEqual([
      "Agents",
      "Coding Agents",
      "Evals",
      "RAG",
      "Retrieval",
      "Security",
      "Tooling",
      "Learning Resource"
    ]);
  });
});
