from pathlib import Path
root = Path('/mnt/data/agentflow')

files = {}
files['components/agentflow/types.ts'] = '''export type NodeStatus = 'done' | 'running' | 'queued' | 'error';

export type AgentNodeData = {
  title: string;
  role: string;
  status: NodeStatus;
  cost: string;
  time: string;
  confidence: number;
  badge: string;
  tools: string[];
  summary: string;
  output: string[];
};

export type RunMetric = {
  label: string;
  value: string;
  hint: string;
};

export type TimelineItem = {
  id: string;
  label: string;
  lane: string;
  time: string;
  status: NodeStatus;
};

export type OutputSection = {
  title: string;
  content: string;
};

export type ProjectRunSnapshot = {
  projectTitle: string;
  mode: 'fast' | 'smart' | 'deep';
  prompt: string;
  metrics: RunMetric[];
  nodes: Array<import('@xyflow/react').Node<AgentNodeData>>;
  edges: Array<import('@xyflow/react').Edge>;
  timeline: TimelineItem[];
  finalOutputSections: OutputSection[];
  selectedNodeId?: string;
  runStatus: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
  connectionLabel: string;
};

export type StreamEvent =
  | { type: 'snapshot'; payload: ProjectRunSnapshot }
  | { type: 'patch'; payload: Partial<ProjectRunSnapshot> }
  | { type: 'status'; payload: Pick<ProjectRunSnapshot, 'runStatus' | 'connectionLabel'> }
  | { type: 'done' };
'''

