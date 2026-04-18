import type { AgentNodeData, OutputSection } from './types';

export function Inspector({
  selectedNode,
  finalOutputSections,
}: {
  selectedNode: AgentNodeData;
  finalOutputSections: OutputSection[];
}) {
  return (
    <aside className="rf-glass rf-scrollbar h-[calc(100vh-2rem)] w-[360px] shrink-0 overflow-y-auto rounded-[28px] p-5 shadow-2xl">
      <div className="mb-6">
        <div className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-400">Inspector</div>
        <h2 className="text-xl font-semibold text-white">{selectedNode.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{selectedNode.summary}</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Status</div>
          <div className="mt-2 text-sm font-medium capitalize text-white">{selectedNode.status}</div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Cost</div>
          <div className="mt-2 text-sm font-medium text-white">{selectedNode.cost}</div>
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/4 p-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Confidence</div>
          <div className="mt-2 text-sm font-medium text-white">{Math.round(selectedNode.confidence * 100)}%</div>
        </div>
      </div>

      <div className="mb-5 rounded-[24px] border border-white/6 bg-white/4 p-4">
        <div className="mb-3 text-sm font-medium text-white">Structured output</div>
        <ul className="space-y-2 pl-5 text-sm leading-6 text-slate-300">
          {selectedNode.output.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-5 rounded-[24px] border border-white/6 bg-white/4 p-4">
        <div className="mb-3 text-sm font-medium text-white">Tools used</div>
        <div className="flex flex-wrap gap-2">
          {selectedNode.tools.map((tool) => (
            <span key={tool} className="rounded-full border border-white/8 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300">
              {tool}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/6 bg-white/4 p-4">
        <div className="mb-3 text-sm font-medium text-white">Final output preview</div>
        <div className="space-y-4">
          {finalOutputSections.map((section) => (
            <div key={section.title}>
              <div className="mb-1 text-sm font-medium text-white">{section.title}</div>
              <p className="m-0 text-sm leading-6 text-slate-400">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
