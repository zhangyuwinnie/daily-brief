import { Sparkles, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { RightRail } from "./RightRail";
import { Sidebar } from "./Sidebar";
import type { Insight } from "../../types/models";

type AppShellProps = {
  children: React.ReactNode;
  buildCount: number;
  currentPath: string;
  topics: string[];
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onAddToBuild: (insight: Insight) => void;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
};

export function AppShell({
  children,
  buildCount,
  currentPath,
  topics,
  selectedInsight,
  topicFilter,
  onAddToBuild,
  onInsightShare,
  onTopicFilterChange
}: AppShellProps) {
  const showRightRail = currentPath === "/today" || currentPath === "/topics";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7ea] via-[#c8eed8] to-[#9adfb9] px-3 py-3 text-slate-800 sm:px-4 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-shell border border-white/70 bg-white/78 shadow-glass lg:min-h-[calc(100vh-3rem)] lg:flex-row">
        <Sidebar buildCount={buildCount} />

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

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-700">
                Personal AI learning system for agent builders.
              </p>
              <p className="text-xs text-slate-500">Brief -&gt; Build -&gt; Learn -&gt; Reflect</p>
            </div>

            <div className="flex items-center gap-3">
              <NavLink
                to="/topics"
                className="inline-flex rounded-full border border-white/60 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
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
                topics={topics}
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
