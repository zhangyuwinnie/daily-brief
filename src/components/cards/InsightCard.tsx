import { Clock, Plus, Share2, Sparkles, Target } from "lucide-react";
import type { Insight } from "../../types/models";

type InsightCardProps = {
  insight: Insight;
  onAdd: () => void;
  onShare: () => void;
};

export function InsightCard({ insight, onAdd, onShare }: InsightCardProps) {
  return (
    <article className="group relative rounded-card border border-white/80 bg-white/70 p-5 shadow-soft backdrop-blur-md transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6">
      {insight.isTopPick ? (
        <div className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full border border-white bg-gradient-to-r from-[#8bd84a] to-[#a2ea5c] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-md animate-pulse-slow sm:-right-3 sm:-top-3">
          <Sparkles className="h-3 w-3" />
          Top Pick
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-500 shadow-sm">
            {insight.source}
          </span>
          <span className="text-xs font-medium text-slate-400">{insight.date}</span>
        </div>
      </div>

      <h3 className="mb-2 text-xl font-black leading-tight text-slate-800 transition-colors group-hover:text-[#5c962c] sm:text-2xl">
        {insight.title}
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-slate-500">{insight.summary}</p>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-slate-300" />
          <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Takeaway
          </h4>
          <p className="text-sm font-medium text-slate-700">{insight.takeaway}</p>
        </section>

        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#cbebb2] bg-[#f2faed] p-4">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-brand-500" />
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5c962c]">
              <Target className="h-3 w-3" />
              Build This
            </h4>
            <div className="flex items-center gap-1 rounded bg-[#e3f4d7] px-2 py-0.5 text-[10px] font-bold text-[#629d31]">
              <Clock className="h-3 w-3" />
              {insight.effort}
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-800">{insight.buildIdea}</p>
        </section>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {insight.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-500"
            >
              {topic}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800"
            title="Share Insight"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={onAdd}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all group-hover:bg-brand-500 group-hover:text-slate-900 group-hover:shadow-[0_4px_14px_rgba(148,227,84,0.4)] hover:bg-slate-800 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            Add to Build
          </button>
        </div>
      </div>
    </article>
  );
}
