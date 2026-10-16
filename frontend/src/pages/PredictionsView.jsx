import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HealthGauge, ProgressBar } from '../components/UIComponents';
import { usePredictions } from '../hooks/useMockData';
import {
  Brain, AlertTriangle, Clock, Target, TrendingUp, Zap, Shield,
  ArrowUpRight, ChevronRight
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
            {typeof entry.value === 'number' ? `${(entry.value * 100).toFixed(0)}%` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PredictionsView({ diagnosticData }) {
  const { data: predictions, refresh } = usePredictions();

  const chartData = useMemo(
    () => predictions.map(p => ({
      name: p.equipmentName.length > 15 ? p.equipmentName.slice(0, 15) + '...' : p.equipmentName,
      probability: p.probability,
      confidence: p.confidence,
    })),
    [predictions]
  );

  const getUrgencyColor = (days) => {
    if (days <= 7) return '#EF4444';
    if (days <= 21) return '#F59E0B';
    return '#10B981';
  };

  const getUrgencyLabel = (days) => {
    if (days <= 7) return 'Imminent';
    if (days <= 21) return 'Approaching';
    return 'Distant';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Diagnostics & Root-Cause Failure Engine</h2>
          <p className="text-sm text-gray-500 mt-1">
            Machine learning & physics-guided root-cause diagnostic telemetry (GET /api/diagnostics/latest)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-industrial-800 border border-industrial-accent/20 rounded-lg">
            <Brain className="w-4 h-4 text-industrial-accent" />
            <span className="text-xs text-industrial-accent font-medium">AI Diagnostic Engine Online</span>
            <span className="w-2 h-2 rounded-full bg-industrial-success animate-pulse" />
          </div>
        </div>
      </div>

      {/* Live Root-Cause Diagnostic Card from FastAPI Endpoint */}
      {diagnosticData && (
        <div className="bg-[#111827] border-2 border-[#06B6D4]/40 rounded-2xl p-6 shadow-xl animate-fadeInUp">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#374151] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/40 flex items-center justify-center text-lg text-[#06B6D4] font-bold">
                🧠
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#F3F4F6]">
                    Active Root-Cause Diagnostic: {diagnosticData.machine_id || 'CONV-MTR-01'}
                  </h3>
                  <span className="mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1F2937] text-[#06B6D4] border border-[#374151]">
                    {diagnosticData.id || 'DIAG-LIVE'}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Continuous inference from AMD Instinct MI300X TokenFactory telemetry diagnostics pipeline
                </p>
              </div>
            </div>

            {/* Confidence Gauge */}
            <div className="flex items-center gap-3 bg-[#1F2937] px-4 py-2 rounded-xl border border-[#374151]">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">Confidence</span>
                <span className="mono font-bold text-base text-[#10B981]">
                  {diagnosticData.confidence ?? 92}%
                </span>
              </div>
              <Shield className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>

          {/* Primary Hypothesis */}
          <div className="bg-[#1F2937]/70 border border-[#374151] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-xs uppercase font-bold text-[#EF4444] tracking-wider">
                Primary Root-Cause Hypothesis
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#F3F4F6] mb-1">
              {diagnosticData.primaryHypothesis?.title || 'Nominal Baseline Operating State'}
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {diagnosticData.primaryHypothesis?.description ||
                'Telemetry parameters are tracking within normal ISO 10816-3 Zone A and NEMA Class F thresholds.'}
            </p>
          </div>

          {/* Alternatives & Remediation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alternative Hypotheses */}
            {diagnosticData.alternatives && diagnosticData.alternatives.length > 0 && (
              <div className="bg-[#1F2937]/50 border border-[#374151] rounded-xl p-4">
                <h5 className="text-xs font-bold uppercase text-[#9CA3AF] tracking-wider mb-2">
                  Differential Diagnostic Hypotheses
                </h5>
                <div className="space-y-2">
                  {diagnosticData.alternatives.map((alt, idx) => (
                    <div key={idx} className="bg-[#111827] border border-[#374151]/80 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#F3F4F6]">{alt.title}</span>
                        {alt.likelihood && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1F2937] ${alt.color || 'text-[#F59E0B]'}`}>
                            {alt.likelihood}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF]">{alt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescriptive Remediation Steps */}
            {diagnosticData.remediationSteps && diagnosticData.remediationSteps.length > 0 && (
              <div className="bg-[#1F2937]/50 border border-[#374151] rounded-xl p-4">
                <h5 className="text-xs font-bold uppercase text-[#9CA3AF] tracking-wider mb-2">
                  Prescriptive Remediation Protocol
                </h5>
                <ol className="space-y-2 text-xs">
                  {diagnosticData.remediationSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[#D1D5DB] bg-[#111827] border border-[#374151]/80 rounded-lg p-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-tight">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-industrial-800 border border-industrial-critical/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-industrial-critical" />
            <span className="text-xs text-gray-500">Imminent Risks (&lt;7d)</span>
          </div>
          <div className="text-3xl font-bold text-industrial-critical">
            {predictions.filter(p => p.estimatedDays <= 7).length}
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Require immediate attention</p>
        </div>
        <div className="bg-industrial-800 border border-industrial-warning/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-industrial-warning" />
            <span className="text-xs text-gray-500">Approaching (7-21d)</span>
          </div>
          <div className="text-3xl font-bold text-industrial-warning">
            {predictions.filter(p => p.estimatedDays > 7 && p.estimatedDays <= 21).length}
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Schedule preventive maintenance</p>
        </div>
        <div className="bg-industrial-800 border border-industrial-success/20 rounded-xl p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-industrial-success" />
            <span className="text-xs text-gray-500">Model Confidence</span>
          </div>
          <div className="text-3xl font-bold text-industrial-success">
            {Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100)}%
          </div>
          <p className="text-[10px] text-gray-600 mt-1">Average prediction confidence</p>
        </div>
      </div>

      {/* Probability chart */}
      <div className="bg-industrial-800 border border-industrial-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Failure Probability by Equipment</h3>
        <p className="text-xs text-gray-500 mb-4">Higher bars indicate greater failure risk</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
            <XAxis dataKey="name" tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="probability" name="Failure Probability" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.probability > 0.7 ? '#EF4444' : entry.probability > 0.4 ? '#F59E0B' : '#10B981'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">Detailed Predictions</h3>
        {predictions.map(pred => (
          <div
            key={pred.id}
            className="bg-industrial-800 border border-industrial-700 rounded-xl p-5 card-hover"
          >
            <div className="flex items-start gap-4">
              {/* Urgency indicator */}
              <div className="shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                  style={{ backgroundColor: `${getUrgencyColor(pred.estimatedDays)}15`, border: `1px solid ${getUrgencyColor(pred.estimatedDays)}30` }}
                >
                  <span className="text-lg font-bold font-mono" style={{ color: getUrgencyColor(pred.estimatedDays) }}>
                    {pred.estimatedDays}
                  </span>
                  <span className="text-[8px] text-gray-500 -mt-0.5">DAYS</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-200">{pred.equipmentName}</h4>
                  <span className="text-xs text-gray-500">{pred.equipmentId}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  <span className="font-medium text-gray-300">{pred.failureMode}</span> — {pred.recommendedAction}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-1">Probability</span>
                    <ProgressBar value={pred.probability * 100} color={getUrgencyColor(pred.estimatedDays)} height="h-1.5" />
                    <span className="text-xs font-mono mt-1 block" style={{ color: getUrgencyColor(pred.estimatedDays) }}>
                      {(pred.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-1">Confidence</span>
                    <ProgressBar value={pred.confidence * 100} color="#00F0FF" height="h-1.5" />
                    <span className="text-xs font-mono text-industrial-accent mt-1 block">{(pred.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-1">Impact</span>
                    <span className={`text-xs font-medium ${
                      pred.impact === 'High' ? 'text-industrial-critical' :
                      pred.impact === 'Medium' ? 'text-industrial-warning' :
                      'text-industrial-success'
                    }`}>{pred.impact}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-1">Est. Cost</span>
                    <span className="text-xs font-mono text-gray-300">${pred.estimatedCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Urgency badge */}
              <div className="shrink-0">
                <span
                  className="text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${getUrgencyColor(pred.estimatedDays)}15`,
                    color: getUrgencyColor(pred.estimatedDays),
                    border: `1px solid ${getUrgencyColor(pred.estimatedDays)}30`,
                  }}
                >
                  {getUrgencyLabel(pred.estimatedDays)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
