import { Link, useParams } from 'react-router-dom';
import { usePumpDetail } from '../hooks/usePump.js';
import { triggerScenario } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import InferenceStrip from '../components/InferenceStrip.jsx';
import SpectrumChart from '../components/SpectrumChart.jsx';
import ConfidenceGauge from '../components/ConfidenceGauge.jsx';
import DiagnosisCard from '../components/DiagnosisCard.jsx';
import InventoryCard from '../components/InventoryCard.jsx';
import WorkOrderCard from '../components/WorkOrderCard.jsx';

function stageState(pump, stage) {
  /* Returns 'active' if this stage's data has arrived, 'pending' otherwise. */
  switch (stage) {
    case 1: return pump.dsp.spectrum.length > 0 ? 'active' : 'pending';
    case 2: return pump.dsp.confidence > 0 ? 'active' : 'pending';
    case 3: return pump.diagnosis.fault_code ? 'active' : 'pending';
    case 4: return pump.inventory.bay ? 'active' : 'pending';
    case 5: return pump.work_order.id ? 'active' : 'pending';
    default: return 'pending';
  }
}

export default function PumpDetail() {
  const { id } = useParams();
  const { pump, loading, error } = usePumpDetail(id);
  const addToast = useToast();

  const handleScenario = async () => {
    try {
      const res = await Promise.resolve(triggerScenario());
      addToast(res.message || 'Fault scenario initiated', 'info', 6000);
    } catch (err) {
      addToast(err.message || 'Failed to trigger scenario', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state"><div className="loading-spinner" /> Loading pump {id}…</div>
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
  if (!pump || pump.pump_id === 'n/a') {
    return (
      <div className="page-container">
        <Link to="/" className="back-link">← Back to Overview</Link>
        <div className="empty-state">Pump {id} not found</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/" className="back-link">← Back to Overview</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Pump {pump.pump_id}</h2>
          <span className="readout" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            Last update: {new Date(pump.ts).toLocaleTimeString()}
          </span>
        </div>
        {pump.pump_id === 'P-07' && (
          <button className="btn btn-primary" onClick={handleScenario}>
            ▶ Trigger Fault Scenario
          </button>
        )}
      </div>

      {/* Inference strip */}
      <InferenceStrip inference={pump.inference} />

      {/* Pipeline stages */}
      <div className="pipeline">

        {/* Stage 1: Signal */}
        <div className={`stage-card ${stageState(pump, 1)}`}>
          <div className="stage-number">1</div>
          <div className="stage-title">Signal — FFT Spectrum</div>
          <SpectrumChart
            spectrum={pump.dsp.spectrum}
            bpfoHz={pump.dsp.bpfo_hz}
            peakAmplitude={pump.dsp.peak_amplitude}
          />
        </div>

        {/* Stage 2: Confidence */}
        <div className={`stage-card ${stageState(pump, 2)}`}>
          <div className="stage-number">2</div>
          <div className="stage-title">Confidence — DSP Analysis</div>
          <ConfidenceGauge
            confidence={pump.dsp.confidence}
            uncertainty={pump.dsp.uncertainty}
          />
        </div>

        {/* Stage 3: Diagnosis */}
        <div className={`stage-card ${stageState(pump, 3)}`}>
          <div className="stage-number">3</div>
          <div className="stage-title">Diagnosis — LLM Fault Analysis</div>
          <DiagnosisCard diagnosis={pump.diagnosis} />
        </div>

        {/* Stage 4: Inventory */}
        <div className={`stage-card ${stageState(pump, 4)}`}>
          <div className="stage-number">4</div>
          <div className="stage-title">Inventory — Part Verification</div>
          <InventoryCard inventory={pump.inventory} />
        </div>

        {/* Stage 5: Work Order */}
        <div className={`stage-card ${stageState(pump, 5)}`}>
          <div className="stage-number">5</div>
          <div className="stage-title">Work Order — Evolus Dispatch</div>
          <WorkOrderCard workOrder={pump.work_order} />
        </div>
      </div>
    </div>
  );
}
