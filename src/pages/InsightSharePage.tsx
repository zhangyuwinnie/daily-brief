import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Sparkles, Target, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getInsightById,
  getInsightDateById,
  loadInsightById
} from "../lib/briefings/generatedContentLoader";

function ShareState({
  eyebrow,
  title,
  body,
  extra,
  tone = "default"
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  extra?: React.ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className="animate-enter mt-8 rounded-[1.8rem] border p-8 text-center shadow-[0_18px_50px_rgba(53,37,20,0.06)]"
      style={{
        borderColor: tone === "error" ? "rgba(171,62,62,0.22)" : "var(--border-soft)",
        background: tone === "error" ? "rgba(252,242,240,0.92)" : "var(--surface-strong)"
      }}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-title mt-3 text-4xl font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{body}</div>
      {extra ? <div className="mt-4 text-xs">{extra}</div> : null}
      <Link
        to="/today"
        className="mt-6 inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold"
        style={{
          borderColor: "var(--border-soft)",
          background: "rgba(47,41,35,0.96)",
          color: "#f6f1e8"
        }}
      >
        Back to Today
      </Link>
    </div>
  );
}

export function InsightSharePage() {
  const { insightId } = useParams();
  const selectedInsight = insightId ? getInsightById(insightId) : null;
  const insightDate = insightId ? getInsightDateById(insightId) : null;
  const [insightLoadStatus, setInsightLoadStatus] = useState<"idle" | "loading" | "error">(
    insightId && insightDate && !selectedInsight ? "loading" : "idle"
  );
  const [insightLoadError, setInsightLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!insightId || !insightDate || selectedInsight) {
      setInsightLoadStatus("idle");
      setInsightLoadError(null);
      return;
    }

    let isDisposed = false;
    setInsightLoadStatus("loading");
    setInsightLoadError(null);

    loadInsightById(insightId)
      .then(() => {
        if (!isDisposed) {
          setInsightLoadStatus("idle");
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setInsightLoadStatus("error");
          setInsightLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [insightDate, insightId, selectedInsight]);

  if (!selectedInsight && insightId && insightDate && insightLoadStatus === "loading") {
    return (
      <ShareState
        eyebrow="Loading"
        title="Loading insight"
        body={<p>Fetching the generated day payload for this permalink.</p>}
      />
    );
  }

  if (!selectedInsight && insightLoadStatus === "error") {
    return (
      <ShareState
        eyebrow="Load error"
        title="Insight failed to load"
        tone="error"
        body={<p>The generated day payload for this permalink could not be fetched.</p>}
        extra={insightLoadError ? <p className="text-rose-700">{insightLoadError}</p> : null}
      />
    );
  }

  if (!selectedInsight) {
    return (
      <ShareState
        eyebrow="Unavailable"
        title="Insight not found"
        body={<p>The permalink is missing or no longer exists.</p>}
      />
    );
  }

  return (
    <div className="animate-enter mx-auto mt-4 max-w-4xl">
      <Link
        to="/today"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-strong)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Today
      </Link>

      <article
        className="overflow-hidden rounded-[2rem] border p-6 shadow-[0_26px_60px_rgba(53,37,20,0.08)] sm:p-10"
        style={{
          borderColor: "var(--border-soft)",
          background:
            "linear-gradient(180deg, rgba(255,252,247,0.94) 0%, rgba(248,243,236,0.94) 100%)"
        }}
      >
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "rgba(111,123,93,0.18)",
              background: "rgba(111,123,93,0.12)"
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "var(--accent-strong)" }} />
          </div>
          <span className="eyebrow">Daily Signal • {selectedInsight.date}</span>
        </div>

        <h2 className="display-title text-5xl font-semibold leading-[0.95] text-[color:var(--text-strong)]">
          {selectedInsight.title}
        </h2>

        <section
          className="mt-8 rounded-[1.6rem] border p-6"
          style={{
            borderColor: "rgba(111,123,93,0.18)",
            background: "rgba(237,244,231,0.92)"
          }}
        >
          <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
            <Zap className="h-3.5 w-3.5" />
            Core Insight
          </h4>
          <p className="text-base leading-8 text-[color:var(--text-base)]">{selectedInsight.summary}</p>
        </section>

        <section className="mt-8">
          <p className="eyebrow mb-2">My Takeaway</p>
          <div className="flex gap-4">
            <div className="w-px rounded-full bg-[rgba(111,123,93,0.7)]" />
            <p className="display-title text-[2rem] italic font-medium leading-tight text-[color:var(--text-base)]">
              &quot;{selectedInsight.take}&quot;
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section
            className="rounded-[1.45rem] border p-5"
            style={{
              borderColor: "var(--border-soft)",
              background: "rgba(250,247,241,0.92)"
            }}
          >
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
              Why It Matters
            </h4>
            <p className="text-sm leading-7 text-[color:var(--text-muted)]">
              {selectedInsight.whyItMatters ??
                "No why-it-matters cue was extracted for this insight yet."}
            </p>
          </section>

          <section
            className="rounded-[1.45rem] border p-5"
            style={{
              borderColor: "rgba(111,123,93,0.18)",
              background: "rgba(237,244,231,0.92)"
            }}
          >
            <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              <Target className="h-3.5 w-3.5" />
              Build Idea
            </h4>
            <p className="text-sm leading-7 text-[color:var(--text-base)]">
              {selectedInsight.buildIdea ?? "No build idea was extracted for this insight yet."}
            </p>
          </section>
        </div>

        <section
          className="mt-8 rounded-[1.45rem] border p-5"
          style={{
            borderColor: "var(--border-soft)",
            background: "rgba(255,252,247,0.7)"
          }}
        >
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
            Original Source
          </h4>
          {selectedInsight.sourceUrl ? (
            <a
              href={selectedInsight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)] underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {selectedInsight.sourceName ?? selectedInsight.sourceLabel}
            </a>
          ) : (
            <p className="text-sm text-[color:var(--text-muted)]">
              No original source link is available for this insight.
            </p>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6" style={{ borderColor: "var(--border-soft)" }}>
          {selectedInsight.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{
                borderColor: "var(--border-soft)",
                background: "rgba(255,255,255,0.55)",
                color: "var(--text-muted)"
              }}
            >
              #{topic}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
