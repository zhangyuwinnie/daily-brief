import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AddToBuildModal } from "../components/modals/AddToBuildModal";
import {
  getAllInsights,
  getAvailableTopics,
  getInsightDateById,
  getInsightById,
  loadDayData,
  loadGeneratedContentSources,
  subscribeGeneratedContentUpdates
} from "../lib/briefings/generatedContentLoader";
import {
  deriveBuildQueueFromInsightStates,
  inferSkillFocusFromInsight,
  readInsightStates,
  saveInsightForBuild,
  updateInsightStateStatus,
  writeInsightStates
} from "../lib/insightStateStore";
import type { BuildItem, BuildStatus, Insight, InsightState, SkillFocus } from "../types/models";
import type { AppOutletContext } from "./outlet-context";

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [generatedContentStatus, setGeneratedContentStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [generatedContentError, setGeneratedContentError] = useState<string | null>(null);
  const [generatedContentRevision, setGeneratedContentRevision] = useState(0);
  const [insightStates, setInsightStates] = useState<InsightState[]>(() => readInsightStates());
  const [buildQueue, setBuildQueue] = useState<BuildItem[]>([]);
  const [buildQueueStatus, setBuildQueueStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [buildQueueError, setBuildQueueError] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSkill, setModalSkill] = useState<SkillFocus>("agents");
  const [modalNote, setModalNote] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const availableTopics = useMemo(
    () => (generatedContentStatus === "ready" ? getAvailableTopics() : []),
    [generatedContentRevision, generatedContentStatus]
  );
  const insightStatesById = useMemo(
    () => new Map(insightStates.map((state) => [state.insightId, state] as const)),
    [insightStates]
  );
  const selectedInsight = useMemo(
    () =>
      generatedContentStatus === "ready" && params.insightId ? getInsightById(params.insightId) : null,
    [generatedContentRevision, generatedContentStatus, params.insightId]
  );

  useEffect(() => subscribeGeneratedContentUpdates(() => setGeneratedContentRevision((current) => current + 1)), []);

  useEffect(() => {
    let isDisposed = false;

    loadGeneratedContentSources()
      .then(() => {
        if (isDisposed) {
          return;
        }

        setGeneratedContentStatus("ready");
        setGeneratedContentError(null);
      })
      .catch((error) => {
        if (isDisposed) {
          return;
        }

        setGeneratedContentStatus("error");
        setGeneratedContentError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  useEffect(() => {
    writeInsightStates(insightStates);
  }, [insightStates]);

  useEffect(() => {
    if (generatedContentStatus !== "ready") {
      setBuildQueue([]);
      setBuildQueueStatus("idle");
      setBuildQueueError(null);
      return;
    }

    if (insightStates.length === 0) {
      setBuildQueue([]);
      setBuildQueueStatus("ready");
      setBuildQueueError(null);
      return;
    }

    const requiredDates = Array.from(
      new Set(
        insightStates.flatMap((state) => {
          const insightDate = getInsightDateById(state.insightId);
          return insightDate ? [insightDate] : [];
        })
      )
    );

    if (requiredDates.length === 0) {
      setBuildQueue([]);
      setBuildQueueStatus("ready");
      setBuildQueueError(null);
      return;
    }

    let isDisposed = false;
    setBuildQueueStatus("loading");
    setBuildQueueError(null);

    Promise.all(requiredDates.map((date) => loadDayData(date)))
      .then(() => {
        if (isDisposed) {
          return;
        }

        setBuildQueue(deriveBuildQueueFromInsightStates(insightStates, getAllInsights()));
        setBuildQueueStatus("ready");
      })
      .catch((error) => {
        if (isDisposed) {
          return;
        }

        setBuildQueue([]);
        setBuildQueueStatus("error");
        setBuildQueueError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isDisposed = true;
    };
  }, [generatedContentStatus, insightStates]);

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

  if (generatedContentStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f7ea] via-[#c8eed8] to-[#9adfb9] px-3 py-3 text-slate-800 sm:px-4 md:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1400px] items-center justify-center rounded-shell border border-white/60 bg-white/40 px-6 py-20 text-center shadow-glass backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
          <div className="max-w-md">
            <h1 className="text-2xl font-black text-slate-800">Loading generated briefings...</h1>
            <p className="mt-3 text-sm text-slate-600">
              Fetching the latest brief and audio manifests from <code>/generated</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (generatedContentStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f7ea] via-[#c8eed8] to-[#9adfb9] px-3 py-3 text-slate-800 sm:px-4 md:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1400px] items-center justify-center rounded-shell border border-rose-200 bg-white/50 px-6 py-20 text-center shadow-glass backdrop-blur-xl lg:min-h-[calc(100vh-3rem)]">
          <div className="max-w-lg">
            <h1 className="text-2xl font-black text-slate-800">Generated content failed to load</h1>
            <p className="mt-3 text-sm text-slate-600">
              Run <code>npm run sync:generated</code>, confirm the files exist under <code>public/generated</code>,
              then reload the app.
            </p>
            {generatedContentError ? (
              <p className="mt-3 text-xs text-rose-700">{generatedContentError}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
        buildCount={insightStates.length}
        currentPath={location.pathname}
        topics={availableTopics}
        selectedInsight={selectedInsight}
        topicFilter={topicFilter}
        onAddToBuild={handleOpenModal}
        onInsightShare={(insight) => navigate(`/insights/${insight.id}`)}
        onTopicFilterChange={setTopicFilter}
      >
        <Outlet
          context={{
            buildQueue,
            buildQueueError,
            buildQueueStatus,
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
