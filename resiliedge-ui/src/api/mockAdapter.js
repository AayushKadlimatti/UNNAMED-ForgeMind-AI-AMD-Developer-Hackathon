/**
 * Mock adapter — realistic industrial vibration data & scripted scenario.
 * All mock values are generated HERE, never hardcoded in components.
 */

import { normalize, normalizeSummary } from './schema.js';

// ── Constants ──────────────────────────────────────────────────────────────
const PUMP_IDS = Array.from({ length: 16 }, (_, i) => `P-${String(i + 1).padStart(2, '0')}`);
const BPFO_HZ = 142.4;
const ROTATION_HZ = 29.5;
const SPECTRUM_POINTS = 256;
const FREQ_MAX = 500;
const FREQ_STEP = FREQ_MAX / SPECTRUM_POINTS;

// ── Internal state ─────────────────────────────────────────────────────────
let pumps = {};
let scenarioState = null;
let eventLog = [];
let burstStarted = null;
let burstHistory = [];

// ── Deterministic-ish RNG (for reproducible spectra per-pump) ──────────────
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Spectrum generation ────────────────────────────────────────────────────
function generateSpectrum(bpfoAmplitude = 0.02, seed = 42) {
  const rng = mulberry32(seed);
  const noiseLevel = 0.03;
  const rotAmp = 0.12 + rng() * 0.06;
  const spectrum = [];

  for (let i = 0; i < SPECTRUM_POINTS; i++) {
    const freq = i * FREQ_STEP;
    let amp = rng() * noiseLevel;

    // Rotation harmonics (1×, 2×, 3×)
    if (Math.abs(freq - ROTATION_HZ) < FREQ_STEP) amp += rotAmp;
    if (Math.abs(freq - ROTATION_HZ * 2) < FREQ_STEP) amp += rotAmp * 0.55;
    if (Math.abs(freq - ROTATION_HZ * 3) < FREQ_STEP) amp += rotAmp * 0.25;

    // BPFO harmonics (1×, 2×, 3×)
    if (Math.abs(freq - BPFO_HZ) < FREQ_STEP) amp += bpfoAmplitude;
    if (Math.abs(freq - BPFO_HZ * 2) < FREQ_STEP) amp += bpfoAmplitude * 0.45;
    if (Math.abs(freq - BPFO_HZ * 3) < FREQ_STEP) amp += bpfoAmplitude * 0.2;

    spectrum.push([parseFloat(freq.toFixed(1)), parseFloat(amp.toFixed(4))]);
  }
  return spectrum;
}

// ── Confidence derived from spectrum peak-to-noise ratio ───────────────────
function computeMetrics(spectrum) {
  const bpfoIdx = Math.round(BPFO_HZ / FREQ_STEP);
  const peakAmp = spectrum[bpfoIdx]?.[1] ?? 0;

  // Noise floor: mean of bins away from known peaks
  const noiseBins = spectrum.filter(([f]) =>
    Math.abs(f - ROTATION_HZ) > FREQ_STEP * 3 &&
    Math.abs(f - ROTATION_HZ * 2) > FREQ_STEP * 3 &&
    Math.abs(f - BPFO_HZ) > FREQ_STEP * 3 &&
    Math.abs(f - BPFO_HZ * 2) > FREQ_STEP * 3
  );
  const noiseAvg = noiseBins.reduce((s, [, a]) => s + a, 0) / (noiseBins.length || 1);
  const snr = noiseAvg > 0 ? peakAmp / noiseAvg : 0;

  const confidence = Math.min(100, Math.max(0, (snr - 1) / 25 * 100));
  const uncertainty = Math.max(1.5, 18 - confidence * 0.16);

  return {
    peak_amplitude: parseFloat(peakAmp.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(1)),
    uncertainty: parseFloat(uncertainty.toFixed(1)),
  };
}

function statusFromConfidence(confidence) {
  if (confidence >= 60) return 'critical';
  if (confidence >= 25) return 'warning';
  return 'healthy';
}

// ── Initialise 16 pumps ────────────────────────────────────────────────────
function initPumps() {
  pumps = {};
  eventLog = [];
  PUMP_IDS.forEach((id, idx) => {
    const spectrum = generateSpectrum(0.015 + (idx % 3) * 0.003, idx * 1000 + 42);
    const metrics = computeMetrics(spectrum);
    pumps[id] = {
      pump_id: id,
      ts: new Date().toISOString(),
      status: 'healthy',
      sparkline: Array.from({ length: 20 }, (_, j) => {
        const rng = mulberry32(idx * 100 + j);
        return parseFloat((0.01 + rng() * 0.025).toFixed(4));
      }),
      dsp: { bpfo_hz: BPFO_HZ, ...metrics, spectrum },
      diagnosis: { fault_code: '', component: '', root_cause: '', severity: '', required_part: '', human_escalation_required: false },
      inference: { ttft_ms: 0, tokens_per_sec: 0, model: '', backend: '' },
      inventory: { sku: 'SKF-6204', bay: '', in_stock: false },
      work_order: { id: '', status: '', evolus_run_id: '', torque_nm: 45, loto_steps: [] },
    };
  });
}

