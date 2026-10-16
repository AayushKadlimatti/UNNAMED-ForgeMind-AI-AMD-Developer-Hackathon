// ForgeMind AI - Mock Data Layer
// Provides realistic industrial sensor data, equipment states, and AI predictions

const EQUIPMENT_TYPES = ['CNC Mill', 'Hydraulic Press', 'Conveyor Belt', 'Compressor', 'Industrial Robot', 'Heat Exchanger', 'Turbine', 'Pump Station'];
const LOCATIONS = ['Building A - Floor 1', 'Building A - Floor 2', 'Building B - Floor 1', 'Building B - Floor 2', 'Building C - Floor 1', 'Outdoor Yard'];
const FAILURE_MODES = [
  'Bearing Degradation', 'Seal Leak', 'Overheating', 'Vibration Anomaly',
  'Pressure Drop', 'Electrical Fault', 'Lubrication Failure', 'Misalignment',
  'Corrosion', 'Fatigue Crack', 'Valve Malfunction', 'Sensor Drift'
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId() {
  return `EQ-${randomInt(1000, 9999)}`;
}

// Generate time series data
export function generateTimeSeries(hours = 24, interval = 1) {
  const data = [];
  const now = new Date();
  const points = hours * (60 / interval);
  
  let baseTemp = randomBetween(60, 80);
  let baseVibration = randomBetween(0.5, 2.0);
  let basePressure = randomBetween(90, 110);
  let baseRpm = randomBetween(1400, 1600);
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60000);
    const hourOfDay = time.getHours();
    
    // Simulate daily patterns
    const dayFactor = hourOfDay >= 8 && hourOfDay <= 18 ? 1.15 : 0.85;
    
    // Add some drift for anomaly simulation
    const anomalyChance = Math.random();
    const anomalyFactor = anomalyChance > 0.95 ? randomBetween(1.2, 1.5) : 1;
    
    baseTemp += randomBetween(-0.5, 0.5);
    baseVibration += randomBetween(-0.1, 0.1);
    basePressure += randomBetween(-0.8, 0.8);
    baseRpm += randomBetween(-5, 5);
    
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: time.toISOString(),
      temperature: Math.round((baseTemp * dayFactor * anomalyFactor) * 10) / 10,
      vibration: Math.round((Math.abs(baseVibration) * dayFactor * anomalyFactor) * 100) / 100,
      pressure: Math.round((basePressure * dayFactor) * 10) / 10,
      rpm: Math.round(baseRpm * dayFactor),
      powerConsumption: Math.round(randomBetween(40, 95) * dayFactor * 10) / 10,
      efficiency: Math.round(randomBetween(82, 98) * 10) / 10,
    });
  }
  return data;
}

// Generate equipment list
export function generateEquipment(count = 12) {
  const statuses = ['healthy', 'warning', 'critical', 'maintenance'];
  const statusWeights = [0.5, 0.25, 0.1, 0.15];
  
  return Array.from({ length: count }, (_, i) => {
    const roll = Math.random();
    let status;
    let cumulative = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (roll <= cumulative) {
        status = statuses[j];
        break;
      }
    }
    
    const healthScore = status === 'healthy' ? randomInt(85, 99) :
                       status === 'warning' ? randomInt(60, 84) :
                       status === 'critical' ? randomInt(15, 59) :
                       randomInt(40, 70);
    
    const lastMaintenance = new Date(Date.now() - randomInt(1, 90) * 86400000);
    const nextMaintenance = new Date(Date.now() + randomInt(1, 60) * 86400000);
    
    return {
      id: `EQ-${1001 + i}`,
      name: `${pickRandom(EQUIPMENT_TYPES)} #${i + 1}`,
      type: pickRandom(EQUIPMENT_TYPES),
      location: pickRandom(LOCATIONS),
      status,
      healthScore,
      runtime: randomInt(1000, 50000),
      lastMaintenance: lastMaintenance.toISOString().split('T')[0],
      nextMaintenance: nextMaintenance.toISOString().split('T')[0],
      failureRisk: status === 'critical' ? randomBetween(0.6, 0.95) :
                   status === 'warning' ? randomBetween(0.3, 0.6) :
                   randomBetween(0.01, 0.15),
      temperature: Math.round(randomBetween(55, 120) * 10) / 10,
      vibration: Math.round(randomBetween(0.2, 5.5) * 100) / 100,
      pressure: Math.round(randomBetween(80, 130) * 10) / 10,
      rpm: randomInt(800, 3600),
      predictedFailure: status === 'critical' ? pickRandom(FAILURE_MODES) : null,
      daysToFailure: status === 'critical' ? randomInt(1, 14) :
                     status === 'warning' ? randomInt(15, 45) : null,
      recommendations: generateRecommendations(status),
    };
  });
}

