import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { AudioPlayer } from "../components/audio/AudioPlayer";
import { InsightCard } from "../components/cards/InsightCard";
import { getDailyBriefPageState } from "../lib/briefings/generatedContentLoader";
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
  accentClassName: string;
  borderClassName: string;
  backgroundClassName: string;
};

function TodaySignalSection({
  title,
  description,
  items,
  accentClassName,
  borderClassName,
  backgroundClassName
}: TodaySignalSectionProps) {
  return (
    <section className={`rounded-card border p-5 shadow-soft ${borderClassName} ${backgroundClassName}`}>
      <div className="mb-4">
        <h3 className="text-lg font-black text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={`${title}-${item.id}`}
            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-4"
          >
            <div className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${accentClassName}`} />
            <div className="mb-2 flex flex-wrap items-center gap-2 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {item.sourceLabel}
              </span>
              {item.sourceName ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.sourceName}
                </span>
              ) : null}
            </div>
            <div className="pl-2">
              <h4 className="text-sm font-bold leading-snug text-slate-800">
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-transparent underline-offset-4 transition-colors transition-[text-decoration-color] hover:decoration-current"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TodayPage() {
  const [searchParams] = useSearchParams();
  const { topicFilter, onAddToBuild, onInsightShare } = useOutletContext<AppOutletContext>();
  const requestedDate = searchParams.get("date") ?? undefined;
  const pageState = getDailyBriefPageState(requestedDate);
  const pageData = pageState.pageData;

  if (!pageData) {
    return (
      <div className="animate-enter">
        <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-slate-800 shadow-soft">
          <h2 className="mb-2 text-2xl font-black text-slate-800">Today&apos;s Brief Unavailable</h2>
          <p className="text-sm text-slate-600">
            {pageState.requestedDateWasUnavailable && requestedDate
              ? `No generated brief is available for ${requestedDate}. `
              : ""}
            Generated daily content is unavailable. Run <code>npm run sync:generated</code> and reload
            the app.
          </p>
        </section>
      </div>
    );
  }

  const insights = topicFilter
    ? pageData.insights.filter((insight) => insight.topics.includes(topicFilter))
    : pageData.insights;
  const todaySections = buildTodaySections(insights);
  const audioStatusNotice = getAudioStatusNotice(pageData.date, pageData.audio, pageState.missingAudio);
  const visibleSignalSections = [
    todaySections.whyItMatters.length > 0 ? (
      <TodaySignalSection
        key="why"
        title="Why It Matters"
        description="Keep the day grounded in the practical significance of each signal."
        items={todaySections.whyItMatters}
        accentClassName="bg-slate-300"
        borderClassName="border-slate-200"
        backgroundClassName="bg-slate-50/70"
      />
    ) : null,
    todaySections.buildThisToday.length > 0 ? (
      <TodaySignalSection
        key="build"
        title="Build This Today"
        description="Pull the most buildable next step out of the same real dataset."
        items={todaySections.buildThisToday}
        accentClassName="bg-brand-500"
        borderClassName="border-[#cbebb2]"
        backgroundClassName="bg-[#f2faed]"
      />
    ) : null,
    todaySections.learnThisNext.length > 0 ? (
      <TodaySignalSection
        key="learn"
        title="Learn This Next"
        description="Keep one concrete learning thread alive while the signal is still fresh."
        items={todaySections.learnThisNext}
        accentClassName="bg-sky-400"
        borderClassName="border-sky-200"
        backgroundClassName="bg-sky-50/80"
      />
    ) : null
  ].filter(Boolean);

  return (
    <div className="animate-enter">
      {pageState.requestedDateWasUnavailable && requestedDate ? (
        <section className="mb-5 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-soft">
          <p className="font-semibold">Requested date {requestedDate} is unavailable.</p>
          <p className="mt-1 text-amber-800">
            Showing the latest generated brief for {pageData.date} instead.
          </p>
        </section>
      ) : null}

      <div className="mb-6 mt-2 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-3xl font-black text-slate-800">Today&apos;s Brief</h2>
          <p className="text-slate-500">Listen to the highlights or scan the top signals below.</p>
        </div>
        <div className="rounded-full border border-white/60 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700">
          {pageData.date}
        </div>
      </div>

      <div className="mb-8">
        {pageData.audio ? (
          <div>
            <AudioPlayer data={pageData.audio} />
            {audioStatusNotice ? (
              <p
                className={`mt-3 text-sm ${
                  audioStatusNotice.tone === "error" ? "text-rose-700" : "text-amber-700"
                }`}
              >
                {audioStatusNotice.message}
              </p>
            ) : null}
          </div>
        ) : (
          <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700 shadow-soft">
            <h3 className="mb-1 font-bold text-slate-800">Audio brief unavailable</h3>
            <p>{audioStatusNotice?.message ?? `Audio metadata is unavailable for ${pageData.date}.`}</p>
          </section>
        )}
      </div>

      {topicFilter ? (
        <div className="mb-5 inline-flex rounded-full border border-white/60 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-700">
          Filter: {topicFilter}
        </div>
      ) : null}

      {insights.length > 0 ? (
        <div className="space-y-10">
          <section>
            <div className="mb-5">
              <h3 className="text-2xl font-black text-slate-800">Top Signals</h3>
              <p className="mt-1 text-sm text-slate-600">
                The highest-signal ideas worth scanning first from the selected day.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {todaySections.topSignals.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAdd={() => onAddToBuild(insight)}
                  onShare={() => onInsightShare(insight)}
                />
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
                <h3 className="text-2xl font-black text-slate-800">More Signals</h3>
                <p className="mt-1 text-sm text-slate-600">
                  The rest of the selected day, kept on the page without crowding the primary sections.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                {todaySections.moreSignals.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onAdd={() => onAddToBuild(insight)}
                    onShare={() => onInsightShare(insight)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-amber-200 bg-amber-50 p-5 text-sm text-slate-700 shadow-soft">
            No insights are available for {pageData.date}
            {topicFilter ? ` under the ${topicFilter} topic filter.` : "."}
          </section>
        </div>
      )}
    </div>
  );
}