files['lib/data.ts'] = '''import type { Edge, Node } from '@xyflow/react';
import type { AgentNodeData, OutputSection, ProjectRunSnapshot, RunMetric, TimelineItem } from '@/components/agentflow/types';

export const defaultPrompt =
  'Create a PRD for a privacy-first expense tracker for freelancers. Include personas, competitor themes, MVP features, and launch priorities.';

export const baseRunMetrics: RunMetric[] = [
  { label: 'Total cost', value: '$0.48', hint: '11,284 tokens' },
  { label: 'Latency', value: '18.2s', hint: 'Parallelized workflow' },
  { label: 'Confidence', value: '0.89', hint: 'Reviewer approved' },
  { label: 'Agents', value: '6', hint: '3 parallel specialists' },
];

export const baseTimeline: TimelineItem[] = [
  { id: '1', label: 'Task Analyzer', time: '0.0s → 1.8s', lane: 'Control', status: 'done' },
  { id: '2', label: 'Planner', time: '1.8s → 4.9s', lane: 'Control', status: 'done' },
  { id: '3', label: 'Competitor Research', time: '5.0s → 10.8s', lane: 'Parallel', status: 'running' },
  { id: '4', label: 'Persona Analyst', time: '5.0s → 10.1s', lane: 'Parallel', status: 'done' },
  { id: '5', label: 'Requirements', time: '5.0s → 9.6s', lane: 'Parallel', status: 'done' },
  { id: '6', label: 'Writer', time: '11.0s → 15.1s', lane: 'Synthesis', status: 'queued' },
  { id: '7', label: 'Reviewer', time: '15.2s → 18.2s', lane: 'Validation', status: 'queued' },
];

export const baseNodes: Node<AgentNodeData>[] = [
  {
    id: 'analyzer',
    type: 'agentNode',
    position: { x: 120, y: 30 },
    data: {
      title: 'Task Analyzer',
      role: 'Intent classification',
      status: 'done',
      cost: '$0.02',
      time: '1.8s',
      confidence: 0.96,
      badge: 'Control',
      tools: ['Classifier'],
      summary: 'Detected PRD task, medium-high complexity, external grounding optional.',
      output: [
        'Task type: PRD generation',
        'Complexity: High',
        'Recommended route: planner + parallel specialists',
      ],
    },
  },
  {
    id: 'planner',
    type: 'agentNode',
    position: { x: 120, y: 210 },
    data: {
      title: 'Planner',
      role: 'Workflow graph builder',
      status: 'done',
      cost: '$0.05',
      time: '3.1s',
      confidence: 0.92,
      badge: 'Control',
      tools: ['Schema Builder'],
      summary: 'Created a DAG with 3 parallel specialists and 2 validation nodes.',
      output: [
        'Built 6-node execution graph',
        'Enabled parallel research branch',
        'Attached PRD output schema',
      ],
    },
  },
  {
    id: 'competitors',
    type: 'agentNode',
    position: { x: 470, y: 120 },
    data: {
      title: 'Competitor Research',
      role: 'Market scan',
      status: 'running',
      cost: '$0.12',
      time: '5.8s',
      confidence: 0.74,
      badge: 'Parallel',
      tools: ['Web Search', 'Memory'],
      summary: 'Collecting competitor patterns and monetization benchmarks.',
      output: [
        'Top 5 comparable products identified',
        'Pricing benchmarks collected',
        'One citation check still running',
      ],
    },
  },
  {
    id: 'persona',
    type: 'agentNode',
    position: { x: 470, y: 300 },
    data: {
      title: 'Persona Analyst',
      role: 'User needs modeling',
      status: 'done',
      cost: '$0.08',
      time: '5.1s',
      confidence: 0.88,
      badge: 'Parallel',
      tools: ['Memory'],
      summary: 'Generated freelancer and SMB owner personas with JTBD.',
      output: [
        'Primary persona: privacy-focused freelancer',
        'JTBD and pain points mapped',
        'Decision triggers captured',
      ],
    },
  },
  {
    id: 'requirements',
    type: 'agentNode',
    position: { x: 470, y: 480 },
    data: {
      title: 'Requirements Agent',
      role: 'Feature decomposition',
      status: 'done',
      cost: '$0.07',
      time: '4.6s',
      confidence: 0.85,
      badge: 'Parallel',
      tools: ['Template Pack'],
      summary: 'Drafted MVP, stretch features, and privacy guardrails.',
      output: [
        'MVP feature set proposed',
        'Non-functional requirements added',
        'Privacy constraints documented',
      ],
    },
  },
  {
    id: 'writer',
    type: 'agentNode',
    position: { x: 860, y: 230 },
    data: {
      title: 'Writer',
      role: 'PRD synthesis',
      status: 'queued',
      cost: '$0.09',
      time: 'Pending',
      confidence: 0.0,
      badge: 'Synthesis',
      tools: ['Structured Output'],
      summary: 'Waiting for all specialist outputs before generating the draft.',
      output: ['Will merge research, persona, and requirements into one PRD draft'],
    },
  },
  {
    id: 'reviewer',
    type: 'agentNode',
    position: { x: 1190, y: 230 },
    data: {
      title: 'Reviewer',
      role: 'Quality gate',
      status: 'queued',
      cost: '$0.05',
      time: 'Pending',
      confidence: 0.0,
      badge: 'Validation',
      tools: ['Rubric'],
      summary: 'Will validate completeness, consistency, and hallucination risk.',
      output: [
        'Checks schema adherence',
        'Scores confidence',
        'Triggers one retry if score < 0.75',
      ],
    },
  },
];

export const baseEdges: Edge[] = [
  { id: 'e1-2', source: 'analyzer', target: 'planner', animated: false },
  { id: 'e2-3', source: 'planner', target: 'competitors', animated: true },
  { id: 'e2-4', source: 'planner', target: 'persona', animated: true },
  { id: 'e2-5', source: 'planner', target: 'requirements', animated: true },
  { id: 'e3-6', source: 'competitors', target: 'writer', animated: true },
  { id: 'e4-6', source: 'persona', target: 'writer', animated: false },
  { id: 'e5-6', source: 'requirements', target: 'writer', animated: false },
  { id: 'e6-7', source: 'writer', target: 'reviewer', animated: false },
];

export const baseFinalOutputSections: OutputSection[] = [
  {
    title: 'Problem statement',
    content:
      'Freelancers need an expense tracker that minimizes data exposure while still providing quick categorization, tax-ready exports, and simple collaboration with accountants.',
  },
  {
    title: 'MVP highlights',
    content:
      'Receipt capture, local-first categorization, encrypted cloud backup, and privacy controls for export and sharing.',
  },
  {
    title: 'Why this workflow',
    content:
      'The system chose parallel specialists because market research, persona design, and feature decomposition were independent and would reduce latency without sacrificing quality.',
  },
];

export function createInitialSnapshot(): ProjectRunSnapshot {
  return {
    projectTitle: 'Privacy-first expense tracker PRD',
    mode: 'smart',
    prompt: defaultPrompt,
    metrics: baseRunMetrics,
    nodes: baseNodes,
    edges: baseEdges,
    timeline: baseTimeline,
    finalOutputSections: baseFinalOutputSections,
    selectedNodeId: 'competitors',
    runStatus: 'idle',
    connectionLabel: 'Ready to run',
  };
}
'''

