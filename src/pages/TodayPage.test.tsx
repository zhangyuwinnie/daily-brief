import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { MOCK_INSIGHTS } from "../data/mockInsights";
import {
  getAvailableBriefingDates,
  getDailyBriefPageData
} from "../lib/briefings/generatedContentLoader";
import { TodayPage } from "./TodayPage";

const noop = () => {};

function TestLayout() {
  return (
    <Outlet
      context={{
        buildQueue: [],
        selectedInsight: null,
        topicFilter: null,
        onAddToBuild: noop,
        onInsightShare: noop,
        onUpdateStatus: noop
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
  it("renders the latest generated day instead of the static mock content", () => {
    const pageData = getDailyBriefPageData();

    expect(pageData).not.toBeNull();
    expect(pageData!.insights[0].sourceUrl).toBeTruthy();

    const html = renderTodayPage();

    expect(html).toContain(pageData!.insights[0].title);
    expect(html).toContain(`href="${pageData!.insights[0].sourceUrl}"`);
    expect(html).not.toContain(MOCK_INSIGHTS[0].title);
    expect(html).toContain("Generating...");
  });

  it("renders the requested generated date when /today receives a valid date query param", () => {
    const selectedDate = getAvailableBriefingDates()[1];
    const pageData = getDailyBriefPageData(selectedDate);

    expect(selectedDate).toBeTruthy();
    expect(pageData).not.toBeNull();

    const html = renderTodayPage(`/today?date=${selectedDate}`);

    expect(html).toContain(selectedDate);
    expect(html).toContain(pageData!.insights[0].title);
  });

  it("falls back to the latest generated date when /today receives an invalid date query param", () => {
    const latestPageData = getDailyBriefPageData();

    expect(latestPageData).not.toBeNull();

    const html = renderTodayPage("/today?date=1900-01-01");

    expect(html).toContain(latestPageData!.date);
    expect(html).toContain(latestPageData!.insights[0].title);
  });
});
