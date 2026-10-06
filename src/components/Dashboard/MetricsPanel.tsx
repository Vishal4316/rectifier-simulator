import React from 'react';
import type { ConverterMetrics, ConverterConfig } from '../../types/simulator';
import { Gauge, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface MetricsPanelProps {
  metrics: ConverterMetrics;
  config: ConverterConfig;
  isDark?: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, config, isDark = true }) => {
  const isCCM = metrics.mode === 'CCM';
  const diffTheoretical = Math.abs(metrics.Vdc - metrics.theoreticalVdc);

  return (
    <div
      className={`border rounded-2xl p-4 flex flex-col gap-4 shadow-xl select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Live Converter Analytics</h2>
        </div>

        {/* Conduction Mode Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
              isCCM
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
            }`}
          >
            {isCCM ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {metrics.mode} {metrics.betaDeg ? `(β = ${metrics.betaDeg}°)` : ''}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid (4 Key Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Vdc */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex justify-between items-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Average DC (Vdc)</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">AVG</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {metrics.Vdc.toFixed(1)} <span className="text-xs text-slate-500 font-normal">V</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            Ideal: {metrics.theoreticalVdc.toFixed(1)} V (Δ {diffTheoretical.toFixed(1)}V)
          </div>
        </div>

        {/* Vrms */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex justify-between items-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>RMS Voltage (Vrms)</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">RMS</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {metrics.Vrms.toFixed(1)} <span className="text-xs text-slate-500 font-normal">V</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Form Factor: {metrics.formFactor.toFixed(2)}
          </div>
        </div>

        {/* Idc */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex justify-between items-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Average Current (Idc)</span>
            <span className="text-[10px] text-purple-400 font-mono font-bold">DC</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {metrics.Idc.toFixed(2)} <span className="text-xs text-slate-500 font-normal">A</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Irms: {metrics.Irms.toFixed(2)} A
          </div>
        </div>

        {/* Ripple Factor */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex justify-between items-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Ripple Factor (RF)</span>
            <span
              className={`text-[10px] font-mono px-1 rounded font-bold ${
                metrics.rippleFactorV < 0.2
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : metrics.rippleFactorV < 0.6
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {metrics.rippleFactorV < 0.2 ? 'LOW' : 'MODERATE'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {(metrics.rippleFactorV * 100).toFixed(1)} <span className="text-xs text-slate-500 font-normal">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Ratio: {metrics.rippleFactorV.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row (Power & Quality) */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div className="flex flex-col">
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>DC Power (Pdc)</span>
          <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {metrics.Pdc.toFixed(1)} W
          </span>
        </div>

        <div className="flex flex-col">
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Power (Pac)</span>
          <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {metrics.Pac.toFixed(1)} W
          </span>
        </div>

        <div className="flex flex-col">
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Power Factor (PF)</span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {metrics.powerFactor.toFixed(3)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Current Ripple / THD</span>
          <span className="text-sm font-bold font-mono text-purple-400">
            {metrics.thdCurrent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Analytical Equation Banner */}
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Theoretical Equation:</span>
          <span className="text-cyan-400 font-semibold">{metrics.theoreticalFormula}</span>
        </div>
        <div className={isDark ? 'text-slate-500 text-[11px]' : 'text-slate-500 text-[11px]'}>
          α = {config.alpha}° | τ = {((config.L / config.R) * 1000).toFixed(1)}ms
        </div>
      </div>
    </div>
  );
};
