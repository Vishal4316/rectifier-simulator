import type { ConverterConfig } from '../types/simulator';

export interface PresetConfig {
  id: string;
  name: string;
  category: '1-Phase' | '3-Phase';
  description: string;
  config: ConverterConfig;
}

export const PRESETS: PresetConfig[] = [
  {
    id: '1p-dbr',
    name: '1Φ Diode Bridge (DBR)',
    category: '1-Phase',
    description: 'Uncontrolled full-wave bridge rectifier with RL load and smooth continuous DC output.',
    config: {
      phase: '1P',
      rectifier: 'FW',
      switches: { T1: 'diode', T2: 'diode', T3: 'diode', T4: 'diode' },
      hasFWD: false,
      alpha: 0,
      R: 15,
      L: 0.04, // 40 mH
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '1p-tcr-ccm',
    name: '1Φ Fully-Controlled Bridge (TCR)',
    category: '1-Phase',
    description: 'All 4 switches are Thyristors (SCRs). Demonstrates negative voltage excursions before commutation in CCM.',
    config: {
      phase: '1P',
      rectifier: 'FW',
      switches: { T1: 'thyristor', T2: 'thyristor', T3: 'thyristor', T4: 'thyristor' },
      hasFWD: false,
      alpha: 45,
      R: 12,
      L: 0.08, // 80 mH
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '1p-semi',
    name: '1Φ Semi-Converter',
    category: '1-Phase',
    description: 'Half-controlled converter (2 SCRs + 2 Diodes). Inherent freewheeling clamps negative output voltage.',
    config: {
      phase: '1P',
      rectifier: 'FW',
      switches: { T1: 'thyristor', T2: 'thyristor', T3: 'diode', T4: 'diode' },
      hasFWD: false,
      alpha: 60,
      R: 15,
      L: 0.05, // 50 mH
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '1p-hw-fwd',
    name: '1Φ Half-Wave with FWD',
    category: '1-Phase',
    description: 'Freewheeling diode clamps voltage at zero and allows inductive energy dissipation, preventing negative V_o.',
    config: {
      phase: '1P',
      rectifier: 'HW',
      switches: { T1: 'thyristor' },
      hasFWD: true,
      alpha: 30,
      R: 10,
      L: 0.06, // 60 mH
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '1p-hw-spike',
    name: '1Φ HW without FWD (Extinction β)',
    category: '1-Phase',
    description: 'Noticeable negative voltage excursion during π < ωt < β as inductor forces switch conduction.',
    config: {
      phase: '1P',
      rectifier: 'HW',
      switches: { T1: 'thyristor' },
      hasFWD: false,
      alpha: 30,
      R: 8,
      L: 0.07, // 70 mH
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '3p-6p-dbr',
    name: '3Φ 6-Pulse Diode Bridge',
    category: '3-Phase',
    description: 'High-power 6-pulse industrial rectifier with low 300Hz ripple and high DC efficiency.',
    config: {
      phase: '3P',
      rectifier: 'FW',
      switches: { T1: 'diode', T2: 'diode', T3: 'diode', T4: 'diode', T5: 'diode', T6: 'diode' },
      hasFWD: false,
      alpha: 0,
      R: 20,
      L: 0.02, // 20 mH
      Vrms: 230, // 400V line-to-line equivalent
      frequency: 50,
    },
  },
  {
    id: '3p-6p-tcr',
    name: '3Φ Controlled 6-Pulse Bridge',
    category: '3-Phase',
    description: 'Fully-controlled 6-pulse thyristor converter for heavy DC drives and HVDC applications.',
    config: {
      phase: '3P',
      rectifier: 'FW',
      switches: { T1: 'thyristor', T2: 'thyristor', T3: 'thyristor', T4: 'thyristor', T5: 'thyristor', T6: 'thyristor' },
      hasFWD: false,
      alpha: 30,
      R: 18,
      L: 0.04,
      Vrms: 230,
      frequency: 50,
    },
  },
  {
    id: '3p-hw-3pulse',
    name: '3Φ 3-Pulse Half-Wave',
    category: '3-Phase',
    description: '3-pulse star-connected rectifier with neutral return path and 150Hz output ripple.',
    config: {
      phase: '3P',
      rectifier: 'HW',
      switches: { T1: 'thyristor', T2: 'thyristor', T3: 'thyristor' },
      hasFWD: false,
      alpha: 20,
      R: 15,
      L: 0.03,
      Vrms: 230,
      frequency: 50,
    },
  },
];
