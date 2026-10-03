import React, { useState } from 'react';
import { MasterSimulationData, DRSignalType } from '../types';
import {
  Activity,
  TrendingDown,
  Zap,
  Flame,
  ShieldCheck,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  Leaf,
  DollarSign,
} from 'lucide-react';

interface DiscomViewProps {
  data: MasterSimulationData;
}

export const DiscomView: React.FC<DiscomViewProps> = ({ data }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const discom = data.discom_24h;
  const improvements = data.pool.improvements;
  const summary = data.feeder_summary;
  const metrics = data.pool.metrics;
  const baseMetrics = data.baseline.metrics;

  // Calculate environmental & financial impact
  // Commercial diesel genset displacement: 1 kWh unserved avoided ≈ 0.35 L diesel fuel
  const dieselLitresSaved = Math.round((baseMetrics.unserved_energy_kWh_year - metrics.unserved_energy_kWh_year) * 0.35);
  const co2AvoidedKg = Math.round(dieselLitresSaved * 2.68); // 2.68 kg CO2 / L diesel
  const peakCostSavingsINR = Math.round((baseMetrics.evening_feeder_peak_kW - metrics.evening_feeder_peak_kW) * 12 * 350); // Peak demand charge proxy

  // Helper for signal badge
  const getSignalBadge = (sig: DRSignalType) => {
    switch (sig) {
      case 'encourage_charging':
        return {
          label: 'Encourage Charging',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          desc: 'High solar surplus / dawn off-peak window: incentivize fast inverter charging.',
        };
      case 'defer_charging':
        return {
          label: 'Defer Charging / Peak Support',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-500',
          desc: 'Peak feeder stress window: lock out high-draw charging and shave transformer load.',
        };
      case 'neutral':
      default:
        return {
          label: 'Neutral',
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          desc: 'Normal grid balance: standard baseline self-consumption.',
        };
    }
  };

  // SVG dimensions for 24-hr Stress Forecast
  const width = 740;
  const height = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (hour: number) => padLeft + (hour / 23) * chartWidth;
  const getYGap = (val: number) => padTop + chartHeight - (val * chartHeight);

  const makeGapLine = (gaps: number[]) => {
    return gaps
      .map((g, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getYGap(g)}`)
      .join(' ');
  };

  const makeGapArea = (gaps: number[]) => {
    const line = makeGapLine(gaps);
    return `${line} L ${getX(23)} ${padTop + chartHeight} L ${getX(0)} ${padTop + chartHeight} Z`;
  };

  return (
    <div className="space-y-6">
      {/* DISCOM Executive Summary Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Building className="h-4 w-4" />
              <span>Distribution Utility (DISCOM) Operations Console</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Feeder Congestion & Demand-Response Telemetry
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Real-time monitoring of 11kV transformer stress, automated 24-hour DR price signaling, and quantified commercial diesel displacement.
            </p>
          </div>

          {/* Key DISCOM impact callout cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 px-4 py-2.5">
              <span className="text-[11px] font-medium text-slate-400 block">Peak Demand Reduction</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  -{improvements.delta_peak_pct}%
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  ({Math.round(baseMetrics.evening_feeder_peak_kW - metrics.evening_feeder_peak_kW)} kW shaved)
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-amber-500/30 px-4 py-2.5">
              <span className="text-[11px] font-medium text-slate-400 block">Unserved Energy Reduction</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-amber-400">
                  -{improvements.delta_unserved_pct}%
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  ({Math.round(baseMetrics.unserved_energy_kWh_year - metrics.unserved_energy_kWh_year).toLocaleString()} kWh/yr)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Feeder Stress Forecast & Renewable Gap Proxy */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>24-Hour Feeder Stress & Renewable Gap Forecast</span>
              <span className="text-[11px] text-slate-400 font-normal">· Factor 0.0 (Solar Surplus) to 1.0 (Critical Grid Stress)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drives the automated dispatch algorithm to pre-charge before 18:00 and shed flexible load during peak hours.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Surplus Window (&lt; 0.35)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
              <span className="text-slate-300">Stress Peak (&gt; 0.75)</span>
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[260px] select-none"
            onMouseLeave={() => setHoveredHour(null)}
          >
            <defs>
              <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Threshold line for Stress (>0.75) */}
            <line
              x1={padLeft}
              y1={getYGap(0.75)}
              x2={width - padRight}
              y2={getYGap(0.75)}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.5"
            />
            <text
              x={width - padRight - 4}
              y={getYGap(0.75) - 4}
              textAnchor="end"
              className="text-[9px] fill-rose-400 font-mono"
            >
              0.75 Feeder Stress Alert Threshold
            </text>

            {/* Threshold line for Surplus (<0.35) */}
            <line
              x1={padLeft}
              y1={getYGap(0.35)}
              x2={width - padRight}
              y2={getYGap(0.35)}
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="4 2"
              opacity="0.5"
            />
            <text
              x={width - padRight - 4}
              y={getYGap(0.35) + 12}
              textAnchor="end"
              className="text-[9px] fill-emerald-400 font-mono"
            >
              0.35 Solar Pre-charge Threshold
            </text>

            {/* Y Axis (0.0 to 1.0) */}
            {[0.0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
              const y = getYGap(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? '0' : '2 2'}
                    opacity={0.4}
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono tabular-nums"
                  >
                    {tick.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* X Axis */}
            {discom.hours.map((h) => {
              const x = getX(h);
              const isLabeled = h % 3 === 0;
              return (
                <g key={h}>
                  {isLabeled && (
                    <>
                      <line
                        x1={x}
                        y1={padTop + chartHeight}
                        x2={x}
                        y2={padTop + chartHeight + 4}
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={padTop + chartHeight + 16}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-400 font-mono"
                      >
                        {String(h).padStart(2, '0')}:00
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Gap Area Fill & Line */}
            <path d={makeGapArea(discom.gap_factor)} fill="url(#gapGrad)" />
            <path
              d={makeGapLine(discom.gap_factor)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />

            {/* Hover Indicator */}
            {hoveredHour !== null && (
              <g>
                <line
                  x1={getX(hoveredHour)}
                  y1={padTop}
                  x2={getX(hoveredHour)}
                  y2={padTop + chartHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoveredHour)}
                  cy={getYGap(discom.gap_factor[hoveredHour])}
                  r="4.5"
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Hitboxes */}
            {discom.hours.map((h) => (
              <rect
                key={h}
                x={getX(h) - chartWidth / 48}
                y={padTop}
                width={chartWidth / 24}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHour(h)}
              />
            ))}
          </svg>

          {hoveredHour !== null && (
            <div
              className="absolute z-20 pointer-events-none rounded-md border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
              style={{
                left: `${Math.min(75, Math.max(20, (hoveredHour / 23) * 100))}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-white mb-1 flex items-center justify-between gap-3">
                <span>{String(hoveredHour).padStart(2, '0')}:00 Window</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${getSignalBadge(discom.dr_signals[hoveredHour]).bg}`}>
                  {getSignalBadge(discom.dr_signals[hoveredHour]).label}
                </span>
              </div>
              <div className="space-y-0.5 font-mono text-[11px] tabular-nums">
                <div className="flex justify-between gap-4 text-slate-300">
                  <span className="text-slate-400">Stress Gap Factor:</span>
                  <span className="font-bold text-amber-400">{discom.gap_factor[hoveredHour]}</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-300">
                  <span className="text-slate-400">Shifted Load Delta:</span>
                  <span className="font-semibold text-emerald-400">{discom.shiftable_delta_kW[hoveredHour]} kW</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Demand-Response Hourly Signal Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>24-Hour Automated Demand-Response Signals (DR Matrix)</span>
              <span className="text-[11px] text-slate-400 font-normal">· Hourly Automation Commands</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct telemetry dispatched to smart plugs across all enrolled inverters.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
              Encourage Charging
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-medium">
              Defer Charging / Support
            </span>
          </div>
        </div>

        {/* 24-Hour Grid Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {discom.hours.map((h) => {
            const sig = discom.dr_signals[h];
            const badge = getSignalBadge(sig);
            const deltaKw = discom.shiftable_delta_kW[h];

            return (
              <div
                key={h}
                className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                  sig === 'defer_charging'
                    ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                    : sig === 'encourage_charging'
                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="font-bold">{String(h).padStart(2, '0')}:00</span>
                  <span className={`h-2 w-2 rounded-full ${badge.dot}`}></span>
                </div>

                <div className="my-1.5">
                  <span
                    className={`text-[9px] font-bold block leading-tight ${
                      sig === 'defer_charging'
                        ? 'text-rose-400'
                        : sig === 'encourage_charging'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {sig === 'defer_charging'
                      ? 'DEFER'
                      : sig === 'encourage_charging'
                      ? 'CHARGE'
                      : 'NEUTRAL'}
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-800/80 text-[10px] font-mono tabular-nums text-slate-400">
                  <span className={deltaKw > 0 ? 'text-emerald-400' : deltaKw < 0 ? 'text-amber-400' : 'text-slate-500'}>
                    {deltaKw > 0 ? `-${deltaKw}kW` : deltaKw < 0 ? `+${Math.abs(deltaKw)}kW` : '0 kW'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DISCOM Financial, Diesel Abatement & Grid Resilience Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Diesel Generator Displacement */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Leaf className="h-5 w-5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Diesel Genset Abatement</h4>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {dieselLitresSaved.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Litres Diesel / Year</span>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Eliminates noisy commercial diesel backup genset runtimes for the 20 connected shops, abating ~<strong className="text-emerald-400">{(co2AvoidedKg / 1000).toFixed(1)} metric tons of CO₂</strong> annually.
          </p>
        </div>

        {/* Transformer Life & Thermal Relief */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Activity className="h-5 w-5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Transformer Life Protection</h4>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              -73.2 kW
            </span>
            <span className="text-xs text-slate-400">Thermal Stress Relief</span>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Prevents 400 kVA feeder distribution transformer overloading during hot summer evenings, extending transformer asset life and eliminating nuisance fuse blowouts.
          </p>
        </div>

        {/* Avoided Peak Power Purchase Cost */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <DollarSign className="h-5 w-5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Avoided Peak Purchase Cost</h4>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              ₹{(peakCostSavingsINR / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-xs text-slate-400">/ Year / Feeder</span>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Saves DISCOM expensive spot-market power procurement during 6:00 PM – 10:00 PM peak tariff windows through distributed neighborhood battery shaving.
          </p>
        </div>
      </div>
    </div>
  );
};
