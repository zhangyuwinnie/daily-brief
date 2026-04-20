import { Headphones, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DailyAudio } from "../../types/models";

type AudioPlayerProps = {
  data: DailyAudio;
  variant?: "standalone" | "compact";
};

function formatDuration(durationSec?: number) {
  if (durationSec === undefined || durationSec < 0) {
    return "--:--";
  }

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AudioPlayer({ data, variant = "standalone" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [loadedDurationSec, setLoadedDurationSec] = useState(data.durationSec ?? 0);
  const [loadError, setLoadError] = useState(false);
  const isPlayable = data.status === "ready" && Boolean(data.audioUrl) && !loadError;
  const statusLabel = loadError
    ? "Playback unavailable"
    : data.status === "ready"
      ? "Ready"
      : data.status === "failed"
        ? "Failed"
        : "Generating...";
  const effectiveDurationSec = loadedDurationSec > 0 ? loadedDurationSec : data.durationSec ?? 0;
  const progress = effectiveDurationSec > 0 ? Math.min((currentTimeSec / effectiveDurationSec) * 100, 100) : 0;
  const isCompact = variant === "compact";

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
    setLoadedDurationSec(data.durationSec ?? 0);
    setLoadError(false);
  }, [data.audioUrl, data.durationSec, data.id, data.status]);

  const hasAudioElement = data.status === "ready" && Boolean(data.audioUrl);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement || !hasAudioElement) {
      return undefined;
    }

    const syncDuration = () => {
      if (Number.isFinite(audioElement.duration) && audioElement.duration > 0) {
        setLoadedDurationSec(Math.floor(audioElement.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTimeSec(audioElement.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTimeSec(audioElement.currentTime);
    };

    const handleError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    audioElement.addEventListener("loadedmetadata", syncDuration);
    audioElement.addEventListener("durationchange", syncDuration);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.removeEventListener("loadedmetadata", syncDuration);
      audioElement.removeEventListener("durationchange", syncDuration);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, [hasAudioElement]);

  const handleTogglePlayback = () => {
    if (!isPlayable) {
      return;
    }

    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      return;
    }

    void audioElement.play().catch(() => {
      setIsPlaying(false);
    });
  };

  return (
    <section
      className={
        isCompact
          ? "rounded-[1.25rem] border p-4"
          : "rounded-[1.8rem] border p-5 shadow-[0_24px_54px_rgba(53,37,20,0.06)] sm:p-6"
      }
      style={{
        borderColor: "var(--border-soft)",
        background: isCompact
          ? "rgba(250,245,236,0.72)"
          : "linear-gradient(135deg, rgba(255,252,247,0.92) 0%, rgba(244,238,229,0.95) 58%, rgba(232,238,226,0.96) 100%)"
      }}
    >
      {data.status === "ready" && data.audioUrl ? (
        <audio ref={audioRef} preload="metadata" src={data.audioUrl} />
      ) : null}

      <div className={`flex flex-col ${isCompact ? "gap-4" : "gap-5"} sm:flex-row sm:items-center`}>
        <button
          onClick={handleTogglePlayback}
          disabled={!isPlayable}
          aria-label={isPlaying ? "Pause audio brief" : "Play audio brief"}
          className={`flex flex-shrink-0 items-center justify-center self-start rounded-full border transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
            isCompact ? "h-12 w-12" : "h-14 w-14"
          }`}
          style={{
            borderColor: "rgba(111,123,93,0.18)",
            background: "rgba(47, 41, 35, 0.96)",
            color: "#f6f1e8"
          }}
        >
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className={`${isCompact ? "mb-2" : "mb-3"} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0">
              {isCompact ? null : <p className="eyebrow mb-1">Audio brief</p>}
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)]">
                <Headphones className="h-4 w-4" style={{ color: "var(--accent-strong)" }} />
                Today&apos;s Audio Brief
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  borderColor:
                    loadError || data.status === "failed"
                      ? "rgba(171,62,62,0.18)"
                      : data.status === "ready"
                        ? "rgba(111,123,93,0.18)"
                        : "rgba(156,113,48,0.18)",
                  background:
                    loadError || data.status === "failed"
                      ? "rgba(252,242,240,0.9)"
                      : data.status === "ready"
                        ? "rgba(111,123,93,0.12)"
                        : "rgba(253,247,238,0.9)",
                  color:
                    loadError || data.status === "failed"
                      ? "#a93f3f"
                      : data.status === "ready"
                        ? "var(--accent-strong)"
                        : "#8b5f28"
                }}
              >
                {statusLabel}
              </span>
              <span className="text-xs font-semibold tabular-nums text-[color:var(--text-muted)]">
                {`${formatDuration(currentTimeSec)} / ${formatDuration(effectiveDurationSec)}`}
              </span>
            </div>
          </div>

          <div
            className={`relative h-2.5 overflow-hidden rounded-full ${
              isPlayable ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ background: "rgba(90,72,50,0.12)" }}
            onClick={(event) => {
              if (!isPlayable) {
                return;
              }

              const audioElement = audioRef.current;
              const seekDurationSec =
                audioElement && Number.isFinite(audioElement.duration) && audioElement.duration > 0
                  ? audioElement.duration
                  : effectiveDurationSec;

              if (!audioElement || !seekDurationSec || seekDurationSec <= 0) {
                return;
              }

              const rect = event.currentTarget.getBoundingClientRect();
              const nextProgress = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
              const nextTime = nextProgress * seekDurationSec;

              audioElement.currentTime = nextTime;
              setCurrentTimeSec(nextTime);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, rgba(82,92,68,0.95), rgba(126,139,108,0.95))"
              }}
            />
          </div>
        </div>

        <div className={`${isCompact ? "hidden xl:flex" : "hidden sm:flex"} items-end gap-1.5 px-1`}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`audio-bar w-1.5 rounded-full ${
                isPlaying && isPlayable ? "is-playing" : "h-1.5"
              }`}
              style={{ background: "rgba(82,92,68,0.62)" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
