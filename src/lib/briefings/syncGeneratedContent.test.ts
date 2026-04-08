import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import rssNormal from "./fixtures/rss-normal.md?raw";
import { syncGeneratedContent } from "./syncGeneratedContent";

describe("syncGeneratedContent", () => {
  it("publishes matching source audio files from the briefing directory into generated web audio paths", async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), "sync-generated-content-"));
    const inputDir = join(fixtureRoot, "briefings");
    const outputDir = join(fixtureRoot, "public", "generated");
    const audioDir = join(outputDir, "audio");

    await mkdir(inputDir, { recursive: true });
    await mkdir(audioDir, { recursive: true });

    await writeFile(join(inputDir, "2026-03-20.md"), rssNormal);
    await writeFile(join(inputDir, "ai_links_podcast_zh_2026-03-20.mp3"), "zh-audio");
    await writeFile(join(inputDir, "ai_links_2026-03-20_audio_overview (2).mp3"), "duplicate-audio");
    await writeFile(join(inputDir, "ai_links_2026-03-20_audio_overview.mp3"), "english-audio");
    await writeFile(join(audioDir, "2026-03-19.wav"), "stale-audio");

    const result = await syncGeneratedContent({
      inputDir,
      outputDir,
      audioDir
    });

    const publishedAudioFiles = await readdir(audioDir);
    const audioIndex = JSON.parse(await readFile(join(outputDir, "audio-index.json"), "utf8")) as Record<
      string,
      {
        status: string;
        audioUrl?: string;
      }
    >;
    const publishedAudioText = await readFile(join(audioDir, "2026-03-20.mp3"), "utf8");

    expect(result.audioReadyCount).toBe(1);
    expect(publishedAudioFiles).toContain("2026-03-20.mp3");
    expect(publishedAudioFiles).not.toContain("2026-03-19.wav");
    expect(publishedAudioText).toBe("english-audio");
    expect(audioIndex["2026-03-20"]).toMatchObject({
      status: "ready",
      audioUrl: "/generated/audio/2026-03-20.mp3"
    });
  });
});
