import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { SimulationResult, ConverterConfig } from '../../types/simulator';
import { Play, Pause, RotateCcw, Camera, Eye, Zap } from 'lucide-react';

interface WaveformCanvasProps {
  result: SimulationResult;
  config: ConverterConfig;
  currentAngleDeg: number;
  onAngleChange: (deg: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isDark?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  result,
  config,
  currentAngleDeg,
  onAngleChange,
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangeSpeed,
  isDark = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef<number>(currentAngleDeg);

  useEffect(() => {
    angleRef.current = currentAngleDeg;
  }, [currentAngleDeg]);

  // Hover state for oscilloscope crosshair
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    deg: number;
    vIn: number;
    vOut: number;
    iOut: number;
  } | null>(null);

  // Channel toggles
  const [showSupply, setShowSupply] = useState(true);
  const [showGate, setShowGate] = useState(true);
  const [showVout, setShowVout] = useState(true);
  const [showIout, setShowIout] = useState(true);

  // Render oscilloscope on canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result.samples || result.samples.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    // Resize canvas to match display size for crisp retina graphics
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark oscilloscope background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Split canvas vertically into two main scopes:
    // Scope 1 (Top 48%): Supply Voltage + Gate Pulses
    // Scope 2 (Bottom 48%): Output Voltage (Vo) + Load Current (Io)
    const margin = { left: 55, right: 25, top: 20, bottom: 25 };
    const plotWidth = width - margin.left - margin.right;
    const totalPlotHeight = height - margin.top - margin.bottom;
    const gap = 16;
    const scopeHeight = (totalPlotHeight - gap) / 2;

    const topScopeY = margin.top;
    const bottomScopeY = margin.top + scopeHeight + gap;

    // Grid reticle helper
    const drawGrid = (yTop: number, h: number, title: string, unitLabel: string) => {
      // Scope border
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin.left, yTop, plotWidth, h);

