import { describe, expect, it, vi } from "vitest";
import { handleTrackRequest, type AnalyticsDataset } from "./trackEndpoint";

function postTrack(body: string) {
  return new Request("https://brief2build.example/api/track", {
    method: "POST",
    body
  });
}

describe("handleTrackRequest", () => {
  it("writes allowed events to Analytics Engine with the locked slot mapping", async () => {
    const writeDataPoint = vi.fn();
    const analytics = { writeDataPoint } satisfies AnalyticsDataset;
    vi.spyOn(Date, "now").mockReturnValue(1_765_000_000_000);

    const response = await handleTrackRequest(
      postTrack(
        JSON.stringify({
          event: "card_click",
          category: "insight_card",
          label: "insight-1",
          page: "/today"
        })
      ),
      { ANALYTICS: analytics }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["card_click", "insight_card", "insight-1", "/today"],
      doubles: [1_765_000_000_000],
      indexes: ["card_click"]
    });
  });

  it("returns 400 when the event field is missing", async () => {
    const response = await handleTrackRequest(postTrack(JSON.stringify({ category: "audio" })), {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "missing event" });
  });

  it("returns 422 for unknown events", async () => {
    const response = await handleTrackRequest(postTrack(JSON.stringify({ event: "unknown_event" })), {});

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "unknown event" });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await handleTrackRequest(postTrack("{not-json"), {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid json" });
  });

  it("returns 413 when the raw request body is too large", async () => {
    const response = await handleTrackRequest(postTrack(JSON.stringify({ event: "card_click", label: "x".repeat(600) })), {});

    expect(response.status).toBe(413);
  });

  it("returns a no-op success when the binding is missing", async () => {
    const response = await handleTrackRequest(postTrack(JSON.stringify({ event: "audio_play" })), {});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, noop: true });
  });

  it("truncates string fields to 128 characters", async () => {
    const writeDataPoint = vi.fn();
    const longLabel = "a".repeat(140);

    await handleTrackRequest(
      postTrack(JSON.stringify({ event: "card_share", category: longLabel, label: longLabel, page: longLabel })),
      { ANALYTICS: { writeDataPoint } }
    );

    const point = writeDataPoint.mock.calls[0]?.[0] as { blobs: string[] };
    expect(point.blobs[1]).toHaveLength(128);
    expect(point.blobs[2]).toHaveLength(128);
    expect(point.blobs[3]).toHaveLength(128);
  });
});