files['components/agentflow/topbar.tsx'] = '''import { ChevronDown, LoaderCircle, Play, Share2, Square, Sparkles } from 'lucide-react';

type TopbarProps = {
  projectTitle: string;
  mode: 'fast' | 'smart' | 'deep';
  statusLabel: string;
  statusTone: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
  compactMetrics: string;
  onRun: () => void;
  onStop?: () => void;
  isRunning: boolean;
};

const toneStyles: Record<TopbarProps['statusTone'], string> = {
  idle: 'border-white/8 bg-white/6 text-slate-300',
  connecting: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  running: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  completed: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  error: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
};

export function Topbar({ projectTitle, mode, statusLabel, statusTone, compactMetrics, onRun, onStop, isRunning }: TopbarProps) {
  const modeLabel = `${mode.charAt(0).toUpperCase()}${mode.slice(1)} mode`;

  return (
    <header className="rf-glass flex flex-col gap-4 rounded-[24px] px-5 py-4 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-1 text-xs uppercase tracking-[0.24em] text-slate-400">Project</div>
        <div className="text-lg font-semibold">{projectTitle}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
          <Sparkles className="h-4 w-4 text-sky-300" /> {modeLabel} <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
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
        <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </header>
  );
}
'''

files['components/agentflow/prompt-card.tsx'] = '''import { ArrowUpRight, Link2, Paperclip, Table2, Wifi } from 'lucide-react';

type PromptCardProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRun: () => void;
  classifierNote: string;
  transport: string;
  isRunning: boolean;
};

export function PromptCard({ prompt, onPromptChange, onRun, classifierNote, transport, isRunning }: PromptCardProps) {
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
            Suggest workflow <ArrowUpRight className="h-3.5 w-3.5" />
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
              <Paperclip className="h-3.5 w-3.5" /> Attach files
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
              <Link2 className="h-3.5 w-3.5" /> Add source links
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/8">
              <Table2 className="h-3.5 w-3.5" /> Output: Document
            </button>
          </div>
          <div className="text-xs text-slate-500">{classifierNote}</div>
        </div>
      </div>
    </section>
  );
}
'''

files['components/agentflow/metrics-grid.tsx'] = '''import type { RunMetric } from './types';

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
'''

files['components/agentflow/timeline.tsx'] = '''import { statusStyles } from './status';
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
'''

files['components/agentflow/inspector.tsx'] = '''import type { AgentNodeData, OutputSection } from './types';

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
'''

