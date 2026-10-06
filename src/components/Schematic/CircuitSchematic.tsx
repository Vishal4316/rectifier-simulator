import React from 'react';
import type { ConverterConfig, SimulationSample } from '../../types/simulator';
import { SwitchSymbol } from './SwitchSymbol';
import { Zap, Activity } from 'lucide-react';

interface CircuitSchematicProps {
  config: ConverterConfig;
  currentSample?: SimulationSample;
  onToggleSwitch: (switchId: string) => void;
  onToggleFWD: () => void;
  isDark?: boolean;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  config,
  currentSample,
  onToggleSwitch,
  onToggleFWD,
  isDark = true,
}) => {
  const { phase, rectifier, hasFWD, R, L, Vrms, frequency } = config;

  const conductingSwitches = currentSample?.conductingSwitches || [];
  const isFWDConducting = currentSample?.fwdConduction || false;

  // Active path wire styling
  const wireStroke = (active: boolean) => (active ? '#10b981' : isDark ? '#475569' : '#94a3b8');
  const wireWidth = (active: boolean) => (active ? 3 : 2);
  const wireClass = (active: boolean) => (active ? 'transition-all duration-150 animate-pulse' : 'transition-colors');

  return (
    <div
      className={`relative w-full h-full border rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Schematic Header & Legend */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b transition-colors ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Interactive Schematic
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                  isDark
                    ? 'bg-slate-800 text-cyan-400 border-slate-700'
                    : 'bg-slate-100 text-cyan-600 border-slate-200'
                }`}
              >
                {phase === '1P' ? '1-Phase (1Φ)' : '3-Phase (3Φ)'} • {rectifier === 'HW' ? 'Half-Wave' : 'Full-Wave'}
              </span>
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Click any device to switch between Diode and Thyristor (SCR).
            </p>
          </div>
        </div>

        {/* Live Conduction Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Active Path:</span>
            {conductingSwitches.length > 0 ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                {conductingSwitches.join(' + ')}
              </span>
            ) : isFWDConducting ? (
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                FWD Freewheeling
              </span>
            ) : (
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Blocking / Off</span>
            )}
          </div>

          <button
            onClick={onToggleFWD}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              hasFWD
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/40 hover:bg-amber-500/25'
                : isDark
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Zap className={`w-3 h-3 ${hasFWD ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            FWD: {hasFWD ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 w-full flex items-center justify-center min-h-[360px] overflow-hidden">
        {phase === '1P' && rectifier === 'HW' && (
          <SinglePhaseHalfWaveSVG
            config={config}
            conductingSwitches={conductingSwitches}
            isFWDConducting={isFWDConducting}
            onToggleSwitch={onToggleSwitch}
            wireStroke={wireStroke}
            wireWidth={wireWidth}
            wireClass={wireClass}
          />
        )}

        {phase === '1P' && rectifier === 'FW' && (
          <SinglePhaseFullWaveSVG
            config={config}
            conductingSwitches={conductingSwitches}
            isFWDConducting={isFWDConducting}
            onToggleSwitch={onToggleSwitch}
            wireStroke={wireStroke}
            wireWidth={wireWidth}
            wireClass={wireClass}
          />
        )}

        {phase === '3P' && rectifier === 'HW' && (
          <ThreePhaseHalfWaveSVG
            config={config}
            conductingSwitches={conductingSwitches}
            isFWDConducting={isFWDConducting}
            onToggleSwitch={onToggleSwitch}
            wireStroke={wireStroke}
            wireWidth={wireWidth}
            wireClass={wireClass}
          />
        )}

        {phase === '3P' && rectifier === 'FW' && (
          <ThreePhaseFullWaveSVG
            config={config}
            conductingSwitches={conductingSwitches}
            isFWDConducting={isFWDConducting}
            onToggleSwitch={onToggleSwitch}
            wireStroke={wireStroke}
            wireWidth={wireWidth}
            wireClass={wireClass}
          />
        )}
      </div>

      {/* Footer Indicators */}
      <div
        className={`flex items-center justify-between text-xs pt-2 border-t transition-colors ${
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Conducting
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`} /> Blocking / Reverse
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Gate / FWD
          </span>
        </div>
        <div className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Source: {Vrms}V RMS @ {frequency}Hz | Load: {R}Ω + {(L * 1000).toFixed(1)}mH
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* --- 1-PHASE HALF-WAVE SCHEMATIC --- */
/* ========================================================================= */
const SinglePhaseHalfWaveSVG: React.FC<{
  config: ConverterConfig;
  conductingSwitches: string[];
  isFWDConducting: boolean;
  onToggleSwitch: (id: string) => void;
  wireStroke: (active: boolean) => string;
  wireWidth: (active: boolean) => number;
  wireClass: (active: boolean) => string;
}> = ({ config, conductingSwitches, isFWDConducting, onToggleSwitch, wireStroke, wireWidth, wireClass }) => {
  const isT1Active = conductingSwitches.includes('T1');
  const isLoadActive = isT1Active || isFWDConducting;

  return (
    <svg viewBox="0 0 680 340" className="w-full h-full max-h-[380px]">
      <defs>
        <pattern id="pcbGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="680" height="340" fill="transparent" />
      <rect width="680" height="340" fill="url(#pcbGrid)" />

      {/* AC Source Symbol at (80, 170) */}
      <g transform="translate(80, 170)">
        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
        <path
          d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="0" y="44" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
          {config.Vrms}V AC
        </text>
        <text x="0" y="58" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
          {config.frequency}Hz
        </text>
      </g>

      {/* Wire from AC Source Top (80, 142) -> Switch Anode (240, 142) */}
      <path
        d="M 80,142 L 80,100 L 216,100"
        fill="none"
        stroke={wireStroke(isT1Active)}
        strokeWidth={wireWidth(isT1Active)}
        strokeDasharray={isT1Active ? '6,4' : undefined}
        className={wireClass(isT1Active)}
      />

      {/* Switch T1 at (240, 100) pointing right */}
      <SwitchSymbol
        x={240}
        y={100}
        id="T1"
        type={config.switches['T1'] || 'thyristor'}
        isConducting={isT1Active}
        onToggle={onToggleSwitch}
        direction="right"
        labelOffset={{ x: 0, y: -34 }}
      />

      {/* Wire from Switch Cathode (264, 100) -> DC Rail / FWD junction (380, 100) -> Load (520, 100) */}
      <path
        d="M 264,100 L 520,100"
        fill="none"
        stroke={wireStroke(isT1Active)}
        strokeWidth={wireWidth(isT1Active)}
        strokeDasharray={isT1Active ? '6,4' : undefined}
        className={wireClass(isT1Active)}
      />

      {/* Freewheeling Diode branch at x=380 (if enabled) */}
      {config.hasFWD && (
        <g>
          {/* Wire from Top rail (380, 100) down to FWD Cathode (380, 146) */}
          <line
            x1="380"
            y1="100"
            x2="380"
            y2="146"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          {/* FWD Diode at (380, 170) pointing UP (Cathode top, Anode bottom) */}
          <g transform="translate(380, 170)">
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={isFWDConducting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={isFWDConducting ? '#f59e0b' : '#64748b'}
              strokeWidth="2"
            />
            {/* Diode pointing up */}
            <polygon
              points="-10,8 10,8 0,-8"
              fill={isFWDConducting ? '#f59e0b' : '#64748b'}
              stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.5"
            />
            <line x1="-10" y1="-8" x2="10" y2="-8" stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'} strokeWidth="2" />
            <text x="28" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FWD
            </text>
          </g>
          {/* Wire from FWD Anode (380, 194) down to bottom rail (380, 240) */}
          <line
            x1="380"
            y1="194"
            x2="380"
            y2="240"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <circle cx="380" cy="100" r="3.5" fill="#38bdf8" />
          <circle cx="380" cy="240" r="3.5" fill="#38bdf8" />
        </g>
      )}

      {/* R-L Load Block at x=520 */}
      <LoadBranch
        x={520}
        y={100}
        yBottom={240}
        R={config.R}
        L={config.L}
        isActive={isLoadActive}
        wireStroke={wireStroke}
        wireWidth={wireWidth}
      />

      {/* Bottom return wire from Load (520, 240) back to AC Source (80, 240) -> (80, 198) */}
      <path
        d="M 520,240 L 80,240 L 80,198"
        fill="none"
        stroke={wireStroke(isT1Active)}
        strokeWidth={wireWidth(isT1Active)}
        strokeDasharray={isT1Active ? '6,4' : undefined}
        className={wireClass(isT1Active)}
      />

      {/* Connection Nodes */}
      <circle cx="520" cy="100" r="3.5" fill="#38bdf8" />
      <circle cx="520" cy="240" r="3.5" fill="#38bdf8" />
      <circle cx="80" cy="142" r="3.5" fill="#38bdf8" />
      <circle cx="80" cy="198" r="3.5" fill="#38bdf8" />
    </svg>
  );
};

/* ========================================================================= */
/* --- 1-PHASE FULL-WAVE BRIDGE SCHEMATIC --- */
/* ========================================================================= */
const SinglePhaseFullWaveSVG: React.FC<{
  config: ConverterConfig;
  conductingSwitches: string[];
  isFWDConducting: boolean;
  onToggleSwitch: (id: string) => void;
  wireStroke: (active: boolean) => string;
  wireWidth: (active: boolean) => number;
  wireClass: (active: boolean) => string;
}> = ({ config, conductingSwitches, isFWDConducting, onToggleSwitch, wireStroke, wireWidth, wireClass }) => {
  const isT1 = conductingSwitches.includes('T1');
  const isT2 = conductingSwitches.includes('T2');
  const isT3 = conductingSwitches.includes('T3');
  const isT4 = conductingSwitches.includes('T4');

  const pairPositive = isT1 && isT2;
  const pairNegative = isT3 && isT4;
  const isLoadActive = pairPositive || pairNegative || isFWDConducting;

  return (
    <svg viewBox="0 0 740 360" className="w-full h-full max-h-[380px]">
      <defs>
        <pattern id="pcbGridFW" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="740" height="360" fill="transparent" />
      <rect width="740" height="360" fill="url(#pcbGridFW)" />

      {/* AC Source Symbol at (70, 180) */}
      <g transform="translate(70, 180)">
        <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
        <path
          d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="0" y="44" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
          {config.Vrms}V AC
        </text>
        <text x="0" y="58" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
          {config.frequency}Hz
        </text>
      </g>

      {/* Bridge Top Rail (Y=60) & Bottom Rail (Y=300) */}
      <line
        x1="210"
        y1="60"
        x2="560"
        y2="60"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        className={wireClass(isLoadActive)}
      />
      <line
        x1="210"
        y1="300"
        x2="560"
        y2="300"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        className={wireClass(isLoadActive)}
      />

      {/* Polarity markers on DC rails */}
      <text x="540" y="52" fill="#ef4444" fontSize="14" fontWeight="bold">
        +
      </text>
      <text x="540" y="320" fill="#3b82f6" fontSize="16" fontWeight="bold">
        −
      </text>

      {/* Left Leg: T1 (Top, Y=115) and T4 (Bottom, Y=245) at X=210 */}
      <line x1="210" y1="60" x2="210" y2="90" stroke={wireStroke(isT1)} strokeWidth={wireWidth(isT1)} />
      <SwitchSymbol
        x={210}
        y={115}
        id="T1"
        type={config.switches['T1'] || 'thyristor'}
        isConducting={isT1}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="210" y1="140" x2="210" y2="220" stroke={wireStroke(isT1 || isT4)} strokeWidth={2} />
      <SwitchSymbol
        x={210}
        y={245}
        id="T4"
        type={config.switches['T4'] || 'thyristor'}
        isConducting={isT4}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="210" y1="270" x2="210" y2="300" stroke={wireStroke(isT4)} strokeWidth={wireWidth(isT4)} />

      {/* Right Leg: T3 (Top, Y=115) and T2 (Bottom, Y=245) at X=340 */}
      <line x1="340" y1="60" x2="340" y2="90" stroke={wireStroke(isT3)} strokeWidth={wireWidth(isT3)} />
      <SwitchSymbol
        x={340}
        y={115}
        id="T3"
        type={config.switches['T3'] || 'thyristor'}
        isConducting={isT3}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="340" y1="140" x2="340" y2="220" stroke={wireStroke(isT3 || isT2)} strokeWidth={2} />
      <SwitchSymbol
        x={340}
        y={245}
        id="T2"
        type={config.switches['T2'] || 'thyristor'}
        isConducting={isT2}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="340" y1="270" x2="340" y2="300" stroke={wireStroke(isT2)} strokeWidth={wireWidth(isT2)} />

      {/* AC Feed Wires from Source to Bridge midpoints */}
      <path
        d="M 70,152 L 70,180 L 210,180"
        fill="none"
        stroke={wireStroke(isT1 || isT4)}
        strokeWidth={wireWidth(isT1 || isT4)}
      />
      <circle cx="210" cy="180" r="3.5" fill="#38bdf8" />

      {/* AC Line to Right Leg midpoint (340, 180) */}
      <path
        d="M 70,208 L 130,208 L 130,195 L 200,195 Q 210,195 210,195 L 340,195 L 340,180"
        fill="none"
        stroke={wireStroke(isT3 || isT2)}
        strokeWidth={wireWidth(isT3 || isT2)}
      />
      <circle cx="340" cy="180" r="3.5" fill="#38bdf8" />

      {/* Freewheeling Diode Branch at X=450 */}
      {config.hasFWD && (
        <g>
          <line
            x1="450"
            y1="60"
            x2="450"
            y2="155"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <g transform="translate(450, 180)">
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={isFWDConducting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={isFWDConducting ? '#f59e0b' : '#64748b'}
              strokeWidth="2"
            />
            <polygon
              points="-10,8 10,8 0,-8"
              fill={isFWDConducting ? '#f59e0b' : '#64748b'}
              stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.5"
            />
            <line x1="-10" y1="-8" x2="10" y2="-8" stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'} strokeWidth="2" />
            <text x="28" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FWD
            </text>
          </g>
          <line
            x1="450"
            y1="205"
            x2="450"
            y2="300"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <circle cx="450" cy="60" r="3.5" fill="#38bdf8" />
          <circle cx="450" cy="300" r="3.5" fill="#38bdf8" />
        </g>
      )}

      {/* R-L Load at X=560 */}
      <LoadBranch
        x={560}
        y={60}
        yBottom={300}
        R={config.R}
        L={config.L}
        isActive={isLoadActive}
        wireStroke={wireStroke}
        wireWidth={wireWidth}
      />

      <circle cx="560" cy="60" r="3.5" fill="#38bdf8" />
      <circle cx="560" cy="300" r="3.5" fill="#38bdf8" />
    </svg>
  );
};

/* ========================================================================= */
/* --- 3-PHASE HALF-WAVE (3-PULSE) SCHEMATIC --- */
/* ========================================================================= */
const ThreePhaseHalfWaveSVG: React.FC<{
  config: ConverterConfig;
  conductingSwitches: string[];
  isFWDConducting: boolean;
  onToggleSwitch: (id: string) => void;
  wireStroke: (active: boolean) => string;
  wireWidth: (active: boolean) => number;
  wireClass: (active: boolean) => string;
}> = ({ config, conductingSwitches, isFWDConducting, onToggleSwitch, wireStroke, wireWidth, wireClass }) => {
  const isT1 = conductingSwitches.includes('T1');
  const isT2 = conductingSwitches.includes('T2');
  const isT3 = conductingSwitches.includes('T3');
  const isLoadActive = isT1 || isT2 || isT3 || isFWDConducting;

  return (
    <svg viewBox="0 0 760 360" className="w-full h-full max-h-[380px]">
      <defs>
        <pattern id="pcbGrid3PHW" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="760" height="360" fill="url(#pcbGrid3PHW)" />

      {/* 3-Phase AC Source Terminals (A, B, C, N) at X=70 */}
      <g transform="translate(60, 180)">
        <rect x="-30" y="-120" width="60" height="240" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <text x="0" y="-80" fill="#ef4444" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          A
        </text>
        <text x="0" y="-20" fill="#eab308" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          B
        </text>
        <text x="0" y="40" fill="#3b82f6" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          C
        </text>
        <text x="0" y="100" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          N
        </text>
      </g>

      {/* Phase A -> T1 at X=210, Y=80 */}
      <path
        d="M 90,100 L 180,100"
        fill="none"
        stroke={wireStroke(isT1)}
        strokeWidth={wireWidth(isT1)}
      />
      <SwitchSymbol
        x={210}
        y={100}
        id="T1"
        type={config.switches['T1'] || 'thyristor'}
        isConducting={isT1}
        onToggle={onToggleSwitch}
        direction="right"
        labelOffset={{ x: 0, y: -34 }}
      />

      {/* Phase B -> T2 at X=210, Y=160 */}
      <path
        d="M 90,160 L 180,160"
        fill="none"
        stroke={wireStroke(isT2)}
        strokeWidth={wireWidth(isT2)}
      />
      <SwitchSymbol
        x={210}
        y={160}
        id="T2"
        type={config.switches['T2'] || 'thyristor'}
        isConducting={isT2}
        onToggle={onToggleSwitch}
        direction="right"
        labelOffset={{ x: 0, y: -34 }}
      />

      {/* Phase C -> T3 at X=210, Y=220 */}
      <path
        d="M 90,220 L 180,220"
        fill="none"
        stroke={wireStroke(isT3)}
        strokeWidth={wireWidth(isT3)}
      />
      <SwitchSymbol
        x={210}
        y={220}
        id="T3"
        type={config.switches['T3'] || 'thyristor'}
        isConducting={isT3}
        onToggle={onToggleSwitch}
        direction="right"
        labelOffset={{ x: 0, y: -34 }}
      />

      {/* Common Cathode Bus at X=340 joining T1, T2, T3 outputs */}
      <path
        d="M 235,100 L 340,100 L 340,60 L 580,60"
        fill="none"
        stroke={wireStroke(isT1)}
        strokeWidth={wireWidth(isT1)}
      />
      <path
        d="M 235,160 L 340,160"
        fill="none"
        stroke={wireStroke(isT2)}
        strokeWidth={wireWidth(isT2)}
      />
      <path
        d="M 235,220 L 340,220"
        fill="none"
        stroke={wireStroke(isT3)}
        strokeWidth={wireWidth(isT3)}
      />
      <line
        x1="340"
        y1="60"
        x2="340"
        y2="220"
        stroke={wireStroke(isT1 || isT2 || isT3)}
        strokeWidth={wireWidth(isT1 || isT2 || isT3)}
      />

      {/* Top DC Rail to Load */}
      <line
        x1="340"
        y1="60"
        x2="580"
        y2="60"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        className={wireClass(isLoadActive)}
      />

      {/* Neutral return wire from Load (580, 300) back to N (90, 280) */}
      <path
        d="M 580,300 L 90,300 L 90,280"
        fill="none"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        strokeDasharray="4,4"
      />
      <text x="320" y="318" fill="#94a3b8" fontSize="10" fontFamily="monospace">
        Neutral Return (N)
      </text>

      {/* FWD Branch at X=460 */}
      {config.hasFWD && (
        <g>
          <line
            x1="460"
            y1="60"
            x2="460"
            y2="155"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <g transform="translate(460, 180)">
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={isFWDConducting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={isFWDConducting ? '#f59e0b' : '#64748b'}
              strokeWidth="2"
            />
            <polygon
              points="-10,8 10,8 0,-8"
              fill={isFWDConducting ? '#f59e0b' : '#64748b'}
              stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.5"
            />
            <line x1="-10" y1="-8" x2="10" y2="-8" stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'} strokeWidth="2" />
            <text x="28" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FWD
            </text>
          </g>
          <line
            x1="460"
            y1="205"
            x2="460"
            y2="300"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <circle cx="460" cy="60" r="3.5" fill="#38bdf8" />
          <circle cx="460" cy="300" r="3.5" fill="#38bdf8" />
        </g>
      )}

      {/* Load at X=580 */}
      <LoadBranch
        x={580}
        y={60}
        yBottom={300}
        R={config.R}
        L={config.L}
        isActive={isLoadActive}
        wireStroke={wireStroke}
        wireWidth={wireWidth}
      />
      <circle cx="580" cy="60" r="3.5" fill="#38bdf8" />
      <circle cx="580" cy="300" r="3.5" fill="#38bdf8" />
    </svg>
  );
};

/* ========================================================================= */
/* --- 3-PHASE FULL-WAVE 6-PULSE BRIDGE SCHEMATIC --- */
/* ========================================================================= */
const ThreePhaseFullWaveSVG: React.FC<{
  config: ConverterConfig;
  conductingSwitches: string[];
  isFWDConducting: boolean;
  onToggleSwitch: (id: string) => void;
  wireStroke: (active: boolean) => string;
  wireWidth: (active: boolean) => number;
  wireClass: (active: boolean) => string;
}> = ({ config, conductingSwitches, isFWDConducting, onToggleSwitch, wireStroke, wireWidth, wireClass }) => {
  const isT1 = conductingSwitches.includes('T1');
  const isT3 = conductingSwitches.includes('T3');
  const isT5 = conductingSwitches.includes('T5');
  const isT4 = conductingSwitches.includes('T4');
  const isT6 = conductingSwitches.includes('T6');
  const isT2 = conductingSwitches.includes('T2');

  const isUpperActive = isT1 || isT3 || isT5;
  const isLowerActive = isT4 || isT6 || isT2;
  const isLoadActive = (isUpperActive && isLowerActive) || isFWDConducting;

  return (
    <svg viewBox="0 0 780 370" className="w-full h-full max-h-[390px]">
      <defs>
        <pattern id="pcbGrid3PFW" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="780" height="370" fill="url(#pcbGrid3PFW)" />

      {/* 3-Phase AC Source Terminals at X=60 */}
      <g transform="translate(60, 185)">
        <rect x="-30" y="-100" width="60" height="200" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <text x="0" y="-55" fill="#ef4444" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          A
        </text>
        <text x="0" y="5" fill="#eab308" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          B
        </text>
        <text x="0" y="65" fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          C
        </text>
      </g>

      {/* Rails: DC+ at Y=50 and DC- at Y=320 */}
      <line
        x1="180"
        y1="50"
        x2="630"
        y2="50"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        className={wireClass(isLoadActive)}
      />
      <line
        x1="180"
        y1="320"
        x2="630"
        y2="320"
        stroke={wireStroke(isLoadActive)}
        strokeWidth={wireWidth(isLoadActive)}
        className={wireClass(isLoadActive)}
      />

      <text x="610" y="42" fill="#ef4444" fontSize="14" fontWeight="bold">
        +
      </text>
      <text x="610" y="340" fill="#3b82f6" fontSize="16" fontWeight="bold">
        −
      </text>

      {/* Leg 1 */}
      <line x1="180" y1="50" x2="180" y2="85" stroke={wireStroke(isT1)} strokeWidth={wireWidth(isT1)} />
      <SwitchSymbol
        x={180}
        y={110}
        id="T1"
        type={config.switches['T1'] || 'thyristor'}
        isConducting={isT1}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="180" y1="135" x2="180" y2="235" stroke={wireStroke(isT1 || isT4)} strokeWidth={2} />
      <SwitchSymbol
        x={180}
        y={260}
        id="T4"
        type={config.switches['T4'] || 'thyristor'}
        isConducting={isT4}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="180" y1="285" x2="180" y2="320" stroke={wireStroke(isT4)} strokeWidth={wireWidth(isT4)} />

      <path
        d="M 90,130 L 140,130 L 140,185 L 180,185"
        fill="none"
        stroke={wireStroke(isT1 || isT4)}
        strokeWidth={wireWidth(isT1 || isT4)}
      />
      <circle cx="180" cy="185" r="3.5" fill="#ef4444" />

      {/* Leg 2 */}
      <line x1="300" y1="50" x2="300" y2="85" stroke={wireStroke(isT3)} strokeWidth={wireWidth(isT3)} />
      <SwitchSymbol
        x={300}
        y={110}
        id="T3"
        type={config.switches['T3'] || 'thyristor'}
        isConducting={isT3}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="300" y1="135" x2="300" y2="235" stroke={wireStroke(isT3 || isT6)} strokeWidth={2} />
      <SwitchSymbol
        x={300}
        y={260}
        id="T6"
        type={config.switches['T6'] || 'thyristor'}
        isConducting={isT6}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="300" y1="285" x2="300" y2="320" stroke={wireStroke(isT6)} strokeWidth={wireWidth(isT6)} />

      <path
        d="M 90,185 L 300,185"
        fill="none"
        stroke={wireStroke(isT3 || isT6)}
        strokeWidth={wireWidth(isT3 || isT6)}
      />
      <circle cx="300" cy="185" r="3.5" fill="#eab308" />

      {/* Leg 3 */}
      <line x1="420" y1="50" x2="420" y2="85" stroke={wireStroke(isT5)} strokeWidth={wireWidth(isT5)} />
      <SwitchSymbol
        x={420}
        y={110}
        id="T5"
        type={config.switches['T5'] || 'thyristor'}
        isConducting={isT5}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="420" y1="135" x2="420" y2="235" stroke={wireStroke(isT5 || isT2)} strokeWidth={2} />
      <SwitchSymbol
        x={420}
        y={260}
        id="T2"
        type={config.switches['T2'] || 'thyristor'}
        isConducting={isT2}
        onToggle={onToggleSwitch}
        direction="down"
        labelOffset={{ x: 26, y: 0 }}
      />
      <line x1="420" y1="285" x2="420" y2="320" stroke={wireStroke(isT2)} strokeWidth={wireWidth(isT2)} />

      <path
        d="M 90,240 L 150,240 L 150,200 L 420,200 L 420,185"
        fill="none"
        stroke={wireStroke(isT5 || isT2)}
        strokeWidth={wireWidth(isT5 || isT2)}
      />
      <circle cx="420" cy="185" r="3.5" fill="#3b82f6" />

      {/* FWD */}
      {config.hasFWD && (
        <g>
          <line
            x1="520"
            y1="50"
            x2="520"
            y2="160"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <g transform="translate(520, 185)">
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={isFWDConducting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={isFWDConducting ? '#f59e0b' : '#64748b'}
              strokeWidth="2"
            />
            <polygon
              points="-10,8 10,8 0,-8"
              fill={isFWDConducting ? '#f59e0b' : '#64748b'}
              stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.5"
            />
            <line x1="-10" y1="-8" x2="10" y2="-8" stroke={isFWDConducting ? '#fbbf24' : '#94a3b8'} strokeWidth="2" />
            <text x="28" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FWD
            </text>
          </g>
          <line
            x1="520"
            y1="210"
            x2="520"
            y2="320"
            stroke={wireStroke(isFWDConducting)}
            strokeWidth={wireWidth(isFWDConducting)}
          />
          <circle cx="520" cy="50" r="3.5" fill="#38bdf8" />
          <circle cx="520" cy="320" r="3.5" fill="#38bdf8" />
        </g>
      )}

      {/* R-L Load at X=630 */}
      <LoadBranch
        x={630}
        y={50}
        yBottom={320}
        R={config.R}
        L={config.L}
        isActive={isLoadActive}
        wireStroke={wireStroke}
        wireWidth={wireWidth}
      />
      <circle cx="630" cy="50" r="3.5" fill="#38bdf8" />
      <circle cx="630" cy="320" r="3.5" fill="#38bdf8" />
    </svg>
  );
};

/* ========================================================================= */
/* --- HELPER: R-L LOAD BRANCH SVG GLYPH --- */
/* ========================================================================= */
interface LoadBranchProps {
  x: number;
  y: number;
  yBottom: number;
  R: number;
  L: number;
  isActive: boolean;
  wireStroke: (active: boolean) => string;
  wireWidth: (active: boolean) => number;
}

const LoadBranch: React.FC<LoadBranchProps> = ({ x, y, yBottom, R, L, isActive, wireStroke, wireWidth }) => {
  const midY = (y + yBottom) / 2;
  const stroke = wireStroke(isActive);
  const width = wireWidth(isActive);

  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={midY - 50} stroke={stroke} strokeWidth={width} />

      {isActive && (
        <g transform={`translate(${x + 16}, ${midY - 40})`}>
          <path d="M 0,-10 L 0,10 M -4,6 L 0,10 L 4,6" fill="none" stroke="#34d399" strokeWidth="2" />
          <text x="8" y="4" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
            io
          </text>
        </g>
      )}

      <g transform={`translate(${x}, ${midY - 30})`}>
        <path
          d="M 0,-20 L -8,-15 L 8,-5 L -8,5 L 8,15 L 0,20"
          fill="none"
          stroke={isActive ? '#38bdf8' : '#94a3b8'}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x="18" y="4" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
          R = {R}Ω
        </text>
      </g>

      <line x1={x} y1={midY - 10} x2={x} y2={midY + 10} stroke={stroke} strokeWidth={width} />

      <g transform={`translate(${x}, ${midY + 30})`}>
        <path
          d="M 0,-20 C 14,-15 14,-5 0,0 C 14,5 14,15 0,20"
          fill="none"
          stroke={isActive ? '#a855f7' : '#94a3b8'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text x="18" y="4" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="monospace">
          L = {(L * 1000).toFixed(0)}mH
        </text>
      </g>

      <line x1={x} y1={midY + 50} x2={x} y2={yBottom} stroke={stroke} strokeWidth={width} />
    </g>
  );
};
