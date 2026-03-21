import { Plus } from "lucide-react";
import type { Insight, SkillFocus } from "../../types/models";

type AddToBuildModalProps = {
  activeInsight: Insight | null;
  isOpen: boolean;
  modalNote: string;
  modalSkill: SkillFocus;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onSave: () => void;
  onSkillChange: (value: SkillFocus) => void;
};

const SKILLS: SkillFocus[] = ["agents", "evals", "rag", "tooling", "security"];

export function AddToBuildModal({
  activeInsight,
  isOpen,
  modalNote,
  modalSkill,
  onClose,
  onNoteChange,
  onSave,
  onSkillChange
}: AddToBuildModalProps) {
  if (!isOpen || !activeInsight) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
        <h3 className="mb-2 text-2xl font-black text-slate-800">Add to Build Queue</h3>
        <p className="mb-6 line-clamp-2 border-l-2 border-brand-500 pl-2 text-sm text-slate-500">
          {activeInsight.buildIdea}
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Skill Focus
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => onSkillChange(skill)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition-all ${
                    modalSkill === skill
                      ? "border-brand-500 bg-[#f0f9eb] text-[#4d7e1f]"
                      : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Note
            </label>
            <textarea
              value={modalNote}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Why do you want to build this? Any initial ideas?"
              className="min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="flex-1 rounded-full bg-slate-100 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Save to Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