files['components/agentflow/workflow-canvas.tsx'] = ''''use client';

import { useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { Maximize2, Workflow } from 'lucide-react';
import { AgentNode } from './agent-node';
import type { AgentNodeData } from './types';
import type { Edge, Node } from '@xyflow/react';

const nodeTypes = {
  agentNode: AgentNode,
};

function WorkflowCanvasInner({
  nodes: incomingNodes,
  edges: incomingEdges,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  selectedNodeId?: string;
  onSelectNode: (data: AgentNodeData) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(incomingNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(incomingEdges);

  useEffect(() => {
    setNodes(incomingNodes);
  }, [incomingNodes, setNodes]);

  useEffect(() => {
    setEdges(incomingEdges);
  }, [incomingEdges, setEdges]);

  const defaultNode = useMemo(() => incomingNodes[0]?.data, [incomingNodes]);

  useEffect(() => {
    if (!selectedNodeId) return;
    const selectedNode = incomingNodes.find((node) => node.id === selectedNodeId);
    if (selectedNode) {
      onSelectNode(selectedNode.data);
    }
  }, [incomingNodes, onSelectNode, selectedNodeId]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.45}
      maxZoom={1.4}
      onNodeClick={(_, node) => onSelectNode(node.data)}
      defaultEdgeOptions={{ style: { stroke: 'rgba(125, 211, 252, 0.55)' }, type: 'smoothstep' }}
      className="rounded-[28px]"
      colorMode="dark"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(148, 163, 184, 0.16)" />
      <MiniMap
        pannable
        zoomable
        className="!bottom-4 !left-4 !h-28 !w-44 overflow-hidden rounded-2xl border border-white/10 !bg-slate-950/90"
        nodeColor={(node) => {
          const status = (node.data as AgentNodeData).status;
          if (status === 'done') return '#34d399';
          if (status === 'running') return '#38bdf8';
          if (status === 'queued') return '#fbbf24';
          return '#fb7185';
        }}
      />
      <Controls className="!bottom-4 !right-4 overflow-hidden rounded-2xl border border-white/10 !bg-slate-950/90" showInteractive={false} />
      <Panel position="top-left">
        <div className="rf-glass rounded-2xl px-3 py-2 text-xs text-slate-300 shadow-2xl">
          <div className="mb-1 flex items-center gap-2 font-medium text-white">
            <Workflow className="h-4 w-4 text-sky-300" /> Live orchestration graph
          </div>
          <p className="m-0 text-[11px] text-slate-400">Node state, cost, confidence, and outputs are streaming from the backend.</p>
        </div>
      </Panel>
      <Panel position="top-right">
        <button
          type="button"
          onClick={() => defaultNode && onSelectNode(defaultNode)}
          className="rf-glass inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-slate-200 shadow-2xl transition hover:border-sky-300/30 hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Focus first node
        </button>
      </Panel>
    </ReactFlow>
  );
}

export function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  selectedNodeId?: string;
  onSelectNode: (data: AgentNodeData) => void;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner nodes={nodes} edges={edges} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
    </ReactFlowProvider>
  );
}
'''

