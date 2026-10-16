// MachineTelemetryCard.jsx - Design.md Blueprint Component 2
import React from 'react';

export default function MachineTelemetryCard({
  machine,
  onOpenDiagnostics,
  onViewFullData,
  delay = '400ms',
}) {
  const isCritical = machine.status === 'critical';
  const isWarning = machine.status === 'warning';

  const statusColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

  // SVG Waveform variations based on status
  const pathD = isCritical
    ? 'M0,50 Q10,70 20,40 T40,60 T60,30 T80,80 T100,20 T120,60 T140,10 T160,70 T180,40 T200,60 T220,10 T240,80 T260,30 T280,50 L300,45'
    : isWarning
    ? 'M0,45 Q20,20 40,55 T80,35 T120,65 T160,25 T200,50 T240,30 T280,60 L300,42'
    : 'M0,40 Q15,10 30,50 T60,30 T90,40 T120,60 T150,20 T180,45 T210,35 T240,55 T270,30 L300,40';

  return (
    <div
      className={`animate-fadeInUp bg-[#111827] rounded-xl p-5 flex flex-col gap-6 relative overflow-hidden transition-all group ${
        isCritical
          ? 'border-2 border-[#EF4444]/50 hover:border-[#EF4444]'
          : 'border border-[#374151] hover:border-[#06B6D4]/50'
      }`}
      style={{ animationDelay: delay }}
    >
      {/* Priority Tag for Critical */}
      {isCritical && (
        <div className="absolute top-0 right-0 bg-[#EF4444]/10 px-3 py-1 rounded-bl-lg border-b border-l border-[#EF4444]/30">
          <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-tighter">
            Priority 1
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-[#F3F4F6] text-base">{machine.name}</h4>
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">
            {machine.location || 'Production Line 1'}
          </p>
        </div>
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isCritical
              ? 'bg-[#EF4444] pulse-dot-critical'
              : 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]'
          }`}
          style={{ backgroundColor: statusColor }}
        />
      </div>

      {/* Chart */}
      <div className="h-20 w-full overflow-hidden rounded">
        <svg viewBox="0 0 300 80" className="w-full h-full preserve-3d">
          <path
            d={pathD}
            fill="none"
            stroke={statusColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect width="300" height="80" fill={`${statusColor}0D`} />
        </svg>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 border-y border-[#374151] py-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#9CA3AF] uppercase">Current</span>
          <span
            className={`text-sm font-semibold mono ${
              isCritical ? 'text-[#EF4444]' : 'text-[#F3F4F6]'
            }`}
          >
            {machine.current_value || `${machine.temperature || 82.5}°C`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#9CA3AF] uppercase">Max 24h</span>
          <span className="text-sm font-semibold mono text-[#F3F4F6]">
            {machine.max_24h || `${((machine.temperature || 75) * 1.05).toFixed(1)}°C`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#9CA3AF] uppercase">Trend</span>
          <span
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981' }}
          >
            {machine.trend_percent ? `↑ ${machine.trend_percent}%` : isCritical ? '↑ 12.4%' : '↑ 0.8%'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <span>
          {isCritical
            ? `Alert active for: ${machine.activeTime || '4m 21s'}`
            : `Last updated: ${machine.lastUpdated || '2s ago'}`}
        </span>
        {isCritical ? (
          <button
            onClick={() => onOpenDiagnostics?.(machine)}
            className="text-[#EF4444] hover:underline font-bold bg-[#EF4444]/10 px-2.5 py-1 rounded transition-colors"
          >
            Diagnostics
          </button>
        ) : (
          <button
            onClick={() => onViewFullData?.(machine)}
            className="text-[#06B6D4] hover:underline font-semibold transition-colors"
          >
            Full Data
          </button>
        )}
      </div>
    </div>
  );
}
