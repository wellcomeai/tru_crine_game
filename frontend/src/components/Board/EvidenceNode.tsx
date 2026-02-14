import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';

interface EvidenceNodeData {
  label: string;
  type: string;
  importance: number;
}

function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  const icon = EVIDENCE_TYPE_ICONS[data.type || ''] || '🔍';

  return (
    <div className="bg-noir-800 border border-noir-500 rounded-lg p-3 min-w-[120px] hover:border-gold-dim transition-colors shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-gold !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-300 font-serif">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gold !w-2 !h-2" />
    </div>
  );
}

export default memo(EvidenceNode);
