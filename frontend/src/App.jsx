import { useState, useCallback, useEffect } from 'react';
import { Sidebar, Header } from './components/Layout';
import DashboardView from './pages/DashboardView';
import EquipmentView from './pages/EquipmentView';
import EquipmentDetailView from './pages/EquipmentDetailView';
import PredictionsView from './pages/PredictionsView';
import AlertsView from './pages/AlertsView';
import MaintenanceView from './pages/MaintenanceView';
import AnalyticsView from './pages/AnalyticsView';
import AmdComputeHUD from './components/AmdComputeHUD';
import { Cpu } from 'lucide-react';
import {
  getTelemetryHistory,
  getAlerts,
  getLatestDiagnostics,
  triggerScenario,
} from './api/client';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sidebar collapse state persisted in localStorage wrapped in try/catch
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('resiliedge_sidebar_collapsed');
      if (saved !== null) return JSON.parse(saved);
      return typeof window !== 'undefined' && window.innerWidth < 1100;
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('resiliedge_sidebar_collapsed', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Auto-collapse sidebar below 1100px width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FastAPI Polling States
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [diagnostic, setDiagnostic] = useState(null);
  const [currentScenario, setCurrentScenario] = useState('normal');
  const [isApiConnected, setIsApiConnected] = useState(false);

  // RBAC Role State & Global Toast System
  const [userRole, setUserRole] = useState('ADMIN');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  }, []);

  const handleToggleRole = useCallback(() => {
    setUserRole((prev) => {
      const next = prev === 'ADMIN' ? 'TECH' : 'ADMIN';
      if (next === 'ADMIN') {
        showToast('Role switched to ADMIN: Full system access, work-order dispatch & parameter override permissions enabled.');
      } else {
        showToast('Role switched to TECH: Field diagnostics, task execution & inspection logging view enabled.');
      }
      return next;
    });
  }, [showToast]);

  // Poll FastAPI endpoints
  const fetchData = useCallback(async () => {
    try {
      // 1. GET http://127.0.0.1:8000/api/telemetry/history for vibration chart data
      const telRes = await getTelemetryHistory('CONV-MTR-01', 50);
      if (telRes && Array.isArray(telRes.history)) {
        setTelemetryHistory(telRes.history);
        if (telRes.history.length > 0) {
          const latest = telRes.history[telRes.history.length - 1];
          setLatestTelemetry(latest);
          if (latest.scenario) {
            setCurrentScenario(latest.scenario);
          }
        }
      }

      // 2. GET http://127.0.0.1:8000/api/alerts for active anomaly banners
      const alertRes = await getAlerts(20);
      if (alertRes && Array.isArray(alertRes.alerts)) {
        setAlerts(alertRes.alerts);
      }

      // 3. GET http://127.0.0.1:8000/api/diagnostics/latest for root-cause diagnostics tab
      const diagRes = await getLatestDiagnostics('CONV-MTR-01');
      if (diagRes && diagRes.diagnostic) {
        setDiagnostic(diagRes.diagnostic);
      }

      setIsApiConnected(true);
    } catch (err) {
      console.warn('FastAPI Polling (http://127.0.0.1:8000):', err.message);
      setIsApiConnected(false);
    }
  }, []);

  // Set up 1.5-second polling interval (useEffect + setInterval)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle scenario toggle ("normal", "warning", "critical", "recovery", "abnormal")
  const handleTriggerScenario = useCallback(
    async (scenario) => {
      try {
        setCurrentScenario(scenario);
        // POST http://127.0.0.1:8000/api/simulator/scenario
        await triggerScenario(scenario);
        // Immediate refresh so backend updates reflect on the charts immediately
        await fetchData();
      } catch (err) {
        console.error(`Failed to trigger ${scenario} scenario:`, err);
      }
    },
    [fetchData]
  );

  const handleNavigate = useCallback((view) => {
    setActiveView(view);
    setSelectedEquipment(null);
  }, []);

  const handleSelectEquipment = useCallback((equipment) => {
    setSelectedEquipment(equipment);
    setActiveView('equipment-detail');
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedEquipment(null);
    setActiveView('equipment');
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    fetchData();
  }, [fetchData]);

  const renderView = () => {
    if (activeView === 'equipment-detail' && selectedEquipment) {
      return (
        <EquipmentDetailView
          key={`detail-${selectedEquipment.id}-${refreshKey}`}
          equipmentId={selectedEquipment.id}
          onBack={handleBackFromDetail}
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6">
            <DashboardView
              key={`dashboard-${refreshKey}`}
              onNavigate={handleNavigate}
              onSelectEquipment={handleSelectEquipment}
              telemetryHistory={telemetryHistory}
              latestTelemetry={latestTelemetry}
              alerts={alerts}
              diagnosticData={diagnostic}
              scenario={currentScenario}
              onTriggerScenario={handleTriggerScenario}
              showToast={showToast}
            />
            {/* Integrated Inference Acceleration HUD Section */}
            <section className="flex flex-col gap-2.5 pt-2 border-t border-[#2E3846]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F9FAFB] flex items-center gap-2">
                    <Cpu size={16} className="text-[#06B6D4]" />
                    <span>Inference Diagnostics Acceleration Hub</span>
                  </h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    Continuous batching telemetry diagnostics engine powering automated remediation
                  </p>
                </div>
                <button
                  onClick={() => handleNavigate('amd-compute')}
                  className="text-xs text-[#06B6D4] hover:underline font-semibold"
                >
                  Full Compute Monitor →
                </button>
              </div>
              <AmdComputeHUD />
            </section>
          </div>
        );
      case 'amd-compute':
        return (
          <div className="flex flex-col gap-5 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F9FAFB] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-mono">
                    TokenFactory
                  </span>
                  <span>Continuous Batching Inference Engine</span>
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Real-time telemetry inference engine for industrial fault prediction
                </p>
              </div>
            </div>
            <AmdComputeHUD />
          </div>
        );
      case 'equipment':
        return <EquipmentView key={`equipment-${refreshKey}`} onSelectEquipment={handleSelectEquipment} />;
      case 'predictions':
        return (
          <PredictionsView
            key={`predictions-${refreshKey}`}
            diagnosticData={diagnostic}
          />
        );
      case 'alerts':
        return (
          <AlertsView
            key={`alerts-${refreshKey}`}
            alerts={alerts}
          />
        );
      case 'maintenance':
        return <MaintenanceView key={`maintenance-${refreshKey}`} />;
      case 'analytics':
        return <AnalyticsView key={`analytics-${refreshKey}`} />;
      default:
        return (
          <DashboardView
            key={`dashboard-${refreshKey}`}
            onNavigate={handleNavigate}
            onSelectEquipment={handleSelectEquipment}
            telemetryHistory={telemetryHistory}
            latestTelemetry={latestTelemetry}
            alerts={alerts}
            diagnosticData={diagnostic}
            scenario={currentScenario}
            onTriggerScenario={handleTriggerScenario}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] relative">
      {/* Global Interactive RBAC & Work-Order Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-[120] max-w-md bg-[#11161D] border-2 border-[#00F0FF]/60 text-[#F9FAFB] rounded-xl p-4 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex items-start gap-3 animate-fadeIn backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] mt-1 shrink-0 pulse-dot-regular shadow-[0_0_8px_#00F0FF]" />
          <div className="flex-1 text-xs leading-relaxed font-mono font-medium text-[#E5E7EB]">
            {toastMessage}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] text-base leading-none ml-1 shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <Sidebar
        activeView={activeView === 'equipment-detail' ? 'equipment' : activeView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        alertsCount={alerts.length}
      />

      <div
        className={`transition-all duration-200 min-h-screen flex flex-col ${
          sidebarCollapsed ? 'ml-16' : 'ml-[220px]'
        }`}
      >
        <Header
          onRefresh={handleRefresh}
          alertsCount={alerts.length}
          userRole={userRole}
          onToggleRole={handleToggleRole}
          isSimulated={true}
          debugInfo={{
            wsStatus: isApiConnected ? 'ONLINE (127.0.0.1:8000)' : 'RECONNECTING',
            tickCount: telemetryHistory.length,
            scenario: currentScenario,
          }}
        />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {renderView()}
        </main>

        {/* ResiliEdge Industrial Footer */}
        <footer className="px-6 py-4 border-t border-[#2E3846] bg-[#111827] mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9CA3AF]">
            <div className="flex items-center gap-2.5">
              <span className="font-bold tracking-tight text-[#06B6D4]">ResiliEdge</span>
              <span>·</span>
              <span className="text-[#F9FAFB] font-medium">Operational continuity agent</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-[4px] bg-[#1F2937] border border-[#2E3846] text-[#9CA3AF]">
                SIMULATED TELEMETRY
              </span>
              <span>·</span>
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  currentScenario === 'abnormal' || currentScenario === 'critical'
                    ? 'text-[#EF4444]'
                    : currentScenario === 'warning'
                    ? 'text-[#F59E0B]'
                    : 'text-[#10B981]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentScenario === 'abnormal' || currentScenario === 'critical'
                      ? 'bg-[#EF4444] pulse-dot-critical'
                      : currentScenario === 'warning'
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#10B981] pulse-dot-regular'
                  }`}
                />
                {currentScenario === 'abnormal' || currentScenario === 'critical'
                  ? 'Fault Injected'
                  : currentScenario === 'warning'
                  ? 'Warning State'
                  : 'All Systems Nominal'}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
