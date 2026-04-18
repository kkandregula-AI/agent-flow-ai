import { NextRequest } from 'next/server';
import type { Edge, Node } from '@xyflow/react';
import type { AgentNodeData, OutputSection, ProjectRunSnapshot, RunMetric, TimelineItem } from '@/components/agentflow/types';
import {
  baseEdges,
  baseFinalOutputSections,
  baseNodes,
  baseRunMetrics,
  baseTimeline,
  defaultPrompt,
} from '@/lib/data';

const encoder = new TextEncoder();

type Mode = 'fast' | 'smart' | 'deep';

type AttachmentMeta = {
  name: string;
  size: number;
  type: string;
};

type RunPayload = {
  prompt?: string;
  mode?: Mode;
  attachments?: AttachmentMeta[];
  sourceLinks?: string[];
};

type SnapshotBuilder = {
  runId: string;
  prompt: string;
  mode: Mode;
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

function cloneMetrics() {
  return structuredClone(baseRunMetrics) as RunMetric[];
}

function cloneNodes() {
  return structuredClone(baseNodes) as Node<AgentNodeData>[];
}

function cloneEdges() {
  return structuredClone(baseEdges) as Edge[];
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
    runId: builder.runId,
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

function replaceOutputSections(target: OutputSection[], sections: OutputSection[]) {
  target.splice(0, target.length, ...sections);
}

function buildPrdSections({
  prompt,
  mode,
  attachmentNames,
  linkHosts,
  inputSummary,
}: {
  prompt: string;
  mode: Mode;
  attachmentNames: string[];
  linkHosts: string[];
  inputSummary: string;
}): OutputSection[] {
  const hasInputs = attachmentNames.length > 0 || linkHosts.length > 0;
  const modeLine = mode === 'fast'
    ? 'Fast mode emphasized speed and a lean MVP cut.'
    : mode === 'deep'
      ? 'Deep mode added fuller validation, launch sequencing, and non-functional detail.'
      : 'Smart mode balanced scope depth with orchestration speed.';
  const groundingLine = hasInputs
    ? `Grounding inputs included ${inputSummary}. Attachments: ${attachmentNames.join(', ') || 'none'}. Sources: ${linkHosts.join(', ') || 'none'}.`
    : 'No additional files or links were supplied, so the PRD was grounded on the prompt, reusable memory, and internal templates.';

  return [
    {
      title: 'Executive summary',
      content: `This PRD translates the request — “${prompt}” — into a privacy-first product plan for freelancers. ${modeLine}`,
    },
    {
      title: 'Problem statement',
      content: hasInputs
        ? `Freelancers need an expense tracker that stays private by default while still learning from supplied context (${inputSummary}) to remain tax-ready, searchable, and easy to share with an accountant when necessary.`
        : 'Freelancers need an expense tracker that feels as private as a local notebook while still being tax-ready, searchable, and easy to share with an accountant when necessary.',
    },
    {
      title: 'Target users and JTBD',
      content: 'Primary users are privacy-conscious freelancers, consultants, and solo creators. Their core jobs are to capture expenses quickly, stay prepared for tax season, and share only the minimum required information with bookkeepers or accountants.',
    },
    {
      title: 'User pain points',
      content: 'Existing tools often require full-cloud storage, expose too much financial detail during sharing, create weak audit trails for exports, and make categorization feel slow on mobile-first workflows.',
    },
    {
      title: 'Product goals',
      content: 'Deliver trusted receipt capture, local-first organization, clear privacy controls, encrypted sync and backup, and low-friction accountant collaboration without compromising transparency.',
    },
    {
      title: 'Core use cases',
      content: 'Capture receipts on the go, auto-categorize common transactions, review monthly spending, export tax-ready summaries, and grant limited-time or scoped access to an accountant.',
    },
    {
      title: 'MVP features',
      content: hasInputs
        ? `Local-first capture, encrypted backup, privacy-preserving categorization, accountant share mode, export controls, and grounding notes linked back to ${inputSummary}.`
        : 'Local-first capture, encrypted backup, privacy-preserving categorization, accountant share mode, audit logs, and tax-friendly export presets.',
    },
    {
      title: 'Non-functional requirements',
      content: 'Offline-first responsiveness, encrypted-at-rest storage, secure sync, transparent consent-based sharing, clear audit logs for exports, and reliable search over receipts and transactions.',
    },
    {
      title: 'Competitor and market takeaways',
      content: 'Products like Expensify, FreshBooks, Wave, and QuickBooks cover accounting breadth, but a privacy-first position can differentiate on local-first workflows, selective sharing, and user trust.',
    },
    {
      title: 'Launch plan and priorities',
      content: 'Phase 1 should launch to freelancers with strong privacy concerns, Phase 2 should expand to accountant collaboration and smarter categorization, and Phase 3 can introduce premium automation once trust is established.',
    },
    {
      title: 'Success metrics',
      content: 'Track weekly active users, receipt capture completion rate, first export conversion, accountant-share adoption, 30/90-day retention, and trust-related support incidents.',
    },
    {
      title: 'Input grounding',
      content: groundingLine,
    },
    {
      title: 'Why this workflow',
      content: 'The system chose parallel specialists because market research, persona design, and feature decomposition were independent and could reduce latency without sacrificing PRD quality.',
    },
  ];
}

async function getPayload(request: NextRequest): Promise<Required<RunPayload>> {
  if (request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as RunPayload;
    return {
      prompt: body.prompt?.trim() || defaultPrompt,
      mode: body.mode === 'fast' || body.mode === 'deep' ? body.mode : 'smart',
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      sourceLinks: Array.isArray(body.sourceLinks) ? body.sourceLinks : [],
    };
  }

  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt')?.trim() || defaultPrompt;
  const modeParam = searchParams.get('mode');
  return {
    prompt,
    mode: modeParam === 'fast' || modeParam === 'deep' ? modeParam : 'smart',
    attachments: [],
    sourceLinks: [],
  };
}

async function streamRun(request: NextRequest) {
  const payload = await getPayload(request);
  const { attachments, sourceLinks, prompt, mode } = payload;
  const attachmentCount = attachments.length;
  const sourceCount = sourceLinks.length;
  const inputSummary = `${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'} • ${sourceCount} link${sourceCount === 1 ? '' : 's'}`;
  const attachmentNames = attachments.map((file) => file.name);
  const linkHosts = sourceLinks.map((link) => {
    try {
      return new URL(link).host;
    } catch {
      return link;
    }
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const metrics = cloneMetrics();
      const nodes = cloneNodes();
      const edges = cloneEdges();
      const timeline = cloneTimeline();
      const finalOutputSections = cloneOutput();
      const projectTitle = prompt.length > 44 ? `${prompt.slice(0, 44)}…` : prompt;

      updateMetric(metrics, 'Agents', sourceCount || attachmentCount ? '7 + inputs' : '7', inputSummary);
      replaceOutputSections(finalOutputSections, buildPrdSections({ prompt, mode, attachmentNames, linkHosts, inputSummary }));

      const builder: SnapshotBuilder = {
        runId: crypto.randomUUID(),
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
        connectionLabel: sourceCount || attachmentCount
          ? `Streaming orchestration updates… ${inputSummary} included`
          : 'Streaming orchestration updates…',
      };

      controller.enqueue(formatSse({ type: 'status', payload: { runStatus: 'running', connectionLabel: builder.connectionLabel } }));
      controller.enqueue(formatSse({ type: 'snapshot', payload: buildSnapshot(builder) }));

      const sendPatch = () => controller.enqueue(formatSse({ type: 'patch', payload: buildSnapshot(builder) }));

      await wait(650);
      updateNode(nodes, 'analyzer', {
        status: 'done',
        time: '1.4s',
        cost: '$0.03',
        confidence: 0.97,
        output: [
          'Task type: PRD generation',
          'Complexity: High',
          sourceCount || attachmentCount ? `Input bundle detected: ${inputSummary}` : 'No external inputs detected',
        ],
        summary: sourceCount || attachmentCount
          ? 'Intent classified and augmented with staged attachments and source links for downstream nodes.'
          : 'Intent classified and routed to a graph-based orchestration workflow.',
      });
      updateMetric(metrics, 'Total cost', '$0.03', '716 tokens');
      updateMetric(metrics, 'Latency', '1.4s', 'Analyzer complete');
      updateMetric(metrics, 'Confidence', '0.97', 'Classifier certainty');
      updateTimeline(timeline, 'Task Analyzer', { status: 'done', time: '0.0s → 1.4s' });
      builder.selectedNodeId = 'planner';
      sendPatch();

      await wait(800);
      updateNode(nodes, 'planner', {
        status: 'done',
        time: '2.9s',
        cost: '$0.08',
        confidence: 0.93,
        summary: sourceCount || attachmentCount
          ? 'Planner created a DAG and attached input-ingestion instructions for files and links.'
          : 'Planner created a DAG with three independent specialists and two downstream validators.',
        output: [
          'Built 7-node execution graph',
          'Enabled parallel market, persona, and requirements branches',
          sourceCount || attachmentCount ? 'Added input ingestion policy + grounding notes' : 'Attached PRD schema + retry policy',
        ],
      });
      updateTimeline(timeline, 'Planner', { status: 'done', time: '1.4s → 2.9s' });
      updateMetric(metrics, 'Total cost', '$0.08', '1,944 tokens');
      updateMetric(metrics, 'Latency', '2.9s', 'Planner complete');
      builder.selectedNodeId = 'competitors';
      sendPatch();

      await wait(650);
      updateNode(nodes, 'competitors', {
        status: 'running',
        time: '3.7s',
        cost: '$0.14',
        confidence: 0.76,
        summary: sourceCount
          ? `Researcher is grounding market patterns from provided sources: ${linkHosts.join(', ')}`
          : 'Researcher is grounding market patterns from tool results and prior memory.',
      });
      updateNode(nodes, 'persona', {
        status: 'running',
        time: '3.7s',
        cost: '$0.09',
        confidence: 0.72,
        summary: attachmentCount
          ? `Persona analyst is incorporating uploaded inputs: ${attachmentNames.join(', ')}`
          : 'Persona analyst is modeling primary user segments and JTBD signals.',
      });
      updateNode(nodes, 'requirements', {
        status: 'running',
        time: '3.7s',
        cost: '$0.08',
        confidence: 0.71,
        summary: sourceCount || attachmentCount
          ? 'Requirements agent is reconciling prompt intent with staged files and links.'
          : 'Requirements agent is decomposing MVP scope and privacy constraints.',
      });
      updateTimeline(timeline, 'Competitor Research', { status: 'running', time: '2.9s → 8.6s' });
      updateTimeline(timeline, 'Persona Analyst', { status: 'running', time: '2.9s → 7.9s' });
      updateTimeline(timeline, 'Requirements', { status: 'running', time: '2.9s → 7.5s' });
      updateMetric(metrics, 'Latency', '3.7s', 'Parallel branch active');
      sendPatch();

      await wait(1100);
      updateNode(nodes, 'persona', {
        status: 'done',
        time: '4.9s',
        cost: '$0.12',
        confidence: 0.89,
        output: [
          'Primary persona: privacy-sensitive freelancer',
          attachmentCount ? `Incorporated uploaded files: ${attachmentNames.join(', ')}` : 'Secondary persona: bookkeeper/accountant',
          'JTBD and anxieties mapped',
        ],
        summary: 'Persona analyst completed with trust barriers, purchase triggers, and user context.',
      });
      updateTimeline(timeline, 'Persona Analyst', { status: 'done', time: '2.9s → 4.9s' });
      updateMetric(metrics, 'Total cost', '$0.21', '4,866 tokens');
      builder.selectedNodeId = 'persona';
      sendPatch();

      await wait(1000);
      updateNode(nodes, 'requirements', {
        status: 'done',
        time: '6.0s',
        cost: '$0.16',
        confidence: 0.87,
        output: [
          'Local-first receipt capture',
          'Encrypted backup and export controls',
          sourceCount || attachmentCount ? 'External inputs mapped into requirements notes' : 'Audit log + accountant share mode',
        ],
        summary: 'Requirements agent finished MVP scope, privacy guardrails, and launch sequencing.',
      });
      updateTimeline(timeline, 'Requirements', { status: 'done', time: '2.9s → 6.0s' });
      updateMetric(metrics, 'Total cost', '$0.29', '6,988 tokens');
      builder.selectedNodeId = 'requirements';
      sendPatch();

      await wait(900);
      updateNode(nodes, 'competitors', {
        status: 'done',
        time: '6.9s',
        cost: '$0.22',
        confidence: 0.84,
        output: [
          'Benchmark set: Wave, FreshBooks, Expensify, QuickBooks Self-Employed',
          sourceCount ? `Sources used: ${linkHosts.join(', ')}` : 'Competitive gaps: privacy positioning, local-first workflows',
          'Monetization benchmark captured',
        ],
        summary: 'Competitor scan completed with grounded patterns, price anchors, and product white space.',
      });
      updateNode(nodes, 'writer', {
        status: 'running',
        time: '7.0s',
        cost: '$0.24',
        confidence: 0.78,
        summary: sourceCount || attachmentCount
          ? 'Writer is synthesizing the prompt, agent outputs, and supplied inputs into a structured draft.'
          : 'Writer is synthesizing parallel branch outputs into a structured PRD draft.',
        output: ['Merging market, persona, and requirements outputs', 'Draft sections being composed', 'Schema validation in progress'],
      });
      updateTimeline(timeline, 'Competitor Research', { status: 'done', time: '2.9s → 6.9s' });
      updateTimeline(timeline, 'Writer', { status: 'running', time: '6.9s → 10.1s' });
      updateMetric(metrics, 'Total cost', '$0.46', '10,922 tokens');
      updateMetric(metrics, 'Latency', '7.0s', 'Writer activated');
      builder.selectedNodeId = 'writer';
      sendPatch();

      await wait(1200);
      updateNode(nodes, 'writer', {
        status: 'done',
        time: '9.3s',
        cost: '$0.31',
        confidence: 0.9,
        summary: 'Writer produced a full draft with launch priorities and input-aware grounding.',
        output: [
          'Problem, personas, and JTBD aligned',
          sourceCount || attachmentCount ? 'Grounding notes from attachments and links included' : 'MVP + stretch features drafted',
          'Launch priorities and success metrics included',
        ],
      });
      updateNode(nodes, 'reviewer', {
        status: 'running',
        time: '9.4s',
        cost: '$0.33',
        confidence: 0.8,
        summary: 'Reviewer is validating completeness, consistency, and hallucination risk.',
      });
      updateTimeline(timeline, 'Writer', { status: 'done', time: '6.9s → 9.3s' });
      updateTimeline(timeline, 'Reviewer', { status: 'running', time: '9.3s → 11.4s' });
      updateMetric(metrics, 'Total cost', '$0.57', '13,460 tokens');
      updateMetric(metrics, 'Confidence', '0.90', 'Writer complete');
      builder.selectedNodeId = 'reviewer';
      sendPatch();

      await wait(1200);
      updateNode(nodes, 'reviewer', {
        status: 'done',
        time: '11.4s',
        cost: '$0.38',
        confidence: 0.94,
        summary: 'Reviewer approved the draft after schema, quality, and grounding checks.',
        output: [
          'Schema adherence: pass',
          'Completeness score: 0.94',
          sourceCount || attachmentCount ? 'Input references preserved in output summary' : 'No retry required',
        ],
      });
      updateTimeline(timeline, 'Reviewer', { status: 'done', time: '9.3s → 11.4s' });
      replaceOutputSections(finalOutputSections, buildPrdSections({ prompt, mode, attachmentNames, linkHosts, inputSummary }));
      updateMetric(metrics, 'Total cost', '$0.63', '14,801 tokens');
      updateMetric(metrics, 'Latency', '11.4s', 'Review complete');
      updateMetric(metrics, 'Confidence', '0.94', 'Reviewer approved');
      builder.runStatus = 'completed';
      builder.connectionLabel = 'Run complete';
      builder.selectedNodeId = 'reviewer';
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
    },
  });
}

export async function POST(request: NextRequest) {
  return streamRun(request);
}

export async function GET(request: NextRequest) {
  return streamRun(request);
}
