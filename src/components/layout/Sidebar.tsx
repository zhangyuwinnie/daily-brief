import { Home, Sparkles, Zap } from "lucide-react";
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
        `flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
          isActive
            ? "bg-white font-bold text-slate-900 shadow-sm"
            : "font-medium text-slate-500 hover:bg-white/40"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <nav className="hidden w-64 flex-shrink-0 border-r border-white/50 bg-white/20 p-6 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-300 shadow-sm">
          <Sparkles className="h-5 w-5 text-slate-900" />
        </div>
        <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: "monospace, sans-serif" }}>
          Brief<span className="text-[#6bb52b]">2Build</span>
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Menu</p>
        <NavItem to="/today" label="Today" icon={<Home className="h-5 w-5" />} />
      </div>

      <div className="mt-auto rounded-2xl border border-white/60 bg-white/50 p-4 text-sm">
        <p className="mb-1 flex items-center gap-2 font-semibold text-slate-700">
          <Zap className="h-4 w-4 text-brand-500" />
          Daily Loop
        </p>
        <p className="text-xs text-slate-500">Brief → Build → Learn → Reflect</p>
      </div>
    </nav>
  );
}
