import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { StatCard, ProgressBar } from '../components/UIComponents';
import { useCostData, useFleetSummary, useHealthTrend, useTimeSeries } from '../hooks/useMockData';
import {
  BarChart3, TrendingUp, TrendingDown, Zap, Shield, Clock,
  Target, ArrowUpRight, Brain
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
          <span className="font-mono font-medium text-gray-200">
            {typeof entry.value === 'number' ? `$${entry.value.toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsView() {
  const { data: costData } = useCostData(12);
  const { data: fleet } = useFleetSummary();
  const { data: healthTrend } = useHealthTrend(30);
  const { data: timeSeries } = useTimeSeries(24, 15);

  const totalSavings = useMemo(
    () => costData.reduce((sum, d) => sum + d.savings, 0),
    [costData]
  );

  const totalPreventedFailures = useMemo(
    () => costData.reduce((sum, d) => sum + d.preventedFailures, 0),
    [costData]
  );

  const efficiencyData = useMemo(
    () => timeSeries.slice(-96).map(d => ({
      time: d.time,
      efficiency: d.efficiency,
      power: d.powerConsumption,
    })),
    [timeSeries]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Analytics & Insights</h2>
        <p className="text-sm text-gray-500 mt-1">Cost optimization, efficiency metrics, and AI performance tracking</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cost Savings"
          value={`$${(totalSavings / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          trend="up"
          trendValue="vs. reactive"
          color="green"
          subtitle="12-month cumulative"
        />
        <StatCard
          title="Avg Efficiency"
          value={`${fleet.avgEfficiency}%`}
          icon={Zap}
          trend="up"
          trendValue="+1.2%"
          color="cyan"
          subtitle="Across all equipment"
        />
        <StatCard
          title="MTBF"
          value={`${fleet.mtbf}h`}
          icon={Shield}
          trend="up"
          trendValue="+180h"
          color="green"
          subtitle="Mean Time Between Failures"
        />
        <StatCard
          title="MTTR"
          value={`${fleet.mttr}h`}
          icon={Clock}
          trend="down"
          trendValue="-0.5h"
          color="cyan"
          subtitle="Mean Time To Repair"
        />
      </div>

      {/* Cost analysis chart */}
      <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Cost Analysis: Predicted vs Actual</h3>
            <p className="text-xs text-gray-500 mt-0.5">Predictive maintenance ROI over 12 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-industrial-critical opacity-60" /> Predicted Cost</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-industrial-success" /> Actual Cost</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-industrial-accent opacity-40" /> Savings</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="month" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="predictedCost" fill="#EF4444" fillOpacity={0.4} name="Predicted Cost" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="actualCost" fill="#10B981" fillOpacity={0.8} name="Actual Cost" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two column: Efficiency + Savings trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Efficiency over time */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Equipment Efficiency</h3>
          <p className="text-xs text-gray-500 mb-4">24-hour efficiency & power consumption</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={efficiencyData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="time" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} interval={15} />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency (%)" dot={false} />
              <Line type="monotone" dataKey="power" stroke="#F59E0B" strokeWidth={1.5} name="Power (kW)" dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative savings */}
        <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-1">Cumulative Savings</h3>
          <p className="text-xs text-gray-500 mb-4">Cost savings from predictive maintenance</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={costData.map((d, i) => ({
                ...d,
                cumSavings: costData.slice(0, i + 1).reduce((s, x) => s + x.savings, 0),
              }))}
              margin={{ top: 5, right: 5, bottom: 5, left: -10 }}
            >
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="month" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumSavings" stroke="#10B981" fill="url(#savingsGrad)" strokeWidth={2} name="Cumulative Savings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Performance metrics */}
      <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-industrial-accent" />
          <h3 className="text-sm font-semibold text-gray-200">AI Model Performance</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Prediction Accuracy', value: 94.2, color: '#10B981' },
            { label: 'False Positive Rate', value: 3.8, color: '#F59E0B' },
            { label: 'Detection Rate', value: 97.1, color: '#00F0FF' },
            { label: 'Model Uptime', value: 99.9, color: '#10B981' },
          ].map(metric => (
            <div key={metric.label}>
              <ProgressBar
                value={metric.value}
                color={metric.color}
                height="h-2"
                showLabel={true}
                label={metric.label}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Failures Prevented', value: totalPreventedFailures, color: '#10B981' },
            { label: 'Avg Lead Time', value: '14.3 days', color: '#00F0FF' },
            { label: 'Model Version', value: 'v3.2.1', color: '#F59E0B' },
          ].map(item => (
            <div key={item.label} className="bg-industrial-900/50 rounded-lg p-3">
              <span className="text-[10px] text-gray-500 block mb-1">{item.label}</span>
              <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
