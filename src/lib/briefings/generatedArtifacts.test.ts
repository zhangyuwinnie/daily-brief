import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import rssNormal from "./fixtures/rss-normal.md?raw";
import xNormal from "./fixtures/x-normal.md?raw";
import { buildGeneratedArtifacts, validateGeneratedArtifacts, writeGeneratedArtifacts } from "./generatedArtifacts";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function rewriteXDate(text: string, date: string) {
  return text.replace(/^#\s+🐦\s+X Morning Briefing - \d{4}-\d{2}-\d{2}/m, `# 🐦 X Morning Briefing - ${date}`);
}

describe("generatedArtifacts", () => {
  it("builds the three locked artifact shapes from mixed RSS and X briefings", async () => {
    const artifacts = buildGeneratedArtifacts({
      briefingInputs: [
        {
          filePath: "/tmp/2026-03-20.md",
          text: rssNormal
        },
        {
          filePath: "/tmp/x_briefing_2026-03-20.md",
          text: rewriteXDate(xNormal, "2026-03-20")
        }
      ],
      audioFilePaths: []
    });

    expect(artifacts.briefingsIndex.availableDates).toEqual(["2026-03-20"]);
    expect(artifacts.briefingsIndex.byDate["2026-03-20"]).toEqual({
      briefingIds: ["rss-2026-03-20", "x-2026-03-20"],
      insightIds: artifacts.briefingsByDate["2026-03-20"].insights.map((insight) => insight.id),
      hasAudio: false,
      sourceTypes: ["rss", "x"]
    });

    expect(artifacts.briefingsByDate["2026-03-20"]).toMatchObject({
      date: "2026-03-20",
      briefings: [
        {
          id: "rss-2026-03-20",
          sourceType: "rss",
          filePath: "2026-03-20.md"
        },
        {
          id: "x-2026-03-20",
          sourceType: "x",
          filePath: "x_briefing_2026-03-20.md"
        }
      ],
      xToplines: expect.any(Array),
      xActionItems: expect.any(Array)
    });
    expect(artifacts.briefingsByDate["2026-03-20"].insights.some((insight) => insight.sourceType === "rss")).toBe(true);
    expect(artifacts.briefingsByDate["2026-03-20"].insights.some((insight) => insight.sourceType === "x")).toBe(true);

    expect(artifacts.audioIndex["2026-03-20"]).toMatchObject({
      id: "audio-2026-03-20",
      briefingDate: "2026-03-20",
      status: "pending",
      provider: "notebooklm",
      title: "Daily Brief for 2026-03-20"
    });

    const outputDir = await mkdtemp(join(tmpdir(), "generated-artifacts-"));
    await writeGeneratedArtifacts(artifacts, outputDir);

    const briefingsIndex = JSON.parse(await readFile(join(outputDir, "briefings-index.json"), "utf8"));
    const briefingsByDate = JSON.parse(await readFile(join(outputDir, "briefings-by-date.json"), "utf8"));
    const audioIndex = JSON.parse(await readFile(join(outputDir, "audio-index.json"), "utf8"));
    const singleDayRecord = JSON.parse(
      await readFile(join(outputDir, "briefings", "2026-03-20.json"), "utf8")
    );

    expect(briefingsIndex.availableDates).toEqual(["2026-03-20"]);
    expect(briefingsByDate["2026-03-20"].briefings).toHaveLength(2);
    expect(audioIndex["2026-03-20"].status).toBe("pending");
    expect(singleDayRecord).toEqual(briefingsByDate["2026-03-20"]);
  });

  it("marks audio ready when a matching generated audio file exists", () => {
    const artifacts = buildGeneratedArtifacts({
      briefingInputs: [
        {
          filePath: "/tmp/2026-03-20.md",
          text: rssNormal
        }
      ],
      audioFilePaths: ["/tmp/public/generated/audio/2026-03-20.mp3"]
    });

    expect(artifacts.audioIndex["2026-03-20"]).toMatchObject({
      status: "ready",
      audioUrl: "/generated/audio/2026-03-20.mp3",
      provider: "notebooklm"
    });
  });

  it("fails loudly for inconsistent generated artifact shapes", () => {
    const artifacts = buildGeneratedArtifacts({
      briefingInputs: [
        {
          filePath: "/tmp/2026-03-20.md",
          text: rssNormal
        }
      ],
      audioFilePaths: []
    });

    const missingDay = clone(artifacts);
    delete missingDay.briefingsByDate["2026-03-20"];
    expect(() => validateGeneratedArtifacts(missingDay)).toThrow(/availableDates.*2026-03-20/i);

    const mismatchedAudioDate = clone(artifacts);
    mismatchedAudioDate.audioIndex["2026-03-20"].briefingDate = "2026-03-19";
    expect(() => validateGeneratedArtifacts(mismatchedAudioDate)).toThrow(/audio-index\.json.*2026-03-20/i);

    const invalidAudioUrl = clone(artifacts);
    invalidAudioUrl.audioIndex["2026-03-20"] = {
      ...invalidAudioUrl.audioIndex["2026-03-20"],
      status: "ready",
      audioUrl: "https://example.com/audio.mp3"
    };
    expect(() => validateGeneratedArtifacts(invalidAudioUrl)).toThrow(/audioUrl/i);

    const emptyDay = clone(artifacts);
    emptyDay.briefingsByDate["2026-03-20"] = {
      ...emptyDay.briefingsByDate["2026-03-20"],
      briefings: [],
      insights: []
    };
    expect(() => validateGeneratedArtifacts(emptyDay)).toThrow(/lacks both `briefings` and `insights`/i);
  });
});
