import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { MOCK_INSIGHTS } from "../data/mockInsights";
import { getDailyBriefPageData } from "../lib/briefings/generatedContentLoader";
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

describe("TodayPage", () => {
  it("renders the latest generated day instead of the static mock content", () => {
    const pageData = getDailyBriefPageData();

    expect(pageData).not.toBeNull();

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
        initialEntries: ["/today"]
      }
    );

    const html = renderToStaticMarkup(<RouterProvider router={router} />);

    expect(html).toContain(pageData!.insights[0].title);
    expect(html).not.toContain(MOCK_INSIGHTS[0].title);
    expect(html).toContain("Generating...");
  });
});
