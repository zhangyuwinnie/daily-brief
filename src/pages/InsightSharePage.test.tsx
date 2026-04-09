import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { getAllInsights } from "../lib/briefings/generatedContentLoader";
import { escapeStaticMarkup } from "../test/htmlEscaping";
import { InsightSharePage } from "./InsightSharePage";

const noop = () => {};

function TestLayout() {
  return (
    <Outlet
      context={{
        buildQueue: [],
        buildQueueError: null,
        buildQueueStatus: "ready",
        selectedInsight: null,
        topicFilter: null,
        onAddToBuild: noop,
        onInsightShare: noop,
        onTopicFilterChange: noop,
        onUpdateStatus: noop
      }}
    />
  );
}

function renderInsightSharePage(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout />,
        children: [
          {
            path: "insights/:insightId",
            element: <InsightSharePage />
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

describe("InsightSharePage", () => {
  it("loads a generated insight from the permalink id and renders the full share payload shell", () => {
    const insight = getAllInsights().find((candidate) => candidate.sourceUrl);

    expect(insight).toBeTruthy();

    const html = renderInsightSharePage(`/insights/${insight!.id}`);

    expect(html).toContain(escapeStaticMarkup(insight!.title));
    expect(html).toContain(escapeStaticMarkup(insight!.summary));
    expect(html).toContain(`href="${escapeStaticMarkup(insight!.sourceUrl ?? "")}"`);
    expect(html).toContain("Why It Matters");
    expect(html).toContain("Build Idea");
    expect(html).toContain("Back to Today");
    expect(html).toContain("No why-it-matters cue was extracted for this insight yet.");
    expect(html).toContain("No build idea was extracted for this insight yet.");
    expect(html).not.toContain("Download Poster");
    expect(html).not.toContain("Copy Link");
  });

  it("shows a clear recovery state for unknown insight ids", () => {
    const html = renderInsightSharePage("/insights/missing-insight-id");

    expect(html).toContain("Insight not found");
    expect(html).toContain("Back to Today");
    expect(html).toContain("Browse Topics");
  });
});
