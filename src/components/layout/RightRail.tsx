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
    <aside
      className="border-t px-4 py-5 lg:w-[318px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:px-6 lg:py-6"
      style={{
        borderColor: "var(--border-soft)",
        background: "linear-gradient(180deg, rgba(247,241,232,0.6), rgba(242,234,222,0.74))"
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <section className="editorial-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)]">
            <Calendar className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            Recent Briefs
          </h3>
          <div className="flex flex-col gap-2">
            {recentDates.map((date) => (
              <Link
                key={date}
                to={`/today?date=${date}`}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  selectedDate === date && location.pathname === "/today"
                    ? "bg-[rgba(111,123,93,0.12)] font-semibold text-[color:var(--text-strong)]"
                    : "bg-[rgba(255,255,255,0.52)] text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]"
                }`}
                style={{
                  borderColor:
                    selectedDate === date && location.pathname === "/today"
                      ? "rgba(111,123,93,0.18)"
                      : "var(--border-soft)"
                }}
              >
                {date}
              </Link>
            ))}
          </div>
        </section>

        <section className="editorial-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)]">
            <Tag className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            Focus Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTopicFilterChange(null)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                borderColor: topicFilter === null ? "rgba(111,123,93,0.22)" : "var(--border-soft)",
                background: topicFilter === null ? "rgba(111,123,93,0.12)" : "rgba(255,255,255,0.52)",
                color: topicFilter === null ? "var(--text-strong)" : "var(--text-muted)"
              }}
            >
              All
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => onTopicFilterChange(topic)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: topicFilter === topic ? "rgba(111,123,93,0.22)" : "var(--border-soft)",
                  background:
                    topicFilter === topic ? "rgba(111,123,93,0.12)" : "rgba(255,255,255,0.52)",
                  color: topicFilter === topic ? "var(--text-strong)" : "var(--text-muted)"
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {selectedInsight ? (
          <section className="editorial-panel p-5 sm:col-span-2 lg:col-span-1">
            <p className="eyebrow mb-3">Insight Preview</p>
            <h4 className="display-title text-2xl font-semibold leading-tight">{selectedInsight.title}</h4>
            <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
              {selectedInsight.summary}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => onInsightShare(selectedInsight)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[rgba(84,66,42,0.04)]"
                style={{
                  borderColor: "var(--border-soft)",
                  color: "var(--text-strong)"
                }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
            <Link
              to={`/insights/${selectedInsight.id}`}
              className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-strong)]"
            >
              Open permalink
            </Link>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
