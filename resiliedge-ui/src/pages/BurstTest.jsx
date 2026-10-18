import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { useBurst } from '../hooks/useBurst.js';
import { isMock } from '../api/index.js';

export default function BurstTest() {
  const { stats, loading, error } = useBurst(2000);

  const throughputTarget = import.meta.env.VITE_THROUGHPUT_TARGET
    ? Number(import.meta.env.VITE_THROUGHPUT_TARGET)
    : null;

  const simLabel = isMock ? ' (simulated)' : '';

  if (loading || !stats) {
    return (
      <div className="page-container">
        <div className="empty-state"><div className="loading-spinner" /> Initialising burst test…</div>
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

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
        16-Pump Concurrent Burst Test
      </h2>

      {/* Aggregate KPI */}
      <div className="panel" style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
        <div className="panel-header">Aggregate Throughput{simLabel}</div>
        <div className="big-number" style={{ color: 'var(--accent-blue)' }}>
          {stats.aggregate_tokens_per_sec.toFixed(1)}
          <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 8 }}>tok/s</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
          Duration: <span className="readout">{stats.duration_s.toFixed(1)}s</span> &nbsp;|&nbsp;
          Started: <span className="readout">{new Date(stats.started_at).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Throughput chart */}
      {stats.history && stats.history.length > 1 && (
        <div className="panel" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="panel-header">Throughput Over Time{simLabel}</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.history} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={v => `${v}s`}
              />
              <YAxis
                width={55}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)', borderRadius: 4, fontSize: 12 }}
                labelFormatter={v => `${v} s`}
                formatter={v => [`${Number(v).toFixed(1)} tok/s`, 'Aggregate']}
              />
              <Line type="monotone" dataKey="tokens_per_sec" stroke="var(--accent-blue)" strokeWidth={2} dot={false} isAnimationActive={false} />
              {throughputTarget && (
                <ReferenceLine
                  y={throughputTarget}
                  stroke="var(--status-warning)"
                  strokeDasharray="6 4"
                  label={{ value: `Target: ${throughputTarget}`, fill: 'var(--status-warning)', fontSize: 11, position: 'right' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-pump tiles */}
      <div className="panel-header" style={{ marginBottom: 'var(--space-sm)' }}>Per-Pump Metrics{simLabel}</div>
      <div className="burst-grid">
        {stats.pumps.map(p => (
          <div key={p.pump_id} className="burst-tile">
            <div className="readout" style={{ fontWeight: 600, fontSize: '13px', marginBottom: 'var(--space-xs)' }}>
              {p.pump_id}
            </div>
            <div className="readout" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue)' }}>
              {p.tokens_per_sec.toFixed(1)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>tok/s</div>
            <div className="readout" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
              TTFT {p.ttft_ms} ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
