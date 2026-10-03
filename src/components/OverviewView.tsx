import React from 'react';
import { MasterSimulationData, ScenarioMode } from '../types';
import { MetricCard } from './MetricCard';
import { FeederLoadChart } from './FeederLoadChart';
import { OutageBarChart } from './OutageBarChart';
import { Zap, ShieldCheck, BatteryCharging, Network, Clock, CheckCircle2 } from 'lucide-react';

interface OverviewViewProps {
  data: MasterSimulationData;
  scenarioMode: ScenarioMode;
  onToggleScenario: (mode: ScenarioMode) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  scenarioMode,
  onToggleScenario,
}) => {
  const isPoolActive = scenarioMode === 'pool';
  const activeMetrics = isPoolActive ? data.pool.metrics : data.baseline.metrics;
  const baseMetrics = data.baseline.metrics;
  const poolMetrics = data.pool.metrics;
  const improvements = data.pool.improvements;
  const summary = data.feeder_summary;

  return (
    <div className="space-y-6">
      {/* Hero Banner & Feeder Metadata */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <span>Feeder Simulation</span>
              <span>·</span>
              <span>8,760 Hourly Timesteps</span>
              <span>·</span>
              <span className="text-emerald-400">1-Year Horizon</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Inverter Pool — Neighbourhood Virtual Power Plant
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Coordinating distributed home and commercial inverter batteries into an autonomous micro-VPP to eliminate critical outage hours, shave evening feeder peaks, and protect distribution transformers.
            </p>
          </div>

          {/* Feeder Spec Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 lg:pt-0">
            <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 px-3 py-2 text-xs">
              <span className="text-slate-500 block">Feeder Node</span>
              <span className="font-semibold text-slate-200 font-mono">11kV Mayur Vihar</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 px-3 py-2 text-xs">
              <span className="text-slate-500 block">Connected Scale</span>
              <span className="font-semibold text-slate-200 font-mono">200 Homes + 20 Shops</span>
            </div>
            <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 px-3 py-2 text-xs">
              <span className="text-slate-500 block">Inverter Fleet</span>
              <span className="font-semibold text-amber-400 font-mono">
                {summary.controllable_inverters} / {summary.total_inverters} ({summary.controllable_share_pct}% Pool)
              </span>
            </div>
          </div>
        </div>

        {/* Mode Comparison Callout Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Simulation State:</span>
            {isPoolActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Inverter Pool Active (Coordinated Priority & Fair Dispatch)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                <Clock className="h-3.5 w-3.5" />
                Baseline Active (Uncoordinated Inverter Charging & Load Shed)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Toggle Mode:</span>
            <button
              onClick={() => onToggleScenario(isPoolActive ? 'baseline' : 'pool')}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Switch to {isPoolActive ? 'Baseline' : 'Inverter Pool'} View
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Slide-11 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Critical-load outage hours */}
        <MetricCard
          title="Critical Outage Hours"
          value={activeMetrics.critical_load_outage_hours_per_household_year}
          unit="hrs/hh/yr"
          baselineValue={baseMetrics.critical_load_outage_hours_per_household_year}
          poolValue={poolMetrics.critical_load_outage_hours_per_household_year}
          deltaPct={improvements.delta_outage_hours_pct}
          isLowerBetter={true}
          description="Average annual hours where essential critical loads (fridge, medical, lighting) lost power."
          isPoolActive={isPoolActive}
        />

        {/* Metric 2: Worst-served 10% outage hours */}
        <MetricCard
          title="Worst 10% Outage"
          value={activeMetrics.critical_load_outage_hours_worst_10_percent}
          unit="hrs/yr"
          baselineValue={baseMetrics.critical_load_outage_hours_worst_10_percent}
          poolValue={poolMetrics.critical_load_outage_hours_worst_10_percent}
          deltaPct={improvements.delta_worst_10_pct}
          isLowerBetter={true}
          description="Average outage duration experienced by the most vulnerable 10% of households on the feeder."
          isPoolActive={isPoolActive}
        />

        {/* Metric 3: Evening Feeder Peak (kW) */}
        <MetricCard
          title="Evening Feeder Peak"
          value={activeMetrics.evening_feeder_peak_kW}
          unit="kW"
          baselineValue={baseMetrics.evening_feeder_peak_kW}
          poolValue={poolMetrics.evening_feeder_peak_kW}
          deltaPct={improvements.delta_peak_pct}
          isLowerBetter={true}
          description="Maximum aggregate power demand drawn from 11kV substation between 6:00 PM – 10:00 PM."
          isPoolActive={isPoolActive}
        />

        {/* Metric 4: Unserved Energy (kWh/yr) */}
        <MetricCard
          title="Unserved Energy"
          value={activeMetrics.unserved_energy_kWh_year}
          unit="kWh/yr"
          baselineValue={baseMetrics.unserved_energy_kWh_year}
          poolValue={poolMetrics.unserved_energy_kWh_year}
          deltaPct={improvements.delta_unserved_pct}
          isLowerBetter={true}
          description="Total unserved electrical energy across all critical and flexible household & shop appliances."
          isPoolActive={isPoolActive}
        />
      </div>

      {/* Dual Core Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-Hour Feeder Load Line Chart (7 Cols) */}
        <div className="lg:col-span-7">
          <FeederLoadChart
            baselineLoads={data.discom_24h.baseline_feeder_load_kW}
            poolLoads={data.discom_24h.pool_feeder_load_kW}
            baselineCharging={data.discom_24h.baseline_charging_kW}
            poolCharging={data.discom_24h.pool_charging_kW}
            currentMode={scenarioMode}
          />
        </div>

        {/* Right: Critical Outage Comparison Bar Chart (5 Cols) */}
        <div className="lg:col-span-5">
          <OutageBarChart
            baselineMetrics={baseMetrics}
            poolMetrics={poolMetrics}
            currentMode={scenarioMode}
          />
        </div>
      </div>

      {/* Mechanism & Architectural Pillars Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2.5 mb-2 text-amber-400">
            <BatteryCharging className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">1. Off-Peak Solar Charging</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inverters intelligently pre-charge during midday solar surplus (11:00 AM – 3:00 PM) and early dawn off-peak windows, entering peak evening hours at 95–100% capacity without congesting the grid.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2.5 mb-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">2. Critical-Load Protection</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            During power outages and feeder stress alerts, smart plugs shed high-draw flexible loads (ACs, geysers), extending battery runtime by up to 300% for refrigerators, lighting, fans, and routers.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2.5 mb-2 text-sky-400">
            <Network className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">3. Fair Dispatch Credit Ledger</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A neighbourhood fairness ledger dynamically rotates curtailment obligations across participants. Households that defer flexible load accumulate priority credits for subsequent cycles.
          </p>
        </div>
      </div>
    </div>
  );
};
