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
  direction = 'up',
  labelOffset = { x: 30, y: 0 },
}) => {
  const isThyristor = type === 'thyristor';

  const fillColor = isConducting ? 'rgba(16, 185, 129, 0.28)' : 'rgba(30, 41, 59, 0.75)';
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

      {/* Geometry based on direction */}
      {direction === 'up' && (
        <g>
          {/* Anode lead at bottom */}
          <line x1={0} y1={24} x2={0} y2={10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Cathode lead at top */}
          <line x1={0} y1={-10} x2={0} y2={-24} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Diode Triangle pointing UP: base at y=10, apex at (0, -10) */}
          <polygon
            points="-12,10 12,10 0,-10"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Cathode horizontal bar at y=-10 */}
          <line x1={-12} y1={-10} x2={12} y2={-10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

          {/* Thyristor Gate Terminal */}
          {isThyristor && (
            <g>
              <path
                d="M 6,-7 L 15,-12 L 20,-12"
                fill="none"
                stroke={isConducting ? '#fbbf24' : '#f59e0b'}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx={20} cy={-12} r={2.5} fill="#f59e0b" />
              <text x={24} y={-9} fill="#f59e0b" fontSize={9} fontWeight="bold" fontFamily="monospace">
                G
              </text>
            </g>
          )}
        </g>
      )}

      {direction === 'down' && (
        <g>
          {/* Anode lead at top */}
          <line x1={0} y1={-24} x2={0} y2={-10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Cathode lead at bottom */}
          <line x1={0} y1={10} x2={0} y2={24} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Diode Triangle pointing DOWN: base at y=-10, apex at (0, 10) */}
          <polygon
            points="-12,-10 12,-10 0,10"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Cathode bar at y=10 */}
          <line x1={-12} y1={10} x2={12} y2={10} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

          {/* Thyristor Gate Terminal */}
          {isThyristor && (
            <g>
              <path
                d="M 6,7 L 15,12 L 20,12"
                fill="none"
                stroke={isConducting ? '#fbbf24' : '#f59e0b'}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx={20} cy={12} r={2.5} fill="#f59e0b" />
              <text x={24} y={15} fill="#f59e0b" fontSize={9} fontWeight="bold" fontFamily="monospace">
                G
              </text>
            </g>
          )}
        </g>
      )}

      {direction === 'right' && (
        <g>
          {/* Anode lead at left */}
          <line x1={-24} y1={0} x2={-10} y2={0} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Cathode lead at right */}
          <line x1={10} y1={0} x2={24} y2={0} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />
          {/* Diode Triangle pointing RIGHT: base at x=-10, apex at (10, 0) */}
          <polygon
            points="-10,-12 -10,12 10,0"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Cathode vertical bar at x=10 */}
          <line x1={10} y1={-12} x2={10} y2={12} stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" />

          {/* Thyristor Gate Terminal */}
          {isThyristor && (
            <g>
              <path
                d="M 7,6 L 12,15 L 12,20"
                fill="none"
                stroke={isConducting ? '#fbbf24' : '#f59e0b'}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx={12} cy={20} r={2.5} fill="#f59e0b" />
              <text x={16} y={22} fill="#f59e0b" fontSize={9} fontWeight="bold" fontFamily="monospace">
                G
              </text>
            </g>
          )}
        </g>
      )}

      {/* Switch ID & Mode Pill Badge */}
      <g transform={`translate(${labelOffset.x}, ${labelOffset.y})`}>
        <rect
          x={-4}
          y={-12}
          width={48}
          height={22}
          rx={6}
          fill={isConducting ? 'rgba(6, 78, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
          stroke={isConducting ? '#10b981' : isThyristor ? '#f59e0b' : '#38bdf8'}
          strokeWidth={1.5}
        />
        <text
          x={20}
          y={3}
          textAnchor="middle"
          fill={isConducting ? '#a7f3d0' : '#f1f5f9'}
          fontSize={11}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isThyristor ? `T${id.replace(/\D/g, '') || id}` : `D${id.replace(/\D/g, '') || id}`}
        </text>

        {/* Click indicator tag */}
        <text
          x={20}
          y={20}
          textAnchor="middle"
          fill={isThyristor ? '#fbbf24' : '#38bdf8'}
          fontSize={8.5}
          fontWeight="semibold"
          fontFamily="sans-serif"
          className="opacity-80 group-hover:opacity-100 transition-opacity"
        >
          {isThyristor ? 'SCR ↺' : 'Diode ↺'}
        </text>
      </g>
    </g>
  );
};
