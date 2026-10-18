/**
 * Large confidence readout with horizontal uncertainty bar.
 * @param {{ confidence: number, uncertainty: number }} props
 */
export default function ConfidenceGauge({ confidence, uncertainty }) {
  const pct = Math.max(0, Math.min(100, confidence));
  const bandLeft = Math.max(0, pct - uncertainty);
  const bandRight = Math.min(100, pct + uncertainty);

  let barColor = 'var(--status-healthy)';
  if (pct >= 60) barColor = 'var(--status-critical)';
  else if (pct >= 25) barColor = 'var(--status-warning)';

  return (
    <div className="confidence-container">
      <div className="confidence-readout" style={{ color: barColor }}>
        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
        {uncertainty > 0 && pct > 0 && (
          <span style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 8 }}>
            ± {uncertainty.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
        {pct > 0 && uncertainty > 0 && (
          <div
            className="confidence-band"
            style={{ left: `${bandLeft}%`, width: `${bandRight - bandLeft}%` }}
          />
        )}
      </div>

      <div className="confidence-caption">
        Computed by DSP, independent of the LLM
      </div>
    </div>
  );
}
