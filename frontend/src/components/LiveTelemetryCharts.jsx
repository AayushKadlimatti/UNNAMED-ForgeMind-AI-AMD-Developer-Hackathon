import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="custom-tooltip text-xs">
      <div className="text-[#9CA3AF] font-mono text-[10px] mb-1">{label}</div>
      <div className="flex items-center gap-1.5 font-mono">
        <span className="font-bold text-[#F9FAFB]">
          {typeof val === 'number' ? val.toFixed(2) : val}
        </span>
        <span className="text-[#9CA3AF] text-[11px]">{unit}</span>
      </div>
    </div>
  );
}

export default function LiveTelemetryCharts({ history = [], latest = null }) {
  // Format timestamps for chart x-axis
  const chartData = history.map((item, index) => {
    let timeLabel = `${index + 1}s`;
    if (item.timestamp) {
      try {
        const d = new Date(item.timestamp);
        timeLabel = d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
      } catch {
        // fallback
      }
    }
    return {
      time: timeLabel,
      temperature: item.temperature,
      vibration: item.vibration,
      current: item.current,
      health_status: item.health_status,
    };
  });

  const currentTemp = latest?.temperature ?? 65.0;
  const currentVib = latest?.vibration ?? 2.10;
  const currentCurr = latest?.current ?? 15.20;

  return (
    <div className="flex flex-col gap-2">
      {/* Responsive Grid: 3 columns at >=1280px (xl), 1 column below */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 1. VIBRATION CHART */}
        <div
          className={`panel p-3 flex flex-col justify-between transition-colors ${
            currentVib > 4.5
              ? 'border-[#EF4444]/60'
              : currentVib > 2.8
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Vibration Velocity RMS
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B7280]">
              <span className="text-[#F59E0B]">W: 2.8</span>
              <span className="text-[#EF4444]">C: 4.5</span>
            </div>
          </div>

          <div className="h-[155px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentVib > 4.5 ? '#EF4444' : currentVib > 2.8 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={currentVib > 4.5 ? '#EF4444' : currentVib > 2.8 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3846" opacity={0.5} />
                <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 9 }} interval="preserveEnd" />
                <YAxis stroke="#6B7280" domain={[0.5, 9.5]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={2.8} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={4.5} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip content={<ChartTooltip unit="mm/s" />} />
                <Area
                  type="monotone"
                  dataKey="vibration"
                  stroke={currentVib > 4.5 ? '#EF4444' : currentVib > 2.8 ? '#F59E0B' : '#06B6D4'}
                  strokeWidth={2}
                  fill="url(#vibGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. TEMPERATURE CHART */}
        <div
          className={`panel p-3 flex flex-col justify-between transition-colors ${
            currentTemp > 80
              ? 'border-[#EF4444]/60'
              : currentTemp > 72
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Winding Temperature
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B7280]">
              <span className="text-[#F59E0B]">W: 72°C</span>
              <span className="text-[#EF4444]">C: 80°C</span>
            </div>
          </div>

          <div className="h-[155px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentTemp > 80 ? '#EF4444' : currentTemp > 72 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={currentTemp > 80 ? '#EF4444' : currentTemp > 72 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3846" opacity={0.5} />
                <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 9 }} interval="preserveEnd" />
                <YAxis stroke="#6B7280" domain={[55, 105]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={72} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip content={<ChartTooltip unit="°C" />} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke={currentTemp > 80 ? '#EF4444' : currentTemp > 72 ? '#F59E0B' : '#06B6D4'}
                  strokeWidth={2}
                  fill="url(#tempGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. CURRENT CHART */}
        <div
          className={`panel p-3 flex flex-col justify-between transition-colors ${
            currentCurr > 20.5
              ? 'border-[#EF4444]/60'
              : currentCurr > 17.5
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Motor Phase Current
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#6B7280]">
              <span className="text-[#F59E0B]">W: 17.5A</span>
              <span className="text-[#EF4444]">C: 20.5A</span>
            </div>
          </div>

          <div className="h-[155px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentCurr > 20.5 ? '#EF4444' : currentCurr > 17.5 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={currentCurr > 20.5 ? '#EF4444' : currentCurr > 17.5 ? '#F59E0B' : '#06B6D4'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3846" opacity={0.5} />
                <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 9 }} interval="preserveEnd" />
                <YAxis stroke="#6B7280" domain={[12, 28]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={17.5} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={20.5} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip content={<ChartTooltip unit="A" />} />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke={currentCurr > 20.5 ? '#EF4444' : currentCurr > 17.5 ? '#F59E0B' : '#06B6D4'}
                  strokeWidth={2}
                  fill="url(#currGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
