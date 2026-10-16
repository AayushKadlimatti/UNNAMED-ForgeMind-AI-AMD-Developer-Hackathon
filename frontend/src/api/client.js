import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

/**
 * Fetch rolling telemetry history for vibration and motor data
 * GET http://127.0.0.1:8000/api/telemetry/history
 * @param {string} machineId
 * @param {number} limit
 */
export const getTelemetryHistory = async (machineId = 'CONV-MTR-01', limit = 50) => {
  const response = await apiClient.get('/api/telemetry/history', {
    params: { machine_id: machineId, limit },
  });
  return response.data;
};

/**
 * Fetch active anomaly alerts for banner warnings
 * GET http://127.0.0.1:8000/api/alerts
 * @param {number} limit
 */
export const getAlerts = async (limit = 20) => {
  const response = await apiClient.get('/api/alerts', {
    params: { limit },
  });
  return response.data;
};

/**
 * Fetch latest root-cause diagnostic recommendations
 * GET http://127.0.0.1:8000/api/diagnostics/latest
 * @param {string} machineId
 */
export const getLatestDiagnostics = async (machineId = 'CONV-MTR-01') => {
  const response = await apiClient.get('/api/diagnostics/latest', {
    params: { machine_id: machineId },
  });
  return response.data;
};

/**
 * Switch scenario between "normal" and "abnormal"
 * POST http://127.0.0.1:8000/api/simulator/scenario
 * @param {'normal' | 'abnormal'} scenario
 */
export const triggerScenario = async (scenario = 'normal') => {
  const response = await apiClient.post('/api/simulator/scenario', {
    scenario,
  });
  return response.data;
};

export default {
  client: apiClient,
  getTelemetryHistory,
  getAlerts,
  getLatestDiagnostics,
  triggerScenario,
};
