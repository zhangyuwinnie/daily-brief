import { BookOpen } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { InsightCard } from "../components/cards/InsightCard";
import { getAllInsights, getAvailableTopics } from "../lib/briefings/generatedContentLoader";

export function TopicsPage() {
  const { topicFilter, onAddToBuild, onInsightShare, onTopicFilterChange } =
    useOutletContext<AppOutletContext>();
  const topics = getAvailableTopics();
  const insights = getAllInsights();
  const visibleInsights = topicFilter
    ? insights.filter((insight) => insight.topics.includes(topicFilter))
    : insights;

  return (
    <div className="animate-enter">
      <div className="mb-8 mt-2">
        <h2 className="mb-2 text-3xl font-black text-slate-800">Topics</h2>
        <p className="text-slate-500">
          Filter the daily brief by topic without turning the MVP into a full knowledge graph.
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
        {topicFilter ? `Showing insights for ${topicFilter}` : "Showing all generated topics"}
      </div>

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
          No generated insights are available for the {topicFilter} topic yet.
        </section>
      )}
    </div>
  );
}
