import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { AddToBuildModal } from "../components/modals/AddToBuildModal";
import { getAllInsights, getInsightById } from "../lib/briefings/generatedContentLoader";
import {
  deriveBuildQueueFromInsightStates,
  inferSkillFocusFromInsight,
  readInsightStates,
  saveInsightForBuild,
  updateInsightStateStatus,
  writeInsightStates
} from "../lib/insightStateStore";
import type { AppOutletContext } from "./outlet-context";
import type { BuildStatus, Insight, InsightState, SkillFocus } from "../types/models";

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [insightStates, setInsightStates] = useState<InsightState[]>(() => readInsightStates());
  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSkill, setModalSkill] = useState<SkillFocus>("agents");
  const [modalNote, setModalNote] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const buildQueue = useMemo(
    () => deriveBuildQueueFromInsightStates(insightStates, getAllInsights()),
    [insightStates]
  );
  const insightStatesById = useMemo(
    () => new Map(insightStates.map((state) => [state.insightId, state] as const)),
    [insightStates]
  );

  const selectedInsight = useMemo(
    () => (params.insightId ? getInsightById(params.insightId) : null),
    [params.insightId]
  );

  useEffect(() => {
    writeInsightStates(insightStates);
  }, [insightStates]);

  const handleOpenModal = (insight: Insight) => {
    const existingState = insightStatesById.get(insight.id);

    setActiveInsight(insight);
    setModalSkill(existingState?.skillFocus ?? inferSkillFocusFromInsight(insight));
    setModalNote(existingState?.note ?? "");
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

    setInsightStates((current) =>
      saveInsightForBuild(
        current,
        {
          insightId: activeInsight.id,
          note: modalNote,
          skillFocus: modalSkill
        },
        new Date().toISOString()
      )
    );
    handleCloseModal();
    navigate("/build");
  };

  const handleUpdateStatus = (itemId: string, status: BuildStatus) => {
    setInsightStates((current) =>
      updateInsightStateStatus(current, itemId, status, new Date().toISOString())
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
            onTopicFilterChange: setTopicFilter,
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
