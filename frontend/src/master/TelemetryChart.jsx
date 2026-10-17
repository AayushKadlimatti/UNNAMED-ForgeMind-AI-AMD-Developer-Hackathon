import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { chartReadings } from './telemetry';

function ReadingTooltip({ active, payload, config }) {
  const point = payload?.[0]?.payload;
  if (!active || !point || !Number.isFinite(point[config.field])) return null;
  const date = new Date(point.timestamp);
  return <div className="master-chart-tooltip">
    <span>{Number.isNaN(date.getTime()) ? 'Recorded sample' : date.toLocaleString()}</span>
    <strong>{point[config.field].toFixed(config.precision)} {config.unit}</strong>
  </div>;
}

export default function TelemetryChart({ config, history }) {
  const gradientId = useId().replaceAll(':', '');
  const data = chartReadings(history, config.field);
  return <>
    <div className="master-chart-thresholds" aria-label="Illustrative demo thresholds">
      <span>Warning {config.warning} {config.unit}</span><span>Critical {config.critical} {config.unit}</span>
    </div>
    <div className="master-telemetry-chart">
      {data.some(row => Number.isFinite(row[config.field])) ? <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart accessibilityLayer data={data} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--state-color)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--state-color)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.65} />
          <XAxis dataKey="observedAt" type="number" domain={['dataMin', 'dataMax']} tickFormatter={timestamp => new Date(timestamp).toLocaleTimeString([], { hour12: false })} stroke="#9CA3AF" tick={{ fontSize: 10 }} minTickGap={36} tickCount={4} interval="preserveStartEnd" tickMargin={8} />
          <YAxis domain={config.domain} width={34} stroke="#9CA3AF" tick={{ fontSize: 10 }} tickCount={5} />
          <ReferenceLine y={config.warning} stroke="#F59E0B" strokeDasharray="4 4" />
          <ReferenceLine y={config.critical} stroke="#EF4444" strokeDasharray="4 4" />
          <Tooltip content={<ReadingTooltip config={config} />} isAnimationActive={false} cursor={{ stroke: '#9CA3AF', strokeDasharray: '3 3' }} />
          <Area name={config.title} type="monotone" dataKey={config.field} stroke="var(--state-color)" strokeWidth={2} fill={`url(#${gradientId})`} connectNulls={false} isAnimationActive={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer> : <p>Waiting for recorded readings</p>}
    </div>
  </>;
}
