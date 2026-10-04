import React, { useState } from 'react';
import { getAblationData } from '../engine/simulation';
import { Sliders, CheckCircle2, BatteryCharging, ShieldAlert, Cpu, Layers } from 'lucide-react';

export const AblationView: React.FC = () => {
  const ablData = getAblationData();
  const [selectedLever, setSelectedLever] = useState<string>('all three levers');

  const levers = Object.keys(ablData.abl);
  const activeRecord = ablData.abl[selectedLever];

  if (!activeRecord) return null;

  const b = activeRecord.baseline;
  const p = activeRecord.pool;

  const leverDescriptions: Record<string, string> = {
    'all three levers': 'Full Inverter Pool system: (1) Smart Off-Peak Solar Pre-Charging + (2) Smart Plug Critical Load Protection + (3) Ride-Through Flexible Shedding.',
    'charging control only': 'Only coordinated charging: inverters shift charge draw to off-peak solar hours, but batteries do not prioritize critical loads during discharge.',
    'critical-only on battery only': 'Only appliance-level critical load isolation during battery operation; no coordinated off-peak charging schedule.',
    'ride-through-first shedding only': 'Only immediate automated shedding of flexible loads during grid voltage sag events; standard uncoordinated battery discharge.',
    'no levers (enrolled but inactive)': 'Inverters and smart plugs registered on network but operating in unmanaged fallback mode (null control reference).',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <span>Ablation Study</span>
              <span>·</span>
              <span>{ablData.seeds} Monte Carlo Seeds</span>
              <span>·</span>
              <span className="text-emerald-400">Mechanism Attribution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Component & Lever Contribution Breakdown
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Disentangling which algorithmic mechanisms deliver transformer peak shaving vs. critical load outage protection vs. battery life extension.
            </p>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs">
            <span className="text-slate-500 block">Baseline Transformer C0</span>
            <span className="font-semibold text-amber-400 font-mono">{b.C0.toFixed(1)} kW</span>
          </div>
        </div>

        {/* Levers Selector Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {levers.map((leverName) => {
            const isSelected = selectedLever === leverName;
            return (
              <button
                key={leverName}
                onClick={() => setSelectedLever(leverName)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-all capitalize ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {leverName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Lever Description Card */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
        <Cpu className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Active Control Configuration: {selectedLever}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {leverDescriptions[selectedLever]}
          </p>
        </div>
      </div>

      {/* Metric Cards Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outage All */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Outage Hours</span>
            <span className="text-emerald-400 font-semibold">
              {(((p.outage_all[0] - b.outage_all[0]) / b.outage_all[0]) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.outage_all[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">hrs/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.outage_all[0].toFixed(1)} h</span>
            <span className="text-amber-400 font-medium">Pool: {p.outage_all[0].toFixed(1)} h</span>
          </div>
        </div>

        {/* Inverter Outage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inverter Member Outage</span>
            <span className="text-emerald-400 font-semibold">
              {(((p.outage_inv[0] - b.outage_inv[0]) / b.outage_inv[0]) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.outage_inv[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">hrs/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.outage_inv[0].toFixed(1)} h</span>
            <span className="text-amber-400 font-medium">Pool: {p.outage_inv[0].toFixed(1)} h</span>
          </div>
        </div>

        {/* Peak Demand */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Peak Feeder Load</span>
            <span className="text-emerald-400 font-semibold">
              {(((p.annual_max[0] - b.annual_max[0]) / b.annual_max[0]) * 100).toFixed(1)}%
            </span>
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

        {/* Battery Cycles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Battery Degradation Cycles</span>
            <span className="text-emerald-400 font-semibold">
              {(((p.cycles_inv[0] - b.cycles_inv[0]) / b.cycles_inv[0]) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{p.cycles_inv[0].toFixed(1)}</span>
            <span className="text-xs text-slate-400">cyc/yr</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Baseline: {b.cycles_inv[0].toFixed(1)}</span>
            <span className="text-amber-400 font-medium">Pool: {p.cycles_inv[0].toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Comparative Ablation Summary Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 overflow-hidden">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <span>Cross-Lever Attribution Comparison Matrix</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Control Lever Regime</th>
                <th className="py-2.5 px-3">Avg Outage</th>
                <th className="py-2.5 px-3">Inverter Outage</th>
                <th className="py-2.5 px-3">Worst 10% Outage</th>
                <th className="py-2.5 px-3">Peak Feeder Load</th>
                <th className="py-2.5 px-3">Unserved kWh</th>
                <th className="py-2.5 px-3">Annual Battery Cycles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {Object.entries(ablData.abl).map(([leverName, rec]) => {
                const isSelected = leverName === selectedLever;
                const pool = rec.pool;
                const base = rec.baseline;
                const outRed = (((pool.outage_all[0] - base.outage_all[0]) / base.outage_all[0]) * 100).toFixed(1);
                const invRed = (((pool.outage_inv[0] - base.outage_inv[0]) / base.outage_inv[0]) * 100).toFixed(1);
                const peakRed = (((pool.annual_max[0] - base.annual_max[0]) / base.annual_max[0]) * 100).toFixed(1);

                return (
                  <tr
                    key={leverName}
                    onClick={() => setSelectedLever(leverName)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-200 font-semibold'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 capitalize font-sans">{leverName}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-white font-bold">{pool.outage_all[0].toFixed(1)} h</span>
                      <span className="text-emerald-400 ml-1.5 text-[10px]">({outRed}%)</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-amber-400">{pool.outage_inv[0].toFixed(1)} h</span>
                      <span className="text-emerald-400 ml-1.5 text-[10px]">({invRed}%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{pool.worst10[0].toFixed(1)} h</td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-200">{pool.annual_max[0].toFixed(1)} kW</span>
                      <span className="text-emerald-400 ml-1.5 text-[10px]">({peakRed}%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{pool.unserved_kwh[0].toFixed(0)} kWh</td>
                    <td className="py-2.5 px-3 text-slate-300">{pool.cycles_inv[0].toFixed(1)} cyc</td>
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
