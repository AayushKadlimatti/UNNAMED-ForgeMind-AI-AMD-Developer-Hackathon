import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { api } from '../api/connected';
import StatusSummary from './StatusSummary';
import TelemetryCard from './TelemetryCard';
import { fields } from './telemetry';
import IncidentCard from './IncidentCard';

export default function Dashboard({ data, user, tasks, tasksLoading, taskError, search, onSearch, onClearSearch, statusFilter, onStatusFilter, busy, action, navigate, onInvestigate, onAllAlerts }) {
  const reading = data?.status.latest_reading;
  const status = (reading?.health_status || '').toLowerCase();
  const visible = fields.filter(config => (!search || `${config.title} CONV-MTR-01 conveyor`.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || status === statusFilter));
  const alerts = (data?.alerts || []).filter(alert => alert.state === 'active' && (!search || `${alert.description} ${alert.machine_id}`.toLowerCase().includes(search.toLowerCase())));
  const canDispatch = user?.role === 'admin' && data?.diagnostic?.status === 'completed' && data.diagnostic.context_id === data?.status.context_id && !data.diagnostic.work_order_id;
  return <>
    <label className="master-inline-search"><Search size={17} /><input aria-label="Filter machine and incidents" placeholder="Search machine or incidents…" value={search} onChange={e => onSearch(e.target.value)} /></label>
    <StatusSummary status={status} hasReading={Boolean(reading)} maintenanceCount={user && !taskError && !tasksLoading ? new Set(tasks.filter(task => task.status !== 'Completed').map(task => task.machine_id)).size : null} selected={statusFilter} onSelect={key => key === 'maintenance' ? navigate('maintenance') : onStatusFilter(statusFilter === key ? 'all' : key)} />
    <section><div className="master-section-title"><div><h2>Machine Telemetry <span className="master-count">1 MACHINE</span></h2><p>Conveyor Motor 01 · Three sensor channels · Most recent {data?.history.length || 0} saved readings</p></div><button onClick={() => navigate('equipment')}>View machine <ArrowRight size={14} /></button></div>
      <div className="master-telemetry-grid">{visible.map((config, index) => <TelemetryCard key={config.field} config={config} reading={reading} history={data?.history || []} running={data?.status.is_running} index={index} onFullData={() => navigate('analytics')} />)}</div>
      {!visible.length && <div className="master-empty"><strong>No channels match this filter</strong><button className="master-text-button" onClick={() => { onStatusFilter('all'); onClearSearch(); }}>Clear filters</button></div>}
    </section>
    <section className="master-controls" aria-label="Synthetic scenario controls"><span className="master-controls-label">DEMO SCENARIO</span><div className="master-control-group">{['normal', 'warning', 'critical', 'recovery'].map(scenario => <button disabled={busy} aria-pressed={data?.status.scenario === scenario} key={scenario} onClick={() => action(() => api('/api/simulator/scenario', { method: 'POST', body: JSON.stringify({ scenario }) }), `Scenario changed to ${scenario}`)}>{scenario}</button>)}</div><span className="master-control-divider" /><button disabled={busy} onClick={() => action(() => api(`/api/simulator/${data?.status.is_running ? 'stop' : 'start'}`, { method: 'POST' }), 'Simulator updated')}>{data?.status.is_running ? 'Pause monitoring' : 'Start monitoring'}</button><button disabled={busy} onClick={() => action(() => api('/api/simulator/reset', { method: 'POST' }), 'Readings reset. Saved investigations and work orders are retained.')}>Reset readings</button><span className="master-controls-note">Software-generated readings</span></section>
    <section><div className="master-section-title"><div><h2>Active Incidents <span className="master-count">{data?.status.active_incidents || 0}</span></h2><p>Review alerts, investigate causes, and coordinate an inspection.</p></div><button onClick={onAllAlerts}>View all alerts <ArrowRight size={14} /></button></div><div className="master-incident-list">{alerts.map(alert => <IncidentCard key={alert.id} alert={alert} onInvestigate={onInvestigate} onDispatch={onInvestigate} canDispatch={canDispatch} canAcknowledge={Boolean(user)} busy={busy} onAcknowledge={() => action(() => api(`/api/alerts/${alert.id}/acknowledge`, { method: 'PATCH' }), 'Incident acknowledged. Recovery is determined by readings.')} />)}</div>
      {!alerts.length && <div className="master-empty"><strong>{search ? 'No incidents match your search' : 'No active incidents'}</strong>{search ? 'Try a machine ID or sensor term.' : 'New alerts appear here when a demo threshold is exceeded.'}</div>}
    </section>
    <div className="master-note"><ShieldCheck size={15} /><p>Thresholds are illustrative, not validated safety limits. Vibration is velocity RMS in mm/s. Diagnosis requests use AMD; maintenance actions require human approval.</p><button className="master-text-button" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }} onClick={onInvestigate}>Open investigation</button></div>
  </>;
}
