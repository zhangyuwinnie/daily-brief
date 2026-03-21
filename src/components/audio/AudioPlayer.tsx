import { Headphones, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { DailyAudio } from "../../types/models";

type AudioPlayerProps = {
  data: DailyAudio;
};

function formatDuration(durationSec?: number) {
  if (!durationSec || durationSec <= 0) {
    return "--:--";
  }

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AudioPlayer({ data }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const isPlayable = data.status === "ready" && Boolean(data.audioUrl);
  const statusLabel =
    data.status === "ready" ? "Ready" : data.status === "failed" ? "Failed" : "Generating...";

  useEffect(() => {
    if (!isPlaying || !isPlayable) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 100 ? 0 : current + 0.5));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlayable, isPlaying]);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-[#bce89d] bg-gradient-to-r from-[#e3f4d7] to-[#d0efba] p-5 shadow-sm sm:flex-row sm:items-center">
      <button
        onClick={() => {
          if (!isPlayable) {
            return;
          }

          setIsPlaying((current) => !current);
        }}
        disabled={!isPlayable}
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center self-start rounded-full bg-slate-900 text-brand-500 shadow-lg transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200 disabled:hover:scale-100"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6 fill-current" />
        ) : (
          <Play className="ml-1 h-6 w-6 fill-current" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Headphones className="h-4 w-4 text-[#5c962c]" />
              Today's Audio Brief
            </h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                data.status === "ready"
                  ? "border-white/60 bg-white/50 text-[#5c962c]"
                  : data.status === "failed"
                    ? "border-rose-200 bg-rose-100 text-rose-600"
                    : "border-amber-200 bg-amber-100 text-amber-600"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">
            {formatDuration(data.durationSec)}
          </span>
        </div>

        <div
          className={`relative h-2 overflow-hidden rounded-full bg-white/40 ${
            isPlayable ? "cursor-pointer" : "cursor-not-allowed"
          }`}
          onClick={(event) => {
            if (!isPlayable) {
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            setProgress(((event.clientX - rect.left) / rect.width) * 100);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#5c962c] transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="hidden items-end gap-1 px-2 sm:flex">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`audio-bar w-1.5 rounded-full bg-[#5c962c]/60 ${
              isPlaying && isPlayable ? "is-playing" : "h-1"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
