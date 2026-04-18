import { Calendar, Share2, Tag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  getAvailableBriefingDates,
  getResolvedBriefingDate
} from "../../lib/briefings/generatedContentLoader";
import type { Insight } from "../../types/models";

type RightRailProps = {
  selectedInsight: Insight | null;
  topicFilter: string | null;
  topics: string[];
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
};

export function RightRail({
  selectedInsight,
  topicFilter,
  topics,
  onInsightShare,
  onTopicFilterChange
}: RightRailProps) {
  const location = useLocation();
  const requestedDate = new URLSearchParams(location.search).get("date") ?? undefined;
  const selectedDate = getResolvedBriefingDate(requestedDate);
  const recentDates = getAvailableBriefingDates().slice(0, 4);

  return (
    <aside className="border-t border-white/40 bg-white/10 p-4 lg:w-72 lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Calendar className="h-4 w-4 text-slate-400" />
            Recent Briefs
          </h3>
          <div className="flex flex-col gap-2">
            {recentDates.map((date) => (
              <Link
                key={date}
                to={`/today?date=${date}`}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
                  selectedDate === date && location.pathname === "/today"
                    ? "border border-white/60 bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:bg-white/40"
                }`}
              >
                {date}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Tag className="h-4 w-4 text-slate-400" />
            Focus Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTopicFilterChange(null)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
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
                onClick={() => onTopicFilterChange(topic)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  topicFilter === topic
                    ? "border-brand-500 bg-white text-slate-800"
                    : "border-white/60 bg-white/40 text-slate-600 hover:bg-white"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {selectedInsight ? (
          <section className="rounded-card border border-white/60 bg-white/40 p-5 shadow-soft sm:col-span-2 lg:col-span-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Insight Preview
            </p>
            <h4 className="mb-2 text-base font-bold leading-tight text-slate-800">
              {selectedInsight.title}
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-slate-500">
              {selectedInsight.summary}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onInsightShare(selectedInsight)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
            <Link
              to={`/insights/${selectedInsight.id}`}
              className="mt-3 inline-flex text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Open permalink
            </Link>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
