import { ArrowDownRight, ArrowUpRight, ArrowRight } from 'lucide-react';
import { lazy, Suspense } from 'react';
const TelemetryChart = lazy(() => import('./TelemetryChart'));

export default function TelemetryCard({ config, reading, history, running, onFullData, index }) {
  const values = history.map(row => row[config.field]).filter(Number.isFinite);
  const value = reading?.[config.field];
  const status = (reading?.parameters?.[config.field]?.status || 'OK').toLowerCase();
  const state = status === 'ok' ? 'healthy' : status;
  const high = values.length ? Math.max(...values) : 1;
  const first = values[0];
  const delta = first && Number.isFinite(value) ? (value - first) / Math.abs(first) * 100 : null;
  const Trend = delta != null && delta < 0 ? ArrowDownRight : ArrowUpRight;
  const formatted = number => Number.isFinite(number) ? number.toFixed(config.precision) : '—';
  return <article className={`master-telemetry-card master-state-${state} master-enter`} style={{ animationDelay: `${400 + index * 100}ms` }}>
    <div className="master-card-heading"><div><h3>{config.title}</h3><p>CONV-MTR-01 <span>·</span> {config.subtitle}</p></div><span className={`master-status-dot ${running ? 'is-live' : ''}`} aria-label={`${state}, ${running ? 'updating' : 'paused'}`} /></div>
    <Suspense fallback={<div className="master-telemetry-chart"><p role="status">Loading detailed chart…</p></div>}><TelemetryChart config={config} history={history} /></Suspense>
    <div className="master-card-metrics"><div><span>Current</span><strong>{formatted(value)} <small>{config.unit}</small></strong></div><div><span>Window max</span><strong>{values.length ? formatted(high) : '—'} <small>{config.unit}</small></strong></div><div><span>Trend</span><strong className="master-delta">{delta == null ? '—' : <><Trend size={13} />{Math.abs(delta).toFixed(1)}%</>}</strong></div></div>
    <footer><span>{running ? 'Updating every 2s' : 'Monitoring paused'} · {values.length} samples</span><button onClick={onFullData}>Full Data <ArrowRight size={13} /></button></footer>
  </article>;
}
