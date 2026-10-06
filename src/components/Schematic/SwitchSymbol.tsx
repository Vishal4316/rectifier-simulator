import React from 'react';
import type { SwitchType } from '../../types/simulator';

interface SwitchSymbolProps {
  x: number;
  y: number;
  id: string;
  type: SwitchType;
  isConducting: boolean;
  onToggle: (id: string) => void;
  direction?: 'down' | 'up' | 'right';
  labelOffset?: { x: number; y: number };
}

export const SwitchSymbol: React.FC<SwitchSymbolProps> = ({
  x,
  y,
  id,
  type,
  isConducting,
  onToggle,
  direction = 'down',
  labelOffset = { x: 26, y: 0 },
}) => {
  const isThyristor = type === 'thyristor';

  // Rotation based on direction (standard orientation is pointing down: Anode top, Cathode bottom)
  let rotation = 0;
  if (direction === 'up') rotation = 180;
  if (direction === 'right') rotation = -90;

  const fillColor = isConducting ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.7)';
  const strokeColor = isConducting ? '#34d399' : '#94a3b8';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group select-none transition-all duration-200"
      onClick={() => onToggle(id)}
      role="button"
      tabIndex={0}
      aria-label={`Toggle ${id} between Diode and Thyristor`}
    >
      {/* Click target area */}
      <circle cx={0} cy={0} r={28} fill="transparent" className="hover:fill-cyan-500/10 transition-colors" />

      {/* Halo glow when conducting */}
      {isConducting && (
        <circle
          cx={0}
          cy={0}
          r={24}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          opacity={0.6}
          className="animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Rotated diode / thyristor body */}
      <g transform={`rotate(${rotation})`}>
        {/* Anode lead */}
        <line x1={0} y1={-24} x2={0} y2={-10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Cathode lead */}
        <line x1={0} y1={10} x2={0} y2={24} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Diode Triangle: from (-12, -10) to (12, -10) down to (0, 10) */}
        <polygon
          points="-12,-10 12,-10 0,10"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Cathode bar */}
        <line x1={-12} y1={10} x2={12} y2={10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Thyristor Gate Terminal */}
        {isThyristor && (
          <g>
            <path
              d="M 6,7 L 16,13 L 22,13"
              fill="none"
              stroke={isConducting ? '#fbbf24' : '#f59e0b'}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={22} cy={13} r={2.5} fill="#f59e0b" />
            <text x={26} y={15} fill="#f59e0b" fontSize={9} fontWeight="bold" fontFamily="monospace">
              G
            </text>
          </g>
        )}
      </g>

      {/* Switch ID & Mode Pill Badge */}
      <g transform={`translate(${labelOffset.x}, ${labelOffset.y})`}>
        <rect
          x={-4}
          y={-12}
          width={46}
          height={24}
          rx={6}
          fill={isConducting ? 'rgba(6, 78, 59, 0.9)' : 'rgba(15, 23, 42, 0.85)'}
          stroke={isConducting ? '#10b981' : isThyristor ? '#f59e0b' : '#38bdf8'}
          strokeWidth={1.5}
        />
        <text
          x={19}
          y={4}
          textAnchor="middle"
          fill={isConducting ? '#a7f3d0' : '#f1f5f9'}
          fontSize={11}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isThyristor ? `T${id.replace(/\D/g, '') || id}` : `D${id.replace(/\D/g, '') || id}`}
        </text>
      </g>

      {/* Click indicator badge */}
      <g
        transform={`translate(${labelOffset.x}, ${labelOffset.y + 18})`}
        className="opacity-70 group-hover:opacity-100 transition-opacity"
      >
        <text
          x={19}
          y={0}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={8}
          fontFamily="sans-serif"
        >
          {isThyristor ? 'SCR ↺' : 'Diode ↺'}
        </text>
      </g>
    </g>
  );
};
