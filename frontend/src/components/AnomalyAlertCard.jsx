// AnomalyAlertCard.jsx - Design.md Blueprint Component 3
import React from 'react';

export default function AnomalyAlertCard({
  alert,
  onInvestigate,
  onDispatch,
  onDismiss,
  onSchedule,
  delay = '700ms',
}) {
  const isCritical = alert.severity === 'critical';
  const isWarning = alert.severity === 'warning';

  const borderColor = isCritical ? 'border-[#EF4444]' : isWarning ? 'border-[#F59E0B]' : 'border-[#3B82F6]';
  const iconBg = isCritical ? 'bg-[#EF4444]/20' : isWarning ? 'bg-[#F59E0B]/20' : 'bg-[#3B82F6]/20';
  const iconColor = isCritical ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#3B82F6]';
  const badgeBg = isCritical ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]';
  const badgeLabel = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Info';

  return (
    <div
      className={`bg-[#111827] border-l-4 ${borderColor} rounded-r-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#111827]/80 transition-colors animate-fadeInUp`}
      style={{ animationDelay: delay }}
    >
      {/* Icon & Content */}
      <div className="flex items-start gap-4 flex-1">
        <div className={`${iconBg} p-2.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
          <svg className={`w-6 h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-[#F3F4F6] text-base">{alert.title || alert.message}</h4>
            <span className={`${badgeBg} text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-wider`}>
              {badgeLabel}
            </span>
          </div>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            {alert.description || alert.details || `Telemetry threshold alert detected on ${alert.equipmentName || 'equipment'}.`}
          </p>
          <span className="text-[11px] text-[#9CA3AF] mono italic">
            Timestamp: {alert.timestamp || '2024-11-20 14:42:01'} • {alert.location || 'Line 1, Station 4'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        {isCritical ? (
          <>
            <button
              onClick={() => onInvestigate?.(alert)}
              className="flex-1 md:flex-none bg-[#374151] hover:bg-[#4b5563] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Investigate
            </button>
            <button
              onClick={() => onDispatch?.(alert)}
              className="flex-1 md:flex-none bg-[#06B6D4] hover:bg-[#0891b2] text-[#111827] px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Dispatch Technician
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onDismiss?.(alert.id)}
              className="flex-1 md:flex-none bg-[#374151] hover:bg-[#4b5563] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => onSchedule?.(alert)}
              className="flex-1 md:flex-none border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
            >
              Schedule Maintenance
            </button>
          </>
        )}
      </div>
    </div>
  );
}
