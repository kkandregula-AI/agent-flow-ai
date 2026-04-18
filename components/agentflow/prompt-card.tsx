import { ArrowUpRight, Link2, Paperclip, Plus, Table2, Wifi, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

type PromptCardProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRun: () => void;
  classifierNote: string;
  transport: string;
  isRunning: boolean;
  attachments: File[];
  sourceLinks: string[];
  outputFormat: 'Document' | 'Table' | 'JSON';
  onAttachFiles: (files: File[]) => void;
  onRemoveAttachment: (name: string) => void;
  onAddSourceLink: (link: string) => void;
  onRemoveSourceLink: (link: string) => void;
  onCycleOutputFormat: () => void;
};

export function PromptCard({
  prompt,
  onPromptChange,
  onRun,
  classifierNote,
  transport,
  isRunning,
  attachments,
  sourceLinks,
  outputFormat,
  onAttachFiles,
  onRemoveAttachment,
  onAddSourceLink,
  onRemoveSourceLink,
  onCycleOutputFormat,
}: PromptCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(event.target.files ?? []);
    onAttachFiles(fileList);
    event.target.value = '';
  }

  function submitLink() {
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    onAddSourceLink(trimmed);
    setLinkValue('');
    setShowLinkInput(false);
  }

  return (
    <section className="rf-glass rounded-[28px] p-5 shadow-2xl">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-400">Prompt workspace</div>
          <h2 className="text-lg font-semibold">Describe the outcome you want</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-300">
            <Wifi className="h-3.5 w-3.5 text-sky-300" /> {transport}
          </div>
          <button type="button" onClick={onRun} disabled={isRunning} className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs text-sky-200 transition hover:border-sky-300/35 hover:bg-sky-400/14 disabled:cursor-not-allowed disabled:opacity-60">
            Run workflow <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-slate-950/50 p-4">
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          className="min-h-[110px] w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-200 outline-none"
          placeholder="Describe the workflow or artifact you want the agents to produce..."
        />

        {(attachments.length > 0 || sourceLinks.length > 0) ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/6 bg-white/4 p-3">
            {attachments.length > 0 ? (
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Attached files</div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <span key={file.name} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                      <Paperclip className="h-3 w-3" /> {file.name}
                      <button type="button" onClick={() => onRemoveAttachment(file.name)} className="text-slate-400 transition hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {sourceLinks.length > 0 ? (
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Source links</div>
                <div className="flex flex-wrap gap-2">
                  {sourceLinks.map((link) => (
                    <span key={link} className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/8 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="max-w-[240px] truncate">{link}</span>
                      <button type="button" onClick={() => onRemoveSourceLink(link)} className="text-slate-400 transition hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
              <Paperclip className="h-3.5 w-3.5" /> Attach files {attachments.length ? `(${attachments.length})` : ''}
            </button>
            {!showLinkInput ? (
              <button type="button" onClick={() => setShowLinkInput(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
                <Link2 className="h-3.5 w-3.5" /> Add source links
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-2 py-1.5">
                <input
                  value={linkValue}
                  onChange={(event) => setLinkValue(event.target.value)}
                  placeholder="https://example.com"
                  className="w-44 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                />
                <button type="button" onClick={submitLink} className="rounded-xl bg-sky-400/15 p-1.5 text-sky-200 transition hover:bg-sky-400/25">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button type="button" onClick={onCycleOutputFormat} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
              <Table2 className="h-3.5 w-3.5" /> Output: {outputFormat}
            </button>
          </div>
          <div className="text-xs text-slate-500">{classifierNote}</div>
        </div>
      </div>
    </section>
  );
}
