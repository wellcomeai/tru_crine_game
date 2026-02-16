import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EvidenceNode from './EvidenceNode';
import ConnectionLine from './ConnectionLine';
import { useGameStore } from '../../stores/gameStore';
import { toast } from 'sonner';

const CORK_BOARD_URL = 'https://pub-b1e3de631e544c69b0ad6587f740e140.r2.dev/photo_2026-02-16_11-19-32%20%281%29.jpg';

const nodeTypes = { evidence: EvidenceNode };
const edgeTypes = { connection: ConnectionLine };

export default function BoardCanvas() {
  const { evidence, state, connectEvidence, disconnectEvidence } = useGameStore();

  const initialNodes: Node[] = useMemo(() => {
    return evidence.map((ev, i) => ({
      id: ev.slug,
      type: 'evidence',
      position: {
        x: 100 + (i % 4) * 220,
        y: 80 + Math.floor(i / 4) * 200,
      },
      data: {
        label: ev.name,
        type: ev.type || '',
        importance: ev.importance,
        image: ev.image,
        isKeyEvidence: ev.is_key_evidence,
        slug: ev.slug,
        description: ev.description ? ev.description.slice(0, 60) : '',
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
    <div
      className="w-full h-full relative"
      style={{
        backgroundImage: `url(${CORK_BOARD_URL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Empty state hint */}
      {evidence.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-[rgba(10,10,15,0.7)] backdrop-blur-sm rounded-lg px-6 py-4 border border-noir-600/30">
            <p className="font-serif text-gray-300 text-sm text-center">
              Осмотрите локации, чтобы найти улики
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="!bg-transparent"
      >
        <Controls
          className="!bg-[rgba(10,10,15,0.75)] !border-[#c9a84c]/30 !rounded-lg !shadow-lg [&>button]:!bg-transparent [&>button]:!border-[#c9a84c]/20 [&>button]:!text-[#c9a84c] [&>button:hover]:!bg-[#c9a84c]/10"
        />
        <MiniMap
          className="!bg-[rgba(10,10,15,0.75)] !border-[#c9a84c]/30 !rounded-lg"
          nodeColor="#f5f0e8"
          maskColor="rgba(10, 10, 15, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
