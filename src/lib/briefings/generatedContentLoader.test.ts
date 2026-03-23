import { describe, expect, it } from "vitest";
import audioIndexJson from "../../generated/audio-index.json";
import briefingsByDateJson from "../../generated/briefings-by-date.json";
import briefingsIndexJson from "../../generated/briefings-index.json";
import {
  getAvailableBriefingDates,
  getDailyBriefPageData,
  getDailyBriefPageState,
  getInsightById,
  getLatestBriefingDate,
  resolveDailyBriefPageState
} from "./generatedContentLoader";
import type {
  GeneratedAudioIndex,
  GeneratedBriefingsByDate,
  GeneratedBriefingsIndex
} from "./generatedArtifacts";

const briefingsIndex = briefingsIndexJson as GeneratedBriefingsIndex;
const briefingsByDate = briefingsByDateJson as GeneratedBriefingsByDate;
const audioIndex = audioIndexJson as GeneratedAudioIndex;

describe("generatedContentLoader", () => {
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

  it("returns one insight by id and null for unknown ids", () => {
    const latestDate = briefingsIndex.availableDates[0];
    const expectedInsight = briefingsByDate[latestDate].insights[0];

    expect(getInsightById(expectedInsight.id)).toEqual(expectedInsight);
    expect(getInsightById("missing-insight-id")).toBeNull();
  });
});
