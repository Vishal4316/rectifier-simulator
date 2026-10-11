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
 * High-Precision Physics & RK4 ODE Simulation Engine for Power Electronics Rectifiers
 */
export function simulateConverter(config: ConverterConfig): SimulationResult {
  const { phase, rectifier, alpha, R, L, Vrms: sourceVrms, frequency, hasFWD, switches } = config;

  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;

  // Single-phase peak voltage or 3-phase line-to-neutral peak voltage
  const Vm_phase = Math.SQRT2 * sourceVrms;
  const Vm_line = Math.sqrt(6) * sourceVrms; // sqrt(2)*sqrt(3)*Vrms

  // Check if any thyristors are active
  const isThyristor = (id: string) => switches[id] === 'thyristor';
  const hasControlledSwitches = Object.values(switches).some((s) => s === 'thyristor');

  // If all switches are diodes, effective alpha is strictly 0 (natural commutation)
  const effAlpha = hasControlledSwitches ? alpha : 0;
  const alphaRad = (effAlpha * Math.PI) / 180;

  // Step resolution: 1200 points per cycle (16.67 microseconds per step at 50Hz)
  const STEPS_PER_CYCLE = 1200;
  const dt = T / STEPS_PER_CYCLE;

  // Calculate load time constant tau = L / R
  const tau = L / Math.max(0.01, R);
  // Ensure enough cycles to reach exact steady state (at least 5 time constants)
  const warmUpCycles = Math.max(8, Math.min(25, Math.ceil((5 * tau) / T) + 1));
  const TOTAL_CYCLES = warmUpCycles + 1;
  const TOTAL_STEPS = STEPS_PER_CYCLE * TOTAL_CYCLES;

  // State variable: load current i_o
  let current_io = 0;

  // Track steady-state samples
  let samplesAll: SimulationSample[] = [];
  let sourceCurrentSamples: number[] = [];

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
    let iSourceA = 0; // current drawn from Phase A

    if (phase === '1P') {
      vA = Vm_phase * Math.sin(omega * t);

      if (rectifier === 'HW') {
        // =========================================================================
        // --- 1-PHASE HALF-WAVE RECTIFIER ---
        // =========================================================================
        const sw = 'T1';
        const isSCR = isThyristor(sw);
        const inForwardHalf = vA > 0;

        // Gate pulse window for SCR (sharp trigger around alpha)
        const pulseWindow = isSCR && thetaRad >= alphaRad && thetaRad <= alphaRad + (3 * Math.PI) / 180;
        if (pulseWindow) isGatePulse = true;

        let swConducting = false;

        if (isSCR) {
          // SCR fires at alpha in forward half
          if (thetaRad >= alphaRad && thetaRad < Math.PI) {
            swConducting = true;
          } else if (thetaRad < alphaRad) {
            // Before alpha: if freewheeling diode exists, load current flows through FWD, not SCR
            if (!hasFWD && current_io > 1e-4 && L > 1e-6) {
              swConducting = true;
            }
          } else {
            // Past pi (vA < 0): continues conducting past pi only if L maintains current and NO FWD
            if (!hasFWD && current_io > 1e-4 && L > 1e-6) {
              swConducting = true;
            }
          }
        } else {
          // Uncontrolled Diode
          if (inForwardHalf) {
            swConducting = true;
          } else if (current_io > 1e-4 && !hasFWD && L > 1e-6) {
            swConducting = true;
          }
        }

        if (swConducting) {
          conductingSwitches.push(sw);
          vApplied = vA;
          iSourceA = current_io;
        } else {
          vApplied = 0;
          iSourceA = 0;
        }

        // Freewheeling Diode conduction:
        // When load current is flowing and main switch is NOT connecting source forward
        if (hasFWD && current_io > 1e-4 && !swConducting) {
          isFWDConducting = true;
          vApplied = 0;
          conductingSwitches = [];
          iSourceA = 0;
        }

      } else {
        // =========================================================================
        // --- 1-PHASE FULL-WAVE BRIDGE ---
        // =========================================================================
        // T1, T2: conduct for positive half (vA > 0)
        // T3, T4: conduct for negative half (vA < 0)
        const t1_scr = isThyristor('T1');
        const t2_scr = isThyristor('T2');
        const t3_scr = isThyristor('T3');
        const t4_scr = isThyristor('T4');

        const isPositiveControlled = t1_scr || t2_scr;
        const isNegativeControlled = t3_scr || t4_scr;

        const pulseWindow1 = isPositiveControlled && thetaRad >= alphaRad && thetaRad <= alphaRad + (3 * Math.PI) / 180;
        const pulseWindow2 = isNegativeControlled && thetaRad >= Math.PI + alphaRad && thetaRad <= Math.PI + alphaRad + (3 * Math.PI) / 180;
        if (pulseWindow1 || pulseWindow2) isGatePulse = true;

        // Symmetrical or asymmetrical semi-converter or explicit FWD
        const isSemi = (isPositiveControlled && (!t1_scr || !t2_scr)) || (isNegativeControlled && (!t3_scr || !t4_scr));
        const naturalFreewheel = isSemi || hasFWD;

        if (thetaRad >= 0 && thetaRad < Math.PI) {
          // Positive half-cycle [0, pi)
          const fired = !isPositiveControlled || thetaRad >= alphaRad;
          if (fired) {
            conductingSwitches.push('T1', 'T2');
            vApplied = vA;
            iSourceA = current_io;
          } else {
            // Before firing angle alpha in positive half:
            if (current_io > 1e-4 && L > 1e-6) {
              if (naturalFreewheel) {
                isFWDConducting = true;
                vApplied = 0;
                iSourceA = 0;
              } else {
                // Fully controlled bridge without freewheel: previous pair (T3, T4) continues carrying -vA (<0)
                conductingSwitches.push('T3', 'T4');
                vApplied = -vA;
                iSourceA = -current_io;
              }
            } else {
              vApplied = 0;
              iSourceA = 0;
            }
          }
        } else {
          // Negative half-cycle [pi, 2pi)
          const fired = !isNegativeControlled || thetaRad >= Math.PI + alphaRad;
          if (fired) {
            conductingSwitches.push('T3', 'T4');
            vApplied = -vA;
            iSourceA = -current_io;
          } else {
            // Before firing angle (pi + alpha) in negative half:
            if (current_io > 1e-4 && L > 1e-6) {
              if (naturalFreewheel) {
                isFWDConducting = true;
                vApplied = 0;
                iSourceA = 0;
              } else {
                // Fully controlled bridge continues carrying pair (T1, T2) with vA (<0)
                conductingSwitches.push('T1', 'T2');
                vApplied = vA;
                iSourceA = current_io;
              }
            } else {
              vApplied = 0;
              iSourceA = 0;
            }
          }
        }

        // Clamp negative excursions if FWD exists
        if (hasFWD && vApplied < 0 && current_io > 1e-4) {
          isFWDConducting = true;
          vApplied = 0;
          conductingSwitches = [];
          iSourceA = 0;
        }
      }

    } else {
      // =========================================================================
      // --- 3-PHASE RECTIFIERS ---
      // =========================================================================
      vA = Vm_phase * Math.sin(omega * t);
      vB = Vm_phase * Math.sin(omega * t - (2 * Math.PI) / 3);
      vC = Vm_phase * Math.sin(omega * t + (2 * Math.PI) / 3);

      if (rectifier === 'HW') {
        // --- 3-PHASE 3-PULSE HALF-WAVE ---
        // Natural crossover points at 30 deg, 150 deg, 270 deg
        const deg = thetaDeg;
        const fire1 = (30 + effAlpha) % 360;
        const fire2 = (150 + effAlpha) % 360;
        const fire3 = (270 + effAlpha) % 360;

        const pulse1 = isThyristor('T1') && Math.abs(deg - fire1) < 2.5;
        const pulse2 = isThyristor('T2') && Math.abs(deg - fire2) < 2.5;
        const pulse3 = isThyristor('T3') && Math.abs(deg - fire3) < 2.5;
        if (pulse1 || pulse2 || pulse3) isGatePulse = true;

        const delta = ((deg - (30 + effAlpha)) % 360 + 360) % 360;
        let chosenV = 0;
        let chosenSw = '';

        if (delta < 120) {
          chosenV = vA;
          chosenSw = 'T1';
          iSourceA = current_io;
        } else if (delta < 240) {
          chosenV = vB;
          chosenSw = 'T2';
          iSourceA = 0;
        } else {
          chosenV = vC;
          chosenSw = 'T3';
          iSourceA = 0;
        }

        // If chosen phase voltage drops below zero:
        if (chosenV < 0) {
          if (hasFWD && current_io > 1e-4) {
            isFWDConducting = true;
            chosenV = 0;
            chosenSw = '';
            iSourceA = 0;
          } else if (current_io <= 1e-4) {
            chosenV = 0;
            chosenSw = '';
            iSourceA = 0;
          }
        }

        if (chosenSw) conductingSwitches.push(chosenSw);
        vApplied = chosenV;

      } else {
        // --- 3-PHASE 6-PULSE FULL-WAVE BRIDGE ---
        // 6 switches: T1(A+), T3(B+), T5(C+), T4(A-), T6(B-), T2(C-)
        const t1_scr = isThyristor('T1');
        const t3_scr = isThyristor('T3');
        const t5_scr = isThyristor('T5');
        const t4_scr = isThyristor('T4');
        const t6_scr = isThyristor('T6');
        const t2_scr = isThyristor('T2');

        const isSemi3P = (t1_scr || t3_scr || t5_scr) && (!t4_scr && !t6_scr && !t2_scr);

        const deg = thetaDeg;
        const baseFire = 30 + effAlpha;
        const delta = ((deg - baseFire) % 360 + 360) % 360;
        const intIndex = Math.floor(delta / 60);

        let activePair: string[] = ['T1', 'T6'];
        let pairV = vA - vB;
        let scrInPairFired = false;

        if (isSemi3P) {
          // Semi-converter: Top thyristors fire with alpha delay, bottom diodes commutate naturally
          // Top switch active interval (120 deg each starting at 30+alpha, 150+alpha, 270+alpha):
          const topDelta = ((deg - (30 + effAlpha)) % 360 + 360) % 360;
          let topSw = 'T1';
          let vTop = vA;
          if (topDelta < 120) {
            topSw = 'T1';
            vTop = vA;
          } else if (topDelta < 240) {
            topSw = 'T3';
            vTop = vB;
          } else {
            topSw = 'T5';
            vTop = vC;
          }

          // Bottom diode active interval (natural crossover, most negative phase):
          // vB most negative from 330 to 90 -> T6
          // vC most negative from 90 to 210 -> T2
          // vA most negative from 210 to 330 -> T4
          const botDelta = ((deg - 330) % 360 + 360) % 360;
          let botSw = 'T6';
          let vBot = vB;
          if (botDelta < 120) {
            botSw = 'T6';
            vBot = vB;
          } else if (botDelta < 240) {
            botSw = 'T2';
            vBot = vC;
          } else {
            botSw = 'T4';
            vBot = vA;
          }

          activePair = [topSw, botSw];
          pairV = vTop - vBot;

          // Semi-converter inherent freewheeling: output voltage never drops below zero
          if (pairV < 0 || (topSw === 'T1' && botSw === 'T4') || (topSw === 'T3' && botSw === 'T6') || (topSw === 'T5' && botSw === 'T2')) {
            isFWDConducting = true;
            pairV = 0;
            activePair = [];
          }

          const degInTop = topDelta % 120;
          if (degInTop < 2.5) isGatePulse = true;

        } else {
          // Standard Fully Controlled or Uncontrolled Bridge
          switch (intIndex) {
            case 0:
              activePair = ['T1', 'T6'];
              pairV = vA - vB;
              scrInPairFired = t1_scr || t6_scr;
              break;
            case 1:
              activePair = ['T1', 'T2'];
              pairV = vA - vC;
              scrInPairFired = t1_scr || t2_scr;
              break;
            case 2:
              activePair = ['T3', 'T2'];
              pairV = vB - vC;
              scrInPairFired = t3_scr || t2_scr;
              break;
            case 3:
              activePair = ['T3', 'T4'];
              pairV = vB - vA;
              scrInPairFired = t3_scr || t4_scr;
              break;
            case 4:
              activePair = ['T5', 'T4'];
              pairV = vC - vA;
              scrInPairFired = t5_scr || t4_scr;
              break;
            case 5:
              activePair = ['T5', 'T6'];
              pairV = vC - vB;
              scrInPairFired = t5_scr || t6_scr;
              break;
          }

          const degInInterval = delta % 60;
          if (scrInPairFired && degInInterval < 2.5) isGatePulse = true;

          // Freewheeling clamp or zero current cutoff
          if (hasFWD && pairV < 0 && current_io > 1e-4) {
            isFWDConducting = true;
            pairV = 0;
            activePair = [];
          } else if (current_io <= 1e-4 && pairV < 0) {
            pairV = 0;
            activePair = [];
          }
        }

        conductingSwitches.push(...activePair);
        vApplied = pairV;

        // Phase A line current contribution:
        if (conductingSwitches.includes('T1')) iSourceA = current_io;
        else if (conductingSwitches.includes('T4')) iSourceA = -current_io;
        else iSourceA = 0;
      }
    }

    const effectiveVo = vApplied;

    // Numerical Runge-Kutta 4th Order (RK4) ODE Integration:
    // L * (di/dt) + R * i = Vo
    if (L <= 1e-6) {
      current_io = Math.max(0, effectiveVo / R);
    } else {
      const f = (iVal: number, vVal: number) => (vVal - R * iVal) / L;
      const k1 = f(current_io, effectiveVo);
      const k2 = f(Math.max(0, current_io + 0.5 * dt * k1), effectiveVo);
      const k3 = f(Math.max(0, current_io + 0.5 * dt * k2), effectiveVo);
      const k4 = f(Math.max(0, current_io + dt * k3), effectiveVo);
      let iNext = current_io + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      if (iNext < 1e-6) iNext = 0;
      current_io = iNext;
    }

    // Save sample if we are in the final cycle (exact steady state)
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
      sourceCurrentSamples.push(iSourceA);
    }
  }

  // Calculate Metrics from steady-state cycle
  const N = samplesAll.length;
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumP = 0;
  let sumIsSq = 0;
  let minIo = Infinity;
  let betaDeg: number | null = null;

  for (let i = 0; i < N; i++) {
    const s = samplesAll[i];
    sumVo += s.vOut;
    sumVoSq += s.vOut * s.vOut;
    sumIo += s.iOut;
    sumIoSq += s.iOut * s.iOut;
    sumP += s.vOut * s.iOut;
    sumIsSq += sourceCurrentSamples[i] * sourceCurrentSamples[i];

    if (s.iOut < minIo) minIo = s.iOut;

    // Detect extinction angle beta (where iOut extinguishes to zero)
    if (betaDeg === null) {
      const prev = samplesAll[(i - 1 + N) % N];
      if (prev.iOut > 1e-3 && s.iOut <= 1e-4) {
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

  // True AC input current RMS
  const IsourceRms = Math.sqrt(sumIsSq / N);
  const S_in = phase === '1P' ? sourceVrms * IsourceRms : Math.sqrt(3) * (Math.sqrt(3) * sourceVrms) * IsourceRms;
  const powerFactor = S_in > 0 ? Math.min(1, Math.max(0, Pac / S_in)) : 0;

  // DC current ripple factor (%)
  const thdCurrent = Idc > 0 ? Math.sqrt(Math.max(0, Math.pow(Irms / Idc, 2) - 1)) * 100 : 0;

  // Rigorous CCM/DCM criteria: CCM means current strictly never touches zero
  const isCCM = minIo > 1e-3;

  // Theoretical Closed-Form Textbook Formulas
  let theoreticalVdc = 0;
  let theoreticalFormula = '';

  const betaRad = betaDeg !== null ? (betaDeg * Math.PI) / 180 : Math.PI;

  if (phase === '1P') {
    if (rectifier === 'HW') {
      if (!hasControlledSwitches) {
        // 1-Phase HW Diode
        if (hasFWD || L <= 1e-6) {
          theoreticalVdc = Vm_phase / Math.PI;
          theoreticalFormula = 'Vdc = Vm / π';
        } else {
          theoreticalVdc = (Vm_phase / (2 * Math.PI)) * (1 - Math.cos(betaRad));
          theoreticalFormula = 'Vdc = (Vm / 2π) * (1 - cos β)';
        }
      } else {
        // 1-Phase HW Thyristor
        if (hasFWD || L <= 1e-6) {
          theoreticalVdc = (Vm_phase / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
          theoreticalFormula = 'Vdc = (Vm / 2π) * (1 + cos α)';
        } else {
          theoreticalVdc = (Vm_phase / (2 * Math.PI)) * (Math.cos(alphaRad) - Math.cos(betaRad));
          theoreticalFormula = 'Vdc = (Vm / 2π) * (cos α - cos β)';
        }
      }
    } else {
      // 1-Phase Full-Wave Bridge
      if (!hasControlledSwitches) {
        // Uncontrolled Diode Bridge
        theoreticalVdc = (2 * Vm_phase) / Math.PI;
        theoreticalFormula = 'Vdc = 2Vm / π';
      } else {
        const isSemi = (isThyristor('T1') !== isThyristor('T4')) || (isThyristor('T3') !== isThyristor('T2')) || hasFWD;
        if (isSemi) {
          // Semi-converter or fully controlled with FWD
          theoreticalVdc = (Vm_phase / Math.PI) * (1 + Math.cos(alphaRad));
          theoreticalFormula = 'Vdc = (Vm / π) * (1 + cos α)';
        } else {
          // Fully controlled bridge
          if (isCCM) {
            theoreticalVdc = ((2 * Vm_phase) / Math.PI) * Math.cos(alphaRad);
            theoreticalFormula = 'Vdc = (2Vm / π) * cos α';
          } else {
            theoreticalVdc = (Vm_phase / Math.PI) * (Math.cos(alphaRad) - Math.cos(betaRad));
            theoreticalFormula = 'Vdc = (Vm / π) * (cos α - cos β)';
          }
        }
      }
    }
  } else {
    // 3-Phase Converters
    if (rectifier === 'HW') {
      if (!hasControlledSwitches) {
        theoreticalVdc = (3 * Math.sqrt(3) * Vm_phase) / (2 * Math.PI);
        theoreticalFormula = 'Vdc = (3√3 Vm,ph / 2π)';
      } else {
        if (effAlpha <= 30 || (!hasFWD && isCCM)) {
          theoreticalVdc = ((3 * Math.sqrt(3) * Vm_phase) / (2 * Math.PI)) * Math.cos(alphaRad);
          theoreticalFormula = 'Vdc = (3√3 Vm,ph / 2π) * cos α';
        } else {
          theoreticalVdc = ((3 * Vm_phase) / (2 * Math.PI)) * (1 + Math.cos(alphaRad + Math.PI / 6));
          theoreticalFormula = 'Vdc = (3Vm,ph / 2π) * [1 + cos(α + 30°)]';
        }
      }
    } else {
      // 3-Phase Full-Wave 6-Pulse Bridge
      if (!hasControlledSwitches) {
        theoreticalVdc = (3 * Vm_line) / Math.PI;
        theoreticalFormula = 'Vdc = (3Vm,LL / π)';
      } else {
        const t1 = isThyristor('T1'), t3 = isThyristor('T3'), t5 = isThyristor('T5');
        const t4 = isThyristor('T4'), t6 = isThyristor('T6'), t2 = isThyristor('T2');
        const isSemi3P = (t1 || t3 || t5) && (!t4 && !t6 && !t2);

        if (isSemi3P) {
          theoreticalVdc = ((3 * Vm_line) / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
          theoreticalFormula = 'Vdc = (3Vm,LL / 2π) * (1 + cos α)';
        } else if (hasFWD && effAlpha >= 60) {
          theoreticalVdc = ((3 * Vm_line) / Math.PI) * (1 + Math.cos(alphaRad + Math.PI / 3));
          theoreticalFormula = 'Vdc = (3Vm,LL / π) * [1 + cos(α + 60°)]';
        } else {
          theoreticalVdc = ((3 * Vm_line) / Math.PI) * Math.cos(alphaRad);
          theoreticalFormula = 'Vdc = (3Vm,LL / π) * cos α';
        }
      }
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
    betaDeg: isCCM ? null : betaDeg,
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
