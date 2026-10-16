import { useState, useEffect, useRef, useCallback } from 'react';

const MACHINE_ID = 'CONV-MTR-01';
const MAX_HISTORY_POINTS = 35;

export function useSimulatorWebSocket(machineId = MACHINE_ID) {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [simulatorState, setSimulatorState] = useState({
    is_running: true,
    scenario: 'normal',
    tick_count: 0,
  });
  const [latestAlert, setLatestAlert] = useState(null);
  const [latestDiagnostic, setLatestDiagnostic] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  const getWsUrl = useCallback(() => {
    // If running in browser, determine host and port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use relative path via Vite proxy, or direct backend on 8000
    const host = window.location.hostname;
    // Attempt standard proxy first
    if (window.location.port === '5173') {
      return `${protocol}//${window.location.host}/ws/machines/${machineId}`;
    }
    return `${protocol}//${host}:8000/ws/machines/${machineId}`;
  }, [machineId]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('CONNECTING');
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('CONNECTED');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = jsonParseSafe(event.data);
        if (!data) return;

        if (data.type === 'connection_established') {
          if (data.simulator_status) {
            setSimulatorState(data.simulator_status);
          }
          if (data.latest_reading) {
            setLatestTelemetry(data.latest_reading);
          }
          if (data.recent_history && Array.isArray(data.recent_history)) {
            setHistory(data.recent_history.slice(-MAX_HISTORY_POINTS));
          }
          if (data.latest_diagnostic) {
            setLatestDiagnostic(data.latest_diagnostic);
          }
        } else if (data.type === 'telemetry_update') {
          const tel = data.telemetry;
          if (tel) {
            setLatestTelemetry(tel);
            setHistory((prev) => {
              const updated = [...prev, tel];
              if (updated.length > MAX_HISTORY_POINTS) {
                return updated.slice(-MAX_HISTORY_POINTS);
              }
              return updated;
            });
          }
          if (data.simulator_status) {
            setSimulatorState(data.simulator_status);
          }
          if (data.new_alert) {
            setLatestAlert(data.new_alert);
          }
          if (data.new_diagnostic) {
            setLatestDiagnostic(data.new_diagnostic);
          }
        } else if (data.type === 'control_ack') {
          if (data.simulator_status) {
            setSimulatorState(data.simulator_status);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      setConnectionStatus('DISCONNECTED');
    };

    ws.onclose = () => {
      setConnectionStatus('DISCONNECTED');
      // Exponential backoff reconnection: 1s, 2s, 4s, capped at 10s
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 10000);
      reconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [getWsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // REST Control Actions with WebSocket command fallback
  const startSimulation = async () => {
    try {
      await fetch('/api/simulator/start', { method: 'POST' });
    } catch {
      // Send over WS fallback
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'start' }));
      }
    }
  };

  const stopSimulation = async () => {
    try {
      await fetch('/api/simulator/stop', { method: 'POST' });
    } catch {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'stop' }));
      }
    }
  };

  const setScenario = async (scenario) => {
    try {
      await fetch('/api/simulator/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
    } catch {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'set_scenario', scenario }));
      }
    }
  };

  const resetSimulation = async () => {
    try {
      await fetch('/api/simulator/reset', { method: 'POST' });
    } catch {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'reset' }));
      }
    }
  };

  return {
    connectionStatus,
    latestTelemetry,
    history,
    simulatorState,
    latestAlert,
    latestDiagnostic,
    startSimulation,
    stopSimulation,
    setScenario,
    resetSimulation,
  };
}

function jsonParseSafe(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
