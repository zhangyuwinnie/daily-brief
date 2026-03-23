import { Clock, MessageSquare } from "lucide-react";
import type { BuildItem, BuildStatus } from "../../types/models";

type BuildItemCardProps = {
  item: BuildItem;
  onUpdateStatus: (itemId: string, status: BuildStatus) => void;
};

function getStatusAccentClassName(status: BuildStatus) {
  switch (status) {
    case "Inbox":
      return "bg-blue-400";
    case "Interested":
      return "bg-amber-400";
    case "Building":
      return "bg-orange-400";
    case "Learned":
      return "bg-brand-500";
    case "Archived":
      return "bg-slate-400";
  }
}

function getStatusCardClassName(status: BuildStatus) {
  switch (status) {
    case "Learned":
      return "border-brand-500 bg-[#f9fdf6]";
    case "Archived":
      return "border-slate-200 bg-slate-50";
    case "Interested":
      return "border-amber-200 bg-amber-50/60";
    default:
      return "border-slate-100";
  }
}

function getStatusSelectClassName(status: BuildStatus) {
  switch (status) {
    case "Inbox":
      return "border-blue-100 bg-blue-50 text-blue-600";
    case "Interested":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "Building":
      return "border-orange-100 bg-orange-50 text-orange-600";
    case "Learned":
      return "border-[#cbebb2] bg-[#f0f9eb] text-[#4d7e1f]";
    case "Archived":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function BuildItemCard({ item, onUpdateStatus }: BuildItemCardProps) {
  const buildIdea = item.insight.buildIdea ?? item.insight.take;
  const effortEstimate = item.insight.effortEstimate ?? "TBD";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:border-[#cbebb2] ${getStatusCardClassName(item.status)}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${getStatusAccentClassName(item.status)}`} />

      <div className="mb-2 flex items-start justify-between gap-3 pl-1">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {item.skillFocus}
        </span>
        <span className="text-[10px] font-medium text-slate-400">{item.addedAt}</span>
      </div>

      <h4 className="mb-1 line-clamp-2 pl-1 text-sm font-bold leading-tight text-slate-800">
        {buildIdea}
      </h4>
      <p className="mb-3 line-clamp-1 pl-1 text-xs text-slate-500">From: {item.insight.title}</p>

      {item.note ? (
        <div className="mb-3 ml-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
          <p className="flex items-start gap-1.5 text-xs italic text-slate-600">
            <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400" />
            {item.note}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-50 pt-3 pl-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <Clock className="h-3 w-3" />
          {effortEstimate}
        </div>

        <select
          value={item.status}
          onChange={(event) => onUpdateStatus(item.id, event.target.value as BuildStatus)}
          className={`rounded-lg border px-2 py-1 text-xs font-bold outline-none transition-colors ${getStatusSelectClassName(item.status)}`}
        >
          <option value="Inbox">Inbox</option>
          <option value="Interested">Interested</option>
          <option value="Building">Building</option>
          <option value="Learned">Learned</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
    </article>
  );
}
