import { Check, ChevronDown, Copy, LoaderCircle, Play, Share2, Square, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type TopbarProps = {
  projectTitle: string;
  mode: 'fast' | 'smart' | 'deep';
  statusLabel: string;
  statusTone: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
  compactMetrics: string;
  onRun: () => void;
  onStop?: () => void;
  onModeChange: (mode: 'fast' | 'smart' | 'deep') => void;
  onShare: () => Promise<boolean> | boolean;
  isRunning: boolean;
};

const toneStyles: Record<TopbarProps['statusTone'], string> = {
  idle: 'border-white/8 bg-white/6 text-slate-300',
  connecting: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  running: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  completed: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  error: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
};

const modes: Array<{ value: 'fast' | 'smart' | 'deep'; label: string; note: string }> = [
  { value: 'fast', label: 'Fast mode', note: 'Lowest latency' },
  { value: 'smart', label: 'Smart mode', note: 'Balanced orchestration' },
  { value: 'deep', label: 'Deep mode', note: 'Most thorough review' },
];

export function Topbar({
  projectTitle,
  mode,
  statusLabel,
  statusTone,
  compactMetrics,
  onRun,
  onStop,
  onModeChange,
  onShare,
  isRunning,
}: TopbarProps) {
  const [showModes, setShowModes] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const modeLabel = `${mode.charAt(0).toUpperCase()}${mode.slice(1)} mode`;

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModes(false);
      }
    }
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  async function handleShare() {
    const ok = await onShare();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <header className="rf-glass flex flex-col gap-4 rounded-[24px] px-5 py-4 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-1 text-xs uppercase tracking-[0.24em] text-slate-400">Project</div>
        <div className="text-lg font-semibold">{projectTitle}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowModes((value) => !value)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-sky-300" /> {modeLabel} <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
          {showModes ? (
            <div className="absolute right-0 z-30 mt-2 min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl">
              {modes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onModeChange(option.value);
                    setShowModes(false);
                  }}
                  className={`flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition ${
                    mode === option.value ? 'bg-sky-400/10 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-slate-400">{option.note}</span>
                  </span>
                  {mode === option.value ? <Check className="mt-0.5 h-4 w-4 text-sky-300" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={`rounded-2xl border px-4 py-2 text-sm ${toneStyles[statusTone]}`}>
          {statusTone === 'connecting' || statusTone === 'running' ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : null}
          {statusLabel}
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-300">{compactMetrics}</div>
        <button type="button" onClick={onRun} disabled={isRunning} className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60">
          <Play className="h-4 w-4" /> {isRunning ? 'Running…' : 'Run'}
        </button>
        {isRunning ? (
          <button type="button" onClick={onStop} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            <Square className="h-4 w-4" /> Stop
          </button>
        ) : null}
        <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
          {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </header>
  );
}
