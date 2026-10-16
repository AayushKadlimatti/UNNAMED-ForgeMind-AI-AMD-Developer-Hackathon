import { useState, useEffect, useCallback } from 'react';
import {
  generateEquipment,
  generateAlerts,
  generateFleetSummary,
  generateHealthTrend,
  generatePredictions,
  generateMaintenanceSchedule,
  generateTimeSeries,
  generateCostData,
  generateEquipmentDetail,
} from '../data/mockData';

// Custom hook for mock data with auto-refresh
export function useMockData(generator, refreshInterval = null, ...args) {
  const [data, setData] = useState(() => generator(...args));
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    // Simulate API latency
    setTimeout(() => {
      setData(generator(...args));
      setLoading(false);
    }, 300);
  }, [generator, ...args]);

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  return { data, loading, refresh };
}

// Pre-configured hooks
export function useEquipment(count = 12) {
  return useMockData(generateEquipment, null, count);
}

export function useAlerts(count = 20) {
  return useMockData(generateAlerts, 30000, count);
}

export function useFleetSummary() {
  return useMockData(generateFleetSummary, 15000);
}

export function useHealthTrend(days = 30) {
  return useMockData(generateHealthTrend, null, days);
}

export function usePredictions() {
  return useMockData(generatePredictions, null);
}

export function useMaintenanceSchedule() {
  return useMockData(generateMaintenanceSchedule, null);
}

export function useTimeSeries(hours = 24, interval = 5) {
  return useMockData(generateTimeSeries, 10000, hours, interval);
}

export function useCostData(months = 12) {
  return useMockData(generateCostData, null, months);
}

export function useEquipmentDetail(id) {
  return useMockData(generateEquipmentDetail, null, id);
}
