import { isMock } from '../api/index.js';

/**
 * Horizontal strip showing live inference metrics.
 * In mock mode, values are labelled "simulated".
 * @param {{ inference: import('../api/schema.js').Inference }} props
 */
export default function InferenceStrip({ inference }) {
  const { ttft_ms, tokens_per_sec, model, backend } = inference;
  const simLabel = isMock ? ' (simulated)' : '';
  const hasData = ttft_ms > 0 || tokens_per_sec > 0;

  if (!hasData) {
    return (
      <div className="inference-strip" style={{ opacity: 0.4 }}>
        <div className="inference-metric">
          <span className="inference-value readout">—</span>
          <span className="inference-label">Inference metrics will appear when diagnosis runs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inference-strip">
      <div className="inference-metric">
        <span className="inference-value readout">{ttft_ms} ms</span>
        <span className="inference-label">TTFT{simLabel}</span>
      </div>
      <div className="inference-metric">
        <span className="inference-value readout">{tokens_per_sec} tok/s</span>
        <span className="inference-label">Throughput{simLabel}</span>
      </div>
      <div className="inference-metric">
        <span className="inference-value readout">{model || 'n/a'}</span>
        <span className="inference-label">Model{simLabel}</span>
      </div>
      <div className="inference-metric">
        <span className="inference-value readout">{backend || 'n/a'}</span>
        <span className="inference-label">Backend{simLabel}</span>
      </div>
    </div>
  );
}
