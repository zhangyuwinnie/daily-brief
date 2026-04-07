import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { InsightCard } from "../components/cards/InsightCard";
import {
  getAllInsights,
  getAvailableTopics,
  loadAllInsights
} from "../lib/briefings/generatedContentLoader";

export function TopicsPage() {
  const { topicFilter, onAddToBuild, onInsightShare, onTopicFilterChange } =
    useOutletContext<AppOutletContext>();
  const [topicsLoadStatus, setTopicsLoadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [topicsLoadError, setTopicsLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;
    setTopicsLoadStatus("loading");
    setTopicsLoadError(null);

    loadAllInsights()
      .then(() => {
        if (isDisposed) {
          return;
        }

        setTopicsLoadStatus("idle");
      })
      .catch((error) => {
        if (isDisposed) {
          return;
        }

        setTopicsLoadStatus("error");
        setTopicsLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  const topics = getAvailableTopics();
  const insights = getAllInsights();
  const visibleInsights = topicFilter
    ? insights.filter((insight) => insight.topics.includes(topicFilter))
    : insights;

  if (topicsLoadStatus === "loading" && insights.length === 0) {
    return (
      <div className="animate-enter">
        <section className="rounded-card border border-white/60 bg-white/50 p-5 text-slate-800 shadow-soft">
          <h2 className="mb-2 text-2xl font-black text-slate-800">Loading topics</h2>
          <p className="text-sm text-slate-600">
            Fetching the generated briefing days needed to build the cross-day topic view.
          </p>
        </section>
      </div>
    );
  }

  if (topicsLoadStatus === "error" && insights.length === 0) {
    return (
      <div className="animate-enter">
        <section className="rounded-card border border-rose-200 bg-rose-50 p-5 text-slate-800 shadow-soft">
          <h2 className="mb-2 text-2xl font-black text-slate-800">Topics failed to load</h2>
          <p className="text-sm text-slate-600">
            The generated briefing history could not be loaded. Re-run <code>npm run sync:generated</code>
            and reload the app.
          </p>
          {topicsLoadError ? <p className="mt-3 text-xs text-rose-700">{topicsLoadError}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <div className="mb-8 mt-2">
        <h2 className="mb-2 text-3xl font-black text-slate-800">Topics</h2>
        <p className="text-slate-500">
          Track the themes showing up across recent briefs and open the signals worth acting on.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={topicFilter === null}
          onClick={() => onTopicFilterChange(null)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            topicFilter === null
              ? "border-brand-500 bg-white text-slate-800"
              : "border-white/60 bg-white/40 text-slate-600 hover:bg-white"
          }`}
        >
          All
        </button>
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            aria-pressed={topicFilter === topic}
            onClick={() => onTopicFilterChange(topic)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              topicFilter === topic
                ? "border-brand-500 bg-white text-slate-800"
                : "border-white/60 bg-white/40 text-slate-600 hover:bg-white"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm text-slate-600">
        <BookOpen className="h-4 w-4 text-slate-400" />
        {topicFilter ? `Showing signals tagged ${topicFilter}` : "Browsing signals across all tracked topics"}
      </div>

      {topicsLoadStatus === "loading" ? (
        <div className="mb-5 rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm text-slate-600">
          Loading additional briefing days for the full topic history.
        </div>
      ) : null}

      {visibleInsights.length > 0 ? (
        <div className="flex flex-col gap-6">
          {visibleInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAdd={() => onAddToBuild(insight)}
              onShare={() => onInsightShare(insight)}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700 shadow-soft">
          No recent signals are tagged {topicFilter} yet.
        </section>
      )}
    </div>
  );
}
