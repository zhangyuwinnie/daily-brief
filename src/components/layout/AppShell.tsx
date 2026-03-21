import { Search, Sparkles, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { RightRail } from "./RightRail";
import { Sidebar } from "./Sidebar";
import type { BuildItem, Insight } from "../../types/models";
import { FOCUS_TOPICS } from "../../data/mockInsights";

type AppShellProps = {
  children: React.ReactNode;
  buildQueue: BuildItem[];
  currentPath: string;
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onAddToBuild: (insight: Insight) => void;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
};

export function AppShell({
  children,
  buildQueue,
  currentPath,
  selectedInsight,
  topicFilter,
  onAddToBuild,
  onInsightShare,
  onTopicFilterChange
}: AppShellProps) {
  const showRightRail = currentPath === "/today" || currentPath === "/topics";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7ea] via-[#c8eed8] to-[#9adfb9] px-3 py-3 text-slate-800 sm:px-4 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-shell border border-white/60 bg-white/40 shadow-glass backdrop-blur-xl lg:min-h-[calc(100vh-3rem)] lg:flex-row">
        <Sidebar buildCount={buildQueue.length} />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-white/40 px-4 py-4 sm:px-6 lg:h-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-300 shadow-sm">
                <Sparkles className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">
                  Brief<span className="text-[#6bb52b]">2Build</span>
                </h1>
                <p className="text-xs text-slate-500">Daily AI learning loop</p>
              </div>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search insights or topics..."
                className="w-full rounded-full border border-white/60 bg-white/50 py-2.5 pl-11 pr-4 text-sm transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="w-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-[0_4px_14px_rgba(162,234,92,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(162,234,92,0.55)] sm:w-auto">
                Start Learning
              </button>
              <NavLink
                to="/topics"
                className="hidden rounded-full border border-white/60 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white sm:inline-flex"
              >
                Explore Topics
              </NavLink>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-6 lg:px-8">
              {children}
            </div>

            {showRightRail ? (
              <RightRail
                selectedInsight={selectedInsight}
                topicFilter={topicFilter}
                topics={FOCUS_TOPICS}
                onAddToBuild={onAddToBuild}
                onInsightShare={onInsightShare}
                onTopicFilterChange={onTopicFilterChange}
              />
            ) : null}
          </div>

          <div className="border-t border-white/40 bg-white/20 px-4 py-3 lg:hidden">
            <div className="rounded-2xl border border-white/60 bg-white/50 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold text-slate-700">
                <Zap className="h-4 w-4 text-brand-500" />
                Daily Loop
              </p>
              <p className="text-xs text-slate-500">Brief → Build → Learn → Reflect</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
