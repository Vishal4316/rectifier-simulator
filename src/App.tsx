import { useState, useMemo, useCallback } from 'react';
import type { ConverterConfig, SwitchType } from './types/simulator';
import { simulateConverter } from './engine/physics';
import { PRESETS } from './engine/presets';
import { CircuitSchematic } from './components/Schematic/CircuitSchematic';
import { WaveformCanvas } from './components/Waveforms/WaveformCanvas';
import { ConverterControls } from './components/Controls/ConverterControls';
import { MetricsPanel } from './components/Dashboard/MetricsPanel';
import { TheoryPanel } from './components/Dashboard/TheoryPanel';
import {
  Zap,
  Download,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';

export function App() {
  const [isDark, setIsDark] = useState(true);
  const [showTheory, setShowTheory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [currentAngleDeg, setCurrentAngleDeg] = useState(0);

  const [config, setConfig] = useState<ConverterConfig>({
    phase: '1P',
    rectifier: 'FW',
    switches: {
      T1: 'thyristor',
      T2: 'thyristor',
      T3: 'thyristor',
      T4: 'thyristor',
    },
    hasFWD: false,
    alpha: 45,
    R: 15,
    L: 0.05,
    Vrms: 230,
    frequency: 50,
  });

  const result = useMemo(() => {
    return simulateConverter(config);
  }, [config]);

  const currentSample = useMemo(() => {
    if (!result.samples || result.samples.length === 0) return undefined;
    const target = currentAngleDeg % 360;
    const idx = Math.min(
      result.samples.length - 1,
      Math.max(0, Math.floor((target / 360) * result.samples.length))
    );
    return result.samples[idx];
  }, [result.samples, currentAngleDeg]);

  const handleToggleSwitch = useCallback(
    (switchId: string) => {
      setConfig((prev) => {
        const currentType = prev.switches[switchId] || 'thyristor';
        const nextType: SwitchType = currentType === 'thyristor' ? 'diode' : 'thyristor';
        return {
          ...prev,
          switches: {
            ...prev.switches,
            [switchId]: nextType,
          },
        };
      });
    },
    []
  );

  const handleToggleFWD = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      hasFWD: !prev.hasFWD,
    }));
  }, []);

  const handleApplyPreset = useCallback((presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      setConfig(found.config);
      setCurrentAngleDeg(0);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!result.samples || result.samples.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Time_s,Angle_deg,V_sourceA_V,V_out_V,I_out_A,Conducting_Switches\n';

    result.samples.forEach((s) => {
      const row = [
        s.time.toFixed(6),
        s.thetaDeg.toFixed(2),
        s.vSourceA.toFixed(2),
        s.vOut.toFixed(2),
        s.iOut.toFixed(4),
        `"${s.conductingSwitches.join(';')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rectifier_data_${config.phase}_${config.rectifier}_alpha${config.alpha}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result, config]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark ? 'bg-slate-950/85 border-slate-800' : 'bg-white/85 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Student ID & Name in Upper Left Corner */}
            <div
              className={`flex flex-col justify-center leading-tight border-r pr-3.5 mr-0.5 transition-colors ${
                isDark ? 'border-slate-800' : 'border-slate-300'
              }`}
            >
              <span className="font-mono text-xs font-bold tracking-wider text-cyan-400">
                24EE10023
              </span>
              <span
                className={`text-xs font-semibold tracking-tight ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                Vishal Mehta
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5 fill-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  RectifierLab
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive Power Electronics Converter & Rectifier Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTheory(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Formulas &</span> Theory
            </button>

            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title="Download steady-state waveform data as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl transition-colors border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 flex flex-col gap-4">
        {/* TOP ROW: Split View of Interactive Circuit Schematic & Multi-Channel Canvas Waveforms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div className="w-full h-full min-h-[420px]">
            <CircuitSchematic
              config={config}
              currentSample={currentSample}
              onToggleSwitch={handleToggleSwitch}
              onToggleFWD={handleToggleFWD}
              isDark={isDark}
            />
          </div>

          <div className="w-full h-full min-h-[420px]">
            <WaveformCanvas
              result={result}
              config={config}
              currentAngleDeg={currentAngleDeg}
              onAngleChange={setCurrentAngleDeg}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              playSpeed={playSpeed}
              onChangeSpeed={setPlaySpeed}
              isDark={isDark}
            />
          </div>
        </div>

        {/* BOTTOM ROW: Converter Parameter Controls & Live Analytics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5">
            <ConverterControls
              config={config}
              onChangeConfig={setConfig}
              onApplyPreset={handleApplyPreset}
              isDark={isDark}
            />
          </div>

          <div className="lg:col-span-7">
            <MetricsPanel metrics={result.metrics} config={config} isDark={isDark} />
          </div>
        </div>
      </main>

      <TheoryPanel
        isOpen={showTheory}
        onClose={() => setShowTheory(false)}
        config={config}
        metrics={result.metrics}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
