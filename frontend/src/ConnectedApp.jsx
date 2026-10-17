import { useCallback, useEffect, useState } from 'react';
import ConsoleShell from './master/ConsoleShell';
import MasterDashboard from './master/Dashboard';
import DiagnosticsModal from './master/DiagnosticsModal';
import IncidentCard from './master/IncidentCard';
import { Download, RefreshCw } from 'lucide-react';
import KnowledgePanel from './components/KnowledgePanel';
import { api, setToken } from './api/connected';

const titles = { dashboard: 'Dashboard', equipment: 'Connected machine', predictions: 'AI diagnosis', 'amd-compute': 'Measured inference', maintenance: 'Maintenance work orders', alerts: 'Incident history', analytics: 'Telemetry report', settings: 'Demo access' };
const button = 'master-button master-secondary';
const panel = 'p-6 rounded-xl border border-[#374151] bg-[#111827] space-y-5';
const input = 'master-input';

export default function ConnectedApp() {
  const [view, setView] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [credential, setCredential] = useState('');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskError, setTaskError] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [assignmentEdits, setAssignmentEdits] = useState({});
  const [taskFilter, setTaskFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('active');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [priority, setPriority] = useState('HIGH');
  const [audit, setAudit] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [taskTitle, setTaskTitle] = useState('Review conveyor anomaly and plan a qualified inspection');

  const refresh = useCallback(async () => {
    try {
      const [telemetry, status, alerts, diagnosis, history] = await Promise.all([
        api('/api/telemetry/history'), api('/api/simulator/status'), api('/api/alerts'), api('/api/diagnostics/latest'), api('/api/diagnostics/history'),
      ]);
      setData({ history: telemetry.history, status, alerts: alerts.alerts, diagnostic: diagnosis.diagnostic, diagnoses: history });
      setError('');
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => {
    let active = true;
    let timer;
    async function poll() {
      await refresh();
      if (active) timer = setTimeout(poll, 2000);
    }
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [refresh]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try { setTasks(await api('/api/v1/tasks?machine_id=CONV-MTR-01')); setTaskError(''); }
    catch (err) { setTaskError(err.message); }
    finally { setTasksLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    api('/api/session').then(current => {
      if (active) { setUser(current); loadTasks(); }
    }).catch(() => {});
    return () => { active = false; };
  }, [loadTasks]);

  useEffect(() => {
    const expire = () => { setUser(null); setTasks([]); setToken(''); };
    window.addEventListener('forgemind-session-expired', expire);
    return () => window.removeEventListener('forgemind-session-expired', expire);
  }, []);

  function navigate(next) {
    setView(next);
    if (user && next === 'maintenance') loadTasks();
  }

  async function action(fn, message) {
    setBusy(true); setNotice('');
    try { await fn(); setNotice(message); await refresh(); }
    catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }
  const reading = data?.status.latest_reading;
  const diagnosis = selectedDiagnosis ? data?.diagnoses.find(item => item.id === selectedDiagnosis) || data?.diagnostic : data?.diagnostic;
  const admin = user?.role === 'admin';
  const completed = diagnosis?.status === 'completed';
  const metrics = diagnosis?.inference;
  const stale = diagnosis && diagnosis.context_id !== data?.status.context_id;

  function inference() {
    return <section className={panel}>
      <h2 className="font-semibold text-lg">AMD TokenFactory request metrics</h2>
      {!metrics ? <p className="text-gray-400">No completed AMD request yet. Metrics appear after a successful diagnosis.</p> : <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {Object.entries({ Model: metrics.model, 'Request duration': `${metrics.request_latency_s} s`, 'Completion tokens': metrics.completion_tokens ?? 'Unavailable', 'End-to-end rate': metrics.end_to_end_tokens_per_sec == null ? 'Unavailable' : `${metrics.end_to_end_tokens_per_sec} tokens/s`, Hardware: metrics.hardware || 'Not reported by provider', 'Measured at': diagnosis.completed_at }).map(([label, value]) => <div key={label}><dt className="text-gray-400">{label}</dt><dd className="mt-1 break-words font-mono">{value}</dd></div>)}
      </dl>}
      <p className="text-xs text-gray-400">Rate includes request waiting and network time. GPU utilization, memory use, decoding-only speed, and 16-request throughput have not been measured.</p>
    </section>;
  }

  function diagnosticPanel() {
    return <section className={panel}>
      <div className="flex flex-wrap justify-between items-center gap-3"><h2 className="font-semibold text-lg">AI-assisted investigation</h2>
        <button className={button} disabled={busy || !admin || data?.diagnostic?.status === 'pending' || (data?.status.retry_after_s || 0) > 0 || reading?.health_status === 'HEALTHY' || !data?.status.is_running} onClick={() => action(async () => { setSelectedDiagnosis(null); return api('/api/diagnostics/request', { method: 'POST' }); }, 'Diagnosis requested. Telemetry continues while AMD responds.')}> {data?.diagnostic?.status === 'pending' ? 'Waiting for AMD…' : (data?.status.retry_after_s || 0) > 0 ? `Retry available in ${data.status.retry_after_s}s` : diagnosis?.status === 'unavailable' ? 'Retry AMD diagnosis' : 'Request AMD diagnosis'}</button></div>
      {!admin && <p className="text-sm text-[#F59E0B]">Connect an administrator demo token in Settings to request a diagnosis or approve a work order.</p>}
      {data?.diagnoses.length > 0 && <label className="block text-sm">Investigation history<select className={input} value={selectedDiagnosis || ''} onChange={e => setSelectedDiagnosis(e.target.value || null)}><option value="">Latest investigation</option>{data.diagnoses.map(item => <option key={item.id} value={item.id}>{new Date(item.timestamp).toLocaleString()} · {item.status}</option>)}</select></label>}
      {!diagnosis && <p className="text-gray-400">No diagnosis requested. Select an abnormal scenario, then request analysis.</p>}
      {diagnosis && <><p className="text-sm">Status: <strong>{diagnosis.status}</strong> · Recorded {new Date(diagnosis.timestamp).toLocaleString()}</p>
        {stale && <p className="text-[#F59E0B] text-sm">Historical investigation: the monitoring context has changed. Review its saved sensor snapshot before acting.</p>}
        {diagnosis.message && <p role="status" className="text-[#F3F4F6]">{diagnosis.message}</p>}
        {completed && <>
          <div className="master-confidence"><span>Diagnostic confidence</span><strong>Not calibrated · human review required</strong></div>
          <p className="master-hypothesis">{diagnosis.primaryHypothesis?.description}</p>
          <h3 className="font-semibold">Possible causes</h3><ul className="master-cause-grid">{diagnosis.alternatives.map((cause, i) => <li key={i}>{cause.title}</li>)}</ul>
          <h3 className="font-semibold">Suggested inspections for qualified review</h3><ul className="master-steps">{diagnosis.remediationSteps.map((step, i) => <li key={i}>{step}</li>)}</ul>
          <p className="text-[#F59E0B] text-sm">Unvalidated suggestions, not approved repair instructions. Human review is required. Reference excerpts are user-supplied and not independently verified.</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-400">{diagnosis.limitations?.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <p className="text-xs text-gray-400">Trend readings supplied: {diagnosis.trend_readings || 0} · Matching reference excerpts: {diagnosis.references?.length || 0}</p>
          {diagnosis.references?.map(ref => <details key={ref.excerpt_id}><summary className="text-sm text-[#06B6D4] cursor-pointer">Reference: {ref.title}</summary><p className="text-xs text-gray-400">{ref.source} · User-supplied</p><p className="text-sm whitespace-pre-wrap mt-2">{ref.excerpt}</p></details>)}
          {diagnosis.work_order_id ? <div className="space-y-2 border-t border-[#374151] pt-4"><p className="text-sm break-all">Saved work order: {diagnosis.work_order_id}</p><button className={button} onClick={() => navigate('maintenance')}>Open maintenance</button></div> : <form data-task-form className="space-y-3 border-t border-[#374151] pt-4" onSubmit={e => { e.preventDefault(); action(async () => { const task = await api(`/api/diagnostics/${diagnosis.id}/work-order`, { method: 'POST', body: JSON.stringify({ title: taskTitle, assigned_to: assignee, priority }) }); await loadTasks(); setDiagnosticOpen(false); setView('maintenance'); return task; }, 'Inspection work order saved. Repeated approval reuses the same order.'); }}>
            <h3 className="font-semibold">Approve an inspection work order</h3>
            <label className="block text-sm">Task title<input className={input} value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required minLength={1} maxLength={300} /></label>
            <label className="block text-sm">Assign to<input className={input} value={assignee} onChange={e => setAssignee(e.target.value)} required minLength={1} maxLength={100} /></label>
            <label className="block text-sm">Priority<select className={input} value={priority} onChange={e => setPriority(e.target.value)}>{['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map(value => <option key={value}>{value}</option>)}</select></label>
            <button className={button} disabled={!admin || busy || !assignee.trim() || !taskTitle.trim()}>Approve and save work order</button>
          </form>}
        </>}
      </>}
    </section>;
  }

  function maintenance() {
    return <section className={panel}><h2 className="font-semibold text-lg">Saved inspection work orders</h2>
      {!user ? <p>Connect your demo token in Settings to load work orders.</p> : <>
        <div className="flex flex-wrap gap-3"><button className={button} disabled={tasksLoading} onClick={loadTasks}>{tasksLoading ? 'Loading work orders…' : 'Refresh work orders'}</button><label className="text-sm">Filter by status<select className={input} value={taskFilter} onChange={e => setTaskFilter(e.target.value)}>{['all', 'Pending', 'In Progress', 'Completed'].map(value => <option key={value}>{value}</option>)}</select></label></div>
        {taskError && <p role="alert" className="text-[#EF4444]">{taskError}</p>}
        {!tasksLoading && !taskError && tasks.length === 0 && <p className="text-gray-400">No work orders yet. Review a completed diagnosis and approve an inspection task.</p>}
        {!tasksLoading && tasks.length > 0 && !tasks.some(task => taskFilter === 'all' || task.status === taskFilter) && <p>No work orders match this status.</p>}
        {tasks.filter(task => taskFilter === 'all' || task.status === taskFilter).map(task => <article className="p-4 border border-[#374151] rounded-md space-y-2" key={task.id}><h3 className="font-semibold">{task.title}</h3><p className="text-sm text-[#F3F4F6]">{task.machine_id} · {task.assigned_to} · {task.priority} · {task.status}</p><p className="text-xs font-mono text-gray-400 break-all">{task.id}</p>
          {task.status !== 'Completed' && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); action(async () => { await api(`/api/v1/tasks/${task.id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to: assignmentEdits[task.id] || task.assigned_to }) }); await loadTasks(); }, 'Assignment saved.'); }}><label className="text-sm">Assigned technician<input className={input} value={assignmentEdits[task.id] ?? task.assigned_to} onChange={e => setAssignmentEdits({ ...assignmentEdits, [task.id]: e.target.value })} required maxLength={100} /></label><button className={button} disabled={busy || !(assignmentEdits[task.id] ?? task.assigned_to).trim()}>Save assignment</button></form>}
          {task.status !== 'Completed' && <button className={button} disabled={busy} onClick={() => action(async () => { await api(`/api/v1/tasks/${task.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'Pending' ? 'In Progress' : 'Completed' }) }); await loadTasks(); }, 'Work order updated.')}>{task.status === 'Pending' ? 'Start inspection' : 'Mark completed'}</button>}
        </article>)}
      </>}
    </section>;
  }

  function downloadReport() {
    const rows = [['timestamp', 'machine_id', 'temperature_c', 'vibration_mm_s_rms', 'current_a', 'health_status', 'data_source'],
      ...(data?.history || []).map(row => [row.timestamp, row.machine_id, row.temperature, row.vibration, row.current, row.health_status, 'synthetic'])];
    const csv = rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'forgemind-synthetic-telemetry.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function content() {
    if (view === 'settings') return <section className={panel}><h2 className="text-lg font-semibold">Connect a demo role</h2><p className="text-sm text-gray-400">Use FORGEMIND_ADMIN_TOKEN or FORGEMIND_TECHNICIAN_TOKEN from the local integration .env. This is a demo access token, never your AMD API key. Your session survives refresh for up to eight hours on this local app. Sign out on shared computers.</p>
      <form className="space-y-3" onSubmit={async e => { e.preventDefault(); setToken(credential); setBusy(true); try { const current = await api('/api/session', { method: 'POST' }); setToken(''); setUser(current); await loadTasks(); setCredential(''); setNotice(`Connected as ${current.role}`); } catch (err) { setToken(''); setUser(null); setNotice(err.message); } finally { setBusy(false); } }}><label className="block">Demo access token<input type="password" autoComplete="off" className={input} value={credential} onChange={e => setCredential(e.target.value)} required /></label><button className={button} disabled={busy}>Connect</button></form>
      {admin && <details><summary className="cursor-pointer text-[#06B6D4]" onClick={() => action(async () => { setAudit(await api('/api/v1/admin/audit-logs?limit=100')); }, 'Audit log loaded')}>View audit log</summary>{audit?.slice().reverse().map(log => <article className="py-2 border-b border-[#374151] text-xs" key={log.id}><p>{new Date(log.timestamp).toLocaleString()} · {log.username} · {log.action}</p><pre className="whitespace-pre-wrap break-all text-gray-400">{log.details}</pre></article>)}</details>}
      {user && <button className={button} onClick={() => action(async () => { await api('/api/session', { method: 'DELETE' }); setToken(''); setUser(null); setTasks([]); }, 'Disconnected')}>Disconnect {user.role}</button>}
    </section>;
    if (view === 'maintenance') return maintenance();
    if (view === 'equipment') return <section className={panel}>
      <h2 className="text-lg font-semibold">Conveyor Motor 01</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {Object.entries({ 'Machine ID': 'CONV-MTR-01', 'Data source': 'Software-generated synthetic readings', 'Monitoring': data?.status.is_running ? 'Running' : 'Paused', 'Latest detector state': reading?.health_status || 'Unavailable', 'Scenario': data?.status.scenario, 'Last observed': reading ? new Date(reading.timestamp).toLocaleString() : 'Unavailable', 'Vibration unit': 'Velocity RMS, mm/s', 'Open incidents': data?.status.active_incidents ?? 0 }).map(([key, value]) => <div key={key}><dt className="text-gray-400">{key}</dt><dd className="mt-1">{value}</dd></div>)}
      </dl>
      <p className="text-sm text-gray-400">This machine uses an illustrative velocity-based threshold profile. No physical machine, calibrated baseline, remaining-life estimate, or validated failure probability is connected.</p>
      <div className="flex flex-wrap gap-3"><button className={button} onClick={() => navigate('dashboard')}>Open monitoring</button><button className={button} onClick={() => navigate('predictions')}>Open investigations</button><button className={button} onClick={() => navigate('maintenance')}>Open work orders</button></div>
    </section>;
    if (view === 'amd-compute') return inference();
    if (view === 'predictions') return <>{diagnosticPanel()}<KnowledgePanel user={user} /></>;
    if (view === 'alerts') return <section className={panel}><div className="master-section-title"><div><h2>Incident history</h2><p>Saved alerts, acknowledgements, and recoveries for Conveyor Motor 01.</p></div><label className="text-sm">Show incidents<select className={input} value={alertFilter} onChange={e => setAlertFilter(e.target.value)}>{['active', 'resolved', 'all'].map(value => <option key={value}>{value}</option>)}</select></label></div><div className="master-incident-list">{data?.alerts.filter(alert => alertFilter === 'all' || alert.state === alertFilter).map(alert => <IncidentCard key={alert.id} alert={alert} onInvestigate={() => { setNotice(''); setSelectedDiagnosis(null); setDiagnosticOpen(true); }} onDispatch={() => { setNotice(''); setSelectedDiagnosis(null); setDiagnosticOpen(true); }} canDispatch={admin && completed && !stale && !diagnosis.work_order_id && alert.state === 'active'} canAcknowledge={Boolean(user)} busy={busy} onAcknowledge={() => action(() => api(`/api/alerts/${alert.id}/acknowledge`, { method: 'PATCH' }), 'Incident acknowledged; acknowledgement does not resolve the fault.')} />)}</div>{!data?.alerts.some(alert => alertFilter === 'all' || alert.state === alertFilter) && <div className="master-empty"><strong>No {alertFilter === 'all' ? '' : alertFilter} incidents</strong>Incidents appear when a demo threshold is exceeded.</div>}</section>;
    if (view === 'analytics') return <section className={panel}><h2 className="text-lg font-semibold">Latest persisted telemetry</h2><button className={button} onClick={downloadReport} disabled={!data?.history.length}>Download readings CSV</button><p className="text-sm text-gray-400">Synthetic readings only; no failure-prediction accuracy or financial savings have been evaluated.</p><div className="overflow-auto"><table className="w-full text-sm text-left"><thead><tr>{['Observed', '°C', 'mm/s RMS', 'A', 'State'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data?.history.slice().reverse().map(row => <tr key={row.id}><td className="p-2 whitespace-nowrap">{new Date(row.timestamp).toLocaleTimeString()}</td><td>{row.temperature}</td><td>{row.vibration}</td><td>{row.current}</td><td>{row.health_status}</td></tr>)}</tbody></table></div></section>;
    return <MasterDashboard data={data} user={user} tasks={tasks} tasksLoading={tasksLoading} taskError={taskError} search={search} onSearch={setSearch} onClearSearch={() => setSearch('')} statusFilter={statusFilter} onStatusFilter={setStatusFilter} busy={busy} action={action} navigate={navigate} onInvestigate={() => { setNotice(''); setSelectedDiagnosis(null); setDiagnosticOpen(true); }} onAllAlerts={() => { setAlertFilter('all'); navigate('alerts'); }} />;
  }

  return <ConsoleShell view={view} title={titles[view]} user={user} activeAlerts={data?.status.active_incidents || 0} connected={Boolean(data) && !error && !data?.status.monitor_error} running={data?.status.is_running} onNavigate={navigate} search={search} onSearch={setSearch}>
    <div className="master-page-heading"><div><div className="master-eyebrow">INDUSTRIAL OPERATIONS</div><h1>{view === 'dashboard' ? 'Machine Operations' : titles[view]}</h1><p>{view === 'dashboard' ? 'Live telemetry and incident response for Conveyor Motor 01.' : 'Conveyor Motor 01 · Industrial monitoring workspace'}</p></div><div className="flex flex-wrap items-center gap-3"><span className="master-data-source"><i />SIMULATED TELEMETRY</span><button className="master-button master-secondary" aria-label="Refresh data" onClick={refresh}><RefreshCw size={14} />Refresh</button>{view === 'dashboard' && <button className="master-button master-primary" disabled={!data?.history.length} onClick={downloadReport}><Download size={14} />Export readings</button>}</div></div>
    {notice && <div role="status" className="master-notice">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>Dismiss</button></div>}
    {error && <div role="alert" className="master-notice master-error">Connection error: {error}. Saved content may be stale.<button onClick={refresh}>Retry</button></div>}
    {!data && !error && <p role="status">Loading conveyor data…</p>}
    {data?.status.monitor_error && <p role="alert" className="text-[#F59E0B]">{data.status.monitor_error}</p>}
    {(data || view === 'settings') && content()}
    <DiagnosticsModal open={diagnosticOpen} onClose={() => setDiagnosticOpen(false)} canCreate={admin && completed && !diagnosis?.work_order_id}>{notice && <div className="master-notice" role="status">{notice}</div>}{diagnosticPanel()}</DiagnosticsModal>
  </ConsoleShell>;
}