files['app/page.tsx'] = ''''use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Inspector } from '@/components/agentflow/inspector';
import { MetricsGrid } from '@/components/agentflow/metrics-grid';
import { PromptCard } from '@/components/agentflow/prompt-card';
import { Sidebar } from '@/components/agentflow/sidebar';
import { Timeline } from '@/components/agentflow/timeline';
import { Topbar } from '@/components/agentflow/topbar';
import type { AgentNodeData, ProjectRunSnapshot, StreamEvent } from '@/components/agentflow/types';
import { WorkflowCanvas } from '@/components/agentflow/workflow-canvas';
import { createInitialSnapshot } from '@/lib/data';

function useOrchestrationStream() {
  const [snapshot, setSnapshot] = useState<ProjectRunSnapshot>(() => createInitialSnapshot());
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSnapshot((current) => ({
      ...current,
      runStatus: current.runStatus === 'completed' ? 'completed' : 'idle',
      connectionLabel: current.runStatus === 'completed' ? current.connectionLabel : 'Stream stopped',
    }));
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSnapshot((current) => ({
      ...createInitialSnapshot(),
      prompt,
      runStatus: 'connecting',
      connectionLabel: 'Connecting to orchestration stream…',
      projectTitle: current.projectTitle,
      mode: current.mode,
    }));

    try {
      const response = await fetch(`/api/orchestrate/stream?prompt=${encodeURIComponent(prompt)}&mode=smart`, {
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok || !response.body) {
        throw new Error('Unable to connect to the orchestration stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventChunk of events) {
          const dataLine = eventChunk
            .split('\n')
            .find((line) => line.startsWith('data: '));

          if (!dataLine) continue;

          const event = JSON.parse(dataLine.slice(6)) as StreamEvent;

          if (event.type === 'snapshot') {
            setSnapshot(event.payload);
          } else if (event.type === 'patch') {
            setSnapshot((current) => ({ ...current, ...event.payload }));
          } else if (event.type === 'status') {
            setSnapshot((current) => ({ ...current, ...event.payload }));
          } else if (event.type === 'done') {
            setSnapshot((current) => ({ ...current, runStatus: 'completed', connectionLabel: 'Run complete' }));
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setSnapshot((current) => ({
        ...current,
        runStatus: 'error',
        connectionLabel: error instanceof Error ? error.message : 'Stream error',
      }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  return { snapshot, setSnapshot, run, stop };
}

export default function HomePage() {
  const { snapshot, setSnapshot, run, stop } = useOrchestrationStream();
  const fallbackNode = useMemo<AgentNodeData>(() => snapshot.nodes[0]?.data ?? createInitialSnapshot().nodes[0].data, [snapshot.nodes]);
  const selectedNode = useMemo<AgentNodeData>(() => {
    const match = snapshot.nodes.find((node) => node.id === snapshot.selectedNodeId);
    return match?.data ?? fallbackNode;
  }, [fallbackNode, snapshot.nodes, snapshot.selectedNodeId]);

  const setPrompt = useCallback((value: string) => {
    setSnapshot((current) => ({ ...current, prompt: value }));
  }, [setSnapshot]);

  const setSelectedNode = useCallback((data: AgentNodeData) => {
    setSnapshot((current) => ({
      ...current,
      selectedNodeId: current.nodes.find((node) => node.data.title === data.title)?.id ?? current.selectedNodeId,
    }));
  }, [setSnapshot]);

  const classifierNote = useMemo(() => {
    if (snapshot.runStatus === 'running' || snapshot.runStatus === 'connecting') {
      return 'Live orchestration in progress • backend patches will keep this graph updated';
    }
    return 'Classifier: High complexity • Parallel path recommended';
  }, [snapshot.runStatus]);

  const compactMetrics = useMemo(() => snapshot.metrics.slice(0, 2).map((metric) => metric.value).join(' • '), [snapshot.metrics]);

  const isRunning = snapshot.runStatus === 'running' || snapshot.runStatus === 'connecting';

  return (
    <main className="min-h-screen p-4 text-white lg:p-4">
      <div className="mx-auto flex max-w-[1780px] gap-4">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar
            projectTitle={snapshot.projectTitle}
            mode={snapshot.mode}
            statusLabel={snapshot.connectionLabel}
            statusTone={snapshot.runStatus}
            compactMetrics={compactMetrics}
            onRun={() => run(snapshot.prompt)}
            onStop={stop}
            isRunning={isRunning}
          />
          <PromptCard
            prompt={snapshot.prompt}
            onPromptChange={setPrompt}
            onRun={() => run(snapshot.prompt)}
            classifierNote={classifierNote}
            transport="SSE stream connected to orchestration engine"
            isRunning={isRunning}
          />
          <MetricsGrid metrics={snapshot.metrics} />

          <div className="grid min-h-[520px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rf-glass overflow-hidden rounded-[28px] p-3 shadow-2xl">
              <div className="h-[520px]">
                <WorkflowCanvas
                  nodes={snapshot.nodes}
                  edges={snapshot.edges}
                  selectedNodeId={snapshot.selectedNodeId}
                  onSelectNode={setSelectedNode}
                />
              </div>
            </section>
            <div className="hidden xl:block">
              <Inspector selectedNode={selectedNode} finalOutputSections={snapshot.finalOutputSections} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Timeline items={snapshot.timeline} />
            <section className="rf-glass rounded-[28px] p-5 shadow-2xl xl:hidden">
              <Inspector selectedNode={selectedNode} finalOutputSections={snapshot.finalOutputSections} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
'''

