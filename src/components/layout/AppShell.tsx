import { ArrowUpRight, Sparkles } from "lucide-react";
import { RightRail } from "./RightRail";
import { Sidebar } from "./Sidebar";
import type { Insight } from "../../types/models";

type AppShellProps = {
  children: React.ReactNode;
  currentPath: string;
  topics: string[];
  selectedInsight: Insight | null;
  topicFilter: string | null;
  onInsightShare: (insight: Insight) => void;
  onTopicFilterChange: (topic: string | null) => void;
};

export function AppShell({
  children,
  currentPath,
  topics,
  selectedInsight,
  topicFilter,
  onInsightShare,
  onTopicFilterChange
}: AppShellProps) {
  const showRightRail = currentPath === "/today";

  return (
    <div className="app-page text-[color:var(--text-base)]">
      <div className="app-shell">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b px-4 py-5 sm:px-6 lg:px-10" style={{ borderColor: "var(--border-soft)" }}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 lg:hidden">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                    style={{
                      background: "rgba(111, 123, 93, 0.12)",
                      borderColor: "rgba(111, 123, 93, 0.18)"
                    }}
                  >
                    <Sparkles className="h-5 w-5" style={{ color: "var(--accent-strong)" }} />
                  </div>
                  <div>
                    <p className="eyebrow">Daily Brief</p>
                    <h1 className="display-title text-3xl font-semibold">Brief2Build</h1>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="eyebrow">A private briefing room for agent builders.</p>
                  <div className="max-w-3xl">
                    <p className="text-sm leading-6 text-[color:var(--text-muted)] sm:text-[15px]">
                      Built for the brief → build → learn → reflect loop, with just enough structure
                      to move from signal to action without turning the product into a dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="editorial-panel-muted flex items-center justify-between gap-4 px-4 py-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <div>
                  <p className="eyebrow mb-1">Operating mode</p>
                  <p className="font-semibold text-[color:var(--text-strong)]">Brief → Build → Learn → Reflect</p>
                </div>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--accent-strong)" }} />
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-12 pt-5 sm:px-6 lg:px-10">{children}</div>

            {showRightRail ? (
              <RightRail
                selectedInsight={selectedInsight}
                topicFilter={topicFilter}
                topics={topics}
                onInsightShare={onInsightShare}
                onTopicFilterChange={onTopicFilterChange}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