initPumps();

// ── Scenario progression (called each poll) ────────────────────────────────
function updateScenario() {
  if (!scenarioState || scenarioState.completed) return;

  const elapsed = (Date.now() - scenarioState.startTime) / 1000;
  const pump = pumps[scenarioState.pumpId];
  if (!pump) return;

  pump.ts = new Date().toISOString();

  // Phase 1 (0–4 s): BPFO peak grows, confidence rises
  if (elapsed < 4) {
    const progress = elapsed / 4;
    const bpfoAmp = 0.02 + progress * 0.55;
    pump.dsp.spectrum = generateSpectrum(bpfoAmp, Math.floor(Date.now() / 500));
    const m = computeMetrics(pump.dsp.spectrum);
    Object.assign(pump.dsp, m);
    pump.sparkline = [...pump.sparkline.slice(1), m.peak_amplitude];
    pump.status = statusFromConfidence(m.confidence);

    if (elapsed > 1.5 && !scenarioState.anomalyLogged) {
      eventLog.push({
        ts: new Date().toISOString(),
        pump_id: pump.pump_id,
        event: 'anomaly',
        detail: `BPFO amplitude rising: ${m.peak_amplitude.toFixed(3)} g at ${BPFO_HZ} Hz`,
      });
      scenarioState.anomalyLogged = true;
    }
  }
  // Phase 2 (4–8 s): Diagnosis from LLM
  else if (elapsed < 8) {
    const bpfoAmp = 0.55 + (elapsed - 4) / 4 * 0.15;
    pump.dsp.spectrum = generateSpectrum(bpfoAmp, Math.floor(Date.now() / 500));
    const m = computeMetrics(pump.dsp.spectrum);
    Object.assign(pump.dsp, m);
    pump.sparkline = [...pump.sparkline.slice(1), m.peak_amplitude];
    pump.status = 'critical';

    if (elapsed > 5.5 && !pump.diagnosis.fault_code) {
      pump.inference = {
        ttft_ms: 185 + Math.round(Math.random() * 60),
        tokens_per_sec: 72 + Math.round(Math.random() * 25),
        model: 'Llama-3.1-70B',
        backend: 'AMD Instinct MI300X (ROCm)',
      };
      pump.diagnosis = {
        fault_code: 'E-402',
        component: 'Bearing cage – outer race',
        root_cause: `BPFO harmonic at ${BPFO_HZ} Hz with ${pump.dsp.confidence}% confidence indicates outer-race spalling consistent with fatigue wear.`,
        severity: 'critical',
        required_part: 'SKF-6204',
        human_escalation_required: true,
      };
      eventLog.push({
        ts: new Date().toISOString(),
        pump_id: pump.pump_id,
        event: 'diagnosis',
        detail: 'Fault E-402: Bearing cage degradation – severity CRITICAL',
      });
    }
  }
  // Phase 3 (8–11 s): Inventory lookup
  else if (elapsed < 11) {
    pump.dsp.spectrum = generateSpectrum(0.7, Math.floor(Date.now() / 500));
    const m = computeMetrics(pump.dsp.spectrum);
    Object.assign(pump.dsp, m);
    pump.sparkline = [...pump.sparkline.slice(1), m.peak_amplitude];

    if (elapsed > 9 && !pump.inventory.bay) {
      pump.inventory = { sku: 'SKF-6204', bay: 'Bay 4, Shelf 12', in_stock: true };
      eventLog.push({
        ts: new Date().toISOString(),
        pump_id: pump.pump_id,
        event: 'inventory',
        detail: 'SKF-6204 located: Bay 4, Shelf 12 – IN STOCK',
      });
    }
  }
  // Phase 4 (11–15 s): Work order created
  else if (elapsed < 15) {
    pump.dsp.spectrum = generateSpectrum(0.7, Math.floor(Date.now() / 500));
    const m = computeMetrics(pump.dsp.spectrum);
    Object.assign(pump.dsp, m);
    pump.sparkline = [...pump.sparkline.slice(1), m.peak_amplitude];

    if (elapsed > 12 && !pump.work_order.id) {
      pump.work_order = {
        id: 'WO-8941',
        status: 'created',
        evolus_run_id: 'EVOLUS-RUN-20261015-001',
        torque_nm: 45,
        loto_steps: [
          'Notify control room and obtain isolation permit',
          'Shut down pump P-07 via local HMI',
          'Close suction and discharge valves',
          'Apply lockout device to motor disconnect switch',
          'Verify zero energy state with multimeter',
          'Drain residual pressure from pump casing',
          'Replace bearing assembly SKF-6204',
          'Torque casing bolts to 45 Nm per OEM spec §5.3',
          'Remove lockout, restore power, test run for 5 min',
        ],
      };
      eventLog.push({
        ts: new Date().toISOString(),
        pump_id: pump.pump_id,
        event: 'work-order',
        detail: 'Work order WO-8941 created – Evolus run EVOLUS-RUN-20261015-001',
      });
    }
  }
  // Done
  else {
    scenarioState.completed = true;
  }
}

