const ALLOWED_EVENTS = new Set(["audio_play", "card_click", "card_share"]);
const MAX_STRING_LEN = 128;
const MAX_BODY_SIZE = 512;

type AnalyticsDataPoint = {
  blobs: string[];
  doubles: number[];
  indexes: string[];
};

export type AnalyticsDataset = {
  writeDataPoint: (point: AnalyticsDataPoint) => void;
};

export type TrackEndpointEnv = {
  ANALYTICS?: AnalyticsDataset;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

export async function handleTrackRequest(request: Request, env: TrackEndpointEnv): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_SIZE) {
    return new Response(null, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  if (typeof body.event !== "string" || body.event === "") {
    return jsonResponse({ error: "missing event" }, 400);
  }

  if (!ALLOWED_EVENTS.has(body.event)) {
    return jsonResponse({ error: "unknown event" }, 422);
  }

  if (!env.ANALYTICS) {
    return jsonResponse({ ok: true, noop: true }, 200);
  }

  const event = body.event;
  const category = truncate(String(body.category ?? ""), MAX_STRING_LEN);
  const label = truncate(String(body.label ?? ""), MAX_STRING_LEN);
  const page = truncate(String(body.page ?? ""), MAX_STRING_LEN);

  env.ANALYTICS.writeDataPoint({
    blobs: [event, category, label, page],
    doubles: [Date.now()],
    indexes: [event]
  });

  return jsonResponse({ ok: true }, 200);
}
