// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_PROGRESS_INDEX_KEY,
  buildAudioProgressKey,
  clearAudioProgress,
  readAudioProgress,
  writeAudioProgress
} from "./audioProgressStorage";

describe("audioProgressStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips saved progress for a specific audio item", () => {
    writeAudioProgress({
      audioId: "audio-1",
      briefingDate: "2026-04-27",
      audioUrl: "/generated/audio/2026-04-27.mp3",
      currentTimeSec: 42,
      durationSec: 180,
      updatedAt: 1000
    });

    expect(readAudioProgress("audio-1", 1000)).toEqual({
      audioId: "audio-1",
      briefingDate: "2026-04-27",
      audioUrl: "/generated/audio/2026-04-27.mp3",
      currentTimeSec: 42,
      durationSec: 180,
      updatedAt: 1000
    });
  });

  it("prunes stale indexed entries and removes their orphaned storage keys", () => {
    window.localStorage.setItem(
      AUDIO_PROGRESS_INDEX_KEY,
      JSON.stringify([
        { audioId: "fresh-audio", updatedAt: 30 * 24 * 60 * 60 * 1000 },
        { audioId: "stale-audio", updatedAt: 1 }
      ])
    );
    window.localStorage.setItem(
      buildAudioProgressKey("fresh-audio"),
      JSON.stringify({
        audioId: "fresh-audio",
        briefingDate: "2026-04-27",
        currentTimeSec: 15,
        updatedAt: 30 * 24 * 60 * 60 * 1000
      })
    );
    window.localStorage.setItem(
      buildAudioProgressKey("stale-audio"),
      JSON.stringify({
        audioId: "stale-audio",
        briefingDate: "2026-03-01",
        currentTimeSec: 15,
        updatedAt: 1
      })
    );

    const now = 31 * 24 * 60 * 60 * 1000 + 1;

    expect(readAudioProgress("fresh-audio", now)).toMatchObject({
      audioId: "fresh-audio",
      currentTimeSec: 15
    });
    expect(window.localStorage.getItem(buildAudioProgressKey("stale-audio"))).toBeNull();
    expect(window.localStorage.getItem(AUDIO_PROGRESS_INDEX_KEY)).toContain("fresh-audio");
    expect(window.localStorage.getItem(AUDIO_PROGRESS_INDEX_KEY)).not.toContain("stale-audio");
  });

  it("removes both the per-audio record and index entry when clearing progress", () => {
    writeAudioProgress({
      audioId: "audio-1",
      briefingDate: "2026-04-27",
      currentTimeSec: 42,
      updatedAt: 1000
    });

    clearAudioProgress("audio-1");

    expect(window.localStorage.getItem(buildAudioProgressKey("audio-1"))).toBeNull();
    expect(window.localStorage.getItem(AUDIO_PROGRESS_INDEX_KEY)).toBe("[]");
  });
});
