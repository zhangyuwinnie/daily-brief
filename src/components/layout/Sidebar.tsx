import { Home, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

function NavItem({
  to,
  label,
  icon
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
          isActive
            ? "bg-[rgba(111,123,93,0.12)] text-[color:var(--text-strong)]"
            : "text-[color:var(--text-muted)] hover:bg-[rgba(84,66,42,0.05)] hover:text-[color:var(--text-strong)]"
        ].join(" ")
      }
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
        style={{
          borderColor: "var(--border-soft)",
          background: "rgba(255,255,255,0.45)"
        }}
      >
        <span className="text-[color:var(--accent-strong)]">{icon}</span>
      </span>
      <span className="font-semibold">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <nav
      className="hidden w-[286px] flex-shrink-0 flex-col border-r px-6 py-7 lg:flex"
      style={{
        borderColor: "var(--border-soft)",
        background: "linear-gradient(180deg, rgba(247,241,232,0.72), rgba(243,235,223,0.82))"
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border"
            style={{
              background: "rgba(111, 123, 93, 0.12)",
              borderColor: "rgba(111, 123, 93, 0.18)"
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "var(--accent-strong)" }} />
          </div>
          <div>
            <p className="eyebrow">Daily Brief</p>
            <h1 className="display-title text-[2rem] font-semibold leading-none">Brief2Build</h1>
          </div>
        </div>

        <div className="editorial-panel-muted px-4 py-4">
          <p className="eyebrow mb-2">Product thesis</p>
          <p className="text-sm leading-6 text-[color:var(--text-base)]">
            A personal AI learning system that helps builder-operators stay current without turning
            every day into another feed.
          </p>
        </div>

        <div className="space-y-2">
          <p className="eyebrow px-1">Navigate</p>
          <NavItem to="/today" label="Today" icon={<Home className="h-4 w-4" />} />
        </div>
      </div>

      <div
        className="mt-auto rounded-[1.6rem] border px-4 py-4"
        style={{
          borderColor: "var(--border-soft)",
          background: "rgba(255, 250, 243, 0.7)"
        }}
      >
        <p className="eyebrow mb-2">Reading posture</p>
        <p className="text-sm font-semibold text-[color:var(--text-strong)]">
          Start with signal.
          <br />
          End with a build move.
        </p>
      </div>
    </nav>
  );
}