function generateRecommendations(status) {
  const recs = {
    critical: [
      'Schedule immediate inspection within 24 hours',
      'Reduce operating load by 30% until maintenance',
      'Order replacement parts: bearings, seals',
      'Assign senior technician for detailed analysis',
    ],
    warning: [
      'Schedule preventive maintenance within 2 weeks',
      'Increase monitoring frequency to every 4 hours',
      'Check lubrication levels and top up if necessary',
      'Review vibration trend for further deterioration',
    ],
    healthy: [
      'Continue standard monitoring schedule',
      'Next routine inspection on schedule',
    ],
    maintenance: [
      'Complete ongoing maintenance checklist',
      'Verify all sensors after maintenance',
      'Run calibration test before resuming operations',
    ],
  };
  return recs[status] || recs.healthy;
}

// Generate alerts
export function generateAlerts(count = 20) {
  const severities = ['critical', 'warning', 'info'];
  const alertTypes = [
    { msg: 'Temperature exceeds threshold', severity: 'critical', icon: 'Thermometer' },
    { msg: 'Vibration anomaly detected', severity: 'critical', icon: 'Activity' },
    { msg: 'Bearing wear approaching limit', severity: 'warning', icon: 'AlertTriangle' },
    { msg: 'Pressure deviation detected', severity: 'warning', icon: 'Gauge' },
    { msg: 'Scheduled maintenance due', severity: 'info', icon: 'Calendar' },
    { msg: 'Efficiency drop below 85%', severity: 'warning', icon: 'TrendingDown' },
    { msg: 'Lubrication level low', severity: 'warning', icon: 'Droplets' },
    { msg: 'Motor current spike detected', severity: 'critical', icon: 'Zap' },
    { msg: 'Coolant flow rate reduced', severity: 'warning', icon: 'Waves' },
    { msg: 'Predictive model updated', severity: 'info', icon: 'Brain' },
    { msg: 'Sensor calibration required', severity: 'info', icon: 'Settings' },
    { msg: 'Abnormal noise pattern detected', severity: 'critical', icon: 'Volume2' },
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const alert = pickRandom(alertTypes);
    const minutesAgo = randomInt(1, 1440);
    const time = new Date(Date.now() - minutesAgo * 60000);
    
    return {
      id: `ALR-${2001 + i}`,
      equipmentId: `EQ-${randomInt(1001, 1012)}`,
      equipmentName: `${pickRandom(EQUIPMENT_TYPES)} #${randomInt(1, 12)}`,
      message: alert.msg,
      severity: alert.severity,
      icon: alert.icon,
      timestamp: time.toISOString(),
      timeAgo: minutesAgo < 60 ? `${minutesAgo}m ago` :
               minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}h ago` :
               `${Math.floor(minutesAgo / 1440)}d ago`,
      acknowledged: Math.random() > 0.6,
      location: pickRandom(LOCATIONS),
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate fleet health summary
export function generateFleetSummary() {
  const total = 48;
  const critical = randomInt(2, 5);
  const warning = randomInt(4, 10);
  const maintenance = randomInt(2, 6);
  const healthy = total - critical - warning - maintenance;
  
  return {
    total,
    healthy,
    warning,
    critical,
    maintenance,
    overallHealth: Math.round((healthy / total) * 100),
    avgEfficiency: Math.round(randomBetween(87, 96) * 10) / 10,
    totalAlerts: randomInt(12, 35),
    unacknowledgedAlerts: randomInt(3, 12),
    uptime: Math.round(randomBetween(96, 99.8) * 10) / 10,
    mtbf: randomInt(2400, 4800), // Mean Time Between Failures (hours)
    mttr: Math.round(randomBetween(2.5, 8.0) * 10) / 10, // Mean Time To Repair (hours)
    costSavings: randomInt(120000, 350000),
    failuresPrevented: randomInt(8, 24),
  };
}

// Generate health distribution over time for area chart
export function generateHealthTrend(days = 30) {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const healthy = randomInt(28, 38);
    const warning = randomInt(4, 10);
    const critical = randomInt(1, 5);
    const maintenance = 48 - healthy - warning - critical;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      healthy: Math.max(0, healthy),
      warning: Math.max(0, warning),
      critical: Math.max(0, critical),
      maintenance: Math.max(0, maintenance),
    });
  }
  return data;
}

// Generate failure prediction data
export function generatePredictions() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `PRED-${3001 + i}`,
    equipmentId: `EQ-${1001 + i}`,
    equipmentName: `${pickRandom(EQUIPMENT_TYPES)} #${i + 1}`,
    failureMode: pickRandom(FAILURE_MODES),
    probability: Math.round(randomBetween(0.15, 0.95) * 100) / 100,
    estimatedDays: randomInt(1, 60),
    confidence: Math.round(randomBetween(0.7, 0.98) * 100) / 100,
    impact: pickRandom(['High', 'Medium', 'Low']),
    estimatedCost: randomInt(2000, 50000),
    recommendedAction: pickRandom([
      'Replace bearing assembly',
      'Perform shaft realignment',
      'Replace seals and gaskets',
      'Flush and replace lubricant',
      'Replace motor windings',
      'Overhaul hydraulic system',
      'Replace heat exchanger tubes',
      'Calibrate pressure sensors',
    ]),
  })).sort((a, b) => a.estimatedDays - b.estimatedDays);
}

