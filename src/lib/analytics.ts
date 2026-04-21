export type AnalyticsEvent = "audio_play" | "card_click" | "card_share";

type TrackEvent = {
  event: AnalyticsEvent;
  category?: string;
  label?: string;
};

export function trackEvent({ event, category, label }: TrackEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    event,
    category,
    label,
    page: window.location.pathname
  });

  const blob = new Blob([payload], { type: "application/json" });
  const canUseBeacon = typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";

  if (canUseBeacon && navigator.sendBeacon("/api/track", blob)) {
    return;
  }

  if (typeof fetch !== "function") {
    return;
  }

  fetch("/api/track", {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true
  }).catch(() => {});
}
