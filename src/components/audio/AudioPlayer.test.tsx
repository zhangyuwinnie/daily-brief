// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "../../lib/analytics";
import { AudioPlayer } from "./AudioPlayer";
import type { DailyAudio } from "../../types/models";

vi.mock("../../lib/analytics", () => ({
  trackEvent: vi.fn()
}));

const readyAudio: DailyAudio = {
  id: "audio-2026-03-21",
  briefingDate: "2026-03-21",
  status: "ready",
  provider: "notebooklm",
  title: "Daily Brief for 2026-03-21",
  audioUrl: "/generated/audio/2026-03-21.mp3",
  durationSec: 120
};

let container: HTMLDivElement;
let root: Root;

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderAudioPlayer(data: DailyAudio) {
  act(() => {
    root.render(<AudioPlayer data={data} />);
  });
}

function queryPlayButton() {
  const button = container.querySelector("button");

  if (!button) {
    throw new Error("Expected audio player button to exist.");
  }

  return button as HTMLButtonElement;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(trackEvent).mockClear();

  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function play(this: HTMLMediaElement) {
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function pause(this: HTMLMediaElement) {
    this.dispatchEvent(new Event("pause"));
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe("AudioPlayer", () => {
  it("renders a real audio element and playback controls when the daily audio is ready", () => {
    renderAudioPlayer(readyAudio);

    const playButton = queryPlayButton();
    const audioElement = container.querySelector("audio");

    expect(audioElement).not.toBeNull();
    expect(audioElement?.getAttribute("src")).toBe("/generated/audio/2026-03-21.mp3");
    expect(playButton.disabled).toBe(false);
    expect(playButton.getAttribute("aria-label")).toBe("Play deep dive podcast");
    expect(container.textContent).toContain("00:00 / 02:00");
  });

  it("uses the underlying audio element for play, pause, and progress updates instead of simulated progress", () => {
    renderAudioPlayer(readyAudio);

    const playButton = queryPlayButton();
    const audioElement = container.querySelector("audio");

    if (!(audioElement instanceof HTMLAudioElement)) {
      throw new Error("Expected audio element to exist for ready audio.");
    }

    act(() => {
      playButton.click();
    });

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({
      event: "audio_play",
      category: "audio",
      label: "audio-2026-03-21"
    });
    expect(playButton.getAttribute("aria-label")).toBe("Pause deep dive podcast");

    Object.defineProperty(audioElement, "currentTime", {
      configurable: true,
      value: 45,
      writable: true
    });

    act(() => {
      audioElement.dispatchEvent(new Event("timeupdate"));
    });

    expect(container.textContent).toContain("00:45 / 02:00");

    act(() => {
      playButton.click();
    });

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    expect(playButton.getAttribute("aria-label")).toBe("Play deep dive podcast");
  });

  it("disables playback and shows 'Playback unavailable' when audio element fires an error event", () => {
    renderAudioPlayer(readyAudio);

    const playButton = queryPlayButton();
    const audioElement = container.querySelector("audio");

    expect(audioElement).not.toBeNull();
    expect(playButton.disabled).toBe(false);

    act(() => {
      audioElement!.dispatchEvent(new Event("error"));
    });

    expect(playButton.disabled).toBe(true);
    expect(container.textContent).toContain("Playback unavailable");
  });

  it("keeps playback disabled when audio is still pending or metadata is incomplete", () => {
    renderAudioPlayer({
      ...readyAudio,
      status: "pending",
      audioUrl: undefined,
      durationSec: undefined
    });

    expect(queryPlayButton().disabled).toBe(true);
    expect(container.querySelector("audio")).toBeNull();
    expect(container.textContent).toContain("Generating...");

    renderAudioPlayer({
      ...readyAudio,
      audioUrl: undefined
    });

    expect(queryPlayButton().disabled).toBe(true);
    expect(container.querySelector("audio")).toBeNull();
    expect(container.textContent).toContain("Ready");
  });
});
