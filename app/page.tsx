'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { estimateRunCost } from '@/lib/cost';
import { deriveTitleFromPrompt } from '@/lib/title';

type Mode = 'fast' | 'smart' | 'deep';
type OutputFormat = 'markdown' | 'json';
type RunStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
type NodeStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';

type NodeState = {
  id: string;
  label: string;
  role?: string;
  status: NodeStatus;
  progress: number;
  cost?: number;
  confidence?: number;
  output?: unknown;
  startedAt?: string;
  completedAt?: string;
  dependsOn?: string[];
};

type Snapshot = {
  runId: string;
  projectTitle?: string;
  prompt?: string;
  mode?: Mode;
  runStatus?: RunStatus;
  connectionLabel?: string;
  artifactText?: string;
  totalCost?: number;
  avgConfidence?: number;
  latencyMs?: number;
  nodes?: NodeState[];
  finalOutputSections?: Array<{ title: string; content: string }>;
};

type StreamEvent =
  | { type: 'snapshot'; payload?: Partial<Snapshot> | null }
  | { type: 'run.started'; runId?: string }
  | { type: 'run.completed'; runId?: string; output?: string; totalCost?: number; totalTokens?: number; avgConfidence?: number }
  | { type: 'run.failed'; error?: string }
  | { type: 'run.canceled'; runId?: string }
  | { type: 'node.started'; nodeId: string }
  | { type: 'node.progress'; nodeId: string; progress: number; label?: string }
  | { type: 'node.completed'; nodeId: string; output?: unknown; cost?: number; confidence?: number }
  | { type: 'node.failed'; nodeId: string; error?: string }
  | { type: 'node.skipped'; nodeId: string; reason?: string }
  | { type: 'token.delta'; nodeId?: string; delta: string }
  | { type: 'token.usage'; totalTokens: number; totalCost: number }
  | { type: 'run.partial_output'; section: string; content: string };

const DEFAULT_PROMPT =
  'Create a detailed PRD for Recruit AI, an AI-first recruitment assistant for startups, including personas, JTBD, MVP features, NFRs, success metrics, risks, and rollout plan.';

const DEFAULT_NODES: NodeState[] = [
  { id: 'router', label: 'Task Router', role: 'router', status: 'queued', progress: 0, dependsOn: [] },
  { id: 'analyzer', label: 'Task Analyzer', role: 'analyzer', status: 'queued', progress: 0, dependsOn: ['router'] },
  { id: 'planner', label: 'Workflow Planner', role: 'planner', status: 'queued', progress: 0, dependsOn: ['analyzer'] },
  { id: 'research_market', label: 'Market Research', role: 'researcher', status: 'queued', progress: 0, dependsOn: ['planner'] },
  { id: 'research_users', label: 'User Research', role: 'researcher', status: 'queued', progress: 0, dependsOn: ['planner'] },
  { id: 'writer', label: 'Writer', role: 'writer', status: 'queued', progress: 0, dependsOn: ['research_market', 'research_users'] },
  { id: 'reviewer', label: 'Reviewer', role: 'reviewer', status: 'queued', progress: 0, dependsOn: ['writer'] },
];

