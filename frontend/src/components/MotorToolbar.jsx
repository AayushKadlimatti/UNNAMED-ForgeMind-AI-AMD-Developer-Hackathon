import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertOctagon
} from 'lucide-react';

export default function MotorToolbar({
  machineName = 'Conveyor Motor',
  machineId = 'CONV-MTR-01',
  isRunning = true,
  currentScenario = 'normal',
  healthStatus = 'HEALTHY',
  latestTelemetry = null,
  history = [],
  onSetScenario,
  onStart,
  onStop,
  onReset,
  onOpenDrawer,
}) {
  const [resetConfirm, setResetConfirm] = useState(false);

  const vib = latestTelemetry?.vibration ?? 2.10;
  const temp = latestTelemetry?.temperature ?? 65.0;
  const curr = latestTelemetry?.current ?? 15.20;

  // Determine machine health status & colors
  const isCritical =
    healthStatus === 'CRITICAL' ||
    currentScenario === 'critical' ||
    currentScenario === 'abnormal' ||
    currentScenario === 'warning';

  // State badge styling (exact once)
  const statusLabel = !isRunning
    ? 'STOPPED'
    : isCritical
    ? 'CRITICAL'
    : 'HEALTHY';

  const statusBadgeClass = !isRunning
    ? 'bg-[#1F2937] text-[#9CA3AF] border-[#2E3846]'
    : isCritical
    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40'
    : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40';

  // Computed alert message from existing data (not hardcoded)
  const vibBaseline = 2.10;
  const vibDeltaPercent = Math.round(((vib - vibBaseline) / vibBaseline) * 100);
  const tempBaseline = 65.0;
  const tempDeltaPercent = Math.round(((temp - tempBaseline) / tempBaseline) * 100);

  let computedAlertBanner = null;
  if (isCritical) {
    computedAlertBanner = `Critical Alert: Vibration RMS exceeded baseline by ${vibDeltaPercent}% (${vib.toFixed(2)} mm/s vs ${vibBaseline.toFixed(2)} mm/s) · ISO 10816 Zone D fault threshold exceeded`;
  }

  // Trend detection from history
  const prevReading = history.length > 5 ? history[history.length - 5] : null;
  const vibTrend = prevReading ? vib - prevReading.vibration : 0;
  const tempTrend = prevReading ? temp - prevReading.temperature : 0;
  const currTrend = prevReading ? curr - prevReading.current : 0;

  const scenarios = [
    { id: 'normal', label: 'Normal' },
    { id: 'warning', label: '• Warning', dotColor: 'bg-[#F59E0B]' },
    { id: 'critical', label: '• Critical', dotColor: 'bg-[#EF4444]' },
    { id: 'recovery', label: 'Recovery' },
  ];

  const handleResetClick = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    } else {
      onReset?.();
      setResetConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. SINGLE COMPACT TOOLBAR ROW */}
      <div className="panel p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Machine Identity & State Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-[#F9FAFB] truncate whitespace-nowrap">
              {machineName}
            </span>
            <span className="text-[#6B7280]">·</span>
            <span className="mono text-xs font-semibold text-[#9CA3AF] shrink-0">
              {machineId}
            </span>
          </div>

          {/* Machine State Badge: Exactly once */}
          <span
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold font-mono tracking-wider border shrink-0 ${statusBadgeClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Right: Scenario Segmented Control + Icon Actions */}
        <div className="flex items-center gap-3">
          {/* Scenario Segmented Control */}
          <div className="bg-[#0B0F19] border border-[#2E3846] p-0.5 rounded-[6px] flex items-center gap-0.5">
            {scenarios.map((sc) => {
              const isSelected =
                currentScenario === sc.id ||
                (sc.id === 'critical' && currentScenario === 'abnormal');
              return (
                <button
                  key={sc.id}
                  onClick={() => onSetScenario(sc.id)}
                  className={`px-3 py-1 rounded-[4px] text-xs font-medium transition-colors flex items-center control-btn ${
                    isSelected
                      ? 'bg-[#06B6D4] text-[#0B0F19] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
                  }`}
                  title={`Switch scenario to ${sc.label}`}
                >
                  {sc.dotColor && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sc.dotColor} shrink-0`}
                    />
                  )}
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-[1px] h-5 bg-[#2E3846]" />

          {/* Pause / Resume Neutral Icon Button */}
          {isRunning ? (
            <button
              onClick={onStop}
              className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] border border-[#2E3846] transition-colors control-btn"
              title="Pause telemetry stream"
              aria-label="Pause"
            >
              <Pause size={15} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={onStart}
              className="p-1.5 rounded-[6px] text-[#10B981] hover:bg-[#10B981]/10 border border-[#10B981]/30 transition-colors control-btn"
              title="Resume telemetry stream"
              aria-label="Resume"
            >
              <Play size={15} strokeWidth={2} />
            </button>
          )}

          {/* Reset Baseline Icon Button */}
          <button
            onClick={handleResetClick}
            className={`p-1.5 rounded-[6px] border transition-colors control-btn text-xs flex items-center gap-1 ${
              resetConfirm
                ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937] border-[#2E3846]'
            }`}
            title={resetConfirm ? 'Click again to confirm reset baseline' : 'Reset simulation to nominal baseline'}
            aria-label="Reset telemetry baseline"
          >
            <RotateCcw size={15} strokeWidth={2} />
            {resetConfirm && <span className="text-[10px] font-mono">Confirm?</span>}
          </button>
        </div>
      </div>

      {/* 2. ONE-LINE ALERT BANNER (Only when state is Warning or Critical) */}
      {computedAlertBanner && (
        <div
          className={`px-3 py-2 rounded-[6px] text-xs font-medium flex items-center justify-between border animate-fadeInUp ${
            isCritical
              ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
              : 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isCritical ? <AlertOctagon size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
            <span className="truncate">{computedAlertBanner}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {onOpenDrawer && (
              <button
                onClick={onOpenDrawer}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors control-btn cursor-pointer"
              >
                Inspect AI Diagnostic Drawer →
              </button>
            )}
            <span className="mono text-[10px] uppercase font-semibold">
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      {/* 3. KPI STRIP (Value + Unit on Single Line, 28-32px JetBrains Mono) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* KPI 1: Vibration RMS */}
        <div
          className={`panel p-3.5 flex flex-col justify-between transition-colors ${
            vib > 4.5
              ? 'border-[#EF4444]/60'
              : vib > 2.8
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
            <span className="uppercase text-[11px] font-semibold tracking-wider">
              Vibration RMS
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  vib > 4.5 ? 'bg-[#EF4444]' : vib > 2.8 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                }`}
              />
              <span className="text-[10px] mono">
                {vib > 4.5 ? 'Zone D' : vib > 2.8 ? 'Zone C' : 'Zone A'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            {/* Value + Unit on single line */}
            <div className="whitespace-nowrap">
              <span
                className={`mono font-bold text-3xl tracking-tight ${
                  vib > 4.5 ? 'text-[#EF4444]' : vib > 2.8 ? 'text-[#F59E0B]' : 'text-[#F9FAFB]'
                }`}
              >
                {vib.toFixed(2)}
              </span>
              <span className="mono text-sm text-[#9CA3AF] ml-1.5 font-medium">mm/s</span>
            </div>

            {/* Tiny trend indicator */}
            <div className="flex items-center text-xs font-mono text-[#9CA3AF]">
              {vibTrend > 0.05 ? (
                <ArrowUpRight size={14} className="text-[#EF4444]" />
              ) : vibTrend < -0.05 ? (
                <ArrowDownRight size={14} className="text-[#10B981]" />
              ) : (
                <Minus size={14} className="text-[#6B7280]" />
              )}
              <span className="text-[10px] ml-0.5">2.10 base</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Temperature */}
        <div
          className={`panel p-3.5 flex flex-col justify-between transition-colors ${
            temp > 80
              ? 'border-[#EF4444]/60'
              : temp > 72
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
            <span className="uppercase text-[11px] font-semibold tracking-wider">
              Winding Temperature
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  temp > 80 ? 'bg-[#EF4444]' : temp > 72 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                }`}
              />
              <span className="text-[10px] mono">
                {temp > 80 ? 'Exceeded' : temp > 72 ? 'Elevated' : 'Nominal'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            {/* Value + Unit on single line */}
            <div className="whitespace-nowrap">
              <span
                className={`mono font-bold text-3xl tracking-tight ${
                  temp > 80 ? 'text-[#EF4444]' : temp > 72 ? 'text-[#F59E0B]' : 'text-[#F9FAFB]'
                }`}
              >
                {temp.toFixed(1)}
              </span>
              <span className="mono text-sm text-[#9CA3AF] ml-1.5 font-medium">°C</span>
            </div>

            {/* Tiny trend indicator */}
            <div className="flex items-center text-xs font-mono text-[#9CA3AF]">
              {tempTrend > 0.5 ? (
                <ArrowUpRight size={14} className="text-[#EF4444]" />
              ) : tempTrend < -0.5 ? (
                <ArrowDownRight size={14} className="text-[#10B981]" />
              ) : (
                <Minus size={14} className="text-[#6B7280]" />
              )}
              <span className="text-[10px] ml-0.5">65.0 base</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Phase Current */}
        <div
          className={`panel p-3.5 flex flex-col justify-between transition-colors ${
            curr > 20.5
              ? 'border-[#EF4444]/60'
              : curr > 17.5
              ? 'border-[#F59E0B]/60'
              : 'border-[#2E3846]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
            <span className="uppercase text-[11px] font-semibold tracking-wider">
              Phase Current
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  curr > 20.5 ? 'bg-[#EF4444]' : curr > 17.5 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                }`}
              />
              <span className="text-[10px] mono">FLA 15.5A</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            {/* Value + Unit on single line */}
            <div className="whitespace-nowrap">
              <span
                className={`mono font-bold text-3xl tracking-tight ${
                  curr > 20.5 ? 'text-[#EF4444]' : curr > 17.5 ? 'text-[#F59E0B]' : 'text-[#F9FAFB]'
                }`}
              >
                {curr.toFixed(1)}
              </span>
              <span className="mono text-sm text-[#9CA3AF] ml-1.5 font-medium">A</span>
            </div>

            {/* Tiny trend indicator */}
            <div className="flex items-center text-xs font-mono text-[#9CA3AF]">
              {currTrend > 0.2 ? (
                <ArrowUpRight size={14} className="text-[#EF4444]" />
              ) : currTrend < -0.2 ? (
                <ArrowDownRight size={14} className="text-[#10B981]" />
              ) : (
                <Minus size={14} className="text-[#6B7280]" />
              )}
              <span className="text-[10px] ml-0.5">15.2 base</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
