export const fields = [
  { field: 'vibration', title: 'Vibration velocity', unit: 'mm/s', precision: 2, subtitle: 'RMS VELOCITY', warning: 2.8, critical: 4.5, domain: [0.5, 9.5] },
  { field: 'temperature', title: 'Winding temperature', unit: '°C', precision: 1, subtitle: 'THERMAL CHANNEL', warning: 72, critical: 80, domain: [55, 105] },
  { field: 'current', title: 'Motor current', unit: 'A', precision: 2, subtitle: 'ELECTRICAL CHANNEL', warning: 17.5, critical: 20.5, domain: [12, 28] },
];
