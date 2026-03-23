import { Target } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../app/outlet-context";
import { BuildItemCard } from "../components/cards/BuildItemCard";

export function BuildQueuePage() {
  const { buildQueue, onUpdateStatus } = useOutletContext<AppOutletContext>();
  const inboxItems = buildQueue.filter((item) => item.status === "Inbox");
  const interestedItems = buildQueue.filter((item) => item.status === "Interested");
  const activeItems = buildQueue.filter(
    (item) => item.status === "Building" || item.status === "Learned" || item.status === "Archived"
  );

  return (
    <div className="animate-enter flex h-full flex-col">
      <div className="mb-8 mt-2">
        <h2 className="mb-2 text-3xl font-black text-slate-800">Build Queue</h2>
        <p className="text-slate-500">Turn today&apos;s signals into concrete build and learning moves.</p>
      </div>

      {buildQueue.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-card border-2 border-dashed border-white/60 bg-white/20 px-6 py-16 text-center">
          <Target className="mb-4 h-16 w-16 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">Your queue is empty</h3>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Review today&apos;s brief to find something worth building or learning.
          </p>
          <Link
            to="/today"
            className="rounded-full border border-slate-100 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50"
          >
            Open Today&apos;s Brief
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-card border border-white/50 bg-white/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Inbox
              </h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-400">
                {inboxItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {inboxItems.map((item) => (
                <BuildItemCard key={item.id} item={item} onUpdateStatus={onUpdateStatus} />
              ))}
            </div>
          </section>

          <section className="rounded-card border border-white/60 bg-white/35 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Interested
              </h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-400">
                {interestedItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {interestedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/60 py-8 text-center text-sm text-slate-400">
                  Move an item to Interested when you want to keep it warm without starting yet.
                </div>
              ) : (
                interestedItems.map((item) => (
                  <BuildItemCard key={item.id} item={item} onUpdateStatus={onUpdateStatus} />
                ))
              )}
            </div>
          </section>

          <section className="rounded-card border border-white/60 bg-white/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Building & Finished
              </h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-400">
                {activeItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {activeItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/60 py-8 text-center text-sm text-slate-400">
                  Move an item to Building, Learned, or Archived to track progress here.
                </div>
              ) : (
                activeItems.map((item) => (
                  <BuildItemCard key={item.id} item={item} onUpdateStatus={onUpdateStatus} />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
