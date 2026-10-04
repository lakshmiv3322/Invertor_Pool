import React, { useState } from 'react';
import { getSensitivityData } from '../engine/simulation';
import { Layers, Activity, Zap, TrendingDown, Battery, Shield, CheckCircle2 } from 'lucide-react';

export const SensitivityView: React.FC = () => {
  const sensData = getSensitivityData();
  const [selectedPen, setSelectedPen] = useState<'30' | '50' | '70'>('50');
  const [selectedOutage, setSelectedOutage] = useState<'low' | 'base' | 'high'>('base');

  const scenarioKey = `pen${selectedPen}_${selectedOutage}`;
  const record = sensData.sens[scenarioKey];

  if (!record) return null;

  const b = record.baseline;
  const p = record.pool;

  const deltaOutageAll = +(((p.outage_all[0] - b.outage_all[0]) / b.outage_all[0]) * 100).toFixed(1);
  const deltaOutageInv = +(((p.outage_inv[0] - b.outage_inv[0]) / b.outage_inv[0]) * 100).toFixed(1);
  const deltaOutageNoInv = +(((p.outage_noinv[0] - b.outage_noinv[0]) / b.outage_noinv[0]) * 100).toFixed(1);
  const deltaWorst10 = +(((p.worst10[0] - b.worst10[0]) / b.worst10[0]) * 100).toFixed(1);
  const deltaUnserved = +(((p.unserved_kwh[0] - b.unserved_kwh[0]) / b.unserved_kwh[0]) * 100).toFixed(1);
  const deltaCycles = +(((p.cycles_inv[0] - b.cycles_inv[0]) / b.cycles_inv[0]) * 100).toFixed(1);
  const deltaAnnualMax = +(((p.annual_max[0] - b.annual_max[0]) / b.annual_max[0]) * 100).toFixed(1);
  const deltaOverload = +(((p.overload_h[0] - b.overload_h[0]) / b.overload_h[0]) * 100).toFixed(1);

  const maxProfile = Math.max(...b.profile, ...p.profile, b.C0, 150);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <span>Sensitivity Analysis Benchmark</span>
              <span>·</span>
              <span>{sensData.seeds} Monte Carlo Seeds</span>
              <span>·</span>
              <span className="text-emerald-400">9 Parameter Matrix Combinations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Feeder Penetration & Outage Severity Matrix
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Examine Inverter Pool resilience gains across inverter adoption levels (30%, 50%, 70%) and grid outage stress scenarios (Low, Base, High frequency). All numbers loaded directly from benchmark simulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs">
              <span className="text-slate-500 block">Transformer C0</span>
              <span className="font-semibold text-amber-400 font-mono">{b.C0.toFixed(1)} kW</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs">
              <span className="text-slate-500 block">Enrolled Fleet</span>
              <span className="font-semibold text-slate-200 font-mono">
                {b.n_enr.toFixed(0)} / {b.n_inv.toFixed(0)} Inverters
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Selectors */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {/* Penetration Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Inverter Penetration:
            </span>
            <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
              {(['30', '50', '70'] as const).map((pen) => (
                <button
                  key={pen}
                  onClick={() => setSelectedPen(pen)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    selectedPen === pen
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pen}% Adoption ({pen === '30' ? '71' : pen === '50' ? '115' : '157'} Inv)
                </button>
              ))}
            </div>
          </div>

          {/* Outage Severity Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Grid Outage Scenario:
            </span>
            <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1">
              {(['low', 'base', 'high'] as const).map((scen) => (
                <button
                  key={scen}
                  onClick={() => setSelectedOutage(scen)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                    selectedOutage === scen
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {scen === 'base' ? 'Medium (Base)' : scen} Outages
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Grid for Selected Matrix Point */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outage All */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Avg Outage per HH</span>
            <span className="text-emerald-400 font-semibold">{deltaOutageAll}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.outage_all[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">hrs/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.outage_all[0].toFixed(1)} ± {b.outage_all[1].toFixed(1)}</span>
            <span className="text-amber-400 font-medium">Pool: {p.outage_all[0].toFixed(1)} ± {p.outage_all[1].toFixed(1)}</span>
          </div>
        </div>

        {/* Inverter Owners Outage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inverter Owners Outage</span>
            <span className="text-emerald-400 font-semibold">{deltaOutageInv}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.outage_inv[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">hrs/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.outage_inv[0].toFixed(1)} hrs</span>
            <span className="text-amber-400 font-medium">Pool: {p.outage_inv[0].toFixed(1)} hrs</span>
          </div>
        </div>

        {/* Non-Inverter Households Outage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Non-Inverter Households</span>
            <span className="text-emerald-400 font-semibold">{deltaOutageNoInv}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.outage_noinv[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">hrs/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.outage_noinv[0].toFixed(1)} hrs</span>
            <span className="text-amber-400 font-medium">Pool: {p.outage_noinv[0].toFixed(1)} hrs</span>
          </div>
        </div>

        {/* Annual Max Peak kW */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Peak Feeder Load</span>
            <span className="text-emerald-400 font-semibold">{deltaAnnualMax}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.annual_max[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.annual_max[0].toFixed(1)} kW</span>
            <span className="text-amber-400 font-medium">Pool: {p.annual_max[0].toFixed(1)} kW</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Profile for Selected Combination */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>24-Hour Feeder Load Profile ({selectedPen}% Penetration, {selectedOutage.toUpperCase()} Outage)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of diurnal load curve against 134.6 kW transformer capacity limit.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-slate-500 inline-block"></span>
              <span className="text-slate-400">Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-amber-400 inline-block"></span>
              <span className="text-amber-400 font-semibold">Inverter Pool</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-rose-500 inline-block border-b border-dashed border-rose-400"></span>
              <span className="text-rose-400 font-medium">C0 ({b.C0.toFixed(1)} kW)</span>
            </div>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 50, 100, 150].map((val) => {
              const y = 220 - (val / maxProfile) * 200;
              return (
                <g key={val}>
                  <line x1="40" y1={y} x2="780" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="32" y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                    {val}kW
                  </text>
                </g>
              );
            })}

            {/* Transformer Capacity Line */}
            {(() => {
              const yC0 = 220 - (b.C0 / maxProfile) * 200;
              return (
                <g>
                  <line x1="40" y1={yC0} x2="780" y2={yC0} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="775" y={yC0 - 6} textAnchor="end" fill="#fb7185" fontSize="10" fontWeight="bold">
                    Capacity Limit: {b.C0.toFixed(1)} kW
                  </text>
                </g>
              );
            })()}

            {/* Baseline Path */}
            {(() => {
              const pts = b.profile.map((val, h) => {
                const x = 40 + (h / 23) * 740;
                const y = 220 - (val / maxProfile) * 200;
                return `${x},${y}`;
              }).join(' ');
              return <polyline fill="none" stroke="#64748b" strokeWidth="2.5" points={pts} strokeLinecap="round" strokeLinejoin="round" />;
            })()}

            {/* Pool Path */}
            {(() => {
              const pts = p.profile.map((val, h) => {
                const x = 40 + (h / 23) * 740;
                const y = 220 - (val / maxProfile) * 200;
                return `${x},${y}`;
              }).join(' ');
              return <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points={pts} strokeLinecap="round" strokeLinejoin="round" />;
            })()}

            {/* X-Axis Hour Labels */}
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => {
              const x = 40 + (h / 23) * 740;
              return (
                <text key={h} x={x} y="235" textAnchor="middle" fill="#64748b" fontSize="10">
                  {String(h).padStart(2, '0')}:00
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Full 9-Cell Sensitivity Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 overflow-hidden">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <span>Complete 9-Scenario Sensitivity Benchmark Table</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Penetration</th>
                <th className="py-2.5 px-3">Outage Stress</th>
                <th className="py-2.5 px-3">Baseline Outage</th>
                <th className="py-2.5 px-3">Pool Outage</th>
                <th className="py-2.5 px-3">Outage Reduction</th>
                <th className="py-2.5 px-3">Inverter Outage (Pool)</th>
                <th className="py-2.5 px-3">Non-Inv Outage (Pool)</th>
                <th className="py-2.5 px-3">Unserved Energy Δ</th>
                <th className="py-2.5 px-3">Peak Load Δ</th>
                <th className="py-2.5 px-3">Battery Cycles Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {Object.entries(sensData.sens).map(([key, sc]) => {
                const isCurrent = key === scenarioKey;
                const parts = key.split('_');
                const pen = parts[0].replace('pen', '') + '%';
                const scen = parts[1];
                const baseOut = sc.baseline.outage_all[0];
                const poolOut = sc.pool.outage_all[0];
                const redPct = (((poolOut - baseOut) / baseOut) * 100).toFixed(1);
                const invOut = sc.pool.outage_inv[0];
                const noInvOut = sc.pool.outage_noinv[0];
                const unsDelta = (((sc.pool.unserved_kwh[0] - sc.baseline.unserved_kwh[0]) / sc.baseline.unserved_kwh[0]) * 100).toFixed(1);
                const peakDelta = (((sc.pool.annual_max[0] - sc.baseline.annual_max[0]) / sc.baseline.annual_max[0]) * 100).toFixed(1);
                const cycDelta = (((sc.pool.cycles_inv[0] - sc.baseline.cycles_inv[0]) / sc.baseline.cycles_inv[0]) * 100).toFixed(1);

                return (
                  <tr
                    key={key}
                    onClick={() => {
                      setSelectedPen(parts[0].replace('pen', '') as any);
                      setSelectedOutage(scen as any);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/10 text-amber-200 font-semibold'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3">{pen}</td>
                    <td className="py-2.5 px-3 capitalize font-sans">{scen}</td>
                    <td className="py-2.5 px-3 text-slate-400">{baseOut.toFixed(1)} h</td>
                    <td className="py-2.5 px-3 text-white font-bold">{poolOut.toFixed(1)} h</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{redPct}%</td>
                    <td className="py-2.5 px-3 text-amber-400">{invOut.toFixed(1)} h</td>
                    <td className="py-2.5 px-3 text-slate-300">{noInvOut.toFixed(1)} h</td>
                    <td className="py-2.5 px-3 text-emerald-400">{unsDelta}%</td>
                    <td className="py-2.5 px-3 text-emerald-400">{peakDelta}%</td>
                    <td className="py-2.5 px-3 text-emerald-400">{cycDelta}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
