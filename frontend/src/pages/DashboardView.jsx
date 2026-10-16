import { useState, useMemo, useEffect } from 'react';
import StatusBadges from '../components/StatusBadges';
import MachineTelemetryCard from '../components/MachineTelemetryCard';
import AnomalyAlertCard from '../components/AnomalyAlertCard';
import DiagnosticsModal from '../components/DiagnosticsModal';
import DiagnosticDrawer from '../components/DiagnosticDrawer';
import MotorToolbar from '../components/MotorToolbar';
import LiveTelemetryCharts from '../components/LiveTelemetryCharts';
import { useSimulatorWebSocket } from '../hooks/useSimulatorWebSocket';

export default function DashboardView({
  onNavigate,
  onSelectEquipment,
  telemetryHistory: propHistory,
  latestTelemetry: propLatestTelemetry,
  alerts: propAlerts,
  diagnosticData: propDiagnosticData,
  scenario: propScenario,
  onTriggerScenario,
  showToast: parentShowToast,
}) {
  const {
    connectionStatus,
    latestTelemetry: wsLatestTelemetry,
    history: wsHistory,
    simulatorState,
    latestAlert,
    latestDiagnostic,
    startSimulation,
    stopSimulation,
    setScenario,
    resetSimulation,
  } = useSimulatorWebSocket('CONV-MTR-01');

  // Prioritize active polled data from FastAPI backend routes
  const activeHistory = (propHistory && propHistory.length > 0) ? propHistory : wsHistory;
  const activeLatestTelemetry = propLatestTelemetry || wsLatestTelemetry;
  const activeSimulatorState = {
    ...simulatorState,
    scenario: propScenario || simulatorState?.scenario || 'normal',
  };

  const [activeFilter, setActiveFilter] = useState('all');
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [isDiagnosticDrawerOpen, setIsDiagnosticDrawerOpen] = useState(false);
  const [activeDiagnosticData, setActiveDiagnosticData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleScenarioChange = (sc) => {
    if (sc === 'normal') {
      setIsDiagnosticDrawerOpen(false);
    } else if (sc === 'critical' || sc === 'warning' || sc === 'abnormal') {
      setIsDiagnosticDrawerOpen(true);
    }
    if (onTriggerScenario) {
      onTriggerScenario(sc);
    } else {
      setScenario(sc);
    }
  };

  // Background machines fleet
  const [fleetMachines, setFleetMachines] = useState([
    {
      id: 'motor-a',
      name: 'Motor A - Head Pulley Drive',
      location: 'Production Line 1',
      status: 'healthy',
      current_value: '2.14 mm/s',
      max_24h: '3.10 mm/s',
      trend_percent: 0.4,
      lastUpdated: '1s ago',
      temperature: 63.8,
      vibration: 2.14,
      healthScore: 95,
    },
    {
      id: 'hydraulic-p',
      name: 'Hydraulic Press HP-3',
      location: 'Stamping Cell 2',
      status: 'healthy',
      current_value: '112 PSI',
      max_24h: '124 PSI',
      trend_percent: 0.3,
      lastUpdated: '3s ago',
      temperature: 58.1,
      vibration: 1.12,
      healthScore: 98,
    },
    {
      id: 'compressor-c1',
      name: 'Rotary Compressor C-1',
      location: 'Utility Yard',
      status: 'maintenance',
      current_value: 'Offline',
      max_24h: '105 PSI',
      trend_percent: 0.0,
      lastUpdated: '15m ago',
      temperature: 45.0,
      vibration: 0.1,
      healthScore: 75,
    },
    {
      id: 'robot-arm-4',
      name: 'Robotic Arm RA-04',
      location: 'Assembly Station 4',
      status: 'healthy',
      current_value: '99.2%',
      max_24h: '99.8%',
      trend_percent: 0.5,
      lastUpdated: '2s ago',
      temperature: 52.3,
      vibration: 0.94,
      healthScore: 96,
    },
    {
      id: 'pump-station-2',
      name: 'Coolant Pump CP-02',
      location: 'Machining Bay C',
      status: 'healthy',
      current_value: '1.45 mm/s',
      max_24h: '2.30 mm/s',
      trend_percent: 0.2,
      lastUpdated: '5s ago',
      temperature: 54.0,
      vibration: 1.45,
      healthScore: 92,
    },
  ]);

  // Live alerts list
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-initial-01',
      title: 'Conveyor Drive Motor - Baseline Verification Active',
      description:
        'Continuous simulated telemetry online. ISO 10816-3 Zone A vibration & Class F thermal limits monitored.',
      severity: 'info',
      timestamp: new Date().toISOString(),
      location: 'Conveyor Line 1, Main Drive Station',
      machine_id: 'CONV-MTR-01',
    },
  ]);

  // Sync incoming real-time alerts from props (FastAPI polling) or WebSocket
  useEffect(() => {
    if (propAlerts && propAlerts.length > 0) {
      setAlerts(propAlerts);
    }
  }, [propAlerts]);

  useEffect(() => {
    if (latestAlert) {
      setAlerts((prev) => {
        // Prevent duplicate alerts by ID
        if (prev.some((a) => a.id === latestAlert.id)) {
          return prev;
        }
        return [latestAlert, ...prev].slice(0, 10);
      });
      showToast(`🚨 New ${latestAlert.severity.toUpperCase()} Alert: ${latestAlert.title}`);
    }
  }, [latestAlert]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Conveyor Motor card representation updated from simulator telemetry
  const liveSimulatedMachine = useMemo(() => {
    const isCrit =
      activeLatestTelemetry?.health_status === 'CRITICAL' ||
      activeSimulatorState.scenario === 'abnormal' ||
      activeSimulatorState.scenario === 'critical';
    const isWarn = activeLatestTelemetry?.health_status === 'WARNING';
    const status = isCrit ? 'critical' : isWarn ? 'warning' : 'healthy';

    const temp = activeLatestTelemetry?.temperature ?? 65.0;
    const vib = activeLatestTelemetry?.vibration ?? 2.10;
    const curr = activeLatestTelemetry?.current ?? 15.20;

    return {
      id: 'CONV-MTR-01',
      name: 'Conveyor Motor (Live Simulator)',
      location: 'Production Line 1, Station 4',
      status,
      current_value: `${temp.toFixed(1)}°C | ${vib.toFixed(2)} mm/s`,
      max_24h: `${Math.max(temp * 1.04, 75).toFixed(1)}°C`,
      trend_percent: isCrit ? 14.8 : isWarn ? 5.2 : 0.6,
      activeTime: isCrit ? 'Active Now' : undefined,
      lastUpdated: 'Live Stream',
      temperature: temp,
      vibration: vib,
      current: curr,
      healthScore: isCrit ? 38 : isWarn ? 65 : 97,
    };
  }, [activeLatestTelemetry, activeSimulatorState.scenario]);

  // Combined machines array
  const allMachines = useMemo(() => {
    return [liveSimulatedMachine, ...fleetMachines];
  }, [liveSimulatedMachine, fleetMachines]);

  // Filtered machines
  const filteredMachines = useMemo(() => {
    if (activeFilter === 'all') return allMachines;
    return allMachines.filter((m) => m.status === activeFilter);
  }, [allMachines, activeFilter]);

  // Status badges count
  const statusCounts = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0, maintenance: 0 };
    allMachines.forEach((m) => {
      if (counts[m.status] !== undefined) {
        counts[m.status] += 1;
      }
    });
    // Add realistic plant background counts
    return {
      healthy: counts.healthy + 8,
      warning: counts.warning,
      critical: counts.critical,
      maintenance: counts.maintenance + 2,
    };
  }, [allMachines]);

  const handleOpenDiagnostics = () => {
    setIsDiagnosticDrawerOpen(true);
  };

  const handleApproveWorkOrder = () => {
    setIsDiagnosticDrawerOpen(false);
    setFleetMachines((prev) =>
      prev.map((m) =>
        m.id === 'motor-a' || m.id === 'CONV-MTR-01'
          ? {
              ...m,
              lastMaintenance: 'Work Order #WO-8941 Dispatched (Alex Rivera)',
            }
          : m
      )
    );
    const msg = '✅ Work Order #WO-8941 Dispatched to Floor Technician: Alex Rivera (History Updated)';
    if (parentShowToast) {
      parentShowToast(msg);
    } else {
      showToast(msg);
    }
  };

  const handleDispatchTechnician = (alertOrMachine) => {
    const msg = `✓ Work Order #WO-8941 Dispatched! Field technician notified for ${
      alertOrMachine.title || alertOrMachine.name
    }. Part SKF-6204 reserved.`;
    if (parentShowToast) parentShowToast(msg);
    else showToast(msg);
  };

  const handleCreateMaintenanceTask = (diagData) => {
    const msg = `✓ Maintenance Task created: ${diagData?.primaryHypothesis?.title || 'Inspection Work Order'}. Assigned to Mechanical Team.`;
    if (parentShowToast) parentShowToast(msg);
    else showToast(msg);
  };

  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    if (parentShowToast) parentShowToast('Alert acknowledged and dismissed.');
    else showToast('Alert acknowledged and dismissed.');
  };

  const handleScheduleMaintenance = (alert) => {
    const msg = `✓ Preventive work order scheduled for ${alert.title}. Added to maintenance queue.`;
    if (parentShowToast) parentShowToast(msg);
    else showToast(msg);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeInUp">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[110] bg-[#111827] border-2 border-[#06B6D4] text-[#F3F4F6] px-5 py-3 rounded-xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] flex items-center gap-3 animate-fadeInUp">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] pulse-dot-regular" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. COMPACT TOOLBAR ROW & KPI STRIP */}
      <MotorToolbar
        machineName="Conveyor Motor"
        machineId="CONV-MTR-01"
        isRunning={activeSimulatorState.is_running}
        currentScenario={activeSimulatorState.scenario}
        healthStatus={
          activeSimulatorState.scenario === 'critical' ||
          activeSimulatorState.scenario === 'warning' ||
          activeSimulatorState.scenario === 'abnormal'
            ? 'CRITICAL'
            : 'HEALTHY'
        }
        latestTelemetry={activeLatestTelemetry}
        history={activeHistory}
        onSetScenario={handleScenarioChange}
        onStart={startSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
        onOpenDrawer={() => setIsDiagnosticDrawerOpen(true)}
      />

      {/* 2. REAL-TIME MULTI-CHANNEL TELEMETRY CHARTS (Visible without scroll at 1080p) */}
      <LiveTelemetryCharts history={activeHistory} latest={activeLatestTelemetry} />

      {/* SLIDE-OVER AI DIAGNOSTIC DRAWER */}
      <DiagnosticDrawer
        isOpen={isDiagnosticDrawerOpen}
        onClose={() => setIsDiagnosticDrawerOpen(false)}
        machineId="CONV-MTR-01"
        severity={activeSimulatorState.scenario === 'warning' ? 'WARNING' : 'CRITICAL'}
        onApproveWorkOrder={handleApproveWorkOrder}
        empiricalData={activeLatestTelemetry}
      />

      {/* 3. STATUS BADGES SECTION */}
      <StatusBadges
        counts={statusCounts}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* 4. MACHINE TELEMETRY GRID SECTION */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#F3F4F6]">Machine Fleet Telemetry</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Live streaming from conveyor motor alongside plant assets
            </p>
          </div>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-[#06B6D4] hover:underline"
            >
              Reset filter ({activeFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.map((machine, idx) => (
            <MachineTelemetryCard
              key={machine.id}
              machine={machine}
              delay={`${300 + idx * 80}ms`}
              onOpenDiagnostics={handleOpenDiagnostics}
              onViewFullData={(m) => {
                if (onSelectEquipment) onSelectEquipment(m);
                else onNavigate?.('equipment');
              }}
            />
          ))}
        </div>
      </section>

      {/* 5. ANOMALY ALERTS FEED SECTION */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#F3F4F6]">Incident Feed & Real-Time Alerts</h3>
            <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
          <button
            onClick={() => onNavigate?.('alerts')}
            className="text-xs text-[#06B6D4] hover:underline font-semibold"
          >
            View Full Incident Audit Log →
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {alerts.map((alert, idx) => (
            <AnomalyAlertCard
              key={alert.id}
              alert={alert}
              delay={`${500 + idx * 80}ms`}
              onInvestigate={() => handleOpenDiagnostics(alert)}
              onDispatch={() => handleDispatchTechnician(alert)}
              onDismiss={() => handleDismissAlert(alert.id)}
              onSchedule={() => handleScheduleMaintenance(alert)}
            />
          ))}
          {alerts.length === 0 && (
            <div className="bg-[#111827] border border-[#374151] rounded-xl p-8 text-center text-[#9CA3AF]">
              ✓ No active incidents detected. All monitored drives within nominal operating thresholds.
            </div>
          )}
        </div>
      </section>

      {/* 6. DIAGNOSTICS MODAL */}
      <DiagnosticsModal
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        data={activeDiagnosticData}
        onCreateTask={handleCreateMaintenanceTask}
      />
    </div>
  );
}
