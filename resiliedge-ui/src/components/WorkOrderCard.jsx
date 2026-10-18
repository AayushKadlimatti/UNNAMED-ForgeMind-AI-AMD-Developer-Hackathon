/**
 * Work order card with status stepper, torque spec, LOTO checklist, and Evolus link.
 * @param {{ workOrder: import('../api/schema.js').WorkOrder }} props
 */
export default function WorkOrderCard({ workOrder }) {
  const { id, status, evolus_run_id, torque_nm, loto_steps } = workOrder;

  const hasData = !!id;
  const evolusBase = import.meta.env.VITE_EVOLUS_RUN_URL_BASE || '';

  if (!hasData) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--space-md)' }}>
        Awaiting work order creation…
      </div>
    );
  }

  const STEPS = ['created', 'dispatched', 'in_progress', 'completed'];
  const STEP_LABELS = ['Created', 'Dispatched', 'In Progress', 'Completed'];
  const currentIdx = STEPS.indexOf(status);

  return (
    <div>
      <div className="field-row">
        <span className="field-label">Work Order</span>
        <span className="field-value">{id}</span>
      </div>

      {/* Status stepper */}
      <div className="stepper">
        {STEP_LABELS.map((label, i) => {
          const completed = i < currentIdx;
          const current = i === currentIdx;
          return (
            <span key={label} style={{ display: 'contents' }}>
              {i > 0 && <span className={`step-connector${completed || current ? ' completed' : ''}`} />}
              <span className={`step${completed ? ' completed' : ''}${current ? ' current' : ''}`}>
                {completed ? '✓' : (i + 1)} {label}
              </span>
            </span>
          );
        })}
      </div>

      <div className="field-row">
        <span className="field-label">Torque Spec</span>
        <span className="field-value">{torque_nm} Nm</span>
      </div>
      <div className="field-row">
        <span className="field-label">Evolus Run</span>
        <span className="field-value">{evolus_run_id || 'n/a'}</span>
      </div>

      {evolusBase && evolus_run_id && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <a
            href={`${evolusBase}/${evolus_run_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', fontSize: 13 }}
          >
            View audit trail →
          </a>
        </div>
      )}

      {/* LOTO checklist */}
      {loto_steps.length > 0 && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <div className="panel-header">LOTO Procedure</div>
          <ol className="loto-list">
            {loto_steps.map((step, i) => (
              <li key={i} className="loto-item">
                <span className="loto-number">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
