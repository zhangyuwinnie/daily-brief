import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { AudioPlayer } from "../components/audio/AudioPlayer";
import { InsightCard } from "../components/cards/InsightCard";
import {
  getAvailableBriefingDates,
  getDailyBriefPageState,
  loadDayData
} from "../lib/briefings/generatedContentLoader";
import type { DailyAudio } from "../types/models";
import type { TodaySectionItem } from "./todaySections";
import { buildTodaySections } from "./todaySections";

type AudioStatusNotice = {
  tone: "warning" | "error";
  message: string;
};

export function getAudioStatusNotice(
  date: string,
  audio: DailyAudio | undefined,
  missingAudio: boolean
): AudioStatusNotice | null {
  if (!audio) {
    if (!missingAudio) {
      return null;
    }

    return {
      tone: "warning",
      message: `No audio metadata was generated for ${date} yet. Run the upstream audio job, then refresh this page.`
    };
  }

  if (audio.status === "failed") {
    return audio.errorMessage
      ? {
          tone: "error",
          message: `Audio generation failed for ${date}: ${audio.errorMessage}`
        }
      : {
          tone: "error",
          message: `Audio generation failed for ${date}. Re-run the upstream audio job and refresh.`
        };
  }

  if (audio.status === "pending") {
    return {
      tone: "warning",
      message: `Audio for ${date} is still generating. Check back after the upstream audio job finishes.`
    };
  }

  if (!audio.audioUrl) {
    return {
      tone: "warning",
      message: `Audio for ${date} is marked ready, but no playable file URL was generated. Re-run the upstream audio job and regenerate the audio manifest.`
    };
  }

  return null;
}

type TodaySignalSectionProps = {
  title: string;
  description: string;
  items: TodaySectionItem[];
  accentColor: string;
  panelTone: string;
};

