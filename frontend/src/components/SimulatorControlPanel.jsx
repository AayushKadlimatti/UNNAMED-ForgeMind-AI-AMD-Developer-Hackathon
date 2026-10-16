import React from 'react';

export default function SimulatorControlPanel({
  simulatorState,
  connectionStatus,
  onStart,
  onStop,
  onSetScenario,
  onReset,
}) {
  const isRunning = simulatorState?.is_running;
  const currentScenario = simulatorState?.scenario || 'normal';

  const scenarios = [
    {
      id: 'normal',
      label: 'Normal',
      color: '#10B981',
      activeBg: 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]',
      desc: 'Stable ~65°C, 2.1mm/s, 15A',
    },
    {
      id: 'warning',
      label: 'Warning',
      color: '#F59E0B',
      activeBg: 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]',
      desc: 'Gradual rise (temp & vib)',
    },
    {
      id: 'critical',
      label: 'Critical',
      color: '#EF4444',
      activeBg: 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]',
      desc: 'Severe spike (>80°C, >5mm/s)',
    },
    {
      id: 'recovery',
      label: 'Recovery',
      color: '#06B6D4',
      activeBg: 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]',
      desc: 'Gradual return to baseline',
    },
  ];

  return (
    <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-4 shadow-lg animate-fadeInUp">
      {/* Top Bar: Machine Target & Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#374151] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center font-bold text-base text-[#06B6D4]">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#F3F4F6] text-base leading-tight">
                Conveyor Motor Telemetry Simulator
              </h3>
              <span className="mono text-xs font-semibold px-2 py-0.5 rounded bg-[#374151] text-[#06B6D4]">
                CONV-MTR-01
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Real-time multi-channel telemetry engine with statistical anomaly detection
            </p>
          </div>
        </div>

        {/* Live WS Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1F2937] px-3 py-1.5 rounded-lg border border-[#374151]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-[#10B981] pulse-dot-regular'
                  : connectionStatus === 'CONNECTING'
                  ? 'bg-[#F59E0B] pulse-dot-regular'
                  : 'bg-[#EF4444]'
              }`}
            />
            <span className="text-xs font-mono font-medium text-[#F3F4F6]">
              {connectionStatus === 'CONNECTED'
                ? 'WS STREAM LIVE'
                : connectionStatus === 'CONNECTING'
                ? 'WS RECONNECTING'
                : 'WS DISCONNECTED'}
            </span>
          </div>

          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#374151] hover:bg-[#4B5563] text-[#F3F4F6] transition-colors"
            title="Reset telemetry to nominal baseline"
          >
            ↻ Reset
          </button>
        </div>
      </div>

      {/* Simulator Controls & Scenario Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Play / Pause Toggle */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/30 transition-all shadow-sm"
            >
              <span>⏸</span>
              <span>Pause Simulator</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#10B981] hover:bg-[#059669] text-[#111827] transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <span>▶</span>
              <span>Start Simulator</span>
            </button>
          )}

          <div className="text-xs text-[#9CA3AF] pl-2 border-l border-[#374151]">
            <span className="block text-[10px] uppercase tracking-wider">Ticks Streamed</span>
            <span className="mono font-semibold text-[#F3F4F6]">
              {simulatorState?.tick_count || 0}s
            </span>
          </div>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#9CA3AF] mr-1">Scenario:</span>
          {scenarios.map((sc) => {
            const isActive = currentScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSetScenario(sc.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isActive
                    ? `${sc.activeBg} ring-1 ring-current shadow-md scale-[1.02]`
                    : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#374151]'
                }`}
                title={sc.desc}
              >
                {sc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Simulation Disclaimer Banner */}
      <div className="bg-[#1F2937]/80 border border-[#374151] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <span className="font-medium text-[#F3F4F6]">
            SIMULATED TELEMETRY:
          </span>
          <span>
            Data continuously generated by software physics simulator for predictive maintenance verification (no physical ESP32 required).
          </span>
        </div>
        <span className="hidden sm:inline-block mono text-[11px] text-[#06B6D4] font-semibold">
          Current: {currentScenario.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
