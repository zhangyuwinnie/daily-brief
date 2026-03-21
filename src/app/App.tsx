import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { AddToBuildModal } from "../components/modals/AddToBuildModal";
import { MOCK_INSIGHTS } from "../data/mockInsights";
import type { AppOutletContext } from "./outlet-context";
import type { BuildItem, BuildStatus, Insight, SkillFocus } from "../types/models";

function inferSkillFocus(insight: Insight): SkillFocus {
  const normalizedTopics = insight.topics.map((topic) => topic.toLowerCase());

  if (normalizedTopics.includes("security")) {
    return "security";
  }

  if (normalizedTopics.includes("evals")) {
    return "evals";
  }

  if (normalizedTopics.includes("rag") || normalizedTopics.includes("retrieval")) {
    return "rag";
  }

  if (normalizedTopics.includes("tooling")) {
    return "tooling";
  }

  return "agents";
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [buildQueue, setBuildQueue] = useState<BuildItem[]>([]);
  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSkill, setModalSkill] = useState<SkillFocus>("agents");
  const [modalNote, setModalNote] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const selectedInsight = useMemo(
    () => MOCK_INSIGHTS.find((insight) => insight.id === params.insightId) ?? null,
    [params.insightId]
  );

  const handleOpenModal = (insight: Insight) => {
    setActiveInsight(insight);
    setModalSkill(inferSkillFocus(insight));
    setModalNote("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveInsight(null);
  };

  const handleSaveToBuild = () => {
    if (!activeInsight) {
      return;
    }

    setBuildQueue((current) => [
      {
        id: crypto.randomUUID(),
        insight: activeInsight,
        skillFocus: modalSkill,
        note: modalNote,
        status: "Inbox",
        addedAt: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric"
        }).format(new Date())
      },
      ...current
    ]);
    handleCloseModal();
    navigate("/build");
  };

  const handleUpdateStatus = (itemId: string, status: BuildStatus) => {
    setBuildQueue((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  return (
    <>
      <AppShell
        buildQueue={buildQueue}
        currentPath={location.pathname}
        selectedInsight={selectedInsight}
        topicFilter={topicFilter}
        onAddToBuild={handleOpenModal}
        onInsightShare={(insight) => navigate(`/insights/${insight.id}`)}
        onTopicFilterChange={setTopicFilter}
      >
        <Outlet
          context={{
            buildQueue,
            selectedInsight,
            topicFilter,
            onAddToBuild: handleOpenModal,
            onInsightShare: (insight: Insight) => navigate(`/insights/${insight.id}`),
            onUpdateStatus: handleUpdateStatus
          } satisfies AppOutletContext}
        />
      </AppShell>

      <AddToBuildModal
        activeInsight={activeInsight}
        isOpen={isModalOpen}
        modalNote={modalNote}
        modalSkill={modalSkill}
        onClose={handleCloseModal}
        onNoteChange={setModalNote}
        onSave={handleSaveToBuild}
        onSkillChange={setModalSkill}
      />
    </>
  );
}