// Generate maintenance schedule
export function generateMaintenanceSchedule() {
  const types = ['Preventive', 'Predictive', 'Corrective', 'Inspection'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  
  return Array.from({ length: 10 }, (_, i) => {
    const daysFromNow = randomInt(-2, 30);
    const date = new Date(Date.now() + daysFromNow * 86400000);
    const type = pickRandom(types);
    
    return {
      id: `WO-${4001 + i}`,
      equipmentId: `EQ-${randomInt(1001, 1012)}`,
      equipmentName: `${pickRandom(EQUIPMENT_TYPES)} #${randomInt(1, 12)}`,
      type,
      priority: type === 'Corrective' ? 'Critical' : pickRandom(priorities),
      scheduledDate: date.toISOString().split('T')[0],
      estimatedDuration: `${randomInt(1, 8)}h`,
      assignee: pickRandom(['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 'Alex Kim']),
      status: daysFromNow < 0 ? 'Overdue' : daysFromNow === 0 ? 'Today' : 'Scheduled',
      description: `${type} maintenance for ${pickRandom(FAILURE_MODES).toLowerCase()} prevention`,
      location: pickRandom(LOCATIONS),
    };
  }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
}

// Generate cost/savings data
export function generateCostData(months = 12) {
  const data = [];
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const predicted = randomInt(15000, 45000);
    const actual = randomInt(5000, 20000);
    
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      predictedCost: predicted,
      actualCost: actual,
      savings: predicted - actual,
      preventedFailures: randomInt(1, 5),
    });
  }
  return data;
}

// Single equipment detail with rich sensor data
export function generateEquipmentDetail(id) {
  const equipment = generateEquipment(1)[0];
  equipment.id = id;
  equipment.sensorData = generateTimeSeries(24, 5);
  equipment.alerts = generateAlerts(5).map(a => ({ ...a, equipmentId: id }));
  equipment.maintenanceHistory = Array.from({ length: 6 }, (_, i) => ({
    date: new Date(Date.now() - randomInt(30, 365) * 86400000).toISOString().split('T')[0],
    type: pickRandom(['Preventive', 'Corrective', 'Predictive']),
    description: `${pickRandom(FAILURE_MODES)} - ${pickRandom(['Replaced', 'Repaired', 'Inspected', 'Calibrated'])}`,
    technician: pickRandom(['J. Smith', 'M. Garcia', 'D. Chen']),
    cost: randomInt(500, 15000),
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return equipment;
}
