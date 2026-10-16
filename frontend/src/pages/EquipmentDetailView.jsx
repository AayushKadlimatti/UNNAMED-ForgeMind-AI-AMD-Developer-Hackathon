import { useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { StatusBadge, HealthGauge, ProgressBar, SeverityBadge } from '../components/UIComponents';
import { useEquipmentDetail } from '../hooks/useMockData';
import {
  ChevronLeft, Thermometer, Activity, Gauge, Zap, Clock, Wrench,
  AlertTriangle, TrendingUp, Target, Calendar, Brain, Settings
} from '../utils/constants';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-mono font-medium text-gray-200">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function EquipmentDetailView({ equipmentId, onBack }) {
  const { data: eq } = useEquipmentDetail(equipmentId);

  const sensorCards = [
    { label: 'Temperature', value: `${eq.temperature}°C`, icon: Thermometer, color: eq.temperature > 95 ? '#EF4444' : '#00F0FF', threshold: '< 95°C' },
    { label: 'Vibration', value: `${eq.vibration} mm/s`, icon: Activity, color: eq.vibration > 4 ? '#F59E0B' : '#10B981', threshold: '< 4.0 mm/s' },
    { label: 'Pressure', value: `${eq.pressure} PSI`, icon: Gauge, color: eq.pressure > 120 ? '#EF4444' : '#00F0FF', threshold: '90-120 PSI' },
    { label: 'RPM', value: eq.rpm.toLocaleString(), icon: Zap, color: '#00F0FF', threshold: '800-3600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-industrial-800 border border-industrial-700 text-gray-400 hover:text-white hover:border-industrial-accent/30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{eq.name}</h2>
            <StatusBadge status={eq.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{eq.id} · {eq.location} · Type: {eq.type}</p>
        </div>
        <HealthGauge score={eq.healthScore} size="lg" />
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sensorCards.map((sensor) => {
          const Icon = sensor.icon;
          return (
            <div key={sensor.label} className="bg-industrial-800 border border-industrial-700 rounded-xl p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: sensor.color }} />
                <span className="text-xs text-gray-500">{sensor.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: sensor.color }}>
                {sensor.value}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">Threshold: {sensor.threshold}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Temperature trend */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Temperature Trend</h3>
          <p className="text-xs text-gray-500 mb-4">24-hour monitoring</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={eq.sensorData?.slice(-96) || []} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="detailTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="time" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} interval={15} />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="temperature" stroke="#00F0FF" fill="url(#detailTempGrad)" strokeWidth={2} name="Temperature (°C)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vibration + Pressure */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Vibration & Pressure</h3>
          <p className="text-xs text-gray-500 mb-4">Multi-axis analysis</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={eq.sensorData?.slice(-96) || []} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="time" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} interval={15} />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="vibration" stroke="#F59E0B" strokeWidth={2} name="Vibration (mm/s)" dot={false} />
              <Line type="monotone" dataKey="pressure" stroke="#10B981" strokeWidth={1.5} name="Pressure (PSI)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Recommendations + Maintenance History + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Recommendations */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-industrial-accent" />
            <h3 className="text-sm font-semibold text-gray-200">AI Recommendations</h3>
          </div>
          <div className="space-y-3">
            {eq.recommendations?.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-industrial-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-industrial-accent">{i + 1}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>

          {eq.predictedFailure && (
            <div className="mt-4 bg-industrial-critical/5 border border-industrial-critical/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-industrial-critical" />
                <span className="text-xs font-semibold text-industrial-critical">Predicted Failure</span>
              </div>
              <p className="text-xs text-gray-400">{eq.predictedFailure}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated in {eq.daysToFailure} days</p>
              <ProgressBar
                value={100 - (eq.daysToFailure / 60) * 100}
                color="#EF4444"
                height="h-1.5"
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-industrial-accent" />
            <h3 className="text-sm font-semibold text-gray-200">Maintenance History</h3>
          </div>
          <div className="space-y-3">
            {eq.maintenanceHistory?.map((maint, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-b border-industrial-700/50 pb-3 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-industrial-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 truncate">{maint.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <span>{maint.date}</span>
                    <span>·</span>
                    <span>{maint.technician}</span>
                    <span>·</span>
                    <span className="font-mono">${maint.cost.toLocaleString()}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  maint.type === 'Corrective' ? 'bg-red-500/10 text-red-400' :
                  maint.type === 'Predictive' ? 'bg-cyan-500/10 text-cyan-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {maint.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts for this equipment */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-industrial-warning" />
            <h3 className="text-sm font-semibold text-gray-200">Recent Alerts</h3>
          </div>
          <div className="space-y-3">
            {eq.alerts?.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-b border-industrial-700/50 pb-3 last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === 'critical' ? 'bg-industrial-critical' :
                  alert.severity === 'warning' ? 'bg-industrial-warning' :
                  'bg-industrial-accent'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-300">{alert.message}</p>
                  <p className="text-gray-500 mt-0.5">{alert.timeAgo}</p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment metadata */}
      <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Equipment Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Equipment ID', value: eq.id },
            { label: 'Type', value: eq.type },
            { label: 'Location', value: eq.location },
            { label: 'Runtime', value: `${eq.runtime?.toLocaleString()}h` },
            { label: 'Last Maintenance', value: eq.lastMaintenance },
            { label: 'Next Maintenance', value: eq.nextMaintenance },
          ].map((item) => (
            <div key={item.label}>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">{item.label}</span>
              <span className="text-sm font-medium text-gray-300">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
