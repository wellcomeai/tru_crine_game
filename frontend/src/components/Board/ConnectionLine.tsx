import { getBezierPath } from '@xyflow/react';
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
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isConfirmed = (data as any)?.is_confirmed;

  return (
    <g>
      <path
        id={id}
        style={style}
        d={edgePath}
        className={`react-flow__edge-path ${
          isConfirmed ? '!stroke-gold' : '!stroke-gray-600'
        }`}
        strokeWidth={isConfirmed ? 2 : 1}
        fill="none"
      />
      {isConfirmed && (data as any)?.note && (
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            className="fill-gold text-[10px]"
          >
            {(data as any).note}
          </textPath>
        </text>
      )}
    </g>
  );
}
