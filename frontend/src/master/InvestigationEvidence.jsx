import { Download } from 'lucide-react';
import { fields } from './telemetry';
import { downloadInvestigation } from './investigation';

export default function InvestigationEvidence({ diagnosis, task }) {
  const snapshot = diagnosis.telemetry_snapshot;
  if (!snapshot) return <p>Saved sensor evidence is unavailable for this investigation.</p>;
  return <section className="master-evidence" aria-label="Saved investigation evidence">
    <div className="master-evidence-heading"><div><h3>Evidence at request time</h3><p>{new Date(snapshot.timestamp).toLocaleString()} · {snapshot.health_status}</p></div><button className="master-button master-secondary" onClick={() => downloadInvestigation(diagnosis, task)}><Download size={14} />Export investigation</button></div>
    <dl className="master-evidence-readings">{fields.map(config => <div key={config.field}><dt>{config.title}</dt><dd>{Number.isFinite(snapshot[config.field]) ? snapshot[config.field].toFixed(config.precision) : '—'} <small>{config.unit}</small></dd></div>)}</dl>
    <ul className="master-evidence-reasons">{snapshot.anomaly_reasons?.map(reason => <li key={reason}>{reason}</li>)}</ul>
    <p className="master-evidence-note">Saved snapshot · {diagnosis.trend_readings || 0} trend readings · {diagnosis.references?.length || 0} reference excerpts. Live charts can change after this snapshot.</p>
    {diagnosis.context_readings?.length > 0 && <details><summary>Inspect the trend readings sent to AMD</summary><div className="master-evidence-table"><table><thead><tr><th>Time</th><th>°C</th><th>mm/s RMS</th><th>A</th><th>State</th></tr></thead><tbody>{diagnosis.context_readings.map((row, index) => <tr key={`${row.timestamp}-${index}`}><td>{new Date(row.timestamp).toLocaleTimeString()}</td><td>{row.temperature}</td><td>{row.vibration}</td><td>{row.current}</td><td>{row.health_status}</td></tr>)}</tbody></table></div></details>}
  </section>;
}
