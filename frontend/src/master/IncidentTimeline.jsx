export default function IncidentTimeline({ alert }) {
  const events = [
    { timestamp: alert.timestamp, label: 'Incident opened' },
    ...(alert.transitions || []).map(item => ({ timestamp: item.timestamp, label: `Detector state: ${item.severity}` })),
    ...(alert.acknowledged_at ? [{ timestamp: alert.acknowledged_at, label: `Acknowledged by ${alert.acknowledged_by || 'operator'}` }] : []),
    ...(alert.resolved_at ? [{ timestamp: alert.resolved_at, label: 'Readings returned within demo thresholds' }] : []),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return <details className="master-incident-timeline"><summary>Incident timeline · peak {alert.peak_severity || alert.severity}</summary><ol>{events.map((event, index) => <li key={`${event.timestamp}-${index}`}><time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time><span>{event.label}</span></li>)}</ol></details>;
}
