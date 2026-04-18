import { statusStyles } from './status';
import type { TimelineItem } from './types';

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="rf-glass rounded-[28px] p-5 shadow-2xl">
      <div className="mb-4">
        <div className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-400">Execution timeline</div>
        <h2 className="text-lg font-semibold">Parallel progress at a glance</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const styles = statusStyles[item.status];
          return (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
              <div className="w-24 shrink-0 text-xs uppercase tracking-[0.2em] text-slate-500">{item.lane}</div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                  {item.label}
                </div>
                <div className="text-xs text-slate-400">{item.time}</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${styles.pill}`}>{item.status}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
