import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { AudioPlayer } from "../components/audio/AudioPlayer";
import { InsightCard } from "../components/cards/InsightCard";
import { MOCK_AUDIO } from "../data/mockAudio";
import { MOCK_INSIGHTS } from "../data/mockInsights";

export function TodayPage() {
  const { topicFilter, onAddToBuild, onInsightShare } = useOutletContext<AppOutletContext>();
  const insights = topicFilter
    ? MOCK_INSIGHTS.filter((insight) => insight.topics.includes(topicFilter))
    : MOCK_INSIGHTS;

  return (
    <div className="animate-enter">
      <div className="mb-6 mt-2 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-3xl font-black text-slate-800">Today&apos;s Brief</h2>
          <p className="text-slate-500">Listen to the highlights or scan the top signals below.</p>
        </div>
      </div>

      <div className="mb-8">
        <AudioPlayer data={MOCK_AUDIO} />
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
