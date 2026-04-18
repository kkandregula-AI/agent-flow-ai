import type { NodeStatus } from './types';

export const statusStyles: Record<NodeStatus, { dot: string; pill: string; ring: string }> = {
  done: {
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-500/12 text-emerald-200 border-emerald-400/20',
    ring: 'shadow-[0_0_0_1px_rgba(52,211,153,0.22)]',
  },
  running: {
    dot: 'bg-sky-400',
    pill: 'bg-sky-500/12 text-sky-200 border-sky-400/20',
    ring: 'shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_32px_rgba(56,189,248,0.16)]',
  },
  queued: {
    dot: 'bg-amber-300',
    pill: 'bg-amber-400/12 text-amber-100 border-amber-300/20',
    ring: 'shadow-[0_0_0_1px_rgba(251,191,36,0.18)]',
  },
  error: {
    dot: 'bg-rose-400',
    pill: 'bg-rose-500/12 text-rose-200 border-rose-400/20',
    ring: 'shadow-[0_0_0_1px_rgba(251,113,133,0.18)]',
  },
};