function TodaySignalSection({ title, description, items, accentColor, panelTone }: TodaySignalSectionProps) {
  return (
    <section className="editorial-panel p-5">
      <div className="mb-4">
        <p className="eyebrow mb-2">{title}</p>
        <h3 className="display-title text-3xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{description}</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={`${title}-${item.id}`}
            className="rounded-[1.35rem] border p-4"
            style={{
              borderColor: "var(--border-soft)",
              background: panelTone
            }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="eyebrow !tracking-[0.18em]">{item.sourceLabel}</span>
              {item.sourceName ? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  {item.sourceName}
                </span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-12 w-px rounded-full" style={{ background: accentColor }} />
              <div>
                <h4 className="text-base font-semibold leading-snug text-[color:var(--text-strong)]">
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] hover:decoration-current"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{item.content}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatePanel({
  eyebrow,
  title,
  body,
  tone = "default",
  extra
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  tone?: "default" | "warning" | "error";
  extra?: React.ReactNode;
}) {
  const toneStyles =
    tone === "error"
      ? { borderColor: "rgba(171, 62, 62, 0.22)", background: "rgba(252, 242, 240, 0.9)" }
      : tone === "warning"
        ? { borderColor: "rgba(156, 113, 48, 0.22)", background: "rgba(253, 247, 238, 0.9)" }
        : { borderColor: "var(--border-soft)", background: "var(--surface-strong)" };

  return (
    <section
      className="animate-enter rounded-[1.7rem] border p-6 shadow-[0_18px_50px_rgba(53,37,20,0.06)]"
      style={toneStyles}
    >
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 className="display-title text-4xl font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{body}</div>
      {extra ? <div className="mt-4 text-xs">{extra}</div> : null}
    </section>
  );
}

export function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { topicFilter, onInsightShare } = useOutletContext<AppOutletContext>();
  const requestedDate = searchParams.get("date") ?? undefined;
  const pageState = getDailyBriefPageState(requestedDate);
  const pageData = pageState.pageData;
  const availableDates = getAvailableBriefingDates();
  const [dayLoadStatus, setDayLoadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [dayLoadError, setDayLoadError] = useState<string | null>(null);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  useEffect(() => {
    if (!pageState.resolvedDate || pageData) {
      setDayLoadStatus("idle");
      setDayLoadError(null);
      return;
    }

    let isDisposed = false;
    setDayLoadStatus("loading");
    setDayLoadError(null);

    loadDayData(pageState.resolvedDate)
      .then(() => {
        if (!isDisposed) {
          setDayLoadStatus("idle");
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setDayLoadStatus("error");
          setDayLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [pageData, pageState.resolvedDate]);

  if (!pageData && dayLoadStatus === "loading" && pageState.resolvedDate) {
    return (
      <StatePanel
        eyebrow="Loading"
        title="Loading today&apos;s brief"
        body={<p>Fetching the generated briefing payload for {pageState.resolvedDate}.</p>}
      />
    );
  }

  if (!pageData && dayLoadStatus === "error") {
    return (
      <StatePanel
        eyebrow="Load error"
        title="Today&apos;s brief failed to load"
        tone="error"
        body={
          <p>
            The generated day payload could not be fetched. Re-run <code>npm run sync:generated</code>{" "}
            and reload the app.
          </p>
        }
        extra={dayLoadError ? <p className="text-rose-700">{dayLoadError}</p> : null}
      />
    );
  }

  if (!pageData) {
    return (
      <StatePanel
        eyebrow="Unavailable"
        title="Today&apos;s brief unavailable"
        tone="warning"
        body={
          <p>
            {pageState.requestedDateWasUnavailable && requestedDate
              ? `No generated brief is available for ${requestedDate}. `
              : ""}
            Generated daily content is unavailable. Run <code>npm run sync:generated</code> and reload the
            app.
          </p>
        }
      />
    );
  }

  const insights = topicFilter
    ? pageData.insights.filter((insight) => insight.topics.includes(topicFilter))
    : pageData.insights;
  const todaySections = buildTodaySections(insights);
  const audioStatusNotice = getAudioStatusNotice(pageData.date, pageData.audio, pageState.missingAudio);
  const handleDateSelect = (date: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("date", date);
    setSearchParams(nextSearchParams);
    setIsDateMenuOpen(false);
  };
  const visibleSignalSections = [
    todaySections.whyItMatters.length > 0 ? (
      <TodaySignalSection
        key="why"
        title="Why It Matters"
        description="Keep the day grounded in what actually changed and why it matters to builders."
        items={todaySections.whyItMatters}
        accentColor="rgba(64, 53, 44, 0.38)"
        panelTone="rgba(250, 247, 241, 0.88)"
      />
    ) : null,
    todaySections.buildThisToday.length > 0 ? (
      <TodaySignalSection
        key="build"
        title="Build This Today"
        description="Turn one useful signal into a concrete build move while the context is still fresh."
        items={todaySections.buildThisToday}
        accentColor="rgba(111, 123, 93, 0.9)"
        panelTone="rgba(239, 245, 233, 0.92)"
      />
    ) : null,
    todaySections.learnThisNext.length > 0 ? (
      <TodaySignalSection
        key="learn"
        title="Learn This Next"
        description="Pick the next concept or tool worth carrying into the next work session."
        items={todaySections.learnThisNext}
        accentColor="rgba(116, 134, 146, 0.85)"
        panelTone="rgba(240, 244, 246, 0.92)"
      />
    ) : null
  ].filter(Boolean);

  return (
    <div className="animate-enter">
      {pageState.requestedDateWasUnavailable && requestedDate ? (
        <section
          className="mb-5 rounded-[1.35rem] border px-4 py-4 text-sm shadow-[0_12px_32px_rgba(53,37,20,0.05)]"
          style={{
            borderColor: "rgba(156, 113, 48, 0.2)",
            background: "rgba(253, 247, 238, 0.88)",
            color: "#8b5f28"
          }}
        >
          <p className="font-semibold">Requested date {requestedDate} is unavailable.</p>
          <p className="mt-1">Showing the latest generated brief for {pageData.date} instead.</p>
        </section>
      ) : null}

      <section data-testid="today-brief-card" className="editorial-panel mb-8 overflow-hidden p-6 sm:p-7">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow mb-3">Daily dossier</p>
              <h2 className="display-title text-[2.8rem] font-semibold leading-[0.94] sm:text-[3.6rem]">
                Today&apos;s Brief
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)] sm:text-[15px]">
                Scan the signal, listen once, and leave with a build direction.
              </p>
            </div>

            <div
              data-testid="today-brief-meta"
              className="flex flex-wrap items-end gap-3 sm:flex-col sm:items-end"
            >
              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  data-testid="selected-date-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isDateMenuOpen}
                  aria-controls="available-brief-dates"
                  aria-label={`Selected date ${pageData.date}. Choose another generated brief date.`}
                  onClick={() => setIsDateMenuOpen((isOpen) => !isOpen)}
                  className="editorial-panel-muted w-full px-4 py-3 text-left transition-colors hover:bg-[rgba(245,238,227,0.92)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,123,93,0.35)] sm:w-auto"
                >
                  <span className="eyebrow mb-1 block">Selected date</span>
                  <span className="block text-sm font-semibold text-[color:var(--text-strong)]">{pageData.date}</span>
                </button>
                {isDateMenuOpen ? (
                  <div
                    id="available-brief-dates"
                    role="listbox"
                    aria-label="Available brief dates"
                    className="mt-2 max-h-72 w-full overflow-y-auto rounded-[1.25rem] border p-2 shadow-[0_18px_45px_rgba(53,37,20,0.12)] sm:w-48"
                    style={{
                      borderColor: "var(--border-soft)",
                      background: "rgba(255,252,247,0.98)"
                    }}
                  >
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        type="button"
                        role="option"
                        aria-selected={date === pageData.date}
                        onClick={() => handleDateSelect(date)}
                        className="flex w-full items-center justify-between rounded-[0.9rem] px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-[rgba(111,123,93,0.1)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,123,93,0.28)]"
                        style={{
                          color: date === pageData.date ? "var(--accent-strong)" : "var(--text-base)",
                          background: date === pageData.date ? "rgba(111,123,93,0.12)" : "transparent"
                        }}
                      >
                        <span>{date}</span>
                        {date === pageData.date ? <span className="text-xs uppercase tracking-[0.16em]">Now</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {topicFilter ? (
                <div
                  className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: "rgba(111,123,93,0.18)",
                    background: "rgba(111,123,93,0.12)",
                    color: "var(--accent-strong)"
                  }}
                >
                  {topicFilter}
                </div>
              ) : null}
            </div>
          </div>

          <div data-testid="today-brief-audio" className="w-full">
            {pageData.audio ? (
              <div>
                <AudioPlayer data={pageData.audio} />
                {audioStatusNotice ? (
                  <p
                    className={`mt-3 text-sm ${
                      audioStatusNotice.tone === "error" ? "text-rose-700" : "text-[#8b5f28]"
                    }`}
                  >
                    {audioStatusNotice.message}
                  </p>
                ) : null}
              </div>
            ) : (
              <section
                className="rounded-[1.6rem] border p-5 text-sm shadow-[0_14px_34px_rgba(53,37,20,0.05)]"
                style={{
                  borderColor: "rgba(156, 113, 48, 0.2)",
                  background: "rgba(253, 247, 238, 0.88)",
                  color: "var(--text-base)"
                }}
              >
                <h3 className="font-semibold text-[color:var(--text-strong)]">Audio brief unavailable</h3>
                <p className="mt-1">
                  {audioStatusNotice?.message ?? `Audio metadata is unavailable for ${pageData.date}.`}
                </p>
              </section>
            )}
          </div>
        </div>
      </section>

      {insights.length > 0 ? (
        <div className="space-y-10">
          <section>
            <div className="mb-5">
              <p className="eyebrow mb-2">Priority read</p>
              <h3 className="display-title text-4xl font-semibold">Top Signals</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                The few items worth reading first before the day fragments into tabs and meetings.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {todaySections.topSignals.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onShare={() => onInsightShare(insight)} />
              ))}
            </div>
          </section>

          {visibleSignalSections.length > 0 ? (
            <div
              className={`grid gap-4 ${
                visibleSignalSections.length === 1
                  ? "grid-cols-1"
                  : visibleSignalSections.length === 2
                    ? "xl:grid-cols-2"
                    : "xl:grid-cols-3"
              }`}
            >
              {visibleSignalSections}
            </div>
          ) : null}

          {todaySections.moreSignals.length > 0 ? (
            <section>
              <div className="mb-5">
                <p className="eyebrow mb-2">Remaining queue</p>
                <h3 className="display-title text-4xl font-semibold">More Signals</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                  The rest of the day&apos;s material, kept visible without pretending each item deserves equal
                  weight.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                {todaySections.moreSignals.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} onShare={() => onInsightShare(insight)} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <section className="editorial-panel p-5 text-sm text-[color:var(--text-base)]">
          No signals are available for {pageData.date}
          {topicFilter ? ` under the ${topicFilter} topic filter.` : "."}
        </section>
      )}
    </div>
  );
}
