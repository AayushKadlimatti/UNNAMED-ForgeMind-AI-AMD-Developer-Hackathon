import StatusBadge from './StatusBadge.jsx';

/**
 * Diagnosis card showing fault details and escalation banner.
 * @param {{ diagnosis: import('../api/schema.js').Diagnosis }} props
 */
export default function DiagnosisCard({ diagnosis }) {
  const { fault_code, component, root_cause, severity, required_part, human_escalation_required } = diagnosis;

  const hasData = !!fault_code;

  if (!hasData) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--space-md)' }}>
        Awaiting LLM diagnosis…
      </div>
    );
  }

  return (
    <div>
      {human_escalation_required && (
        <div className="escalation-banner" style={{ marginBottom: 'var(--space-md)' }}>
          ⚠ Human Escalation Required
        </div>
      )}

      <div className="field-row">
        <span className="field-label">Fault Code</span>
        <span className="field-value">{fault_code || 'n/a'}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Component</span>
        <span className="field-value">{component || 'n/a'}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Severity</span>
        <span>{severity ? <StatusBadge status={severity} /> : 'n/a'}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Required Part</span>
        <span className="field-value">{required_part || 'n/a'}</span>
      </div>
      {root_cause && (
        <div className="callout" style={{ marginTop: 'var(--space-md)' }}>
          <span>💡</span>
          <span>{root_cause}</span>
        </div>
      )}
    </div>
  );
}
