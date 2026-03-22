import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { AudioPlayer } from "../components/audio/AudioPlayer";
import { InsightCard } from "../components/cards/InsightCard";
import { getDailyBriefPageData } from "../lib/briefings/generatedContentLoader";

export function TodayPage() {
  const { topicFilter, onAddToBuild, onInsightShare } = useOutletContext<AppOutletContext>();
  const pageData = getDailyBriefPageData();

  if (!pageData) {
    return (
      <div className="animate-enter">
        <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-slate-800 shadow-soft">
          <h2 className="mb-2 text-2xl font-black text-slate-800">Today&apos;s Brief</h2>
          <p className="text-sm text-slate-600">
            Generated daily content is unavailable. Run <code>npm run sync:generated</code> and reload
            the app.
          </p>
        </section>
      </div>
    );
  }

  const insights = topicFilter
    ? pageData.insights.filter((insight) => insight.topics.includes(topicFilter))
    : pageData.insights;

  return (
    <div className="animate-enter">
      <div className="mb-6 mt-2 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-3xl font-black text-slate-800">Today&apos;s Brief</h2>
          <p className="text-slate-500">Listen to the highlights or scan the top signals below.</p>
        </div>
        <div className="rounded-full border border-white/60 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700">
          {pageData.date}
        </div>
      </div>

      <div className="mb-8">
        {pageData.audio ? (
          <AudioPlayer data={pageData.audio} />
        ) : (
          <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700 shadow-soft">
            Audio metadata is unavailable for {pageData.date}.
          </section>
        )}
      </div>

      {topicFilter ? (
        <div className="mb-5 inline-flex rounded-full border border-white/60 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-700">
          Filter: {topicFilter}
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onAdd={() => onAddToBuild(insight)}
            onShare={() => onInsightShare(insight)}
          />
        ))}
      </div>
    </div>
  );
}
