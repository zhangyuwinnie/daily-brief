import { Headphones, Pause, Play } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { trackEvent } from "../../lib/analytics";
import type { DailyAudio } from "../../types/models";
import { clearAudioProgress, readAudioProgress, writeAudioProgress } from "./audioProgressStorage";

type AudioPlayerProps = {
  data: DailyAudio;
  variant?: "standalone" | "compact";
};

const PERSIST_INTERVAL_SEC = 5;
const RESUME_END_THRESHOLD_SEC = 3;

function formatDuration(durationSec?: number) {
  if (durationSec === undefined || durationSec < 0) {
    return "--:--";
  }

  const totalSeconds = Math.floor(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getSeekDuration(audioElement: HTMLAudioElement | null, fallbackDurationSec: number) {
  if (audioElement && Number.isFinite(audioElement.duration) && audioElement.duration > 0) {
    return audioElement.duration;
  }

  return fallbackDurationSec;
}

export function AudioPlayer({ data, variant = "standalone" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPointerScrubbingRef = useRef(false);
  const restoredAudioIdRef = useRef<string | null>(null);
  const lastPersistedTimeSecRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [loadedDurationSec, setLoadedDurationSec] = useState(data.durationSec ?? 0);
  const [loadError, setLoadError] = useState(false);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
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
  const visibleProgress = scrubProgress ?? progress;
  const isCompact = variant === "compact";

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
    setScrubProgress(null);
    restoredAudioIdRef.current = null;
    lastPersistedTimeSecRef.current = 0;
  }, [data.id]);

  useEffect(() => {
    setIsPlaying(false);
    setLoadedDurationSec(data.durationSec ?? 0);
    setLoadError(false);
  }, [data.audioUrl, data.durationSec, data.status]);

  const hasAudioElement = data.status === "ready" && Boolean(data.audioUrl);

  const persistCurrentProgress = (force = false) => {
    const audioElement = audioRef.current;

    if (!audioElement || !isPlayable) {
      return;
    }

    const nextTimeSec = audioElement.currentTime;
    if (!Number.isFinite(nextTimeSec) || nextTimeSec <= 0) {
      return;
    }

    if (!force && nextTimeSec - lastPersistedTimeSecRef.current < PERSIST_INTERVAL_SEC) {
      return;
    }

    writeAudioProgress({
      audioId: data.id,
      briefingDate: data.briefingDate,
      audioUrl: data.audioUrl,
      currentTimeSec: nextTimeSec,
      durationSec: getSeekDuration(audioElement, effectiveDurationSec)
    });
    lastPersistedTimeSecRef.current = nextTimeSec;
  };

  const commitSeekProgress = (nextProgress: number) => {
    const audioElement = audioRef.current;
    const seekDurationSec = getSeekDuration(audioElement, effectiveDurationSec);

    if (!audioElement || !seekDurationSec || seekDurationSec <= 0) {
      setScrubProgress(null);
      return;
    }

    const boundedProgress = Math.min(Math.max(nextProgress, 0), 100);
    const nextTimeSec = (boundedProgress / 100) * seekDurationSec;

    audioElement.currentTime = nextTimeSec;
    setCurrentTimeSec(nextTimeSec);
    setScrubProgress(null);
  };

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement || !hasAudioElement) {
      return undefined;
    }

    const syncCurrentTime = () => {
      setCurrentTimeSec(audioElement.currentTime);
    };

    const maybeRestoreProgress = () => {
      if (restoredAudioIdRef.current === data.id || !isPlayable) {
        return;
      }

      if (!Number.isFinite(audioElement.duration) || audioElement.duration <= 0) {
        return;
      }

      const storedProgress = readAudioProgress(data.id);
      if (!storedProgress) {
        restoredAudioIdRef.current = data.id;
        return;
      }

      if (
        !Number.isFinite(storedProgress.currentTimeSec) ||
        storedProgress.currentTimeSec <= 0 ||
        audioElement.duration - storedProgress.currentTimeSec <= RESUME_END_THRESHOLD_SEC
      ) {
        clearAudioProgress(data.id);
        restoredAudioIdRef.current = data.id;
        return;
      }

      audioElement.currentTime = storedProgress.currentTimeSec;
      setCurrentTimeSec(storedProgress.currentTimeSec);
      lastPersistedTimeSecRef.current = storedProgress.currentTimeSec;
      restoredAudioIdRef.current = data.id;
    };

    const syncDuration = () => {
      if (Number.isFinite(audioElement.duration) && audioElement.duration > 0) {
        setLoadedDurationSec(Math.floor(audioElement.duration));
      }

      maybeRestoreProgress();
    };

    const handleTimeUpdate = () => {
      syncCurrentTime();
      persistCurrentProgress(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      syncCurrentTime();
      persistCurrentProgress(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      syncCurrentTime();
      lastPersistedTimeSecRef.current = 0;
      clearAudioProgress(data.id);
    };

    const handleError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    const handleSeeking = () => {
      syncCurrentTime();
    };

    const handleSeeked = () => {
      syncCurrentTime();
      persistCurrentProgress(true);
    };

    const handlePageHide = () => {
      persistCurrentProgress(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistCurrentProgress(true);
      }
    };

    audioElement.addEventListener("loadedmetadata", syncDuration);
    audioElement.addEventListener("durationchange", syncDuration);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("seeking", handleSeeking);
    audioElement.addEventListener("seeked", handleSeeked);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    syncDuration();
    maybeRestoreProgress();

    return () => {
      audioElement.removeEventListener("loadedmetadata", syncDuration);
      audioElement.removeEventListener("durationchange", syncDuration);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("seeking", handleSeeking);
      audioElement.removeEventListener("seeked", handleSeeked);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [data.audioUrl, data.briefingDate, data.id, effectiveDurationSec, hasAudioElement, isPlayable]);

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

    trackEvent({ event: "audio_play", category: "audio", label: data.id });
    void audioElement.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const handleSliderValueChange = (nextProgress: number) => {

    if (!Number.isFinite(nextProgress)) {
      return;
    }

    if (isPointerScrubbingRef.current) {
      setScrubProgress(nextProgress);
      return;
    }

    commitSeekProgress(nextProgress);
  };

  const handleSliderInput = (event: FormEvent<HTMLInputElement>) => {
    handleSliderValueChange(Number(event.currentTarget.value));
  };

  const handleSliderPointerDown = () => {
    isPointerScrubbingRef.current = true;
    setScrubProgress(progress);
  };

  const handleSliderPointerUp = () => {
    if (!isPointerScrubbingRef.current) {
      return;
    }

    isPointerScrubbingRef.current = false;

    if (scrubProgress !== null) {
      commitSeekProgress(scrubProgress);
      return;
    }

    setScrubProgress(null);
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
          aria-label={isPlaying ? "Pause deep dive podcast" : "Play deep dive podcast"}
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
              {isCompact ? null : <p className="eyebrow mb-1">THE DEEP DIVE PODCAST</p>}
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)]">
                <Headphones className="h-4 w-4" style={{ color: "var(--accent-strong)" }} />
                Decode Today&apos;s AI Trends
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
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-linear"
              style={{
                width: `${visibleProgress}%`,
                background: "linear-gradient(90deg, rgba(82,92,68,0.95), rgba(126,139,108,0.95))"
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={visibleProgress}
              onInput={handleSliderInput}
              onPointerDown={handleSliderPointerDown}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
              disabled={!isPlayable}
              aria-label="Seek deep dive podcast"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
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
