import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Radio,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function TopDrawer({
  isOpen = true,
  onToggle,
  scenario = 'normal',
  onTriggerScenario,
  isConnected = false,
  lastPolled = null,
  latestTelemetry = null,
  activeAlerts = [],
  onNavigateToDiagnostics,
}) {
  const isAbnormal = scenario === 'abnormal' || scenario === 'critical';
  const vib = latestTelemetry?.vibration ?? 2.14;
  const temp = latestTelemetry?.temperature ?? 65.0;
  const curr = latestTelemetry?.current ?? 15.2;

  return (
    <div className="w-full bg-[#0d131f] border-b border-[#374151] shadow-2xl transition-all duration-300 relative z-30">
      {/* Top Bar Header / Toggle Bar */}
      <div className="px-6 py-2.5 bg-[#111827]/95 border-b border-[#374151]/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#06B6D4]">
            <Radio className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
            <span>Telemetry Simulation Control Drawer</span>
          </div>

          <span className="text-[#4B5563]">|</span>

          {/* Backend Connection & Polling status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#10B981] pulse-dot-regular' : 'bg-[#EF4444]'
              }`}
            />
            <span className="font-mono text-[#9CA3AF] text-[11px]">
              FastAPI: <span className="text-[#F3F4F6]">127.0.0.1:8000</span> (1.5s Polling)
            </span>
          </div>

          {lastPolled && (
            <span className="hidden lg:flex items-center gap-1 text-[10px] text-[#6B7280] font-mono">
              <Clock className="w-3 h-3" />
              {lastPolled.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Active Mode Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider border ${
              isAbnormal
                ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] animate-pulse'
                : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
            }`}
          >
            {isAbnormal ? '⚡ ANOMALY ACTIVE' : '● NOMINAL BASELINE'}
          </span>

          {/* Drawer collapse/expand button */}
          {onToggle && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#1F2937] hover:bg-[#374151] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors text-[11px]"
              title={isOpen ? 'Collapse Top Drawer' : 'Expand Top Drawer'}
            >
              <span>{isOpen ? 'Collapse' : 'Controls'}</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Drawer Body - Interactive Controls */}
      {isOpen && (
        <div className="px-6 py-4 flex flex-col gap-3 animate-fadeInUp">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Left: Quick Instructions & Machine Identifier */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-colors ${
                  isAbnormal
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                    : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                }`}
              >
                {isAbnormal ? '⚠️' : '⚙️'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F3F4F6] text-sm tracking-tight">
                    Conveyor Motor CONV-MTR-01
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#1F2937] border border-[#374151] text-[#06B6D4]">
                    Scenario Switcher
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Toggle scenarios via POST /api/simulator/scenario to see live vibration & telemetry response
                </p>
              </div>
            </div>

            {/* Center: Live Quick Metrics */}
            <div className="flex items-center gap-4 bg-[#111827] border border-[#374151] px-4 py-2 rounded-xl text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-[#9CA3AF] font-medium">Vibration RMS</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    vib > 4.5 ? 'text-[#EF4444]' : vib > 2.8 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                  }`}
                >
                  {typeof vib === 'number' ? vib.toFixed(2) : vib} mm/s
                </span>
              </div>
              <div className="w-[1px] h-6 bg-[#374151]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-[#9CA3AF] font-medium">Temperature</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    temp > 80 ? 'text-[#EF4444]' : temp > 72 ? 'text-[#F59E0B]' : 'text-[#06B6D4]'
                  }`}
                >
                  {typeof temp === 'number' ? temp.toFixed(1) : temp}°C
                </span>
              </div>
              <div className="w-[1px] h-6 bg-[#374151]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-[#9CA3AF] font-medium">Current</span>
                <span className="font-mono font-bold text-sm text-[#F3F4F6]">
                  {typeof curr === 'number' ? curr.toFixed(1) : curr} A
                </span>
              </div>
            </div>

            {/* Right: The Two Primary Scenario Buttons */}
            <div className="flex items-center gap-3">
              {/* Normal Button */}
              <button
                id="btn-scenario-normal"
                type="button"
                onClick={() => onTriggerScenario('normal')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                  !isAbnormal
                    ? 'bg-[#10B981] border-[#10B981] text-[#111827] shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105'
                    : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:text-[#10B981] hover:border-[#10B981]/50 hover:bg-[#10B981]/10'
                }`}
                title="Switch backend simulator to Normal baseline scenario"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Normal</span>
              </button>

              {/* Inject Anomaly Button */}
              <button
                id="btn-scenario-abnormal"
                type="button"
                onClick={() => onTriggerScenario('abnormal')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                  isAbnormal
                    ? 'bg-[#EF4444] border-[#EF4444] text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-105 animate-pulse'
                    : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:text-[#EF4444] hover:border-[#EF4444]/50 hover:bg-[#EF4444]/10'
                }`}
                title="Inject anomaly into backend simulator (triggers vibration & thermal spike)"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Inject Anomaly</span>
              </button>
            </div>
          </div>

          {/* Active Anomaly Banner - Appears immediately when Anomaly is triggered or critical alerts exist */}
          {isAbnormal && (
            <div className="bg-[#EF4444]/15 border border-[#EF4444]/50 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#EF4444]/30 border border-[#EF4444] flex items-center justify-center text-sm shrink-0">
                  🚨
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F3F4F6] text-xs">
                      ACTIVE ANOMALY DETECTED:
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#EF4444]">
                      Vibration ({vib.toFixed(2)} mm/s) &gt; ISO 10816 Zone D Threshold (4.5 mm/s)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#D1D5DB] mt-0.5">
                    {activeAlerts[0]?.description ||
                      'Elevated bearing raceway friction detected. High harmonic energy on drive-end assembly.'}
                  </p>
                </div>
              </div>

              {onNavigateToDiagnostics && (
                <button
                  onClick={onNavigateToDiagnostics}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold shrink-0 transition-colors shadow-md"
                >
                  <span>Root-Cause Diagnostics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
