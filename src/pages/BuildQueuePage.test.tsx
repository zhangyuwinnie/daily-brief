import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { getAllInsights } from "../lib/briefings/generatedContentLoader";
import { BuildQueuePage } from "./BuildQueuePage";
import type { BuildItem } from "../types/models";

const noop = () => {};

function TestLayout({ buildQueue }: { buildQueue: BuildItem[] }) {
  return (
    <Outlet
      context={{
        buildQueue,
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

function renderBuildQueuePage(buildQueue: BuildItem[]) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout buildQueue={buildQueue} />,
        children: [
          {
            path: "build",
            element: <BuildQueuePage />
          }
        ]
      }
    ],
    {
      initialEntries: ["/build"]
    }
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe("BuildQueuePage", () => {
  it("renders the empty state when no persisted queue items exist", () => {
    const html = renderBuildQueuePage([]);

    expect(html).toContain("Your queue is empty");
    expect(html).toContain("Browse Today");
  });

  it("renders Interested items in their own section", () => {
    const [firstInsight, secondInsight, thirdInsight] = getAllInsights();
    const html = renderBuildQueuePage([
      {
        id: firstInsight.id,
        insight: firstInsight,
        skillFocus: "agents",
        note: "",
        status: "Inbox",
        addedAt: "Mar 20"
      },
      {
        id: secondInsight.id,
        insight: secondInsight,
        skillFocus: "security",
        note: "Come back to this",
        status: "Interested",
        addedAt: "Mar 21"
      },
      {
        id: thirdInsight.id,
        insight: thirdInsight,
        skillFocus: "rag",
        note: "",
        status: "Building",
        addedAt: "Mar 22"
      }
    ]);

    expect(html).toContain(">Interested<");
    expect(html).toContain("Come back to this");
    expect(html).toContain(">Building &amp; Finished<");
  });
});
