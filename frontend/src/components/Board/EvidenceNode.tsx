import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { EVIDENCE_TYPE_ICONS } from '../../utils/constants';
import { getImageUrl } from '../../utils/helpers';

interface EvidenceNodeData {
  label: string;
  type: string;
  importance: number;
  image?: string | null;
  isKeyEvidence?: boolean;
  slug?: string;
  description?: string;
}

function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  const icon = EVIDENCE_TYPE_ICONS[data.type || ''] || '🔍';
  const imageUrl = data.image ? getImageUrl(data.image) : null;

  // Stable random rotation per node based on label hash
  const rotation = useMemo(() => {
    let hash = 0;
    const str = data.slug || data.label;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash % 5) - 2; // -2 to +2 degrees
  }, [data.slug, data.label]);

  const stars = useMemo(() => {
    const filled = Math.min(data.importance || 0, 5);
    const empty = 5 - filled;
    return '★'.repeat(filled) + '☆'.repeat(empty);
  }, [data.importance]);

  return (
    <div
      className="group relative w-[170px] transition-all duration-200 hover:scale-105"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Pin */}
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20
                    w-5 h-5 rounded-full
                    border-2 border-white/30"
        style={{
          background: data.isKeyEvidence
            ? 'radial-gradient(circle at 35% 35%, #e8c84a, #c9a84c, #a08030)'
            : 'radial-gradient(circle at 35% 35%, #e85555, #cc3333, #992222)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
        }}
      />

      {/* Card */}
      <div
        className="bg-[#f5f0e8]/95 rounded pt-3 pb-2 px-2.5 border border-[#d4c9b0]/50
                    transition-shadow duration-200
                    group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
        style={{
          boxShadow: '3px 4px 10px rgba(0,0,0,0.25), 1px 1px 3px rgba(0,0,0,0.15)',
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#cc3333] !w-2 !h-2 !border-[#cc3333] !top-0"
        />

        {/* Image or icon fallback */}
        {imageUrl ? (
          <div className="w-full h-[80px] rounded-t overflow-hidden mb-1.5">
            <img
              src={imageUrl}
              alt={data.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className="w-full h-[80px] rounded-t mb-1.5 flex items-center justify-center bg-[#ebe5d8]">
            <span className="text-3xl opacity-70">{icon}</span>
          </div>
        )}

        {/* Title */}
        <p className="font-serif font-bold text-[12px] leading-tight text-[#1a1a2e] mb-0.5 line-clamp-2">
          {data.label}
        </p>

        {/* Type */}
        <p className="text-[10px] text-[#666] mb-0.5">
          {data.type || 'улика'}
        </p>

        {/* Description */}
        {data.description && (
          <p className="text-[10px] leading-snug text-[#444] mb-1 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Importance stars */}
        <p className="text-[11px] text-[#c9a84c] leading-none mb-1">
          {stars}
        </p>

        {/* KEY badge */}
        {data.isKeyEvidence && (
          <span className="inline-block bg-[#8b2500] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
            key
          </span>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-[#cc3333] !w-2 !h-2 !border-[#cc3333] !bottom-0"
        />
      </div>
    </div>
  );
}

export default memo(EvidenceNode);
