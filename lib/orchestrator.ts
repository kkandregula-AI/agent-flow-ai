import 'dotenv/config';
import type { Node } from '@xyflow/react';
import type { ProjectRunSnapshot, OutputSection, TimelineItem } from '@/components/agentflow/types';
import { createInitialSnapshot } from '@/lib/data';
import type { AttachmentMeta, RunMode } from '@/lib/server-types';

export function buildInitialRunSnapshot(input: {
  runId: string;
  prompt: string;
  mode: RunMode;
  projectTitle?: string;
  attachments: AttachmentMeta[];
  sourceLinks: string[];
}): ProjectRunSnapshot {
  const base = createInitialSnapshot();
  return {
    ...base,
    runId: input.runId,
    prompt: input.prompt,
    mode: input.mode,
    projectTitle: input.projectTitle ?? base.projectTitle,
    runStatus: 'connecting',
    connectionLabel: `Run queued • ${input.attachments.length} file(s) • ${input.sourceLinks.length} link(s)`,
  } as ProjectRunSnapshot & { runStatus: 'idle' | 'connecting' | 'running' | 'completed' | 'error' | 'queued' };
}

export function patchNode(snapshot: ProjectRunSnapshot, nodeId: string, patch: Partial<Node['data']>) {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node),
    selectedNodeId: nodeId,
  };
}

export function patchTimeline(snapshot: ProjectRunSnapshot, label: string, patch: Partial<TimelineItem>) {
  return {
    ...snapshot,
    timeline: snapshot.timeline.map((item) => item.label === label ? { ...item, ...patch } : item),
  };
}

export function patchMetrics(snapshot: ProjectRunSnapshot, values: Partial<Record<'Total cost' | 'Latency' | 'Confidence' | 'Agents', string>>) {
  return {
    ...snapshot,
    metrics: snapshot.metrics.map((metric) => ({
      ...metric,
      value: values[metric.label as keyof typeof values] ?? metric.value,
    })),
  };
}

export function setFinalSections(snapshot: ProjectRunSnapshot, sections: OutputSection[]) {
  return {
    ...snapshot,
    finalOutputSections: sections,
  };
}

export function summarizeInputs(attachments: AttachmentMeta[], sourceLinks: string[]) {
  const attachmentText = attachments.length
    ? attachments.map((file) => `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`).join(', ')
    : 'No local files attached';
  const sourceText = sourceLinks.length ? sourceLinks.join(', ') : 'No external source links provided';
  return { attachmentText, sourceText };
}

export function createPrdSections(prompt: string, attachments: AttachmentMeta[], sourceLinks: string[], mode: RunMode): OutputSection[] {
  const { attachmentText, sourceText } = summarizeInputs(attachments, sourceLinks);
  const modeText = mode === 'fast' ? 'fast single-pass with minimal review' : mode === 'deep' ? 'deep orchestration with planner, parallel specialists, writer, and reviewer' : 'balanced orchestration with selective review';
  return [
    { title: 'Executive summary', content: `This PRD is generated from the prompt: ${prompt}. The workflow used ${modeText} to produce a structured product requirements document.` },
    { title: 'Problem statement', content: 'Users need a reliable way to accomplish the target outcome with lower friction, clearer value, and measurable business impact.' },
    { title: 'Target users and JTBD', content: 'Primary users are the most likely early adopters; the core jobs-to-be-done focus on speed, confidence, and low cognitive load.' },
    { title: 'User pain points', content: 'Current workflows are fragmented, repetitive, and difficult to trust. Users face setup friction, context switching, and poor visibility.' },
    { title: 'Product goals', content: 'Deliver the core user value quickly, reduce time-to-first-success, and create a foundation for repeatable expansion beyond the MVP.' },
    { title: 'Core use cases', content: 'Support the main success path end-to-end, including onboarding, routine usage, collaboration or review, and export or sharing.' },
    { title: 'MVP features', content: 'Include the minimum set of features needed to prove demand, unlock repeat usage, and validate workflow reliability.' },
    { title: 'Non-functional requirements', content: 'Set expectations for latency, reliability, privacy, security, and observability so the initial product can operate safely and credibly.' },
    { title: 'Competitor and market takeaways', content: 'Differentiate through workflow quality, clarity, and trust. Competing offerings often win on breadth, so the MVP should win on focus.' },
    { title: 'Launch plan and priorities', content: 'Launch with a narrow ICP, focused messaging, a measurable onboarding loop, and one or two distribution channels that can be instrumented well.' },
    { title: 'Success metrics', content: 'Track activation, weekly engagement, task completion, retention, conversion or expansion, and quality-of-output signals.' },
    { title: 'Input grounding', content: `Attached inputs: ${attachmentText}. Source links: ${sourceText}. These inputs were passed into the run request so agents could reference them during orchestration.` },
    { title: 'Why this workflow', content: `The orchestrator selected ${modeText} because the prompt called for a multi-section deliverable that benefits from decomposition, synthesis, and quality review.` },
  ];
}
