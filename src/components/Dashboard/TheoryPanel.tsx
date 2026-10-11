import React from 'react';
import type { ConverterConfig, ConverterMetrics } from '../../types/simulator';
import { BookOpen, X } from 'lucide-react';

interface TheoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConverterConfig;
  metrics: ConverterMetrics;
  isDark?: boolean;
}

export const TheoryPanel: React.FC<TheoryPanelProps> = ({
  isOpen,
  onClose,
  config,
  metrics,
  isDark = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Power Electronics Principles & Equations
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`p-5 overflow-y-auto space-y-5 text-sm leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {/* Active Topology Overview */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
            <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1 font-mono">
              Active Configuration
            </h4>
            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {config.phase === '1P' ? 'Single-Phase' : 'Three-Phase'} {config.rectifier === 'HW' ? 'Half-Wave' : 'Full-Wave Bridge'} Rectifier
            </p>
            <div className={`mt-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Theoretical Average DC Voltage:{' '}
              <span className="text-cyan-500 font-bold">{metrics.theoreticalFormula}</span>
            </div>
          </div>

          {/* Freewheeling Diode (FWD) Mechanics */}
          <div>
            <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5 mb-2">
              Role of the Freewheeling Diode (FWD)
            </h4>
            <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              When an inductive load (R-L) is rectified without an FWD, the collapsing magnetic field in the inductor forces the thyristor or diode to maintain conduction even after the AC supply voltage swings negative.
            </p>
            <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li>
                <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>Without FWD:</strong> Output voltage goes negative between π and β, significantly decreasing the average DC output voltage (Vdc).
              </li>
              <li>
                <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>With FWD:</strong> As soon as Vin ≤ 0, the FWD becomes forward-biased and conducts, clamping Vo = 0V, dissipating stored inductor energy through the load resistor and improving power factor.
              </li>
            </ul>
          </div>

          {/* Continuous vs Discontinuous Mode */}
          <div>
            <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5 mb-2">
              Conduction Modes: CCM vs DCM
            </h4>
            <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              The converter operates in either <strong className="text-emerald-500">Continuous Conduction Mode (CCM)</strong> or <strong className="text-amber-500">Discontinuous Conduction Mode (DCM)</strong> depending on the load time constant τ = L/R relative to the grid period:
            </p>
            <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <li>
                <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>CCM (Continuous):</strong> The load current io(t) never drops to zero throughout the cycle. Output voltage follows the AC envelopes.
              </li>
              <li>
                <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>DCM (Discontinuous):</strong> The load current drops to zero before the next firing pulse occurs. During the dead interval, Vo = 0V and all devices remain off until the next trigger.
              </li>
            </ul>
          </div>

          {/* Complete Converter Equations Reference Table */}
          <div>
            <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
              Comprehensive Textbook Converter Equations Reference
            </h4>
            <div className={`overflow-x-auto rounded-xl border text-xs ${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400 bg-slate-900/80' : 'border-slate-200 text-slate-600 bg-slate-100'}`}>
                    <th className="p-2.5">Topology</th>
                    <th className="p-2.5">Control Type</th>
                    <th className="p-2.5">Average DC Voltage (Vdc)</th>
                    <th className="p-2.5">Ripple Freq</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Half-Wave</td>
                    <td className="p-2.5 text-cyan-400">Diode (R load / with FWD)</td>
                    <td className="p-2.5 font-bold text-emerald-400">Vm / π</td>
                    <td className="p-2.5 text-slate-400">f (50 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Half-Wave</td>
                    <td className="p-2.5 text-amber-400">Thyristor (with FWD)</td>
                    <td className="p-2.5 font-bold text-emerald-400">(Vm / 2π) * (1 + cos α)</td>
                    <td className="p-2.5 text-slate-400">f (50 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Half-Wave</td>
                    <td className="p-2.5 text-amber-400">Thyristor (without FWD, DCM)</td>
                    <td className="p-2.5 font-bold text-emerald-400">(Vm / 2π) * (cos α - cos β)</td>
                    <td className="p-2.5 text-slate-400">f (50 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Full-Wave</td>
                    <td className="p-2.5 text-cyan-400">Diode Bridge</td>
                    <td className="p-2.5 font-bold text-emerald-400">2Vm / π</td>
                    <td className="p-2.5 text-slate-400">2f (100 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Full-Wave</td>
                    <td className="p-2.5 text-purple-400">Semi-Converter / with FWD</td>
                    <td className="p-2.5 font-bold text-emerald-400">(Vm / π) * (1 + cos α)</td>
                    <td className="p-2.5 text-slate-400">2f (100 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">1Φ Full-Wave</td>
                    <td className="p-2.5 text-amber-400">Fully Controlled (CCM)</td>
                    <td className="p-2.5 font-bold text-emerald-400">(2Vm / π) * cos α</td>
                    <td className="p-2.5 text-slate-400">2f (100 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">3Φ Half-Wave</td>
                    <td className="p-2.5 text-cyan-400">Diode 3-Pulse</td>
                    <td className="p-2.5 font-bold text-emerald-400">3√3 Vm,ph / 2π</td>
                    <td className="p-2.5 text-slate-400">3f (150 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">3Φ Half-Wave</td>
                    <td className="p-2.5 text-amber-400">Controlled (α ≤ 30° / CCM)</td>
                    <td className="p-2.5 font-bold text-emerald-400">(3√3 Vm,ph / 2π) * cos α</td>
                    <td className="p-2.5 text-slate-400">3f (150 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">3Φ Full-Wave</td>
                    <td className="p-2.5 text-cyan-400">6-Pulse Diode Bridge</td>
                    <td className="p-2.5 font-bold text-emerald-400">3Vm,LL / π = 3√6 Vm,ph / π</td>
                    <td className="p-2.5 text-slate-400">6f (300 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">3Φ Full-Wave</td>
                    <td className="p-2.5 text-purple-400">Semi-Converter (Half-Controlled)</td>
                    <td className="p-2.5 font-bold text-emerald-400">(3Vm,LL / 2π) * (1 + cos α)</td>
                    <td className="p-2.5 text-slate-400">6f (300 Hz)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium">3Φ Full-Wave</td>
                    <td className="p-2.5 text-amber-400">Controlled 6-Pulse Bridge</td>
                    <td className="p-2.5 font-bold text-emerald-400">(3Vm,LL / π) * cos α</td>
                    <td className="p-2.5 text-slate-400">6f (300 Hz)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Performance Metric Definitions */}
          <div>
            <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5 mb-2">
              Performance Metrics & Analytical Definitions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-cyan-400 mb-1">Ripple Factor (RF)</div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">RF = √( (Vrms / Vdc)² - 1 )</div>
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Quantifies the proportion of AC harmonics remaining in the DC output voltage.
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-emerald-400 mb-1">Form Factor (FF)</div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">FF = Vrms / Vdc</div>
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Ratio of RMS output voltage to average DC voltage (ideal pure DC = 1.00).
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-amber-400 mb-1">Extinction Angle (β)</div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">β: Angle where io(t) = 0</div>
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  In DCM, the angle at which the inductor energy fully collapses and the thyristor commutates off.
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-purple-400 mb-1">Power Factor (PF)</div>
                <div className="text-slate-400 font-mono text-[11px] mb-1">PF = Pac / Sin</div>
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Ratio of active input power to total apparent grid power (Sin = √3 · VLL · Iline in 3Φ).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-3 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
