import type { Edge, Node } from '@xyflow/react';
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
    title: 'Executive summary',
    content:
      'This PRD defines a privacy-first expense tracker for freelancers with local-first capture, encrypted sync, accountant-safe sharing, and tax-ready reporting.',
  },
  {
    title: 'Problem statement',
    content:
      'Freelancers need an expense tracker that minimizes data exposure while still providing quick categorization, tax-ready exports, and simple collaboration with accountants.',
  },
  {
    title: 'Target users and JTBD',
    content:
      'Primary users are independent freelancers and solo consultants who need low-friction expense capture and confidence during tax filing.',
  },
  {
    title: 'Core use cases',
    content:
      'Capture receipts quickly, organize spending privately, prepare monthly summaries, and share only the minimum required data with accountants.',
  },
  {
    title: 'MVP features',
    content:
      'Receipt capture, local-first categorization, encrypted cloud backup, export controls, and accountant share mode.',
  },
  {
    title: 'Non-functional requirements',
    content:
      'Fast offline behavior, encrypted storage, auditability for exports, and transparent privacy controls across every sharing action.',
  },
  {
    title: 'Launch plan',
    content:
      'Ship an MVP to privacy-conscious freelancers first, then expand into accountant workflows and lightweight automation for repeat categorization.',
  },
  {
    title: 'Success metrics',
    content:
      'Weekly active users, receipt processing completion rate, export usage, retention at 30/90 days, and trust-related support tickets.',
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
