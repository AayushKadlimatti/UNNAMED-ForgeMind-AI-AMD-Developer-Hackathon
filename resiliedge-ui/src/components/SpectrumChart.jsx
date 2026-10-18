import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';

/**
 * FFT spectrum chart with BPFO reference lines and peak callout.
 * @param {{ spectrum: Array<[number,number]>, bpfoHz: number, peakAmplitude: number }} props
 */
export default function SpectrumChart({ spectrum, bpfoHz, peakAmplitude }) {
  if (!spectrum || spectrum.length === 0) {
    return <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>No spectrum data</div>;
  }

  const data = spectrum.map(([freq, amp]) => ({ freq, amp }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis
            dataKey="freq"
            type="number"
            domain={[0, 500]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickFormatter={v => `${v}`}
            label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            width={45}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickFormatter={v => v.toFixed(2)}
            label={{ value: 'Amplitude (g)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-primary)', borderRadius: 4, fontSize: 12 }}
            labelFormatter={v => `${Number(v).toFixed(1)} Hz`}
            formatter={v => [Number(v).toFixed(4) + ' g', 'Amplitude']}
          />
          <Line type="monotone" dataKey="amp" stroke="var(--status-info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />

          {/* BPFO reference lines: 1×, 2×, 3× */}
          <ReferenceLine x={bpfoHz} stroke="var(--status-critical)" strokeDasharray="4 3" label={{ value: `BPFO ${bpfoHz}`, fill: 'var(--status-critical)', fontSize: 10, position: 'top' }} />
          <ReferenceLine x={bpfoHz * 2} stroke="var(--status-critical)" strokeDasharray="2 4" strokeOpacity={0.5} label={{ value: '2×', fill: 'var(--status-critical)', fontSize: 9, position: 'top' }} />
          <ReferenceLine x={bpfoHz * 3} stroke="var(--status-critical)" strokeDasharray="2 4" strokeOpacity={0.3} label={{ value: '3×', fill: 'var(--status-critical)', fontSize: 9, position: 'top' }} />
        </LineChart>
      </ResponsiveContainer>
      {peakAmplitude > 0.05 && (
        <div className="callout" style={{ marginTop: 'var(--space-sm)' }}>
          📈 Peak at BPFO ({bpfoHz} Hz): <strong className="readout" style={{ marginLeft: 4 }}>{peakAmplitude.toFixed(4)} g</strong>
        </div>
      )}
    </div>
  );
}
