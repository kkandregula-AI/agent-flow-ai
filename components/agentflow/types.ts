export type NodeStatus = 'done' | 'running' | 'queued' | 'error';

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
