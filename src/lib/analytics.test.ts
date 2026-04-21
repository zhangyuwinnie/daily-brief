// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics";

function setSendBeacon(sendBeacon: ((url: string, data?: BodyInit | null) => boolean) | undefined) {
  Object.defineProperty(window.navigator, "sendBeacon", {
    configurable: true,
    value: sendBeacon
  });
}

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setSendBeacon(undefined);
});

describe("trackEvent", () => {
  it("sends analytics payloads with sendBeacon when available", async () => {
    const sendBeacon = vi.fn((_url: string, _data?: BodyInit | null) => true);
    const fetch = vi.fn();
    setSendBeacon(sendBeacon);
    vi.stubGlobal("fetch", fetch);

    trackEvent({ event: "card_click", category: "insight_card", label: "insight-1" });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon).toHaveBeenCalledWith("/api/track", expect.any(Blob));
    expect(fetch).not.toHaveBeenCalled();

    const sendBeaconCalls = sendBeacon.mock.calls as Array<[string, BodyInit | null | undefined]>;
    const payloadBlob = sendBeaconCalls[0]?.[1];
    expect(payloadBlob).toBeInstanceOf(Blob);
    expect((payloadBlob as Blob).type).toBe("application/json");
    await expect(readBlob(payloadBlob as Blob)).resolves.toBe(
      JSON.stringify({
        event: "card_click",
        category: "insight_card",
        label: "insight-1",
        page: "/"
      })
    );
  });

  it("falls back to fetch when sendBeacon returns false", () => {
    const sendBeacon = vi.fn((_url: string, _data?: BodyInit | null) => false);
    const fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    setSendBeacon(sendBeacon);
    vi.stubGlobal("fetch", fetch);

    trackEvent({ event: "audio_play", category: "audio", label: "audio-1" });

    expect(fetch).toHaveBeenCalledWith("/api/track", {
      method: "POST",
      body: JSON.stringify({
        event: "audio_play",
        category: "audio",
        label: "audio-1",
        page: "/"
      }),
      headers: { "Content-Type": "application/json" },
      keepalive: true
    });
  });

  it("falls back to fetch when sendBeacon is unavailable", () => {
    const fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    setSendBeacon(undefined);
    vi.stubGlobal("fetch", fetch);

    trackEvent({ event: "card_share", category: "insight_card", label: "insight-2" });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("swallows fetch failures", () => {
    const fetch = vi.fn(() => Promise.reject(new Error("offline")));
    setSendBeacon(undefined);
    vi.stubGlobal("fetch", fetch);

    expect(() => trackEvent({ event: "card_click" })).not.toThrow();
  });
});