// ── Public adapter interface ───────────────────────────────────────────────

export function getPumps() {
  updateScenario();
  return PUMP_IDS.map((id, idx) => {
    const p = pumps[id];
    // Add subtle ambient sensor jitter to healthy pumps so the factory floor feels alive
    if (p.status === 'healthy' && (!scenarioState || scenarioState.pumpId !== id)) {
      const jitter = (Math.random() - 0.5) * 0.004;
      const newAmp = Math.max(0.008, Math.min(0.045, p.dsp.peak_amplitude + jitter));
      p.dsp.peak_amplitude = parseFloat(newAmp.toFixed(4));
      p.sparkline = [...p.sparkline.slice(1), p.dsp.peak_amplitude];
    }
    return normalizeSummary({
      pump_id: p.pump_id,
      status: p.status,
      peak_amplitude: p.dsp.peak_amplitude,
      sparkline: [...p.sparkline],
      confidence: p.dsp.confidence,
      has_work_order: !!p.work_order.id,
    });
  });
}

export function getPump(id) {
  updateScenario();
  const p = pumps[id];
  if (!p) return normalize(null);
  return normalize({ ...p });
}

export function subscribe(callback, intervalMs = 2000) {
  const handle = setInterval(() => callback(getPumps()), intervalMs);
  return () => clearInterval(handle);
}

export function getBurstStats() {
  if (!burstStarted) {
    burstStarted = Date.now();
    burstHistory = [];
  }
  const elapsed = (Date.now() - burstStarted) / 1000;
  const pumpStats = PUMP_IDS.map(id => {
    const tps = 65 + Math.random() * 30;
    return {
      pump_id: id,
      tokens_per_sec: parseFloat(tps.toFixed(1)),
      ttft_ms: Math.round(170 + Math.random() * 130),
      status: pumps[id]?.status ?? 'healthy',
    };
  });
  const aggregate = parseFloat(pumpStats.reduce((s, p) => s + p.tokens_per_sec, 0).toFixed(1));
  burstHistory.push({ time: parseFloat(elapsed.toFixed(1)), tokens_per_sec: aggregate });
  if (burstHistory.length > 60) burstHistory = burstHistory.slice(-60);

  return {
    pumps: pumpStats,
    aggregate_tokens_per_sec: aggregate,
    duration_s: parseFloat(elapsed.toFixed(1)),
    started_at: new Date(burstStarted).toISOString(),
    history: [...burstHistory],
  };
}

export function triggerScenario() {
  const targetPump = 'P-07';

  // Reset the target pump to healthy baseline
  const spectrum = generateSpectrum(0.02, Date.now());
  const m = computeMetrics(spectrum);
  pumps[targetPump] = {
    ...pumps[targetPump],
    status: 'healthy',
    dsp: { bpfo_hz: BPFO_HZ, ...m, spectrum },
    diagnosis: { fault_code: '', component: '', root_cause: '', severity: '', required_part: '', human_escalation_required: false },
    inference: { ttft_ms: 0, tokens_per_sec: 0, model: '', backend: '' },
    inventory: { sku: 'SKF-6204', bay: '', in_stock: false },
    work_order: { id: '', status: '', evolus_run_id: '', torque_nm: 45, loto_steps: [] },
  };

  scenarioState = { pumpId: targetPump, startTime: Date.now(), anomalyLogged: false, completed: false };

  eventLog.push({
    ts: new Date().toISOString(),
    pump_id: targetPump,
    event: 'scenario',
    detail: 'Demo scenario triggered – bearing fault injection on P-07',
  });

  return { pump_id: targetPump, message: 'Bearing fault scenario started on P-07' };
}

export function getTimeline() {
  return [...eventLog].reverse();
}

export const isMock = true;
