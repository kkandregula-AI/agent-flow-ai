'use client';

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
