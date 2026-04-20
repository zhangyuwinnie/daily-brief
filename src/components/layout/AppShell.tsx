import { Sparkles } from "lucide-react";
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
          <header className="border-b px-4 py-4 sm:px-6 lg:hidden" style={{ borderColor: "var(--border-soft)" }}>
            <div className="flex items-center gap-3">
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
