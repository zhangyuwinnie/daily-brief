import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import {
  getAvailableBriefingDates,
  getDailyBriefPageData
} from "../lib/briefings/generatedContentLoader";
import { escapeStaticMarkup } from "../test/htmlEscaping";
import { getAudioStatusNotice, TodayPage } from "./TodayPage";
import type { DailyAudio } from "../types/models";

const noop = () => {};

function TestLayout() {
  return (
    <Outlet
      context={{
        selectedInsight: null,
        topicFilter: null,
        onInsightShare: noop,
        onTopicFilterChange: noop
      }}
    />
  );
}

function renderTodayPage(initialEntry = "/today") {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout />,
        children: [
          {
            path: "today",
            element: <TodayPage />
          }
        ]
      }
    ],
    {
      initialEntries: [initialEntry]
    }
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe("TodayPage", () => {
  it("returns explicit failure guidance when generated audio fails", () => {
    const failedAudio: DailyAudio = {
      id: "audio-2026-03-21",
      briefingDate: "2026-03-21",
      status: "failed",
      provider: "notebooklm",
      title: "Daily Brief for 2026-03-21",
      errorMessage: "provider returned no audio file"
    };

    expect(getAudioStatusNotice("2026-03-21", failedAudio, false)).toEqual({
      tone: "error",
      message:
        "Audio generation failed for 2026-03-21: provider returned no audio file"
    });
  });

  it("returns explicit invalid-ready guidance when audio metadata has no playable url", () => {
    const incompleteReadyAudio: DailyAudio = {
      id: "audio-2026-03-21",
      briefingDate: "2026-03-21",
      status: "ready",
      provider: "notebooklm",
      title: "Daily Brief for 2026-03-21"
    };

    expect(getAudioStatusNotice("2026-03-21", incompleteReadyAudio, false)).toEqual({
      tone: "warning",
      message:
        "Audio for 2026-03-21 is marked ready, but no playable file URL was generated. Re-run the upstream audio job and regenerate the audio manifest."
    });
  });

  it("renders the latest generated day instead of the static mock content", () => {
    const pageData = getDailyBriefPageData();

    expect(pageData).not.toBeNull();
    expect(pageData!.insights[0].sourceUrl).toBeTruthy();

    const html = renderTodayPage();

    expect(html).toContain(escapeStaticMarkup(pageData!.insights[0].title));
    expect(html).toContain(`href="${escapeStaticMarkup(pageData!.insights[0].sourceUrl ?? "")}"`);
    expect(html).toContain(pageData!.audio?.status === "ready" ? "Ready" : "Generating...");
    expect(html).toContain("Scan the signal, listen once, and leave with a build direction.");
    expect(html).toContain('data-testid="today-brief-card"');
    expect(html).toContain('data-testid="today-brief-audio"');
    expect(html).toContain('data-testid="today-brief-meta"');
    expect(html.indexOf('data-testid="today-brief-audio"')).toBeGreaterThan(
      html.indexOf("Scan the signal, listen once, and leave with a build direction.")
    );
    expect(html.indexOf('data-testid="today-brief-audio"')).toBeLessThan(
      html.indexOf('data-testid="today-brief-meta"')
    );
    expect(html.indexOf('data-testid="today-brief-audio"')).toBeLessThan(html.indexOf("Top Signals"));
  });

  it("renders the requested generated date when /today receives a valid date query param", () => {
    const selectedDate = getAvailableBriefingDates()[1];
    const pageData = getDailyBriefPageData(selectedDate);

    expect(selectedDate).toBeTruthy();
    expect(pageData).not.toBeNull();

    const html = renderTodayPage(`/today?date=${selectedDate}`);

    expect(html).toContain(selectedDate);
    expect(html).toContain(escapeStaticMarkup(pageData!.insights[0].title));
  });

  it("falls back to the latest generated date when /today receives an invalid date query param", () => {
    const latestPageData = getDailyBriefPageData();

    expect(latestPageData).not.toBeNull();

    const html = renderTodayPage("/today?date=1900-01-01");

    expect(html).toContain("Requested date 1900-01-01 is unavailable.");
    expect(html).toContain(`Showing the latest generated brief for ${latestPageData!.date} instead.`);
    expect(html).toContain(latestPageData!.date);
    expect(html).toContain(escapeStaticMarkup(latestPageData!.insights[0].title));
  });

  it("shows an explicit pending-audio message when the selected day audio is still generating", () => {
    const pendingDate = getAvailableBriefingDates().find(
      (date) => getDailyBriefPageData(date)?.audio?.status === "pending"
    );
    const pageData = pendingDate ? getDailyBriefPageData(pendingDate) : null;

    expect(pendingDate).toBeTruthy();
    expect(pageData).not.toBeNull();
    expect(pageData!.audio?.status).toBe("pending");

    const html = renderTodayPage(`/today?date=${pendingDate}`);

    expect(html).toContain(`Audio for ${pageData!.date} is still generating.`);
    expect(html).toContain("Check back after the upstream audio job finishes.");
  });

  it("only renders the extra Today sections when distinct why/build/learn content exists", () => {
    const pageData = getDailyBriefPageData();

    expect(pageData).not.toBeNull();

    const html = renderTodayPage();

    expect(html).toContain("Top Signals");
    expect(html).not.toContain("Why It Matters");
    expect(html).not.toContain("Build This Today");
    expect(html).not.toContain("Learn This Next");
    expect(html).toContain(
      escapeStaticMarkup(pageData!.insights.find((insight) => insight.isTopSignal)?.title ?? "")
    );
  });
});
