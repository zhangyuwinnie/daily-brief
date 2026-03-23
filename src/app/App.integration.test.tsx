// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Navigate, RouterProvider, createMemoryRouter } from "react-router-dom";
import { BuildQueuePage } from "../pages/BuildQueuePage";
import { InsightSharePage } from "../pages/InsightSharePage";
import { TodayPage } from "../pages/TodayPage";
import { TopicsPage } from "../pages/TopicsPage";
import {
  getAllInsights,
  getAvailableTopics,
  getDailyBriefPageData
} from "../lib/briefings/generatedContentLoader";
import { App } from "./App";

function getTextContent(node: ParentNode) {
  return node.textContent ?? "";
}

async function flushUpdates() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function clickElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    throw new Error("Expected clickable element");
  }

  await act(async () => {
    element.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true
      })
    );
  });
}

function findButtonByText(container: ParentNode, label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label
  );
}

function createTestRouter(initialEntry: string) {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <App />,
        children: [
          {
            index: true,
            element: <Navigate to="/today" replace />
          },
          {
            path: "today",
            element: <TodayPage />
          },
          {
            path: "build",
            element: <BuildQueuePage />
          },
          {
            path: "topics",
            element: <TopicsPage />
          },
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
}

describe("App integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    window.localStorage.clear();
  });

  it("loads /today from generated data and can navigate to a real permalink route", async () => {
    const pageData = getDailyBriefPageData("2026-03-20") ?? getDailyBriefPageData();

    expect(pageData).not.toBeNull();

    const insight = pageData!.insights[0];
    const router = createTestRouter(`/today?date=${pageData!.date}`);

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await flushUpdates();

    expect(getTextContent(container)).toContain(insight.title);

    const insightArticle = Array.from(container.querySelectorAll("article")).find((article) =>
      getTextContent(article).includes(insight.title)
    );

    expect(insightArticle).toBeTruthy();

    await clickElement(insightArticle?.querySelector('button[title="Share Insight"]') ?? null);
    await flushUpdates();

    expect(router.state.location.pathname).toBe(`/insights/${insight.id}`);
    expect(getTextContent(container)).toContain(insight.summary);
    expect(getTextContent(container)).toContain("Original Source");
  });

  it("loads /topics and updates the visible insights when a topic chip is clicked", async () => {
    const selectedTopic = getAvailableTopics()[0];
    const matchingInsight = getAllInsights().find((insight) => insight.topics.includes(selectedTopic));
    const nonMatchingInsight = getAllInsights().find(
      (insight) => !insight.topics.includes(selectedTopic)
    );

    expect(selectedTopic).toBeTruthy();
    expect(matchingInsight).toBeTruthy();
    expect(nonMatchingInsight).toBeTruthy();

    const router = createTestRouter("/topics");

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await flushUpdates();

    await clickElement(findButtonByText(container, selectedTopic) ?? null);
    await flushUpdates();

    expect(getTextContent(container)).toContain(`Showing insights for ${selectedTopic}`);
    expect(getTextContent(container)).toContain(matchingInsight!.title);
    expect(getTextContent(container)).not.toContain(nonMatchingInsight!.title);
  });

  it("loads a real insight permalink directly from the route entry", async () => {
    const permalinkInsight = getAllInsights().find((insight) => insight.sourceUrl) ?? getAllInsights()[0];
    const router = createTestRouter(`/insights/${permalinkInsight.id}`);

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await flushUpdates();

    expect(router.state.location.pathname).toBe(`/insights/${permalinkInsight.id}`);
    expect(getTextContent(container)).toContain(permalinkInsight.title);
    expect(getTextContent(container)).toContain(permalinkInsight.summary);
    expect(getTextContent(container)).toContain("Build Idea");
  });
});
