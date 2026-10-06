import React from 'react';
import type { ConverterConfig, PhaseType, RectifierType, SwitchType } from '../../types/simulator';
import { PRESETS } from '../../engine/presets';
import { Sliders, Zap, Sparkles } from 'lucide-react';

interface ConverterControlsProps {
  config: ConverterConfig;
  onChangeConfig: (newConfig: ConverterConfig) => void;
  onApplyPreset: (presetId: string) => void;
  isDark?: boolean;
}

export const ConverterControls: React.FC<ConverterControlsProps> = ({
  config,
  onChangeConfig,
  onApplyPreset,
  isDark = true,
}) => {
  const { phase, rectifier, alpha, R, L, Vrms, frequency, hasFWD, switches } = config;

  const handlePhaseChange = (newPhase: PhaseType) => {
    let newSwitches: Record<string, SwitchType> = {};
    if (newPhase === '1P') {
      if (rectifier === 'HW') {
        newSwitches = { T1: switches.T1 || 'thyristor' };
      } else {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
          T4: switches.T4 || 'thyristor',
        };
      }
    } else {
      if (rectifier === 'HW') {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
        };
      } else {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
          T4: switches.T4 || 'thyristor',
          T5: switches.T5 || 'thyristor',
          T6: switches.T6 || 'thyristor',
        };
      }
    }

    onChangeConfig({
      ...config,
      phase: newPhase,
      switches: newSwitches,
    });
  };

  const handleRectifierChange = (newRectifier: RectifierType) => {
    let newSwitches: Record<string, SwitchType> = {};
    if (phase === '1P') {
      if (newRectifier === 'HW') {
        newSwitches = { T1: switches.T1 || 'thyristor' };
      } else {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
          T4: switches.T4 || 'thyristor',
        };
      }
    } else {
      if (newRectifier === 'HW') {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
        };
      } else {
        newSwitches = {
          T1: switches.T1 || 'thyristor',
          T2: switches.T2 || 'thyristor',
          T3: switches.T3 || 'thyristor',
          T4: switches.T4 || 'thyristor',
          T5: switches.T5 || 'thyristor',
          T6: switches.T6 || 'thyristor',
        };
      }
    }

    onChangeConfig({
      ...config,
      rectifier: newRectifier,
      switches: newSwitches,
    });
  };

  const handleQuickPreset = (type: 'all_diodes' | 'all_thyristors' | 'semi_converter') => {
    const updatedSwitches: Record<string, SwitchType> = {};
    const switchKeys = Object.keys(switches);

    if (type === 'all_diodes') {
      switchKeys.forEach((k) => (updatedSwitches[k] = 'diode'));
      onChangeConfig({ ...config, switches: updatedSwitches, alpha: 0 });
    } else if (type === 'all_thyristors') {
      switchKeys.forEach((k) => (updatedSwitches[k] = 'thyristor'));
      onChangeConfig({ ...config, switches: updatedSwitches });
    } else if (type === 'semi_converter') {
      if (phase === '1P' && rectifier === 'FW') {
        updatedSwitches['T1'] = 'thyristor';
        updatedSwitches['T2'] = 'thyristor';
        updatedSwitches['T3'] = 'diode';
        updatedSwitches['T4'] = 'diode';
      } else if (phase === '3P' && rectifier === 'FW') {
        updatedSwitches['T1'] = 'thyristor';
        updatedSwitches['T3'] = 'thyristor';
        updatedSwitches['T5'] = 'thyristor';
        updatedSwitches['T4'] = 'diode';
        updatedSwitches['T6'] = 'diode';
        updatedSwitches['T2'] = 'diode';
      } else {
        switchKeys.forEach((k, idx) => (updatedSwitches[k] = idx % 2 === 0 ? 'thyristor' : 'diode'));
      }
      onChangeConfig({ ...config, switches: updatedSwitches });
    }
  };

  return (
    <div
      className={`border rounded-2xl p-4 flex flex-col gap-4 shadow-xl select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Converter Configuration</h2>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <select
            onChange={(e) => onApplyPreset(e.target.value)}
            className={`border rounded-xl px-2.5 py-1 text-xs font-mono focus:border-cyan-500 outline-none transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            defaultValue=""
          >
            <option value="" disabled>
              Load Presets...
            </option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.category}] {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topology Matrix: Phase & Rectification */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Supply Phase
          </label>
          <div
            className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <button
              onClick={() => handlePhaseChange('1P')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                phase === '1P'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single-Phase (1Φ)
            </button>
            <button
              onClick={() => handlePhaseChange('3P')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                phase === '3P'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Three-Phase (3Φ)
            </button>
          </div>
        </div>

        <div>
          <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Rectification Type
          </label>
          <div
            className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <button
              onClick={() => handleRectifierChange('HW')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                rectifier === 'HW'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Half-Wave (HW)
            </button>
            <button
              onClick={() => handleRectifierChange('FW')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                rectifier === 'FW'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full-Wave (FW)
            </button>
          </div>
        </div>
      </div>

      {/* Control Type Presets & FWD Toggle */}
      <div>
        <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Control Presets & Freewheeling
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleQuickPreset('all_diodes')}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-600'
            }`}
          >
            Diode Bridge (DBR)
          </button>
          <button
            onClick={() => handleQuickPreset('all_thyristors')}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600'
            }`}
          >
            All Thyristors (TCR)
          </button>
          <button
            onClick={() => handleQuickPreset('semi_converter')}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:text-purple-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-500 hover:text-purple-600'
            }`}
          >
            Semi-Converter
          </button>
          <button
            onClick={() => onChangeConfig({ ...config, hasFWD: !hasFWD })}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
              hasFWD
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm'
                : isDark
                ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
            }`}
          >
            <Zap className={`w-3 h-3 ${hasFWD ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            FWD: {hasFWD ? 'Active' : 'Off'}
          </button>
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className={`flex flex-col gap-3 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Firing Angle (α)
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>0° – 180°</span>
            </span>
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                min={0}
                max={180}
                value={alpha}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    alpha: Math.min(180, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
                className={`w-14 border rounded px-1.5 py-0.5 text-right font-bold focus:border-amber-400 outline-none text-xs ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-amber-400'
                    : 'bg-slate-50 border-slate-200 text-amber-600'
                }`}
              />
              <span className="text-amber-500">°</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={1}
            value={alpha}
            onChange={(e) => onChangeConfig({ ...config, alpha: Number(e.target.value) })}
            className={`w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div className="flex justify-between gap-1 mt-1.5">
            {[0, 30, 45, 60, 90, 120].map((ang) => (
              <button
                key={ang}
                onClick={() => onChangeConfig({ ...config, alpha: ang })}
                className={`flex-1 py-0.5 rounded text-[10px] font-mono border transition-all ${
                  alpha === ang
                    ? 'bg-amber-400/20 text-amber-500 border-amber-400/50 font-bold'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                {ang}°
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Resistance (R)</span>
              <span className="text-cyan-500 font-mono font-bold">{R} Ω</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={R}
              onChange={(e) => onChangeConfig({ ...config, R: Number(e.target.value) })}
              className={`w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Inductance (L)</span>
              <span className="text-purple-500 font-mono font-bold">{(L * 1000).toFixed(0)} mH</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.005}
              value={L}
              onChange={(e) => onChangeConfig({ ...config, L: Number(e.target.value) })}
              className={`w-full accent-purple-500 h-1.5 rounded-lg cursor-pointer ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Source Vrms</span>
              <span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{Vrms} V</span>
            </div>
            <div className="flex gap-1.5">
              {[120, 230, 400].map((v) => (
                <button
                  key={v}
                  onClick={() => onChangeConfig({ ...config, Vrms: v })}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                    Vrms === v
                      ? isDark
                        ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-cyan-50 text-cyan-700 border-cyan-400 font-bold'
                      : isDark
                      ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Grid Frequency</span>
              <span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{frequency} Hz</span>
            </div>
            <div className="flex gap-1.5">
              {[50, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => onChangeConfig({ ...config, frequency: f })}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                    frequency === f
                      ? isDark
                        ? 'bg-slate-800 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-cyan-50 text-cyan-700 border-cyan-400 font-bold'
                      : isDark
                      ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {f} Hz
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