      // Horizontal subdivisions (5 horizontal lines)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        const y = yTop + (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotWidth, y);
        ctx.stroke();
      }

      // Midline zero reference
      const zeroY = yTop + h / 2;
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, zeroY);
      ctx.lineTo(margin.left + plotWidth, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertical degree grid (0, 90, 180, 270, 360)
      for (let deg = 0; deg <= 360; deg += 45) {
        const x = margin.left + (deg / 360) * plotWidth;
        ctx.strokeStyle = deg % 90 === 0 ? 'rgba(71, 85, 105, 0.6)' : 'rgba(51, 65, 85, 0.25)';
        ctx.lineWidth = deg % 90 === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yTop + h);
        ctx.stroke();

        if (deg % 90 === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${deg}°`, x, yTop + h + 13);
        }
      }

      // Title & Units
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, margin.left + 8, yTop + 14);

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(unitLabel, margin.left + 8, yTop + 26);
    };

    // Draw Grids
    drawGrid(topScopeY, scopeHeight, 'CH1: AC Source & Firing Trigger', '[Volts]');
    drawGrid(bottomScopeY, scopeHeight, 'CH2 & CH3: Rectified Vo & Load Current Io', '[V / A]');

    // Max Voltage Scale Calculation
    const Vpeak = Math.max(
      config.Vrms * Math.SQRT2 * 1.25,
      ...result.samples.map((s) => Math.abs(s.vOut)),
      ...result.samples.map((s) => Math.abs(s.vSourceA))
    );
    const Ipeak = Math.max(1, ...result.samples.map((s) => s.iOut)) * 1.35;

    // Coordinate conversion functions
    const degToX = (deg: number) => margin.left + ((deg % 360) / 360) * plotWidth;
    const vToY1 = (v: number) => topScopeY + scopeHeight / 2 - (v / Vpeak) * (scopeHeight * 0.45);
    const vToY2 = (v: number) => bottomScopeY + scopeHeight / 2 - (v / Vpeak) * (scopeHeight * 0.45);
    const iToY2 = (i: number) => bottomScopeY + scopeHeight / 2 - (i / Ipeak) * (scopeHeight * 0.45);

    const samples = result.samples;
    const N = samples.length;

    // --- PLOT 1: AC SUPPLY VOLTAGES ---
    if (showSupply) {
      if (config.phase === '1P') {
        // Single Phase Source
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const x = degToX(samples[i].thetaDeg);
          const y = vToY1(samples[i].vSourceA);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // 3-Phase balanced waveforms: Va (Red), Vb (Yellow), Vc (Blue)
        const phases = [
          { key: 'vSourceA', color: '#f87171' },
          { key: 'vSourceB', color: '#facc15' },
          { key: 'vSourceC', color: '#60a5fa' },
        ];
        phases.forEach((p) => {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            const v = (samples[i] as any)[p.key] || 0;
            const x = degToX(samples[i].thetaDeg);
            const y = vToY1(v);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
    }

    // --- PLOT 1b: GATE FIRING PULSES ---
    if (showGate) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < N; i++) {
        if (samples[i].gatePulse) {
          const x = degToX(samples[i].thetaDeg);
          const zeroY = topScopeY + scopeHeight / 2;
          ctx.beginPath();
          ctx.moveTo(x, zeroY);
          ctx.lineTo(x, zeroY - scopeHeight * 0.35);
          ctx.stroke();

          // Pulse tip marker
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, zeroY - scopeHeight * 0.35, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- PLOT 2: RECTIFIED OUTPUT VOLTAGE (Vo) ---
    if (showVout) {
      ctx.save();
      ctx.beginPath();
      const zeroY = bottomScopeY + scopeHeight / 2;
      ctx.moveTo(degToX(samples[0].thetaDeg), zeroY);
      for (let i = 0; i < N; i++) {
        ctx.lineTo(degToX(samples[i].thetaDeg), vToY2(samples[i].vOut));
      }
      ctx.lineTo(degToX(samples[N - 1].thetaDeg), zeroY);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, bottomScopeY, 0, bottomScopeY + scopeHeight);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
      grad.addColorStop(0.5, 'rgba(52, 211, 153, 0.05)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Vo trace stroke
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = degToX(samples[i].thetaDeg);
        const y = vToY2(samples[i].vOut);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Vdc Average guideline
      const vdcY = vToY2(result.metrics.Vdc);
      ctx.strokeStyle = '#34d399';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(margin.left, vdcY);
      ctx.lineTo(margin.left + plotWidth, vdcY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for Vdc
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Vdc=${result.metrics.Vdc.toFixed(1)}V`, margin.left + plotWidth - 6, vdcY - 4);
    }

    // --- PLOT 3: LOAD CURRENT (Io) ---
    if (showIout) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = degToX(samples[i].thetaDeg);
        const y = iToY2(samples[i].iOut);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Idc Average guideline
      const idcY = iToY2(result.metrics.Idc);
      ctx.strokeStyle = '#a855f7';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, idcY);
      ctx.lineTo(margin.left + plotWidth, idcY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for Idc
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Idc=${result.metrics.Idc.toFixed(2)}A`, margin.left + 8, idcY - 4);
    }

    // --- PLAYHEAD / PHASE ANGLE CURSOR ---
    const playheadX = degToX(currentAngleDeg);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);

    // Top scope playhead
    ctx.beginPath();
    ctx.moveTo(playheadX, topScopeY);
    ctx.lineTo(playheadX, topScopeY + scopeHeight);
    ctx.stroke();

    // Bottom scope playhead
    ctx.beginPath();
    ctx.moveTo(playheadX, bottomScopeY);
    ctx.lineTo(playheadX, bottomScopeY + scopeHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Playhead handle marker
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(playheadX, bottomScopeY + scopeHeight, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Voltage scale values on Y-axis (Scope 1)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`+${Vpeak.toFixed(0)}V`, margin.left - 6, topScopeY + 12);
    ctx.fillText(`0V`, margin.left - 6, topScopeY + scopeHeight / 2 + 4);
    ctx.fillText(`-${Vpeak.toFixed(0)}V`, margin.left - 6, topScopeY + scopeHeight - 2);

    // Voltage/Current scale values on Y-axis (Scope 2)
    ctx.fillText(`+${Vpeak.toFixed(0)}V`, margin.left - 6, bottomScopeY + 12);
    ctx.fillText(`0V`, margin.left - 6, bottomScopeY + scopeHeight / 2 + 4);
    ctx.fillText(`-${Vpeak.toFixed(0)}V`, margin.left - 6, bottomScopeY + scopeHeight - 2);

    ctx.restore();
  }, [
    result,
    config,
    currentAngleDeg,
    showSupply,
    showGate,
    showVout,
    showIout,
  ]);

  // Handle animation loop with angleRef to avoid 60fps effect teardowns
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const deltaSec = (now - lastTime) / 1000;
        lastTime = now;
        const degPerSec = 360 * config.frequency * playSpeed * 0.2;
        const nextAngle = (angleRef.current + degPerSec * deltaSec) % 360;
        angleRef.current = nextAngle;
        onAngleChange(nextAngle);
      } else {
        lastTime = now;
      }
      renderCanvas();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playSpeed, config.frequency, onAngleChange, renderCanvas]);

  // Mouse hover for crosshair inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !result.samples || result.samples.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const margin = { left: 55, right: 25 };
    const plotWidth = rect.width - margin.left - margin.right;

    if (mouseX < margin.left || mouseX > margin.left + plotWidth) {
      setHoverData(null);
      return;
    }

    const deg = ((mouseX - margin.left) / plotWidth) * 360;
    const sampleIdx = Math.min(
      result.samples.length - 1,
      Math.max(0, Math.floor((deg / 360) * result.samples.length))
    );
    const s = result.samples[sampleIdx];

    setHoverData({
      x: mouseX,
      y: mouseY,
      deg: Math.round(s.thetaDeg),
      vIn: Math.round(s.vSourceA),
      vOut: Math.round(s.vOut * 10) / 10,
      iOut: Math.round(s.iOut * 100) / 100,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const handleClickCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const margin = { left: 55, right: 25 };
    const plotWidth = rect.width - margin.left - margin.right;

    if (mouseX >= margin.left && mouseX <= margin.left + plotWidth) {
      const deg = ((mouseX - margin.left) / plotWidth) * 360;
      angleRef.current = deg;
      onAngleChange(deg);
    }
  };

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `rectifier_waveform_${config.phase}_${config.rectifier}_alpha${config.alpha}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full border rounded-2xl p-4 flex flex-col shadow-xl select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Waveform Controls Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b transition-colors ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-emerald-500 text-black hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'PAUSE' : 'RUN'}
          </button>

          <button
            onClick={() => {
              angleRef.current = 0;
              onAngleChange(0);
            }}
            title="Reset Phase to 0°"
            className={`p-1.5 rounded-xl transition-colors border ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div
            className={`flex items-center rounded-xl p-0.5 border text-xs ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {[0.25, 0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  playSpeed === spd
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Channel Visibilities */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowSupply(!showSupply)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 border transition-all ${
              showSupply
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 font-semibold'
                : isDark
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            Supply
          </button>

          <button
            onClick={() => setShowGate(!showGate)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 border transition-all ${
              showGate
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 font-semibold'
                : isDark
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            Gates
          </button>

          <button
            onClick={() => setShowVout(!showVout)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 border transition-all ${
              showVout
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-semibold'
                : isDark
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            Vo (Output)
          </button>

          <button
            onClick={() => setShowIout(!showIout)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 border transition-all ${
              showIout
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/40 font-semibold'
                : isDark
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            Io (Current)
          </button>

          <button
            onClick={handleExportPNG}
            title="Snapshot Waveform to PNG"
            className={`p-1.5 rounded-xl transition-colors border ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        className={`relative flex-1 w-full min-h-[360px] overflow-hidden rounded-xl border shadow-inner ${
          isDark ? 'border-slate-800/80 bg-[#090d16]' : 'border-slate-300 bg-[#090d16]'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClickCanvas}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Hover Crosshair Tooltip */}
        {hoverData && (
          <div
            className="absolute pointer-events-none bg-slate-950/95 border border-cyan-500/50 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md z-30 font-mono"
            style={{
              left: Math.min(hoverData.x + 12, (containerRef.current?.clientWidth || 400) - 170),
              top: Math.min(hoverData.y + 12, (containerRef.current?.clientHeight || 400) - 120),
            }}
          >
            <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-1">
              θ = {hoverData.deg}° ({(hoverData.deg * (Math.PI / 180)).toFixed(2)} rad)
            </div>
            <div className="text-slate-300 flex justify-between gap-4">
              <span>Vin:</span> <span className="text-cyan-300 font-semibold">{hoverData.vIn} V</span>
            </div>
            <div className="text-slate-300 flex justify-between gap-4">
              <span>Vo:</span> <span className="text-emerald-400 font-semibold">{hoverData.vOut} V</span>
            </div>
            <div className="text-slate-300 flex justify-between gap-4">
              <span>Io:</span> <span className="text-purple-300 font-semibold">{hoverData.iOut} A</span>
            </div>
          </div>
        )}
      </div>

      {/* Angle Scrubber Slider */}
      <div
        className={`flex items-center gap-3 mt-3 pt-2 border-t transition-colors ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}
      >
        <span className={`text-xs font-mono min-w-[70px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Sweep: {Math.round(currentAngleDeg)}°
        </span>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={Math.round(currentAngleDeg)}
          onChange={(e) => {
            const val = Number(e.target.value);
            angleRef.current = val;
            onAngleChange(val);
          }}
          className={`flex-1 accent-cyan-400 h-1.5 rounded-lg cursor-pointer ${
            isDark ? 'bg-slate-800' : 'bg-slate-200'
          }`}
        />
        <div className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Sync: {((currentAngleDeg / 360) * result.period * 1000).toFixed(1)}ms
        </div>
      </div>
    </div>
  );
};
