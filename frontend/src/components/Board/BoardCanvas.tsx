import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EvidenceNode from './EvidenceNode';
import ConnectionLine from './ConnectionLine';
import { useGameStore } from '../../stores/gameStore';
import { toast } from 'sonner';

const nodeTypes = { evidence: EvidenceNode };
const edgeTypes = { connection: ConnectionLine };

export default function BoardCanvas() {
  const { evidence, state, connectEvidence, disconnectEvidence } = useGameStore();

  const initialNodes: Node[] = useMemo(() => {
    return evidence.map((ev, i) => ({
      id: ev.slug,
      type: 'evidence',
      position: {
        x: 100 + (i % 4) * 200,
        y: 80 + Math.floor(i / 4) * 150,
      },
      data: {
        label: ev.name,
        type: ev.type || '',
        importance: ev.importance,
      },
    }));
  }, [evidence]);

  const initialEdges: Edge[] = useMemo(() => {
    return (state?.player_connections || []).map((conn, i) => ({
      id: `${conn.a}-${conn.b}`,
      source: conn.a,
      target: conn.b,
      type: 'connection',
      data: {
        is_confirmed: conn.is_confirmed,
        note: conn.confirmation_text || conn.note,
      },
      style: {
        stroke: conn.is_confirmed ? '#c9a84c' : '#555566',
      },
    }));
  }, [state?.player_connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source && params.target) {
        try {
          const result = await connectEvidence(params.source, params.target);
          if (result?.connection?.is_confirmed) {
            toast.success(`Связь подтверждена: ${result.connection.confirmation_text}`);
          }
        } catch (err: any) {
          toast.error(err.response?.data?.detail || 'Ошибка создания связи');
        }
      }
    },
    [connectEvidence]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-noir-900"
      >
        <Background color="#2a2a3a" gap={20} />
        <Controls className="!bg-noir-800 !border-noir-600 !text-gray-400" />
        <MiniMap
          className="!bg-noir-800 !border-noir-600"
          nodeColor="#1a1a2e"
          maskColor="rgba(10, 10, 15, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
