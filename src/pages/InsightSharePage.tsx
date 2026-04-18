import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Sparkles, Target, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getInsightById,
  getInsightDateById,
  loadInsightById
} from "../lib/briefings/generatedContentLoader";

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
        if (isDisposed) {
          return;
        }

        setInsightLoadStatus("idle");
      })
      .catch((error) => {
        if (isDisposed) {
          return;
        }

        setInsightLoadStatus("error");
        setInsightLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isDisposed = true;
    };
  }, [insightDate, insightId, selectedInsight]);

  if (!selectedInsight && insightId && insightDate && insightLoadStatus === "loading") {
    return (
      <div className="animate-enter mt-8 rounded-card border border-white/60 bg-white/40 p-8 text-center">
        <h2 className="mb-2 text-2xl font-black text-slate-800">Loading insight</h2>
        <p className="text-slate-500">Fetching the generated day payload for this permalink.</p>
      </div>
    );
  }

  if (!selectedInsight && insightLoadStatus === "error") {
    return (
      <div className="animate-enter mt-8 rounded-card border border-rose-200 bg-rose-50 p-8 text-center">
        <h2 className="mb-2 text-2xl font-black text-slate-800">Insight failed to load</h2>
        <p className="mb-6 text-slate-500">
          The generated day payload for this permalink could not be fetched.
        </p>
        {insightLoadError ? <p className="mb-6 text-xs text-rose-700">{insightLoadError}</p> : null}
        <Link
          to="/today"
          className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
        >
          Back to Today
        </Link>
      </div>
    );
  }

  if (!selectedInsight) {
    return (
      <div className="animate-enter mt-8 rounded-card border border-white/60 bg-white/40 p-8 text-center">
        <h2 className="mb-2 text-2xl font-black text-slate-800">Insight not found</h2>
        <p className="mb-6 text-slate-500">The permalink is missing or no longer exists.</p>
        <Link
          to="/today"
          className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
        >
          Back to Today
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-enter mx-auto mt-4 max-w-3xl">
      <Link
        to="/today"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Today
      </Link>

      <article className="relative overflow-hidden rounded-shell border border-white bg-gradient-to-br from-white to-[#f4fcf7] p-6 shadow-float sm:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-[#bbf07d]/30 to-transparent blur-3xl" />

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
            <Sparkles className="h-4 w-4 text-slate-900" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Daily Signal • {selectedInsight.date}
          </span>
        </div>

        <h2 className="mb-6 text-3xl font-black leading-tight text-slate-800">
          {selectedInsight.title}
        </h2>

        <section className="mb-6 rounded-2xl border border-[#d3ecd9] bg-[#f0f9f3] p-6">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5c962c]">
            <Zap className="h-3 w-3" />
            Core Insight
          </h4>
          <p className="font-medium leading-relaxed text-slate-700">{selectedInsight.summary}</p>
        </section>

        <section className="mb-8">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            My Takeaway
          </h4>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-brand-500" />
            <p className="pl-4 text-lg italic text-slate-600">&quot;{selectedInsight.take}&quot;</p>
          </div>
        </section>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white/70 p-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Why It Matters
            </h4>
            <p className="text-sm leading-relaxed text-slate-600">
              {selectedInsight.whyItMatters ??
                "No why-it-matters cue was extracted for this insight yet."}
            </p>
          </section>

          <section className="rounded-2xl border border-[#d3ecd9] bg-[#f0f9f3] p-5">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5c962c]">
              <Target className="h-3 w-3" />
              Build Idea
            </h4>
            <p className="text-sm leading-relaxed text-slate-700">
              {selectedInsight.buildIdea ?? "No build idea was extracted for this insight yet."}
            </p>
          </section>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-100 bg-white/70 p-5">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Original Source
          </h4>
          {selectedInsight.sourceUrl ? (
            <a
              href={selectedInsight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {selectedInsight.sourceName ?? selectedInsight.sourceLabel}
            </a>
          ) : (
            <p className="text-sm text-slate-600">No original source link is available for this insight.</p>
          )}
        </section>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {selectedInsight.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
            >
              #{topic}
            </span>
          ))}
        </div>
      </article>

    </div>
  );
}
