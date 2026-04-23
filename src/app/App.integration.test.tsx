// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navigate, RouterProvider, createMemoryRouter } from "react-router-dom";
import { InsightSharePage } from "../pages/InsightSharePage";
import { TodayPage } from "../pages/TodayPage";
import {
  getAllInsights,
  getDailyBriefPageData
} from "../lib/briefings/generatedContentLoader";
import { resetGeneratedContentSources } from "../lib/briefings/generatedContentLoader";
import { generatedContentFixture } from "../test/generatedContentFixture";
import { App } from "./App";

function getTextContent(node: ParentNode) {
  return node.textContent ?? "";
}

async function flushUpdates() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
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

function installGeneratedContentFetchMock() {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);

    if (url.endsWith("/generated/briefings-index.json")) {
      return {
        ok: true,
        json: async () => generatedContentFixture.briefingsIndex
      };
    }

    if (url.endsWith("/generated/audio-index.json")) {
      return {
        ok: true,
        json: async () => generatedContentFixture.audioIndex
      };
    }

    const matchedDate = generatedContentFixture.briefingsIndex.availableDates.find((date) =>
      url.endsWith(`/generated/briefings/${date}.json`)
    );

    if (matchedDate) {
      return {
        ok: true,
        json: async () => generatedContentFixture.briefingsByDate[matchedDate]
      };
    }

    throw new Error(`Unexpected fetch request: ${url}`);
  });

  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe("App integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    resetGeneratedContentSources();
    installGeneratedContentFetchMock();
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

  it("shows a loading state before runtime generated content is available", async () => {
    const neverResolvingFetch = vi.fn(
      () => new Promise<Response>(() => undefined)
    );
    vi.stubGlobal("fetch", neverResolvingFetch as unknown as typeof fetch);

    const router = createTestRouter("/today");

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });

    expect(getTextContent(container)).toContain("Loading generated briefings");
  });

  it("loads /today from generated data and can navigate to a real permalink route", async () => {
    const pageData =
      getDailyBriefPageData("2026-03-20", generatedContentFixture) ??
      getDailyBriefPageData(undefined, generatedContentFixture);

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

  it("does not render disconnected search or start-learning shell controls", async () => {
    const router = createTestRouter("/today");

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await flushUpdates();

    expect(container.querySelector('input[placeholder="Search insights or topics..."]')).toBeNull();
    expect(getTextContent(container)).not.toContain("Start Learning");
  });

  it("loads a real insight permalink directly from the route entry", async () => {
    const permalinkInsight =
      getAllInsights(generatedContentFixture).find((insight) => insight.sourceUrl) ??
      getAllInsights(generatedContentFixture)[0];
    const router = createTestRouter(`/insights/${permalinkInsight.id}`);

    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await flushUpdates();

    expect(router.state.location.pathname).toBe(`/insights/${permalinkInsight.id}`);
    expect(getTextContent(container)).toContain(permalinkInsight.title);
    expect(getTextContent(container)).toContain(permalinkInsight.summary);
    expect(getTextContent(container)).toContain("Original Source");
    expect(getTextContent(container)).not.toContain("Build Idea");
  });
});
