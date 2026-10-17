export function elapsedSeconds(start, end) {
  const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return start && end && Number.isFinite(duration) && duration >= 0 ? duration : null;
}

export function investigationReport(diagnosis, task = null) {
  const snapshot = diagnosis.telemetry_snapshot || {};
  const lines = [
    '# ForgeMind investigation report', '',
    'Synthetic telemetry demonstration. Illustrative thresholds are not validated equipment safety limits. AI suggestions require qualified human review.', '',
    `Investigation: ${diagnosis.id}`, `Machine: ${diagnosis.machine_id}`,
    `Requested: ${diagnosis.timestamp}`, `Status: ${diagnosis.status}`,
    `Monitoring context: ${diagnosis.context_id}`, '',
    '## Saved sensor evidence', `Observed: ${snapshot.timestamp || 'Unavailable'}`,
    `Temperature: ${snapshot.temperature ?? 'Unavailable'} °C`,
    `Vibration velocity RMS: ${snapshot.vibration ?? 'Unavailable'} mm/s`,
    `Current: ${snapshot.current ?? 'Unavailable'} A`,
    `Detector state: ${snapshot.health_status || 'Unavailable'}`,
    ...(snapshot.anomaly_reasons || []).map(reason => `- ${reason}`), '',
    '## AI-assisted assessment', diagnosis.primaryHypothesis?.description || diagnosis.message || 'No completed assessment.', '',
    'Possible causes:', ...(diagnosis.alternatives || []).map(item => `- ${item.title}`), '',
    'Suggested inspections for qualified review:', ...(diagnosis.remediationSteps || []).map(item => `- ${item}`), '',
    'Limitations:', ...(diagnosis.limitations || []).map(item => `- ${item}`),
    'Confidence is not calibrated. No repair or machine actuation was performed.', '',
    '## Provider measurements',
    `Model: ${diagnosis.inference?.model || 'Unavailable'}`,
    `Whole-request duration: ${diagnosis.inference?.request_latency_s ?? 'Unavailable'} s`,
    `Completion tokens: ${diagnosis.inference?.completion_tokens ?? 'Unavailable'}`,
    `End-to-end tokens/s: ${diagnosis.inference?.end_to_end_tokens_per_sec ?? 'Unavailable'}`,
    `Hardware: ${diagnosis.inference?.hardware || 'Not reported by provider'}`, '',
    `Trend readings supplied: ${diagnosis.trend_readings || 0}`,
    '## Reference excerpts (user-supplied, not independently verified)',
    ...(diagnosis.references?.length ? diagnosis.references.flatMap(ref => [ref.title, ref.source, ref.source_url || '', ref.excerpt, '']) : ['No reference excerpts were supplied.']), '',
    '## Human-approved inspection work order',
    `Work order: ${diagnosis.work_order_id || 'Not approved'}`,
    ...(task ? [`Title: ${task.title}`, `Assigned to: ${task.assigned_to}`, `Priority: ${task.priority}`, `Status: ${task.status}`, `Created: ${task.created_at}`,
      `Assessment-to-approval time: ${elapsedSeconds(diagnosis.completed_at, task.created_at)?.toFixed(1) ?? 'Unavailable'} s`] : ['Work-order details are unavailable in this session.']), '',
    'Task completion records a workflow action; it does not establish a repaired machine or cause simulated recovery.',
  ];
  if (diagnosis.context_readings?.length) {
    lines.push('', '## Trend evidence captured at request time', 'timestamp,temperature_c,vibration_mm_s,current_a,state',
      ...diagnosis.context_readings.map(row => [row.timestamp, row.temperature, row.vibration, row.current, row.health_status].join(',')));
  }
  return lines.join('\n');
}

export function downloadInvestigation(diagnosis, task) {
  const url = URL.createObjectURL(new Blob([investigationReport(diagnosis, task)], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `forgemind-${diagnosis.id.replace(/[^a-zA-Z0-9_-]/g, '')}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