files['app/api/orchestrate/stream/route.ts'] = '''import { NextRequest } from 'next/server';
import type { Edge, Node } from '@xyflow/react';
import type { AgentNodeData, OutputSection, ProjectRunSnapshot, RunMetric, TimelineItem } from '@/components/agentflow/types';
import { baseEdges, baseFinalOutputSections, baseNodes, baseRunMetrics, baseTimeline, defaultPrompt } from '@/lib/data';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

type SnapshotBuilder = {
  prompt: string;
  mode: 'fast' | 'smart' | 'deep';
  metrics: RunMetric[];
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  timeline: TimelineItem[];
  finalOutputSections: OutputSection[];
  projectTitle: string;
  selectedNodeId?: string;
  runStatus: ProjectRunSnapshot['runStatus'];
  connectionLabel: string;
};

function cloneNodes() {
  return structuredClone(baseNodes) as Node<AgentNodeData>[];
}

function cloneEdges() {
  return structuredClone(baseEdges) as Edge[];
}

function cloneMetrics() {
  return structuredClone(baseRunMetrics) as RunMetric[];
}

function cloneTimeline() {
  return structuredClone(baseTimeline) as TimelineItem[];
}

function cloneOutput() {
  return structuredClone(baseFinalOutputSections) as OutputSection[];
}

function formatSse(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateMetric(metrics: RunMetric[], label: string, value: string, hint: string) {
  const metric = metrics.find((item) => item.label === label);
  if (metric) {
    metric.value = value;
    metric.hint = hint;
  }
}

function updateNode(nodes: Node<AgentNodeData>[], id: string, patch: Partial<AgentNodeData>) {
  const target = nodes.find((node) => node.id === id);
  if (target) {
    target.data = { ...target.data, ...patch };
  }
}

function updateTimeline(timeline: TimelineItem[], label: string, patch: Partial<TimelineItem>) {
  const target = timeline.find((item) => item.label === label);
  if (target) {
    Object.assign(target, patch);
  }
}

function buildSnapshot(builder: SnapshotBuilder): ProjectRunSnapshot {
  return {
    projectTitle: builder.projectTitle,
    mode: builder.mode,
    prompt: builder.prompt,
    metrics: builder.metrics,
    nodes: builder.nodes,
    edges: builder.edges,
    timeline: builder.timeline,
    finalOutputSections: builder.finalOutputSections,
    selectedNodeId: builder.selectedNodeId,
    runStatus: builder.runStatus,
    connectionLabel: builder.connectionLabel,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt')?.trim() || defaultPrompt;
  const modeParam = searchParams.get('mode');
  const mode = modeParam === 'fast' || modeParam === 'deep' ? modeParam : 'smart';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const metrics = cloneMetrics();
      const nodes = cloneNodes();
      const edges = cloneEdges();
      const timeline = cloneTimeline();
      const finalOutputSections = cloneOutput();
      const projectTitle = prompt.length > 44 ? `${prompt.slice(0, 44)}…` : prompt;

      const builder: SnapshotBuilder = {
        prompt,
        mode,
        metrics,
        nodes,
        edges,
        timeline,
        finalOutputSections,
        projectTitle,
        selectedNodeId: 'analyzer',
        runStatus: 'running',
        connectionLabel: 'Streaming orchestration updates…',
      };

      controller.enqueue(formatSse({ type: 'status', payload: { runStatus: 'running', connectionLabel: 'Streaming orchestration updates…' } }));
      controller.enqueue(formatSse({ type: 'snapshot', payload: buildSnapshot(builder) }));

      const sendPatch = () => {
        controller.enqueue(formatSse({ type: 'patch', payload: buildSnapshot(builder) }));
      };

      await wait(900);
      updateNode(nodes, 'analyzer', {
        status: 'done',
        time: '1.7s',
        cost: '$0.03',
        confidence: 0.97,
        output: ['Task type: PRD generation', 'Complexity: High', 'Route: planner + parallel specialists + review'],
        summary: 'Intent classified and routed to a graph-based orchestration workflow.',
      });
      updateMetric(metrics, 'Total cost', '$0.03', '702 tokens');
      updateMetric(metrics, 'Latency', '1.7s', 'Analyzer complete');
      updateMetric(metrics, 'Confidence', '0.97', 'Classifier certainty');
      updateTimeline(timeline, 'Task Analyzer', { status: 'done', time: '0.0s → 1.7s' });
      builder.selectedNodeId = 'planner';
      sendPatch();

      await wait(1000);
      updateNode(nodes, 'planner', {
        status: 'done',
        time: '3.4s',
        cost: '$0.08',
        confidence: 0.93,
        summary: 'Planner created a DAG with three independent specialists and two downstream validators.',
        output: ['Built 7-node execution graph', 'Enabled parallel market, persona, and requirements branches', 'Attached PRD schema + retry policy'],
      });
      updateTimeline(timeline, 'Planner', { status: 'done', time: '1.7s → 3.4s' });
      updateMetric(metrics, 'Total cost', '$0.08', '1,910 tokens');
      updateMetric(metrics, 'Latency', '3.4s', 'Planner complete');
      builder.selectedNodeId = 'competitors';
      sendPatch();

      await wait(600);
      updateNode(nodes, 'competitors', {
        status: 'running',
        time: '4.1s',
        cost: '$0.14',
        confidence: 0.76,
        summary: 'Researcher is grounding market patterns from tool results and prior memory.',
      });
      updateNode(nodes, 'persona', {
        status: 'running',
        time: '4.1s',
        cost: '$0.09',
        confidence: 0.72,
        summary: 'Persona analyst is modeling primary user segments and JTBD signals.',
      });
      updateNode(nodes, 'requirements', {
        status: 'running',
        time: '4.1s',
        cost: '$0.08',
        confidence: 0.71,
        summary: 'Requirements agent is decomposing MVP scope and privacy constraints.',
      });
      updateTimeline(timeline, 'Competitor Research', { status: 'running', time: '3.4s → 9.1s' });
      updateTimeline(timeline, 'Persona Analyst', { status: 'running', time: '3.4s → 8.4s' });
      updateTimeline(timeline, 'Requirements', { status: 'running', time: '3.4s → 8.0s' });
      updateMetric(metrics, 'Agents', '7', '3 parallel specialists + writer + reviewer');
      updateMetric(metrics, 'Latency', '4.1s', 'Parallel branch active');
      sendPatch();

      await wait(1400);
      updateNode(nodes, 'persona', {
        status: 'done',
        time: '5.0s',
        cost: '$0.12',
        confidence: 0.89,
        output: ['Primary persona: privacy-sensitive freelancer', 'Secondary persona: bookkeeper/accountant', 'JTBD and anxieties mapped'],
        summary: 'Persona analyst completed with clear JTBD, trust barriers, and purchase triggers.',
      });
      updateTimeline(timeline, 'Persona Analyst', { status: 'done', time: '3.4s → 5.0s' });
      updateMetric(metrics, 'Total cost', '$0.21', '4,804 tokens');
      builder.selectedNodeId = 'persona';
      sendPatch();

      await wait(1200);
      updateNode(nodes, 'requirements', {
        status: 'done',
        time: '6.2s',
        cost: '$0.16',
        confidence: 0.87,
        output: ['Local-first receipt capture', 'Encrypted backup and export controls', 'Audit log + accountant share mode'],
        summary: 'Requirements agent finished MVP scope, privacy guardrails, and launch sequencing.',
      });
      updateTimeline(timeline, 'Requirements', { status: 'done', time: '3.4s → 6.2s' });
      updateMetric(metrics, 'Total cost', '$0.29', '6,950 tokens');
      builder.selectedNodeId = 'requirements';
      sendPatch();

      await wait(1100);
      updateNode(nodes, 'competitors', {
        status: 'done',
        time: '7.3s',
        cost: '$0.22',
        confidence: 0.84,
        output: ['Benchmark set: Wave, FreshBooks, Expensify, QuickBooks Self-Employed', 'Competitive gaps: privacy positioning, local-first workflows', 'Monetization benchmark captured'],
        summary: 'Competitor scan completed with grounded patterns, price anchors, and product white space.',
      });
      updateTimeline(timeline, 'Competitor Research', { status: 'done', time: '3.4s → 7.3s' });
      updateNode(nodes, 'writer', {
        status: 'running',
        time: '7.4s',
        cost: '$0.24',
        confidence: 0.78,
        summary: 'Writer is synthesizing parallel branch outputs into a structured PRD draft.',
        output: ['Merging market, persona, and requirements outputs', 'Draft sections being composed', 'Schema validation in progress'],
      });
      updateTimeline(timeline, 'Writer', { status: 'running', time: '7.3s → 10.7s' });
      updateMetric(metrics, 'Total cost', '$0.46', '10,880 tokens');
      updateMetric(metrics, 'Latency', '7.4s', 'Writer activated');
      builder.selectedNodeId = 'writer';
      sendPatch();

      await wait(1500);
      updateNode(nodes, 'writer', {
        status: 'done',
        time: '9.9s',
        cost: '$0.31',
        confidence: 0.9,
        summary: 'Writer produced a full PRD draft with launch priorities and privacy-first differentiation.',
        output: ['Problem, personas, and JTBD aligned', 'MVP + stretch features drafted', 'Launch priorities and success metrics included'],
      });
      updateNode(nodes, 'reviewer', {
        status: 'running',
        time: '10.0s',
        cost: '$0.33',
        confidence: 0.8,
        summary: 'Reviewer is validating completeness, consistency, and hallucination risk.',
      });
      updateTimeline(timeline, 'Writer', { status: 'done', time: '7.3s → 9.9s' });
      updateTimeline(timeline, 'Reviewer', { status: 'running', time: '9.9s → 12.2s' });
      updateMetric(metrics, 'Total cost', '$0.57', '13,401 tokens');
      updateMetric(metrics, 'Confidence', '0.90', 'Writer complete');
      builder.selectedNodeId = 'reviewer';
      sendPatch();

      await wait(1500);
      updateNode(nodes, 'reviewer', {
        status: 'done',
        time: '12.2s',
        cost: '$0.38',
        confidence: 0.94,
        summary: 'Reviewer approved the draft after schema, quality, and hallucination checks.',
        output: ['Schema adherence: pass', 'Completeness score: 0.94', 'No retry required'],
      });
      updateTimeline(timeline, 'Reviewer', { status: 'done', time: '9.9s → 12.2s' });
      finalOutputSections[0] = {
        title: 'Problem statement',
        content: 'Freelancers need an expense tracker that feels as private as a local notebook while still being tax-ready, searchable, and easy to share with an accountant when needed.',
      };
      finalOutputSections[1] = {
        title: 'MVP highlights',
        content: 'Local-first capture, encrypted backup, privacy-preserving categorization, accountant share mode, audit logs, and tax-friendly export presets.',
      };
      finalOutputSections[2] = {
        title: 'Why this workflow',
        content: 'The planner selected parallel specialists because market research, persona design, and requirements decomposition were independent. SSE then streamed each node patch to the UI so the graph, metrics, and inspector stayed live throughout the run.',
      };
      updateMetric(metrics, 'Total cost', '$0.62', '14,930 tokens');
      updateMetric(metrics, 'Latency', '12.2s', 'End-to-end streamed run');
      updateMetric(metrics, 'Confidence', '0.94', 'Reviewer approved');
      builder.connectionLabel = 'Run complete';
      builder.runStatus = 'completed';
      sendPatch();

      controller.enqueue(formatSse({ type: 'done' }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
'''

