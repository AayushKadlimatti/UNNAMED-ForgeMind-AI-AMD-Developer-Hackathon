import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

function Sparkline({ data, color = 'var(--text-muted)', width = 80, height = 24 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data, 0.001);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

const STATUS_COLORS = {
  healthy: 'var(--status-healthy)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-critical)',
};

export default function PumpTile({ pump }) {
  const sparkColor = STATUS_COLORS[pump.status] || 'var(--text-muted)';

  return (
    <Link to={`/pump/${pump.pump_id}`} className="panel pump-tile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <span className="readout" style={{ fontWeight: 600, fontSize: '13px' }}>{pump.pump_id}</span>
        <StatusBadge status={pump.status} />
      </div>
      <Sparkline data={pump.sparkline} color={sparkColor} />
      {pump.has_work_order && (
        <div style={{ fontSize: '11px', color: 'var(--status-warning)', marginTop: 'var(--space-xs)' }}>
          ⚠ Open WO
        </div>
      )}
    </Link>
  );
}