const INITIAL_SNAPSHOT: Snapshot = {
  runId: '',
  projectTitle: 'AgentFlow Studio',
  prompt: DEFAULT_PROMPT,
  mode: 'smart',
  runStatus: 'idle',
  connectionLabel: 'Ready',
  artifactText: '',
  totalCost: 0,
  avgConfidence: 0,
  latencyMs: 0,
  nodes: DEFAULT_NODES,
  finalOutputSections: [],
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function formatMoney(value?: number) {
  return `$${(value ?? 0).toFixed(4)}`;
}

function formatPct(value?: number) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function normalizeNodes(nodes?: Partial<NodeState>[]): NodeState[] {
  const base = DEFAULT_NODES.map((n) => ({ ...n }));

  if (!nodes || nodes.length === 0) return base;

  const byId = new Map(nodes.map((n) => [n.id, n]));

  return base.map((defaultNode) => {
    const incoming = byId.get(defaultNode.id);
    return incoming
      ? {
          ...defaultNode,
          ...incoming,
          label: incoming.label || defaultNode.label,
          role: incoming.role || defaultNode.role,
          dependsOn: incoming.dependsOn || defaultNode.dependsOn,
        }
      : defaultNode;
  });
}

function safeMergeSnapshot(current: Snapshot, patch?: Partial<Snapshot> | null): Snapshot {
  if (!patch) return current;

  return {
    ...current,
    ...patch,
    nodes: normalizeNodes(
      (patch.nodes as Partial<NodeState>[] | undefined) ||
        (current.nodes as Partial<NodeState>[] | undefined)
    ),
    artifactText: patch.artifactText ?? current.artifactText ?? '',
    finalOutputSections: patch.finalOutputSections ?? current.finalOutputSections ?? [],
  };
}

function updateNode(snapshot: Snapshot, nodeId: string, patch: Partial<NodeState>): Snapshot {
  const existingNodes = normalizeNodes(snapshot.nodes as Partial<NodeState>[] | undefined);

  const nextNodes = existingNodes.map((node) =>
    node.id === nodeId ? { ...node, ...patch } : node
  );

  const completedNodes = nextNodes.filter((n) => n.status === 'completed');
  const totalCost = nextNodes.reduce((sum, n) => sum + (n.cost ?? 0), 0);
  const confidences = completedNodes
    .map((n) => n.confidence)
    .filter((n): n is number => typeof n === 'number');

  return {
    ...snapshot,
    nodes: nextNodes,
    totalCost,
    avgConfidence:
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : snapshot.avgConfidence ?? 0,
  };
}

function buildMarkdownArtifact(snapshot: Snapshot) {
  if (snapshot.finalOutputSections && snapshot.finalOutputSections.length > 0) {
    return snapshot.finalOutputSections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n');
  }
  return snapshot.artifactText || '';
}

function buildJsonArtifact(snapshot: Snapshot) {
  return JSON.stringify(
    {
      runId: snapshot.runId,
      projectTitle: snapshot.projectTitle,
      mode: snapshot.mode,
      runStatus: snapshot.runStatus,
      totalCost: snapshot.totalCost,
      avgConfidence: snapshot.avgConfidence,
      latencyMs: snapshot.latencyMs,
      artifactText: snapshot.artifactText,
      finalOutputSections: snapshot.finalOutputSections,
      nodes: snapshot.nodes,
    },
    null,
    2
  );
}

function exportFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [mode, setMode] = useState<Mode>('smart');
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL_SNAPSHOT);
  const [artifact, setArtifact] = useState('');
  const [totalTokens, setTotalTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [streamState, setStreamState] = useState<'idle' | 'connecting' | 'connected' | 'closed' | 'error'>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [selectedNodeId, setSelectedNodeId] = useState('router');
  const [timeline, setTimeline] = useState<Array<{ id: string; label: string; time: string }>>([
    { id: 'init', label: 'Workspace ready', time: '—' },
  ]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const activeRunIdRef = useRef('');
  const runStartRef = useRef<number | null>(null);

  const liveTitle = useMemo(() => deriveTitleFromPrompt(prompt), [prompt]);

  const selectedNode = useMemo(
    () => (snapshot.nodes ?? DEFAULT_NODES).find((n) => n.id === selectedNodeId) ?? normalizeNodes(snapshot.nodes as Partial<NodeState>[] | undefined)[0],
    [snapshot.nodes, selectedNodeId]
  );

  const completedNodes = (snapshot.nodes ?? []).filter((n) => n.status === 'completed' || n.status === 'skipped').length;
  const runningNodes = (snapshot.nodes ?? []).filter((n) => n.status === 'running').length;
  const queuedNodes = (snapshot.nodes ?? []).filter((n) => n.status === 'queued').length;

  function pushTimeline(label: string) {
    setTimeline((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        label,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }

  function closeStream() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }

  async function startRun(runPrompt?: string, runMode?: Mode) {
    const finalPrompt = (runPrompt ?? prompt).trim();
    const finalMode = runMode ?? mode;
    if (!finalPrompt) return;

    closeStream();
    setArtifact('');
    setTotalTokens(0);
    setEstimatedCost(estimateRunCost(finalPrompt.length, finalMode));
    setStreamState('connecting');
    setIsRunning(true);
    runStartRef.current = performance.now();

    setSnapshot({
      ...INITIAL_SNAPSHOT,
      projectTitle: deriveTitleFromPrompt(finalPrompt),
      prompt: finalPrompt,
      mode: finalMode,
      runStatus: 'queued',
      connectionLabel: 'Creating run…',
      artifactText: '',
      nodes: DEFAULT_NODES.map((node) => ({ ...node })),
    });

    setSelectedNodeId('router');
    pushTimeline('Run requested');

    const response = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: finalPrompt, mode: finalMode }),
    });

    if (!response.ok) {
      setStreamState('error');
      setIsRunning(false);
      pushTimeline(`Run creation failed: ${response.status}`);
      return;
    }

    const { runId } = await response.json();
    activeRunIdRef.current = runId;

    setSnapshot((prev) => ({
      ...prev,
      runId,
      connectionLabel: 'Connecting stream…',
    }));

    connectSSE(runId);
  }

  async function handleRun() {
    await startRun();
  }

  async function handleRetry() {
    await startRun(snapshot.prompt || prompt, snapshot.mode || mode);
  }

  async function handleCancel() {
    closeStream();

    if (snapshot.runId) {
      try {
        await fetch(`/api/runs/${snapshot.runId}/cancel`, { method: 'POST' });
      } catch {
        // ignore
      }
    }

    setSnapshot((prev) => ({
      ...prev,
      runStatus: 'canceled',
      connectionLabel: 'Run canceled',
    }));
    setStreamState('closed');
    setIsRunning(false);
    pushTimeline('Run canceled');
  }

  async function handleCopy() {
    const text = outputFormat === 'json' ? buildJsonArtifact(snapshot) : buildMarkdownArtifact(snapshot);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    pushTimeline('Output copied');
  }

  function handleExport() {
    const base =
      (snapshot.projectTitle || 'agentflow-artifact')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'agentflow-artifact';

    if (outputFormat === 'json') {
      exportFile(`${base}.json`, buildJsonArtifact(snapshot), 'application/json;charset=utf-8');
    } else {
      exportFile(`${base}.md`, buildMarkdownArtifact(snapshot), 'text/markdown;charset=utf-8');
    }

    pushTimeline(`Exported ${outputFormat.toUpperCase()}`);
  }

  function connectSSE(runId: string) {
    const es = new EventSource(`/api/runs/${runId}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStreamState('connected');
      setSnapshot((prev) => ({
        ...prev,
        connectionLabel: 'Stream connected',
      }));
      pushTimeline('Stream connected');
    };

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamEvent;

      if (data.type === 'snapshot') {
        setSnapshot((prev) => safeMergeSnapshot(prev, data.payload));
        return;
      }

      if (data.type === 'run.started') {
        setSnapshot((prev) => ({
          ...prev,
          runStatus: 'running',
          connectionLabel: 'Orchestrator running',
        }));
        pushTimeline('Run started');
        return;
      }

      if (data.type === 'node.started') {
        setSelectedNodeId(data.nodeId);
        setSnapshot((prev) =>
          updateNode(prev, data.nodeId, {
            status: 'running',
            progress: 5,
            startedAt: new Date().toISOString(),
          })
        );
        pushTimeline(`${data.nodeId} started`);
        return;
      }

      if (data.type === 'node.progress') {
        setSnapshot((prev) =>
          updateNode(prev, data.nodeId, {
            status: 'running',
            progress: data.progress,
          })
        );
        return;
      }

      if (data.type === 'node.completed') {
        setSnapshot((prev) =>
          updateNode(prev, data.nodeId, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: data.output,
            cost: data.cost,
            confidence: data.confidence,
          })
        );
        pushTimeline(`${data.nodeId} completed`);
        return;
      }

      if (data.type === 'node.failed') {
        setSnapshot((prev) =>
          updateNode(prev, data.nodeId, {
            status: 'failed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { error: data.error || 'Unknown error' },
          })
        );
        pushTimeline(`${data.nodeId} failed`);
        return;
      }

      if (data.type === 'node.skipped') {
        setSnapshot((prev) =>
          updateNode(prev, data.nodeId, {
            status: 'skipped',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: data.reason || 'Skipped',
            cost: 0,
            confidence: 1,
          })
        );
        pushTimeline(`${data.nodeId} skipped`);
        return;
      }

      if (data.type === 'token.delta') {
        setArtifact((prev) => prev + data.delta);
        setSnapshot((prev) => ({
          ...prev,
          artifactText: (prev.artifactText || '') + data.delta,
        }));
        return;
      }

      if (data.type === 'token.usage') {
        setTotalTokens(data.totalTokens);
        setSnapshot((prev) => ({
          ...prev,
          totalCost: data.totalCost,
        }));
        return;
      }

      if (data.type === 'run.partial_output') {
        setArtifact(data.content);
        setSnapshot((prev) => ({
          ...prev,
          artifactText: data.content,
          finalOutputSections: [{ title: data.section, content: data.content }],
        }));
        return;
      }

      if (data.type === 'run.completed') {
        const latencyMs = runStartRef.current
          ? Math.round(performance.now() - runStartRef.current)
          : snapshot.latencyMs || 0;

        setSnapshot((prev) => ({
          ...prev,
          runStatus: 'completed',
          connectionLabel: 'Run complete',
          latencyMs,
          totalCost: data.totalCost ?? prev.totalCost,
          artifactText: data.output ?? prev.artifactText,
          avgConfidence:
            typeof data.avgConfidence === 'number'
              ? data.avgConfidence
              : prev.avgConfidence,
          nodes: normalizeNodes(prev.nodes as Partial<NodeState>[] | undefined),
        }));

        if (typeof data.totalTokens === 'number') {
          setTotalTokens(data.totalTokens);
        }

        if (data.output) {
          setArtifact(data.output);
        }

        setIsRunning(false);
        setStreamState('closed');
        pushTimeline('Run completed');
        closeStream();
        return;
      }

      if (data.type === 'run.canceled') {
        setSnapshot((prev) => ({
          ...prev,
          runStatus: 'canceled',
          connectionLabel: 'Run canceled',
        }));
        setIsRunning(false);
        setStreamState('closed');
        pushTimeline('Run canceled');
        closeStream();
        return;
      }

      if (data.type === 'run.failed') {
        setSnapshot((prev) => ({
          ...prev,
          runStatus: 'failed',
          connectionLabel: data.error || 'Run failed',
        }));
        setIsRunning(false);
        setStreamState('error');
        pushTimeline(data.error || 'Run failed');
        closeStream();
      }
    };

    es.onerror = () => {
      setStreamState('error');
      setIsRunning(false);
      pushTimeline('Stream disconnected');
      es.close();
    };
  }

  useEffect(() => {
    return () => closeStream();
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.20),_transparent_35%),linear-gradient(180deg,_#020617,_#020617)] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-sm text-sky-300">🚀 AgentFlow Studio</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {liveTitle || snapshot.projectTitle || 'AgentFlow Studio'}
            </h1>
            <p className="mt-2 text-sm text-neutral-400">{snapshot.connectionLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none"
            >
              <option value="fast">⚡ Fast</option>
              <option value="smart">🧠 Smart</option>
              <option value="deep">🚀 Deep</option>
            </select>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-sky-400 disabled:opacity-50"
            >
              {isRunning ? 'Running…' : 'Run'}
            </button>

            <button
              onClick={handleRetry}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm hover:bg-white/10"
            >
              Retry
            </button>

            <button
              onClick={handleCancel}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-sm text-rose-200 hover:bg-rose-500/20"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm hover:bg-white/10"
            >
              Export
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_420px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-neutral-500">
                Prompt workspace
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-sm outline-none placeholder:text-neutral-500"
                placeholder="Describe the output you want AgentFlow to generate..."
              />
            </section>

            <section className="grid gap-4 md:grid-cols-5">
              <MetricCard label="Completed Nodes" value={`${completedNodes}/${snapshot.nodes?.length ?? 0}`} />
              <MetricCard label="Running Nodes" value={`${runningNodes}`} />
              <MetricCard label="Queued Nodes" value={`${queuedNodes}`} />
              <MetricCard label="Tokens" value={`${totalTokens}`} />
              <MetricCard label="Estimated Cost" value={`$${estimatedCost.toFixed(4)}`} />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Workflow</div>
                  <h2 className="mt-1 text-2xl font-semibold">Node Progression</h2>
                </div>
                <div className="text-sm text-neutral-400">Click a node to inspect output and metrics</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {normalizeNodes(snapshot.nodes as Partial<NodeState>[] | undefined).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition',
                      selectedNodeId === node.id
                        ? 'border-sky-400 bg-sky-500/10'
                        : 'border-white/10 bg-black/40 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-medium">{node.label}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">{node.role}</div>
                      </div>
                      <StatusBadge status={node.status} />
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          node.status === 'completed' && 'bg-emerald-400',
                          node.status === 'running' && 'bg-sky-400',
                          node.status === 'failed' && 'bg-rose-400',
                          node.status === 'skipped' && 'bg-neutral-400',
                          node.status === 'queued' && 'bg-amber-400'
                        )}
                        style={{ width: `${node.progress}%` }}
                      />
                    </div>

                    <div className="mt-2 text-xs text-neutral-400">Progress {node.progress}%</div>
                    <div className="mt-3 text-sm text-neutral-300">
                      Cost {formatMoney(node.cost)}
                    </div>
                    <div className="mt-1 text-sm text-neutral-300">
                      Confidence {typeof node.confidence === 'number' ? formatPct(node.confidence) : '—'}
                    </div>

                    {node.dependsOn && node.dependsOn.length > 0 && (
                      <div className="mt-3 text-xs text-neutral-500">
                        Depends on: {node.dependsOn.join(', ')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Artifact</div>
                  <h2 className="mt-1 text-2xl font-semibold">Output</h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                  </select>

                  <button
                    onClick={handleCopy}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <pre className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/60 p-5 whitespace-pre-wrap text-sm leading-7 text-neutral-200">
                {outputFormat === 'json'
                  ? buildJsonArtifact(snapshot)
                  : artifact || buildMarkdownArtifact(snapshot) || 'Waiting for output…'}
              </pre>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Timeline</div>
              <h2 className="mt-1 text-2xl font-semibold">Run Activity</h2>

              <div className="mt-5 space-y-3">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                  >
                    <div>{item.label}</div>
                    <div className="text-sm text-neutral-500">{item.time}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Runtime</div>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Status" value={snapshot.runStatus || 'idle'} />
                <InfoRow label="Stream" value={streamState} />
                <InfoRow label="Tokens" value={`${totalTokens}`} />
                <InfoRow label="Actual Cost" value={formatMoney(snapshot.totalCost)} />
                <InfoRow label="Estimated Cost" value={`$${estimatedCost.toFixed(4)}`} />
                <InfoRow label="Confidence" value={formatPct(snapshot.avgConfidence)} />
                <InfoRow label="Latency" value={`${((snapshot.latencyMs ?? 0) / 1000).toFixed(1)}s`} />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Inspector</div>
              <h2 className="mt-1 text-2xl font-semibold">{selectedNode?.label || 'No node selected'}</h2>

              {selectedNode && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={selectedNode.status} />
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      Progress {selectedNode.progress}%
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <InfoRow label="Cost" value={formatMoney(selectedNode.cost)} />
                    <InfoRow
                      label="Confidence"
                      value={typeof selectedNode.confidence === 'number' ? formatPct(selectedNode.confidence) : '—'}
                    />
                    <InfoRow label="Started" value={selectedNode.startedAt || '—'} />
                    <InfoRow label="Completed" value={selectedNode.completedAt || '—'} />
                  </div>

                  <pre className="mt-5 max-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-xs leading-6 text-neutral-300">
                    {selectedNode.output
                      ? typeof selectedNode.output === 'string'
                        ? selectedNode.output
                        : JSON.stringify(selectedNode.output, null, 2)
                      : 'No output yet.'}
                  </pre>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10 backdrop-blur">
      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</div>
      <div className="mt-2 text-4xl font-semibold">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-neutral-500">{label}</div>
      <div className="max-w-[220px] truncate text-right text-neutral-200">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: NodeStatus }) {
  const style =
    status === 'completed'
      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
      : status === 'running'
      ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
      : status === 'failed'
      ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
      : status === 'skipped'
      ? 'border-neutral-500/30 bg-neutral-500/15 text-neutral-300'
      : 'border-amber-500/30 bg-amber-500/15 text-amber-300';

  return (
    <span className={cn('rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]', style)}>
      {status}
    </span>
  );
}