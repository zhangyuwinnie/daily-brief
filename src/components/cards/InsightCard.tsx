import { BookOpen, Clock3, Share2, Sparkles, Target } from "lucide-react";
import type { Insight } from "../../types/models";

type InsightCardProps = {
  insight: Insight;
  onShare: () => void;
};

export function InsightCard({ insight, onShare }: InsightCardProps) {
  const cueSections = [
    insight.whyItMatters
      ? {
          title: "Why It Matters",
          value: insight.whyItMatters,
          icon: <Sparkles className="h-3.5 w-3.5" />,
          tone: "rgba(249, 246, 240, 0.92)"
        }
      : null,
    insight.buildIdea
      ? {
          title: "Build Cue",
          value: insight.buildIdea,
          icon: <Target className="h-3.5 w-3.5" />,
          tone: "rgba(237, 244, 231, 0.94)"
        }
      : null,
    insight.learnGoal
      ? {
          title: "Learn Next",
          value: insight.learnGoal,
          icon: <BookOpen className="h-3.5 w-3.5" />,
          tone: "rgba(239, 244, 246, 0.94)"
        }
      : null
  ].filter((section): section is NonNullable<typeof section> => Boolean(section));

  return (
    <article
      className="group rounded-[1.8rem] border p-6 transition-transform duration-300 hover:-translate-y-[2px] sm:p-7"
      style={{
        borderColor: "var(--border-soft)",
        background: "var(--surface-strong)",
        boxShadow: "0 24px 54px rgba(53,37,20,0.06)"
      }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              borderColor: "var(--border-soft)",
              background: "rgba(255,255,255,0.65)",
              color: "var(--text-faint)"
            }}
          >
            {insight.sourceLabel}
          </span>
          {insight.sourceName ? (
            <span className="text-xs font-semibold text-[color:var(--text-muted)]">{insight.sourceName}</span>
          ) : null}
          <span className="text-xs text-[color:var(--text-faint)]">{insight.date}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {insight.effortEstimate ? (
            <div
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: "rgba(111,123,93,0.18)",
                background: "rgba(111,123,93,0.12)",
                color: "var(--accent-strong)"
              }}
            >
              <Clock3 className="h-3 w-3" />
              {insight.effortEstimate}
            </div>
          ) : null}

          {insight.isTopSignal ? (
            <div
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: "rgba(111,123,93,0.18)",
                background: "rgba(111,123,93,0.1)",
                color: "var(--accent-strong)"
              }}
            >
              <Sparkles className="h-3 w-3" />
              Top Pick
            </div>
          ) : null}
        </div>
      </div>

      <h3 className="display-title text-[2.15rem] font-semibold leading-[0.96] text-[color:var(--text-strong)]">
        {insight.sourceUrl ? (
          <a
            href={insight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color,color] hover:text-[color:var(--accent-strong)] hover:decoration-current"
          >
            {insight.title}
          </a>
        ) : (
          insight.title
        )}
      </h3>

      <p className="mt-4 text-sm leading-7 text-[color:var(--text-muted)]">{insight.summary}</p>

      <section
        className="mt-6 rounded-[1.45rem] border p-5"
        style={{
          borderColor: "var(--border-soft)",
          background: "rgba(248, 244, 238, 0.9)"
        }}
      >
        <p className="eyebrow mb-2">Takeaway</p>
        <p className="text-sm font-medium leading-7 text-[color:var(--text-base)]">{insight.take}</p>
      </section>

      {cueSections.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {cueSections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.35rem] border p-4"
              style={{
                borderColor: "var(--border-soft)",
                background: section.tone
              }}
            >
              <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">
                {section.icon}
                {section.title}
              </h4>
              <p className="text-sm leading-6 text-[color:var(--text-base)]">{section.value}</p>
            </section>
          ))}
        </div>
      ) : null}

      <div
        className="mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex flex-wrap gap-1.5">
          {insight.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{
                borderColor: "var(--border-soft)",
                background: "rgba(255,255,255,0.52)",
                color: "var(--text-muted)"
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[rgba(84,66,42,0.04)] sm:self-auto"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-strong)"
          }}
          title="Share Insight"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </article>
  );
}
