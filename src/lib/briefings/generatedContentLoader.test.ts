import { describe, expect, it } from "vitest";
import audioIndexJson from "../../generated/audio-index.json";
import briefingsByDateJson from "../../generated/briefings-by-date.json";
import briefingsIndexJson from "../../generated/briefings-index.json";
import {
  getAvailableBriefingDates,
  getDailyBriefPageData,
  getInsightById,
  getLatestBriefingDate
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

  it("returns one insight by id and null for unknown ids", () => {
    const latestDate = briefingsIndex.availableDates[0];
    const expectedInsight = briefingsByDate[latestDate].insights[0];

    expect(getInsightById(expectedInsight.id)).toEqual(expectedInsight);
    expect(getInsightById("missing-insight-id")).toBeNull();
  });
});