files['README.md'] = '''# AgentFlow Studio UI

A premium orchestration dashboard built with **Next.js**, **Tailwind CSS**, and **React Flow**.

## What changed in this version

This version is now wired to a lightweight **backend orchestration stream** using **Server-Sent Events (SSE)**.

When you press **Run**:
- the UI opens a live SSE connection to `/api/orchestrate/stream`
- the backend emits snapshot + patch events
- graph nodes, timeline, metrics, inspector, and final output update in real time

## Why SSE here

SSE is a strong fit when your backend mostly pushes one-way execution updates to the frontend:
- simpler than WebSockets for run streaming
- works well for node status, cost, confidence, and output patches
- easy to swap later for a real orchestration service behind the same event protocol

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Stream contract

The frontend expects JSON events shaped like:

```ts
{ type: 'snapshot', payload: ProjectRunSnapshot }
{ type: 'patch', payload: Partial<ProjectRunSnapshot> }
{ type: 'status', payload: { runStatus, connectionLabel } }
{ type: 'done' }
```

## Where to plug in your real backend

Replace the mocked orchestration sequence in:

- `app/api/orchestrate/stream/route.ts`

with your real orchestration runtime.

A practical production pattern is:
1. `POST /api/runs` → create a run and return `runId`
2. `GET /api/runs/:runId/stream` → stream node-level patches over SSE
3. UI subscribes by `runId`

## Suggested production event payloads

Each patch should carry enough information to update one or more slices of state:
- `nodes`
- `timeline`
- `metrics`
- `finalOutputSections`
- `selectedNodeId`
- `connectionLabel`
- `runStatus`

## WebSocket alternative

If you later need:
- bi-directional control
- collaborative sessions
- agent interrupts / approvals
- multi-user observers on the same run

then switch the same client state model to **WebSockets**.
'''

for rel, content in files.items():
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
