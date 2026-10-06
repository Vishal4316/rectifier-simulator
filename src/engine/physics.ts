import type {
  ConverterConfig,
  ConverterMetrics,
  SimulationResult,
  SimulationSample,
} from '../types/simulator';

/**
 * Standardize angle to [0, 2*PI)
 */
function normalizeRad(rad: number): number {
  const twoPi = 2 * Math.PI;
  let res = rad % twoPi;
  if (res < 0) res += twoPi;
  return res;
}

/**
 * Physics & ODE Simulation Engine for Power Electronics Rectifiers
 */
export function simulateConverter(config: ConverterConfig): SimulationResult {
  const { phase, rectifier, alpha, R, L, Vrms: sourceVrms, frequency, hasFWD, switches } = config;

  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;
  const alphaRad = (alpha * Math.PI) / 180;

  // Single-phase peak voltage or 3-phase line-to-neutral peak voltage
  const Vm_phase = Math.SQRT2 * sourceVrms;
  const Vm_line = Math.sqrt(6) * sourceVrms; // sqrt(2)*sqrt(3)*Vrms

  // Step resolution: 1200 points per cycle
  const STEPS_PER_CYCLE = 1200;
  const dt = T / STEPS_PER_CYCLE;
  const TOTAL_CYCLES = 4; // run 4 cycles to achieve exact steady state
  const TOTAL_STEPS = STEPS_PER_CYCLE * TOTAL_CYCLES;

  // State variable: load current i_o
  let current_io = 0;

  // Track conduction states
  let samplesAll: SimulationSample[] = [];

  // Helper to test if a switch is diode or thyristor
  const isThyristor = (id: string) => switches[id] === 'thyristor';

  for (let step = 0; step < TOTAL_STEPS; step++) {
    const t = step * dt;
    const thetaRad = normalizeRad(omega * t);
    const thetaDeg = (thetaRad * 180) / Math.PI;

    let vA = 0;
    let vB = 0;
    let vC = 0;
    let vApplied = 0; // instantaneous voltage across R-L branch before FWD clamp
    let conductingSwitches: string[] = [];
    let isGatePulse = false;
    let isFWDConducting = false;

    if (phase === '1P') {
      vA = Vm_phase * Math.sin(omega * t);

      if (rectifier === 'HW') {
        // --- 1-PHASE HALF-WAVE ---
        const sw = 'T1';
        const isSCR = isThyristor(sw);
        const inForwardHalf = vA > 0;

        // Gate pulse window for SCR (active around alpha)
        const pulseWindow = isSCR && thetaRad >= alphaRad && thetaRad <= alphaRad + (8 * Math.PI) / 180;
        if (pulseWindow) isGatePulse = true;

        let swConducting = false;
        if (isSCR) {
          // SCR turns on at alpha if forward biased, or continues if current is flowing
          if (thetaRad >= alphaRad && thetaRad < Math.PI) {
            swConducting = true;
          } else if (current_io > 1e-4) {
            // Continues conducting past pi due to L if no FWD
            if (!hasFWD) {
              swConducting = true;
            }
          }
        } else {
          // Diode conducts whenever vA > 0 or current > 0 without FWD
          if (inForwardHalf) {
            swConducting = true;
          } else if (current_io > 1e-4 && !hasFWD) {
            swConducting = true;
          }
        }

        if (swConducting) {
          conductingSwitches.push(sw);
          vApplied = vA;
        } else {
          vApplied = 0;
        }

        // FWD action: when vA < 0 and current > 0
        if (hasFWD && current_io > 1e-4 && !inForwardHalf) {
          isFWDConducting = true;
          vApplied = 0; // clamped to 0
        }

      } else {
        // --- 1-PHASE FULL-WAVE BRIDGE ---
        // Switches: T1, T2 (conduct for vA > 0), T3, T4 (conduct for vA < 0)
        const t1_scr = isThyristor('T1');
        const t2_scr = isThyristor('T2');
        const t3_scr = isThyristor('T3');
        const t4_scr = isThyristor('T4');

        const pulseWindow1 = (t1_scr || t2_scr) && thetaRad >= alphaRad && thetaRad <= alphaRad + (8 * Math.PI) / 180;
        const pulseWindow2 = (t3_scr || t4_scr) && thetaRad >= Math.PI + alphaRad && thetaRad <= Math.PI + alphaRad + (8 * Math.PI) / 180;
        if (pulseWindow1 || pulseWindow2) isGatePulse = true;

        // Determine if semi-converter (mixed SCR and Diodes)
        const isSemi = (t1_scr !== t3_scr) || (t1_scr && !t2_scr) || (!t1_scr && t2_scr) || (t3_scr && !t4_scr) || (!t3_scr && t4_scr);
        const naturalFreewheel = isSemi || hasFWD;

        if (thetaRad >= 0 && thetaRad < Math.PI) {
          // Positive half-cycle window
          const fired = (!t1_scr && !t2_scr) || thetaRad >= alphaRad;
          if (fired) {
            conductingSwitches.push('T1', 'T2');
            vApplied = vA;
          } else {
            // Before firing angle in positive half:
            if (current_io > 1e-4) {
              if (naturalFreewheel) {
                isFWDConducting = true;
                vApplied = 0;
              } else {
                // Fully controlled without freewheeling: previous pair (T3, T4) continues carrying negative vA!
                conductingSwitches.push('T3', 'T4');
                vApplied = -vA; // which is negative
              }
            } else {
              vApplied = 0;
            }
          }
        } else {
          // Negative half-cycle window: [PI, 2*PI)
          const fired = (!t3_scr && !t4_scr) || thetaRad >= Math.PI + alphaRad;
          if (fired) {
            conductingSwitches.push('T3', 'T4');
            vApplied = -vA;
          } else {
            // Before firing angle in negative half:
            if (current_io > 1e-4) {
              if (naturalFreewheel) {
                isFWDConducting = true;
                vApplied = 0;
              } else {
                // Fully controlled continues carrying T1, T2!
                conductingSwitches.push('T1', 'T2');
                vApplied = vA; // which is negative here
              }
            } else {
              vApplied = 0;
            }
          }
        }

        // Freewheeling Diode clamps negative excursions
        if (hasFWD && vApplied < 0 && current_io > 1e-4) {
          isFWDConducting = true;
          vApplied = 0;
        }
      }

    } else {
      // --- 3-PHASE ---
      vA = Vm_phase * Math.sin(omega * t);
      vB = Vm_phase * Math.sin(omega * t - (2 * Math.PI) / 3);
      vC = Vm_phase * Math.sin(omega * t + (2 * Math.PI) / 3);

      if (rectifier === 'HW') {
        // --- 3-PHASE HALF-WAVE (3-pulse) ---
        // T1 connected to Phase A, T2 to Phase B, T3 to Phase C
        // Natural commutation points at 30 deg, 150 deg, 270 deg
        const deg = thetaDeg;
        const fire1 = (30 + alpha) % 360;
        const fire2 = (150 + alpha) % 360;
        const fire3 = (270 + alpha) % 360;

        const pulse1 = isThyristor('T1') && Math.abs(deg - fire1) < 4;
        const pulse2 = isThyristor('T2') && Math.abs(deg - fire2) < 4;
        const pulse3 = isThyristor('T3') && Math.abs(deg - fire3) < 4;
        if (pulse1 || pulse2 || pulse3) isGatePulse = true;

        // Modulo 360 interval calculation
        const delta = ((deg - (30 + alpha)) % 360 + 360) % 360;
        let chosenV = 0;
        let chosenSw = '';

        if (delta < 120) {
          chosenV = vA;
          chosenSw = 'T1';
        } else if (delta < 240) {
          chosenV = vB;
          chosenSw = 'T2';
        } else {
          chosenV = vC;
          chosenSw = 'T3';
        }

        // If current dropped to 0 in DCM and voltage is negative
        if (chosenV < 0) {
          if (hasFWD && current_io > 1e-4) {
            isFWDConducting = true;
            chosenV = 0;
          } else if (current_io <= 1e-4) {
            chosenV = 0;
            chosenSw = '';
          }
        }

        if (chosenSw) conductingSwitches.push(chosenSw);
        vApplied = chosenV;

      } else {
        // --- 3-PHASE FULL-WAVE 6-PULSE BRIDGE ---
        // 6 switches: T1(A+), T3(B+), T5(C+), T4(A-), T6(B-), T2(C-)
        // Standard commutation sequence:
        // (T1,T6)->vAB, (T1,T2)->vAC, (T3,T2)->vBC, (T3,T4)->vBA, (T5,T4)->vCA, (T5,T6)->vCB
        const deg = thetaDeg;
        const baseFire = 30 + alpha;
        const delta = ((deg - baseFire) % 360 + 360) % 360;
        const intIndex = Math.floor(delta / 60);

        let activePair: [string, string] = ['T1', 'T6'];
        let pairV = vA - vB;

        switch (intIndex) {
          case 0:
            activePair = ['T1', 'T6'];
            pairV = vA - vB;
            break;
          case 1:
            activePair = ['T1', 'T2'];
            pairV = vA - vC;
            break;
          case 2:
            activePair = ['T3', 'T2'];
            pairV = vB - vC;
            break;
          case 3:
            activePair = ['T3', 'T4'];
            pairV = vB - vA;
            break;
          case 4:
            activePair = ['T5', 'T4'];
            pairV = vC - vA;
            break;
          case 5:
            activePair = ['T5', 'T6'];
            pairV = vC - vB;
            break;
        }

        // Gate pulse on commutation transitions
        const degInInterval = delta % 60;
        if (degInInterval < 4) isGatePulse = true;

        if (hasFWD && pairV < 0 && current_io > 1e-4) {
          isFWDConducting = true;
          vApplied = 0;
        } else if (current_io <= 1e-4 && pairV < 0) {
          vApplied = 0;
        } else {
          conductingSwitches.push(...activePair);
          vApplied = pairV;
        }
      }
    }

    // Output voltage cannot drop current below zero (diodes/SCRs block reverse current)
    const effectiveVo = vApplied;

    // Numerical ODE integration: L * di/dt + R * i = Vo
    if (L <= 1e-6) {
      current_io = Math.max(0, effectiveVo / R);
    } else {
      const k1 = (effectiveVo - R * current_io) / L;
      const iMid = Math.max(0, current_io + 0.5 * dt * k1);
      const k2 = (effectiveVo - R * iMid) / L;
      const iNext = current_io + dt * k2;

      current_io = Math.max(0, iNext);
    }

    // Save sample if we are in the last cycle (steady state)
    if (step >= TOTAL_STEPS - STEPS_PER_CYCLE) {
      samplesAll.push({
        time: t - (TOTAL_CYCLES - 1) * T,
        thetaDeg: (step % STEPS_PER_CYCLE) * (360 / STEPS_PER_CYCLE),
        thetaRad,
        vSourceA: vA,
        vSourceB: phase === '3P' ? vB : undefined,
        vSourceC: phase === '3P' ? vC : undefined,
        vOut: effectiveVo,
        iOut: current_io,
        gatePulse: isGatePulse,
        fwdConduction: isFWDConducting,
        conductingSwitches,
      });
    }
  }

  // Calculate Metrics from steady-state samples
  const N = samplesAll.length;
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumP = 0;
  let minIo = Infinity;
  let betaDeg: number | null = null;

  for (let i = 0; i < N; i++) {
    const s = samplesAll[i];
    sumVo += s.vOut;
    sumVoSq += s.vOut * s.vOut;
    sumIo += s.iOut;
    sumIoSq += s.iOut * s.iOut;
    sumP += s.vOut * s.iOut;

    if (s.iOut < minIo) minIo = s.iOut;

    // Detect extinction angle beta (where iOut returns to 0 in 1-phase HW)
    if (phase === '1P' && rectifier === 'HW' && betaDeg === null) {
      const prev = samplesAll[(i - 1 + N) % N];
      if (prev.iOut > 1e-3 && s.iOut <= 1e-4 && s.thetaDeg > alpha) {
        betaDeg = Math.round(s.thetaDeg);
      }
    }
  }

  const Vdc = sumVo / N;
  const VrmsOut = Math.sqrt(sumVoSq / N);
  const Idc = sumIo / N;
  const Irms = Math.sqrt(sumIoSq / N);
  const Pdc = Vdc * Idc;
  const Pac = sumP / N;

  const rippleFactorV = Vdc > 0 ? Math.sqrt(Math.max(0, Math.pow(VrmsOut / Vdc, 2) - 1)) : 0;
  const formFactor = Vdc > 0 ? VrmsOut / Vdc : 0;
  const S_in = sourceVrms * Irms; // apparent power estimate
  const powerFactor = S_in > 0 ? Math.min(1, Pac / S_in) : 0;
  const thdCurrent = Idc > 0 ? Math.sqrt(Math.max(0, Math.pow(Irms / Idc, 2) - 1)) * 100 : 0;

  const isCCM = minIo > 0.05 * Math.max(...samplesAll.map((s) => s.iOut));

  // Closed-form theoretical formula
  let theoreticalVdc = 0;
  let theoreticalFormula = '';

  if (phase === '1P') {
    if (rectifier === 'HW') {
      if (hasFWD || switches['T1'] === 'diode') {
        theoreticalVdc = (Vm_phase / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
        theoreticalFormula = 'Vdc = (Vm / 2π) * (1 + cos α)';
      } else {
        theoreticalVdc = (Vm_phase / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
        theoreticalFormula = 'Vdc = (Vm / 2π) * (cos α - cos β)';
      }
    } else {
      // 1-Phase Full-Wave
      const isControlled = Object.values(switches).every((s) => s === 'thyristor') && !hasFWD;
      if (isControlled) {
        theoreticalVdc = ((2 * Vm_phase) / Math.PI) * Math.cos(alphaRad);
        theoreticalFormula = 'Vdc = (2Vm / π) * cos α';
      } else {
        theoreticalVdc = (Vm_phase / Math.PI) * (1 + Math.cos(alphaRad));
        theoreticalFormula = 'Vdc = (Vm / π) * (1 + cos α)';
      }
    }
  } else {
    // 3-Phase
    if (rectifier === 'HW') {
      theoreticalVdc = ((3 * Math.sqrt(3) * Vm_phase) / (2 * Math.PI)) * Math.cos(alphaRad);
      theoreticalFormula = 'Vdc = (3√3 Vm,ph / 2π) * cos α';
    } else {
      theoreticalVdc = ((3 * Vm_line) / Math.PI) * Math.cos(alphaRad);
      theoreticalFormula = 'Vdc = (3Vm,LL / π) * cos α';
    }
  }

  const metrics: ConverterMetrics = {
    Vdc,
    Vrms: VrmsOut,
    Idc,
    Irms,
    Pdc,
    Pac,
    rippleFactorV,
    formFactor,
    powerFactor,
    thdCurrent,
    mode: isCCM ? 'CCM' : 'DCM',
    betaDeg,
    theoreticalVdc: Math.max(0, theoreticalVdc),
    theoreticalFormula,
  };

  return {
    samples: samplesAll,
    metrics,
    period: T,
    sampleCount: samplesAll.length,
  };
}
