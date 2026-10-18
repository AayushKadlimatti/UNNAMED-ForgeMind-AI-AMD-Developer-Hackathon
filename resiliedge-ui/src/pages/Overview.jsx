import { useState } from 'react';
import { usePumpList } from '../hooks/usePump.js';
import { triggerScenario } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import KpiTile from '../components/KpiTile.jsx';
import PumpTile from '../components/PumpTile.jsx';

export default function Overview() {
  const { pumps, loading, error } = usePumpList();
  const addToast = useToast();
  const [scenarioRunning, setScenarioRunning] = useState(false);

  const handleScenario = async () => {
    try {
      setScenarioRunning(true);
      const result = await Promise.resolve(triggerScenario());
      addToast(`${result.message || 'Scenario started'} — open P-07 to watch the 5-stage triage pipeline!`, 'info', 8000);
      setTimeout(() => {
        setScenarioRunning(false);
      }, 16000);
    } catch (err) {
      addToast(err.message || 'Failed to trigger scenario', 'error');
      setScenarioRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="loading-spinner" />
          Loading telemetry…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">Error: {error}</div>
      </div>
    );
  }

  const healthy = pumps.filter(p => p.status === 'healthy').length;
  const warning = pumps.filter(p => p.status === 'warning').length;
  const critical = pumps.filter(p => p.status === 'critical').length;
  const openWO = pumps.filter(p => p.has_work_order).length;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Plant Overview
        </h2>
        <button className="btn btn-primary" onClick={handleScenario} disabled={scenarioRunning}>
          {scenarioRunning ? 'Scenario running…' : '▶ Run demo scenario'}
        </button>
      </div>

      <div className="kpi-row">
        <KpiTile label="Pumps Monitored" value={pumps.length} />
        <KpiTile label="Healthy" value={healthy} color="healthy" />
        <KpiTile label="Warning" value={warning} color="warning" />
        <KpiTile label="Critical" value={critical} color="critical" />
        <KpiTile label="Open Work Orders" value={openWO} />
      </div>

      <div className="grid-4">
        {pumps.map(p => (
          <PumpTile key={p.pump_id} pump={p} />
        ))}
      </div>
    </div>
  );
}
