import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export default function ConnectionLine({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isConfirmed = (data as any)?.is_confirmed;
  const note = (data as any)?.note;

  return (
    <>
      {/* Shadow/glow for confirmed connections */}
      {isConfirmed && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ff2222"
          strokeWidth={6}
          strokeOpacity={0.25}
          className="react-flow__edge-path"
        />
      )}

      {/* Main string line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isConfirmed ? '#ff2222' : '#cc3333'}
        strokeWidth={isConfirmed ? 3 : 2}
        strokeDasharray={isConfirmed ? undefined : '8 4'}
        strokeLinecap="round"
        className="react-flow__edge-path"
      />

      {/* Label tag on confirmed connections */}
      {isConfirmed && note && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div className="bg-[#f5f0e8] border border-[#cc3333]/40 rounded px-2 py-0.5 shadow-sm">
              <span className="text-[10px] font-serif text-[#1a1a2e] leading-none">
                {note}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
