// StatusBadges.jsx - Design.md Blueprint Component 1
import React from 'react';

export default function StatusBadges({ counts = { healthy: 12, warning: 2, critical: 1, maintenance: 4 }, activeFilter, onSelectFilter }) {
  const badges = [
    {
      id: 'healthy',
      label: 'Healthy',
      count: String(counts.healthy).padStart(2, '0'),
      color: '#10B981',
      borderColor: 'border-[#10B981]/30',
      textColor: 'text-[#10B981]',
      pulseClass: 'pulse-dot-regular',
      delay: '0ms',
    },
    {
      id: 'warning',
      label: 'Warning',
      count: String(counts.warning).padStart(2, '0'),
      color: '#F59E0B',
      borderColor: 'border-[#F59E0B]/30',
      textColor: 'text-[#F59E0B]',
      pulseClass: 'pulse-dot-regular',
      delay: '100ms',
    },
    {
      id: 'critical',
      label: 'Critical',
      count: String(counts.critical).padStart(2, '0'),
      color: '#EF4444',
      borderColor: 'border-[#EF4444]/30',
      textColor: 'text-[#EF4444]',
      pulseClass: 'pulse-dot-critical',
      delay: '200ms',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      count: String(counts.maintenance).padStart(2, '0'),
      color: '#3B82F6',
      borderColor: 'border-[#3B82F6]/30',
      textColor: 'text-[#3B82F6]',
      pulseClass: 'pulse-dot-regular',
      delay: '300ms',
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#F3F4F6]">System Status</h3>
        <span className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          Live updating every 5s
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const isSelected = activeFilter === badge.id;
          return (
            <div
              key={badge.id}
              onClick={() => onSelectFilter?.(isSelected ? 'all' : badge.id)}
              className={`animate-fadeInUp bg-[#111827] border ${badge.borderColor} p-4 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-offset-2 ring-offset-[#1F2937] ring-[#06B6D4]' : ''
              }`}
              style={{ animationDelay: badge.delay }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${badge.pulseClass}`}
                  style={{ backgroundColor: badge.color }}
                />
                <span className="font-medium text-sm text-[#F3F4F6]">{badge.label}</span>
              </div>
              <span className={`text-lg font-bold mono ${badge.textColor}`}>{badge.count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
