import type { RunMetric } from './types';

export function MetricsGrid({ metrics }: { metrics: RunMetric[] }) {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rf-glass rounded-[24px] p-4 shadow-2xl">
          <div className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">{metric.label}</div>
          <div className="mb-1 text-2xl font-semibold text-white">{metric.value}</div>
          <div className="text-xs text-slate-400">{metric.hint}</div>
        </div>
      ))}
    </section>
  );
}
