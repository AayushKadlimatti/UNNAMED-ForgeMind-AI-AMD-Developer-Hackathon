/**
 * ResiliEdge Data Schema
 * All field mapping lives here in normalize(). When the real backend schema
 * arrives, only this file needs to change — components never touch raw data.
 */

/**
 * @typedef {Object} DSP
 * @property {number} bpfo_hz
 * @property {number} peak_amplitude
 * @property {number} confidence
 * @property {number} uncertainty
 * @property {Array<[number, number]>} spectrum - [[freq_hz, amplitude], ...]
 */

/**
 * @typedef {Object} Diagnosis
 * @property {string} fault_code
 * @property {string} component
 * @property {string} root_cause
 * @property {string} severity - 'healthy' | 'warning' | 'critical' | ''
 * @property {string} required_part
 * @property {boolean} human_escalation_required
 */

/**
 * @typedef {Object} Inference
 * @property {number} ttft_ms
 * @property {number} tokens_per_sec
 * @property {string} model
 * @property {string} backend
 */

/**
 * @typedef {Object} Inventory
 * @property {string} sku
 * @property {string} bay
 * @property {boolean} in_stock
 */

/**
 * @typedef {Object} WorkOrder
 * @property {string} id
 * @property {string} status - 'created' | 'dispatched' | 'in_progress' | 'completed' | ''
 * @property {string} evolus_run_id
 * @property {number} torque_nm
 * @property {string[]} loto_steps
 */

/**
 * @typedef {Object} PumpRecord
 * @property {string} pump_id
 * @property {string} ts
 * @property {DSP} dsp
 * @property {Diagnosis} diagnosis
 * @property {Inference} inference
 * @property {Inventory} inventory
 * @property {WorkOrder} work_order
 */

/**
 * @typedef {Object} PumpSummary
 * @property {string} pump_id
 * @property {string} status - 'healthy' | 'warning' | 'critical'
 * @property {number} peak_amplitude
 * @property {number[]} sparkline
 * @property {number} confidence
 * @property {boolean} has_work_order
 */

const DSP_DEFAULTS = {
  bpfo_hz: 0,
  peak_amplitude: 0,
  confidence: 0,
  uncertainty: 0,
  spectrum: [],
};

const DIAGNOSIS_DEFAULTS = {
  fault_code: '',
  component: '',
  root_cause: '',
  severity: '',
  required_part: '',
  human_escalation_required: false,
};

const INFERENCE_DEFAULTS = {
  ttft_ms: 0,
  tokens_per_sec: 0,
  model: '',
  backend: '',
};

const INVENTORY_DEFAULTS = {
  sku: '',
  bay: '',
  in_stock: false,
};

const WORK_ORDER_DEFAULTS = {
  id: '',
  status: '',
  evolus_run_id: '',
  torque_nm: 0,
  loto_steps: [],
};

/**
 * Normalise a raw API pump record into a clean PumpRecord.
 * Handles missing / null fields gracefully — always returns a complete object.
 * @param {Object|null} raw
 * @returns {PumpRecord}
 */
export function normalize(raw) {
  if (!raw) {
    return {
      pump_id: 'n/a',
      ts: new Date().toISOString(),
      dsp: { ...DSP_DEFAULTS },
      diagnosis: { ...DIAGNOSIS_DEFAULTS },
      inference: { ...INFERENCE_DEFAULTS },
      inventory: { ...INVENTORY_DEFAULTS },
      work_order: { ...WORK_ORDER_DEFAULTS },
    };
  }

  return {
    pump_id: raw.pump_id ?? 'n/a',
    ts: raw.ts ?? new Date().toISOString(),
    dsp: {
      bpfo_hz: raw.dsp?.bpfo_hz ?? DSP_DEFAULTS.bpfo_hz,
      peak_amplitude: raw.dsp?.peak_amplitude ?? DSP_DEFAULTS.peak_amplitude,
      confidence: raw.dsp?.confidence ?? DSP_DEFAULTS.confidence,
      uncertainty: raw.dsp?.uncertainty ?? DSP_DEFAULTS.uncertainty,
      spectrum: Array.isArray(raw.dsp?.spectrum) ? raw.dsp.spectrum : DSP_DEFAULTS.spectrum,
    },
    diagnosis: {
      fault_code: raw.diagnosis?.fault_code ?? DIAGNOSIS_DEFAULTS.fault_code,
      component: raw.diagnosis?.component ?? DIAGNOSIS_DEFAULTS.component,
      root_cause: raw.diagnosis?.root_cause ?? DIAGNOSIS_DEFAULTS.root_cause,
      severity: raw.diagnosis?.severity ?? DIAGNOSIS_DEFAULTS.severity,
      required_part: raw.diagnosis?.required_part ?? DIAGNOSIS_DEFAULTS.required_part,
      human_escalation_required: raw.diagnosis?.human_escalation_required ?? DIAGNOSIS_DEFAULTS.human_escalation_required,
    },
    inference: {
      ttft_ms: raw.inference?.ttft_ms ?? INFERENCE_DEFAULTS.ttft_ms,
      tokens_per_sec: raw.inference?.tokens_per_sec ?? INFERENCE_DEFAULTS.tokens_per_sec,
      model: raw.inference?.model ?? INFERENCE_DEFAULTS.model,
      backend: raw.inference?.backend ?? INFERENCE_DEFAULTS.backend,
    },
    inventory: {
      sku: raw.inventory?.sku ?? INVENTORY_DEFAULTS.sku,
      bay: raw.inventory?.bay ?? INVENTORY_DEFAULTS.bay,
      in_stock: raw.inventory?.in_stock ?? INVENTORY_DEFAULTS.in_stock,
    },
    work_order: {
      id: raw.work_order?.id ?? WORK_ORDER_DEFAULTS.id,
      status: raw.work_order?.status ?? WORK_ORDER_DEFAULTS.status,
      evolus_run_id: raw.work_order?.evolus_run_id ?? WORK_ORDER_DEFAULTS.evolus_run_id,
      torque_nm: raw.work_order?.torque_nm ?? WORK_ORDER_DEFAULTS.torque_nm,
      loto_steps: Array.isArray(raw.work_order?.loto_steps) ? raw.work_order.loto_steps : WORK_ORDER_DEFAULTS.loto_steps,
    },
  };
}

/**
 * Normalise a raw pump summary for the overview grid.
 * @param {Object|null} raw
 * @returns {PumpSummary}
 */
export function normalizeSummary(raw) {
  if (!raw) {
    return {
      pump_id: 'n/a',
      status: 'healthy',
      peak_amplitude: 0,
      sparkline: [],
      confidence: 0,
      has_work_order: false,
    };
  }
  return {
    pump_id: raw.pump_id ?? 'n/a',
    status: raw.status ?? 'healthy',
    peak_amplitude: raw.peak_amplitude ?? 0,
    sparkline: Array.isArray(raw.sparkline) ? raw.sparkline : [],
    confidence: raw.confidence ?? 0,
    has_work_order: raw.has_work_order ?? false,
  };
}
