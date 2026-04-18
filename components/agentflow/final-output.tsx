import { Copy, Download, Eye, Table2 } from 'lucide-react';
import type { OutputSection } from './types';

export function FinalOutput({
  sections,
  outputFormat,
  onCopy,
  onExport,
}: {
  sections: OutputSection[];
  outputFormat: 'Document' | 'Table' | 'JSON';
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <section className="rf-glass rounded-[28px] p-5 shadow-2xl">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-400">Final output</div>
          <h2 className="text-lg font-semibold">Live result preview</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-300">
            {outputFormat === 'Document' ? <Eye className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
            {outputFormat} view
          </span>
          <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {outputFormat === 'JSON' ? (
        <pre className="rf-scrollbar overflow-auto rounded-[24px] border border-white/6 bg-slate-950/60 p-4 text-xs leading-6 text-slate-300">
          {JSON.stringify(sections, null, 2)}
        </pre>
      ) : outputFormat === 'Table' ? (
        <div className="overflow-hidden rounded-[24px] border border-white/6 bg-white/4">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-white/6 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Content</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.title} className="border-t border-white/6 align-top">
                  <td className="px-4 py-3 font-medium text-white">{section.title}</td>
                  <td className="px-4 py-3 leading-6">{section.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4 rounded-[24px] border border-white/6 bg-white/4 p-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/6 bg-slate-950/40 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">{section.title}</h3>
              <p className="m-0 text-sm leading-6 text-slate-300">{section.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
