'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Clock3, Coins, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusStyles } from './status';
import type { AgentNodeData } from './types';

export function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const styles = statusStyles[data.status];

  return (
    <div
      className={cn(
        'rf-node min-w-[260px] max-w-[280px] rounded-[20px] border border-white/8 p-4 text-white transition duration-200',
        styles.ring,
        selected && 'border-sky-300/50',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-slate-900 !bg-slate-200" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/6">
              <Bot className="h-4 w-4 text-sky-200" />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">{data.title}</h3>
              <p className="text-xs text-slate-400">{data.role}</p>
            </div>
          </div>
        </div>
        <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize', styles.pill)}>
          <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', styles.dot)} />
          {data.status}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/6 bg-white/4 px-3 py-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> {data.cost}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {data.time}</span>
      </div>

      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <span>Confidence</span>
          <span>{Math.round(data.confidence * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/6">
          <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" style={{ width: `${Math.max(data.confidence * 100, 8)}%` }} />
        </div>
      </div>

      <p className="mb-3 text-xs leading-5 text-slate-300">{data.summary}</p>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-white/4 px-2.5 py-1 text-[11px] text-slate-200">
          <Sparkles className="h-3 w-3" /> {data.badge}
        </span>
        {data.tools.map((tool) => (
          <span key={tool} className="rounded-full border border-white/6 bg-white/4 px-2.5 py-1 text-[11px] text-slate-400">
            {tool}
          </span>
        ))}
      </div>

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-slate-900 !bg-slate-200" />
    </div>
  );
}
