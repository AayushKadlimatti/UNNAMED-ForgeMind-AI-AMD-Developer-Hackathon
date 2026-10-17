import { ArrowRight, Check, Circle, LoaderCircle } from 'lucide-react';

export default function DemoGuide({ data, user, tasks, onNavigate, onInvestigate }) {
  const diagnosis = data?.diagnostic;
  const task = tasks.find(item => item.id === diagnosis?.work_order_id);
  const steps = [
    { title: 'Observe the signal', detail: `${data?.history.length || 0} saved synthetic readings. Select Critical below to open an incident.`, done: Boolean(data?.alerts.length), action: 'View incidents', click: () => onNavigate('alerts') },
    { title: 'Investigate with AMD', detail: diagnosis?.status === 'completed' ? `Saved AMD assessment with ${diagnosis.trend_readings || 0} trend readings.` : diagnosis?.status === 'pending' ? 'AMD is processing. Monitoring continues in the background.' : 'Request analysis explicitly. Sensor evidence is preserved if AMD is unavailable.', done: diagnosis?.status === 'completed', pending: diagnosis?.status === 'pending', action: 'Open investigation', click: onInvestigate },
    { title: 'Approve an inspection', detail: diagnosis?.work_order_id ? `Work order saved${task ? ` · ${task.status}` : ''}. Human approval is recorded.` : 'Review the evidence and assign a technician. No equipment is controlled.', done: Boolean(diagnosis?.work_order_id), action: diagnosis?.work_order_id ? 'View work order' : 'Review and approve', click: diagnosis?.work_order_id ? () => onNavigate('maintenance') : onInvestigate },
    { title: 'Verify recovery', detail: 'Select Recovery below and watch the readings settle. Task completion and sensor recovery are separate events.', done: Boolean(data?.alerts.some(item => item.state === 'resolved')) && data?.status.latest_reading?.health_status === 'HEALTHY', action: 'View recovery history', click: () => onNavigate('alerts') },
  ];
  return <section className="master-demo-guide" aria-label="Demo walkthrough">
    <div className="master-section-title"><div><h2>From signal to inspection</h2><p>A live walkthrough of detection, AI assistance, and human review.</p></div><span className="master-guide-label">DEMO WALKTHROUGH</span></div>
    <div className="master-guide-readiness"><span className={data?.status.amd_configured ? 'is-ready' : ''}>{data?.status.amd_configured ? 'AMD settings present' : 'AMD credentials needed'}</span><span className={user?.role === 'admin' ? 'is-ready' : ''}>{user?.role === 'admin' ? 'Administrator connected' : 'Administrator needed for AI approval'}</span>{user?.role !== 'admin' && <button onClick={() => onNavigate('settings')}>Connect in Settings <ArrowRight size={12} /></button>}</div>
    <ol className="master-guide-steps">{steps.map((step, index) => <li key={step.title} className={step.done ? 'is-complete' : ''}><div className="master-guide-step-label">{step.done ? <Check size={17} /> : step.pending ? <LoaderCircle size={17} /> : <Circle size={17} />}<span>0{index + 1}</span></div><h3>{step.title}</h3><p>{step.detail}</p><button onClick={step.click}>{step.action} <ArrowRight size={12} /></button></li>)}</ol>
    <p className="master-evidence-note">Indicators reflect saved records, including earlier runs. Scenario controls never call AMD automatically.</p>
  </section>;
}
