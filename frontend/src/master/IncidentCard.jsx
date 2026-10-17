import { AlertTriangle, Check, ArrowUpRight } from 'lucide-react';
import IncidentTimeline from './IncidentTimeline';

export default function IncidentCard({ alert, onInvestigate, onDispatch, onAcknowledge, canDispatch, canAcknowledge, busy }) {
  return <article className={`master-incident master-state-${alert.severity === 'critical' ? 'critical' : 'warning'}`}>
    <div className="master-incident-icon"><AlertTriangle size={22} strokeWidth={1.7} /></div>
    <div className="master-incident-content"><div className="master-incident-title"><h3>{alert.machine_id} · {alert.state === 'resolved' ? 'Recovered incident' : 'Sensor threshold exceeded'}</h3><span className="master-severity">{alert.severity}</span>{alert.state === 'resolved' && <span className="master-resolved"><Check size={12} /> Resolved</span>}</div><p>{alert.description}</p><small>{new Date(alert.timestamp).toLocaleString()} · Synthetic conveyor demo</small>{alert.acknowledged && <small>Acknowledged by {alert.acknowledged_by || 'operator'}</small>}<IncidentTimeline alert={alert} /></div>
    <div className="master-incident-actions"><button className="master-button master-secondary" onClick={onInvestigate}>Investigate <ArrowUpRight size={14} /></button><button className="master-button master-primary" onClick={onDispatch} disabled={!canDispatch || busy} title={!canDispatch ? 'A current completed diagnosis and administrator access are required' : 'Review diagnosis and assign an inspection'}>Dispatch Technician</button>{!alert.acknowledged && onAcknowledge && <button className="master-text-button" onClick={onAcknowledge} disabled={!canAcknowledge || busy}>Acknowledge</button>}</div>
  </article>;
}
