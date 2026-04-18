import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import {
  getAvailableTopics,
  getInsightById,
  loadGeneratedContentSources,
  subscribeGeneratedContentUpdates
} from "../lib/briefings/generatedContentLoader";
import type { Insight } from "../types/models";
import type { AppOutletContext } from "./outlet-context";

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [generatedContentStatus, setGeneratedContentStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [generatedContentError, setGeneratedContentError] = useState<string | null>(null);
  const [generatedContentRevision, setGeneratedContentRevision] = useState(0);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const availableTopics = useMemo(
    () => (generatedContentStatus === "ready" ? getAvailableTopics() : []),
    [generatedContentRevision, generatedContentStatus]
  );
  const selectedInsight = useMemo(
    () =>
      generatedContentStatus === "ready" && params.insightId ? getInsightById(params.insightId) : null,
    [generatedContentRevision, generatedContentStatus, params.insightId]
  );

  useEffect(() => subscribeGeneratedContentUpdates(() => setGeneratedContentRevision((current) => current + 1)), []);

  useEffect(() => {
    let isDisposed = false;

    loadGeneratedContentSources()
      .then(() => {
        if (isDisposed) {
          return;
        }

        setGeneratedContentStatus("ready");
        setGeneratedContentError(null);
      })
      .catch((error) => {
        if (isDisposed) {
          return;
        }

        setGeneratedContentStatus("error");
        setGeneratedContentError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  if (generatedContentStatus === "loading") {
    return (
      <div className="app-page text-[color:var(--text-strong)]">
        <div className="app-shell items-center justify-center px-6 py-20 text-center">
          <div className="max-w-md">
            <p className="eyebrow">Preparing the briefing room</p>
            <h1 className="display-title mt-3 text-4xl font-semibold">Loading generated briefings...</h1>
            <p className="mt-4 text-sm text-[color:var(--text-muted)]">
              Fetching the latest brief and audio manifests from <code>/generated</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (generatedContentStatus === "error") {
    return (
      <div className="app-page text-[color:var(--text-strong)]">
        <div className="app-shell items-center justify-center px-6 py-20 text-center">
          <div className="max-w-lg">
            <p className="eyebrow text-rose-700">Manifest unavailable</p>
            <h1 className="display-title mt-3 text-4xl font-semibold">Generated content failed to load</h1>
            <p className="mt-4 text-sm text-[color:var(--text-muted)]">
              Run <code>npm run sync:generated</code>, confirm the files exist under <code>public/generated</code>,
              then reload the app.
            </p>
            {generatedContentError ? (
              <p className="mt-4 text-xs text-rose-700">{generatedContentError}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      currentPath={location.pathname}
      topics={availableTopics}
      selectedInsight={selectedInsight}
      topicFilter={topicFilter}
      onInsightShare={(insight) => navigate(`/insights/${insight.id}`)}
      onTopicFilterChange={setTopicFilter}
    >
      <Outlet
        context={{
          selectedInsight,
          topicFilter,
          onInsightShare: (insight: Insight) => navigate(`/insights/${insight.id}`),
          onTopicFilterChange: setTopicFilter
        } satisfies AppOutletContext}
      />
    </AppShell>
  );
}
