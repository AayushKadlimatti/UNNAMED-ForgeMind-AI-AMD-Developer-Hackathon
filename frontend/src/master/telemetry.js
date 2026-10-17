export const fields = [
  { field: 'vibration', title: 'Vibration velocity', unit: 'mm/s', precision: 2, subtitle: 'RMS VELOCITY', warning: 2.8, critical: 4.5, domain: [0.5, 9.5] },
  { field: 'temperature', title: 'Winding temperature', unit: '°C', precision: 1, subtitle: 'THERMAL CHANNEL', warning: 72, critical: 80, domain: [55, 105] },
  { field: 'current', title: 'Motor current', unit: 'A', precision: 2, subtitle: 'ELECTRICAL CHANNEL', warning: 17.5, critical: 20.5, domain: [12, 28] },
];

export function chartReadings(history, field) {
  const data = [];
  for (const row of history) {
    const observedAt = new Date(row.timestamp).getTime();
    if (!Number.isFinite(observedAt)) continue;
    const previous = data.at(-1);
    // A pause or restart is a gap, not a measured transition between two samples.
    if (previous && observedAt - previous.observedAt > 5000) data.push({ observedAt: previous.observedAt + 1, [field]: null });
    data.push({ ...row, observedAt });
  }
  return data;
}
