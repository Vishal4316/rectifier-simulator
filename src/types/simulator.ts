export type PhaseType = '1P' | '3P';
export type RectifierType = 'HW' | 'FW';
export type SwitchType = 'diode' | 'thyristor';
export type PresetType = 'all_diodes' | 'all_thyristors' | 'semi_converter' | 'custom';
export type ConductionMode = 'CCM' | 'DCM';

export interface ConverterConfig {
  phase: PhaseType;
  rectifier: RectifierType;
  switches: Record<string, SwitchType>; // e.g. T1: 'thyristor', T2: 'diode'
  hasFWD: boolean;
  alpha: number; // in degrees (0 to 180)
  R: number; // in Ohms
  L: number; // in Henries
  Vrms: number; // in Volts
  frequency: number; // in Hz
}

export interface SimulationSample {
  time: number; // seconds
  thetaDeg: number; // 0 to 360 (or multi-cycle)
  thetaRad: number;
  vSourceA: number;
  vSourceB?: number;
  vSourceC?: number;
  vOut: number;
  iOut: number;
  gatePulse: boolean;
  fwdConduction: boolean;
  conductingSwitches: string[];
}

export interface ConverterMetrics {
  Vdc: number; // Average DC voltage (V)
  Vrms: number; // RMS voltage (V)
  Idc: number; // Average DC current (A)
  Irms: number; // RMS current (A)
  Pdc: number; // DC output power (W)
  Pac: number; // Total active power (W)
  rippleFactorV: number; // Ripple Factor (ratio)
  formFactor: number; // Form factor
  powerFactor: number; // Power factor
  thdCurrent: number; // Current THD estimate (%)
  mode: ConductionMode;
  betaDeg: number | null; // Extinction angle in degrees (DCM only)
  theoreticalVdc: number; // Ideal textbook closed-form Vdc
  theoreticalFormula: string;
}

export interface SimulationResult {
  samples: SimulationSample[];
  metrics: ConverterMetrics;
  period: number; // one AC cycle duration in seconds
  sampleCount: number;
}
