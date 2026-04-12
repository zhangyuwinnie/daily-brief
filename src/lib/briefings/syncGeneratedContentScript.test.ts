import { describe, expect, it } from "vitest";
import { resolveSyncGeneratedContentPaths } from "../../../scripts/sync-generated-content";

describe("sync-generated-content script", () => {
  it("defaults BRIEFINGS_DIR to the repo-local briefings directory", () => {
    const paths = resolveSyncGeneratedContentPaths({
      repoRoot: "/tmp/daily-brief-repo",
      env: {}
    });

    expect(paths.inputDir).toBe("/tmp/daily-brief-repo/briefings");
    expect(paths.outputDir).toBe("/tmp/daily-brief-repo/public/generated");
    expect(paths.audioDir).toBe("/tmp/daily-brief-repo/public/generated/audio");
  });

  it("respects environment overrides when they are provided", () => {
    const paths = resolveSyncGeneratedContentPaths({
      repoRoot: "/tmp/daily-brief-repo",
      env: {
        BRIEFINGS_DIR: "/tmp/custom-briefings",
        GENERATED_CONTENT_DIR: "/tmp/custom-generated",
        GENERATED_AUDIO_DIR: "/tmp/custom-audio"
      }
    });

    expect(paths).toEqual({
      inputDir: "/tmp/custom-briefings",
      outputDir: "/tmp/custom-generated",
      audioDir: "/tmp/custom-audio"
    });
  });
});
