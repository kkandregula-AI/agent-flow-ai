import { Archive, BrainCircuit, FileClock, Layers2, Plus, Settings2, Wrench } from 'lucide-react';

export type SidebarView = 'new' | 'history' | 'templates' | 'memory' | 'tools' | 'archives' | 'settings';

export type RecentRun = {
  title: string;
  meta: string;
  prompt: string;
};

const nav: Array<{ key: SidebarView; label: string; icon: typeof Plus }> = [
  { key: 'new', label: 'New run', icon: Plus },
  { key: 'history', label: 'Run history', icon: FileClock },
  { key: 'templates', label: 'Templates', icon: Layers2 },
  { key: 'memory', label: 'Memory', icon: BrainCircuit },
  { key: 'tools', label: 'Tools', icon: Wrench },
  { key: 'archives', label: 'Archives', icon: Archive },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar({
  activeView,
  onSelectView,
  recentRuns,
  onLoadRecentRun,
}: {
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  recentRuns: RecentRun[];
  onLoadRecentRun: (run: RecentRun) => void;
}) {
  return (
    <aside className="rf-glass rf-scrollbar flex h-[calc(100vh-2rem)] w-[290px] shrink-0 flex-col overflow-y-auto rounded-[28px] p-5 shadow-2xl">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-200">
          AgentFlow Studio
        </div>
        <h1 className="mb-2 text-xl font-semibold">Adaptive AI orchestration</h1>
        <p className="text-sm leading-6 text-slate-400">
          Build, inspect, and refine fast agent workflows with real-time graph execution.
        </p>
      </div>

      <nav className="mb-8 space-y-2">
        {nav.map(({ key, label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelectView(key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
              activeView === key ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">Recent runs</h2>
        <span className="text-xs text-slate-500">Clickable presets</span>
      </div>

      <div className="space-y-3">
        {recentRuns.map((run) => (
          <button
            key={run.title}
            type="button"
            onClick={() => onLoadRecentRun(run)}
            className="w-full rounded-2xl border border-white/6 bg-white/4 p-4 text-left transition hover:border-sky-300/20 hover:bg-white/8"
          >
            <div className="mb-2 text-sm font-medium leading-5 text-white">{run.title}</div>
            <div className="text-xs text-slate-400">{run.meta}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
