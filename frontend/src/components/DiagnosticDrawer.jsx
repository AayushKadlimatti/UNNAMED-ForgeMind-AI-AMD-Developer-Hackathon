import React from 'react';
import {
  AlertTriangle,
  Cpu,
  FileText,
  CheckCircle,
  Wrench,
  X,
  Shield,
  BookOpen
} from 'lucide-react';

export default function DiagnosticDrawer({
  isOpen = false,
  onClose,
  machineId = 'CONV-MTR-01',
  severity = 'CRITICAL',
  onApproveWorkOrder,
  empiricalData = null,
}) {
  if (!isOpen) return null;

  const vibValue = empiricalData?.vibration ? empiricalData.vibration.toFixed(2) : '4.82';
  const tempValue = empiricalData?.temperature ? empiricalData.temperature.toFixed(1) : '81.4';
  const currValue = empiricalData?.current ? empiricalData.current.toFixed(1) : '18.9';

  const handleApprove = () => {
    if (onApproveWorkOrder) {
      onApproveWorkOrder({
        workOrderId: 'WO-8941',
        technician: 'Alex Rivera',
        timestamp: new Date().toISOString(),
        machineId,
        task: 'Drive-End Bearing Race Replacement & Torque Alignment',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out drawer: width 460px, background #11161D, border #21262D */}
      <aside className="relative w-full max-w-[460px] h-screen bg-[#11161D] border-l border-[#21262D] shadow-2xl flex flex-col z-10 animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#21262D] flex items-center justify-between shrink-0 bg-[#161B22]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444]">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F9FAFB] tracking-tight">
                  AI Diagnostic Investigation
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444]">
                  {severity}
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">
                Target Asset: <span className="text-[#06B6D4] font-semibold">{machineId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#21262D] transition-colors"
            title="Close Drawer"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-xs text-[#9CA3AF]">
          {/* Section 1: AMD Hardware HUD */}
          <div className="bg-[#161B22] border border-[#21262D] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] pulse-dot-regular" />
              <div className="flex items-center gap-1.5">
                <Cpu size={14} className="text-[#ED1C24]" strokeWidth={2} />
                <span className="font-mono text-[#F9FAFB] font-semibold text-[11px]">
                  Inference: Qwen2.5-32B (AMD MI300X)
                </span>
              </div>
            </div>
            <span className="mono text-[11px] font-bold text-[#10B981] px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/20">
              114.2 tok/s
            </span>
          </div>

          {/* Section 2: Root-Cause Probabilities */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F9FAFB]">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-[#06B6D4]" strokeWidth={2} />
                <span>Root-Cause Fault Probabilities</span>
              </span>
              <span className="mono text-[10px] text-[#06B6D4]">Model Confidence 94.6%</span>
            </div>

            <div className="space-y-3 bg-[#161B22] border border-[#21262D] rounded-lg p-3.5">
              {/* Fault 1: Bearing Race Flaking (74% - Red) */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-medium text-[#F9FAFB]">Bearing Race Flaking / Fatigue Spall</span>
                  <span className="mono font-bold text-[#EF4444]">74%</span>
                </div>
                <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
                    style={{ width: '74%' }}
                  />
                </div>
              </div>

              {/* Fault 2: Rotor-Stator Air Gap Eccentricity (18% - Amber) */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-medium text-[#F9FAFB]">Rotor-Stator Air Gap Eccentricity</span>
                  <span className="mono font-bold text-[#F59E0B]">18%</span>
                </div>
                <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                    style={{ width: '18%' }}
                  />
                </div>
              </div>

              {/* Fault 3: Structural Base Footing Looseness (8% - Blue) */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="font-medium text-[#F9FAFB]">Structural Base Footing Looseness</span>
                  <span className="mono font-bold text-[#3B82F6]">8%</span>
                </div>
                <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                    style={{ width: '8%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Empirical Evidence Discrepancy Table */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#F9FAFB] flex items-center gap-1.5">
              <FileText size={14} className="text-[#06B6D4]" strokeWidth={2} />
              <span>Empirical Sensor Discrepancy Evidence</span>
            </span>

            <div className="bg-[#161B22] border border-[#21262D] rounded-lg overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#1A202C] text-[#9CA3AF] border-b border-[#21262D]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Telemetry Channel</th>
                    <th className="py-2 px-3 font-semibold">Current</th>
                    <th className="py-2 px-3 font-semibold">Baseline</th>
                    <th className="py-2 px-3 font-semibold text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262D]">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-[#F9FAFB]">Vibration Velocity RMS</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#EF4444]">{vibValue} mm/s</td>
                    <td className="py-2.5 px-3 font-mono text-[#9CA3AF]">2.10 mm/s</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#EF4444] text-right">+129%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-[#F9FAFB]">Winding Temperature</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F59E0B]">{tempValue} °C</td>
                    <td className="py-2.5 px-3 font-mono text-[#9CA3AF]">65.0 °C</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F59E0B] text-right">+25%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-[#F9FAFB]">Motor Phase Current</td>
                    <td className="py-2.5 px-3 font-mono text-[#F9FAFB]">{currValue} A</td>
                    <td className="py-2.5 px-3 font-mono text-[#9CA3AF]">15.2 A</td>
                    <td className="py-2.5 px-3 font-mono text-[#9CA3AF] text-right">+24%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: RAG OEM Manual Citation */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#F9FAFB] flex items-center gap-1.5">
              <BookOpen size={14} className="text-[#06B6D4]" strokeWidth={2} />
              <span>RAG OEM Documentation Citation</span>
            </span>

            <blockquote className="bg-[#161B22] border-l-4 border-[#06B6D4] p-3 rounded-r-lg text-[11px] text-[#D1D5DB] leading-relaxed">
              <div className="font-mono text-[#06B6D4] font-semibold text-[10px] mb-1 uppercase tracking-wider">
                HydroConveyor 400 Series Manual §5.3, Page 48
              </div>
              "Radial vibration spikes exceeding 4.5 mm/s RMS coupled with thermal rise &gt;80°C indicate 
              immediate drive-end raceway fatigue spalling. De-energize feeder CB-14 immediately under LOTO 
              protocols. Upon bearing replacement, torque casing mounting bolts to exactly 45 Nm."
            </blockquote>
          </div>

          {/* Section 5: Prescribed SOP */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#F9FAFB] flex items-center gap-1.5">
              <Wrench size={14} className="text-[#06B6D4]" strokeWidth={2} />
              <span>Prescribed Remediation Protocol (SOP)</span>
            </span>

            <div className="space-y-2 bg-[#161B22] border border-[#21262D] rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-[11px] text-[#F9FAFB]">
                  Execute 480V LOTO isolation protocol on feeder breaker CB-14.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-[11px] text-[#F9FAFB]">
                  Inspect drive-end grease purge port for metallic flakes & replace SKF-6204 bearing.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-[11px] text-[#F9FAFB]">
                  Torque casing flange and mounting bolts to exactly 45 Nm prior to recommissioning.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Action CTA Footer */}
        <div className="p-4 border-t border-[#21262D] bg-[#161B22] shrink-0">
          <button
            onClick={handleApprove}
            className="w-full py-3 px-4 rounded-lg bg-[#00F0FF] hover:bg-[#00D8E6] text-[#0E1117] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] cursor-pointer"
          >
            <CheckCircle size={16} strokeWidth={2.5} />
            <span>Approve & Dispatch Work Order</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
