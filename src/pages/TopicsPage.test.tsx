import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { MOCK_INSIGHTS } from "../data/mockInsights";
import { getAllInsights, getAvailableTopics } from "../lib/briefings/generatedContentLoader";
import { TopicsPage } from "./TopicsPage";

const noop = () => {};

function TestLayout({ topicFilter }: { topicFilter: string | null }) {
  return (
    <Outlet
      context={{
        buildQueue: [],
        selectedInsight: null,
        topicFilter,
        onAddToBuild: noop,
        onInsightShare: noop,
        onTopicFilterChange: noop,
        onUpdateStatus: noop
      }}
    />
  );
}

function renderTopicsPage(topicFilter: string | null = null) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout topicFilter={topicFilter} />,
        children: [
          {
            path: "topics",
            element: <TopicsPage />
          }
        ]
      }
    ],
    {
      initialEntries: ["/topics"]
    }
  );

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe("TopicsPage", () => {
  it("renders generated topics and insights instead of mock content", () => {
    const generatedInsights = getAllInsights();
    const generatedTopics = getAvailableTopics();

    expect(generatedInsights.length).toBeGreaterThan(0);
    expect(generatedTopics.length).toBeGreaterThan(0);

    const html = renderTopicsPage();

    expect(html).toContain(generatedInsights[0].title);
    expect(html).toContain(generatedTopics[0]);
    expect(html).not.toContain(MOCK_INSIGHTS[0].title);
    expect(html).not.toContain("Showing all current topics");
  });

  it("renders page-level topic controls and filters the visible insights", () => {
    const selectedTopic = getAvailableTopics()[0];
    const matchingInsight = getAllInsights().find((insight) => insight.topics.includes(selectedTopic));
    const nonMatchingInsight = getAllInsights().find((insight) => !insight.topics.includes(selectedTopic));

    expect(selectedTopic).toBeTruthy();
    expect(matchingInsight).toBeTruthy();
    expect(nonMatchingInsight).toBeTruthy();

    const html = renderTopicsPage(selectedTopic);

    expect(html).toContain(`Showing insights for ${selectedTopic}`);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain(`>${selectedTopic}</button>`);
    expect(html).toContain(">All</button>");
    expect(html).toContain(matchingInsight!.title);
    expect(html).not.toContain(nonMatchingInsight!.title);
  });
});
