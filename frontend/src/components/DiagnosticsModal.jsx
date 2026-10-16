// DiagnosticsModal.jsx - Design.md Blueprint Component 4
import React, { useEffect, useState } from 'react';

export default function DiagnosticsModal({
  isOpen,
  onClose,
  data,
  onCreateTask,
}) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateIn(true), 20);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = data?.title || data?.name || 'Motor B Spike';
  const confidence = data?.confidence || 92;
  const primaryHypothesis = data?.primaryHypothesis || {
    title: 'Winding Insulation Failure',
    description:
      'Telemetry patterns suggest partial insulation breakdown in the stator windings. High frequency current noise detected matches known degradation signatures for Class F insulation at 3000 RPM.',
  };
  const alternatives = data?.alternatives || [
    {
      title: 'Bearing Overheat',
      likelihood: '15% Likely',
      color: 'text-[#F59E0B]',
      description: 'Slight Y-axis vibration increase noted, but temperature distribution favors core fault.',
    },
    {
      title: 'Ambient Air Blockage',
      likelihood: '8% Likely',
      color: 'text-[#3B82F6]',
      description: 'Air intake sensor shows normal flow rate; cooling fins checked via visual AI (OK).',
    },
  ];
  const remediationSteps = data?.remediationSteps || [
    'Shutdown production line 1 immediately for emergency motor inspection.',
    'Perform surge testing and insulation resistance (Megger) check on Motor B.',
    'Prepare replacement Motor (Type M3-X) for rapid swap if test fails.',
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-[#111827] border border-[#374151] rounded-2xl w-[90%] max-w-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transform transition-all duration-300 z-10 ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#374151] bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="bg-[#06B6D4]/10 p-2 rounded-lg">
              <svg className="w-5 h-5 text-[#06B6D4]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#F3F4F6]">
              AI Diagnostics: {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F3F4F6] text-3xl font-light leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Confidence Score */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF] font-medium">AI Confidence Score</span>
              <span className="text-[#06B6D4] font-bold mono">{confidence}%</span>
            </div>
            <div className="h-2 bg-[#374151] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Hypotheses */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
              Primary Hypothesis
            </h3>
            <div className="bg-[#EF4444]/5 border-l-4 border-[#EF4444] p-5 rounded-r-xl">
              <h4 className="font-bold text-[#F3F4F6] mb-1">{primaryHypothesis.title}</h4>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                {primaryHypothesis.description}
              </p>
            </div>

            <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-2">
              Alternative Hypotheses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alternatives.map((alt, i) => (
                <div key={i} className="bg-[#374151]/30 border border-[#374151] p-4 rounded-xl">
                  <span className={`text-[10px] font-bold uppercase mb-1 block ${alt.color || 'text-[#F59E0B]'}`}>
                    {alt.likelihood}
                  </span>
                  <h5 className="text-sm font-bold text-[#F3F4F6] mb-1">{alt.title}</h5>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{alt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Remediation */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
              Recommended Remediation
            </h3>
            <div className="flex flex-col gap-3">
              {remediationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span className="w-6 h-6 flex-shrink-0 bg-[#06B6D4] text-[#111827] rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-[#F3F4F6] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#374151] flex justify-end gap-3 bg-[#1F2937]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-[#374151] text-[#F3F4F6] hover:bg-[#374151] transition-colors text-sm font-semibold"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onCreateTask?.(data);
              onClose();
            }}
            className="px-6 py-2.5 rounded-lg bg-[#06B6D4] text-[#111827] hover:bg-[#0891b2] font-bold transition-all text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Create Maintenance Task
          </button>
        </div>
      </div>
    </div>
  );
}
