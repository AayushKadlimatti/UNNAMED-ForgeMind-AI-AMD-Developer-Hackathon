import React, { useState, useEffect } from 'react';
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
import { Cpu, Zap, Activity, Clock, ShieldCheck, Flame, BarChart3, Database } from 'lucide-react';

export default function AmdComputeHUD() {
  const [surgeMode, setSurgeMode] = useState(true);
  const [throughputHistory, setThroughputHistory] = useState([
    { time: '10s', tok_s: 1120, latency: 1.15 },
    { time: '9s', tok_s: 1145, latency: 1.18 },
    { time: '8s', tok_s: 1160, latency: 1.16 },
    { time: '7s', tok_s: 1184, latency: 1.20 },
    { time: '6s', tok_s: 1178, latency: 1.19 },
    { time: '5s', tok_s: 1192, latency: 1.17 },
    { time: '4s', tok_s: 1184, latency: 1.18 },
    { time: '3s', tok_s: 1188, latency: 1.16 },
    { time: '2s', tok_s: 1180, latency: 1.18 },
    { time: '1s', tok_s: 1184, latency: 1.18 },
  ]);

  // Live throughput jitter simulation matching AMD Instinct MI300X continuous batching
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughputHistory((prev) => {
        const baseRate = surgeMode ? 1184.0 : 114.2;
        const jitter = (Math.random() - 0.5) * (surgeMode ? 35.0 : 6.0);
        const newRate = Math.round((baseRate + jitter) * 10) / 10;
        const newLatency = Math.round((1.18 + (Math.random() - 0.5) * 0.04) * 100) / 100;
        const nowSec = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });

        const updated = [...prev.slice(1), { time: nowSec, tok_s: newRate, latency: newLatency }];
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [surgeMode]);

  const currentThroughput = surgeMode ? 1184.0 : 114.2;
  const throughputLabel = surgeMode ? '1,184.0 tok/s (16-Pump Burst)' : '114.2 tok/s (Single-Stream)';

  return (
    <div className="bg-industrial-800 border border-industrial-700 rounded-2xl p-6 flex flex-col gap-6 shadow-xl animate-fadeInUp">
      {/* Header with AMD Badge and Hardware Specification */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-industrial-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-industrial-amd/15 border border-industrial-amd/40 flex items-center justify-center font-bold text-industrial-amd shadow-[0_0_15px_rgba(237,28,36,0.25)]">
            <Cpu className="w-6 h-6 text-industrial-amd" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-primary text-lg tracking-tight">
                Compute Engine: AMD Instinct MI300X
              </h3>
              <span className="badge-amd">ROCm 6.2 / vLLM</span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              TokenFactory Continuous Batching • 192GB HBM3 • 5.3 TB/s Memory Bandwidth
            </p>
          </div>
        </div>

        {/* Surge Mode Interactive Toggle */}
        <div className="flex items-center gap-3 bg-industrial-900 border border-industrial-700 p-1.5 rounded-xl">
          <button
            onClick={() => setSurgeMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !surgeMode
                ? 'bg-industrial-accent/20 border border-industrial-accent text-industrial-accent shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Single-Stream (1x)
          </button>
          <button
            onClick={() => setSurgeMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              surgeMode
                ? 'bg-industrial-amd text-white shadow-[0_0_15px_rgba(237,28,36,0.5)]'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            16-Pump Burst (10x)
          </button>
        </div>
      </div>

      {/* Dynamic Status Callout Banner */}
      {surgeMode ? (
        <div className="bg-industrial-amd/10 border-l-4 border-industrial-amd rounded-r-xl p-4 flex items-center justify-between text-xs text-text-primary">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-industrial-amd pulse-dot-amd" />
            <div>
              <span className="font-bold text-industrial-amd tracking-wider uppercase mr-1">
                ⚡ 16-Pump Concurrency Surge Active
              </span>
              <span>
                ROCm continuous batching is processing 16 simultaneous fault-diagnosis streams at 1,184 tok/s aggregate throughput (batch window: 2.35 s).
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-block mono font-bold text-industrial-amd text-sm pl-4">
            1,184.0 tok/s
          </span>
        </div>
      ) : (
        <div className="bg-industrial-accent/10 border-l-4 border-industrial-accent rounded-r-xl p-4 flex items-center justify-between text-xs text-text-primary">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-industrial-accent pulse-dot-regular" />
            <div>
              <span className="font-bold text-industrial-accent tracking-wider uppercase mr-1">
                🔵 Single-Stream Execution Mode
              </span>
              <span>
                AMD ROCm / vLLM continuous batching ready. Toggle to simulate 16-pump concurrency surge on the MI300X accelerator.
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-block mono font-bold text-industrial-accent text-sm pl-4">
            114.2 tok/s
          </span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-4 flex flex-col gap-1 card-hover">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Target Accelerator</span>
            <Cpu className="w-4 h-4 text-industrial-amd" />
          </div>
          <span className="text-xl font-bold font-mono text-text-primary">MI300X</span>
          <span className="text-[10px] text-text-secondary">AMD CDNA 3 Architecture</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-4 flex flex-col gap-1 card-hover">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>vLLM Throughput</span>
            <Zap className="w-4 h-4 text-industrial-accent" />
          </div>
          <span className={`text-xl font-bold font-mono ${surgeMode ? 'text-industrial-amd' : 'text-industrial-accent'}`}>
            {throughputLabel}
          </span>
          <span className="text-[10px] text-text-secondary">TokenFactory Inference Rate</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-4 flex flex-col gap-1 card-hover">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Inference Latency</span>
            <Clock className="w-4 h-4 text-industrial-warning" />
          </div>
          <span className="text-xl font-bold font-mono text-text-primary">1.18 s</span>
          <span className="text-[10px] text-industrial-success font-medium">TTFT: &lt; 0.22 s (Ultra-Low)</span>
        </div>

        <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-4 flex flex-col gap-1 card-hover">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>HBM3 Memory Pool</span>
            <Database className="w-4 h-4 text-industrial-success" />
          </div>
          <span className="text-xl font-bold font-mono text-text-primary">42.8 / 192 GB</span>
          <span className="text-[10px] text-text-secondary">5.3 TB/s Peak Bandwidth</span>
        </div>
      </div>

      {/* Live Token Throughput Stream Chart */}
      <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-industrial-amd" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Live Token Generation Velocity (tok/s) • Rolling AMD Instinct Stream
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2.5 h-0.5 bg-industrial-amd" /> Throughput
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2.5 h-0.5 bg-industrial-warning border-dashed" /> Target (1,200)
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputHistory} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="amdThroughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ED1C24" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ED1C24" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="time" stroke="#8B949E" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8B949E" domain={[0, surgeMode ? 1400 : 200]} tick={{ fontSize: 10 }} />
              <ReferenceLine y={1200} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: '1200 Target', fill: '#F59E0B', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#161B22', borderColor: '#21262D', borderRadius: '8px' }}
                itemStyle={{ color: '#E6EDF3', fontSize: '11px' }}
              />
              <Area
                type="monotone"
                dataKey="tok_s"
                name="Tokens / Sec"
                stroke="#ED1C24"
                strokeWidth={2}
                fill="url(#amdThroughputGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Exposure & Downtime Cost Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#3D1214] to-industrial-800 border border-industrial-amd/60 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-industrial-amd font-bold">
                Unplanned Downtime Cost
              </span>
              <span className="text-[10px] bg-industrial-amd/20 text-industrial-amd px-2 py-0.5 rounded font-mono font-bold">
                CRITICAL RISK
              </span>
            </div>
            <div className="text-3xl font-extrabold text-industrial-amd font-mono tracking-tight">
              $18,500 / min
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Heavy industry manufacturing exposure rate across stamping & conveyor drive trains.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-industrial-amd/30 text-xs">
            <div>
              <span className="text-text-secondary block text-[10px]">Legacy Triage (~75 min)</span>
              <span className="text-industrial-critical font-bold font-mono">$1.38 M Exposure</span>
            </div>
            <div>
              <span className="text-text-secondary block text-[10px]">ForgeMind AI (&lt; 2.5 min)</span>
              <span className="text-industrial-success font-bold font-mono">$46 K Residual</span>
            </div>
          </div>
        </div>

        {/* 16 Parallel ROCm Batch Stream Matrix */}
        <div className="bg-industrial-900 border border-industrial-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-text-secondary font-bold">
                ROCm vLLM Parallel Stream Matrix (16 Pumps)
              </span>
              <span className="text-[10px] text-industrial-accent font-mono">
                Batch Window: 2.35s
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Concurrent inference channels assigned to plant-wide conveyor & pump motors:
            </p>

            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded flex items-center justify-center font-mono text-[10px] font-bold border ${
                    surgeMode
                      ? 'bg-industrial-amd/20 border-industrial-amd/50 text-industrial-amd animate-pulse'
                      : i === 0
                      ? 'bg-industrial-accent/20 border-industrial-accent/50 text-industrial-accent'
                      : 'bg-industrial-800 border-industrial-700 text-text-secondary opacity-40'
                  }`}
                  title={`Stream #${i + 1} (${surgeMode ? 'Active Burst' : i === 0 ? 'Active Stream' : 'Idle'})`}
                >
                  P{i + 1 < 10 ? `0${i + 1}` : i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-secondary mt-3 pt-3 border-t border-industrial-700">
            <span className="flex items-center gap-1.5 text-industrial-success font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero External Cloud Dependencies
            </span>
            <span className="mono text-text-secondary">vLLM Continuous Batching v0.6.3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
