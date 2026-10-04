import React, { useState } from 'react';
import { ScenarioMetrics, ScenarioMode } from '../types';

interface OutageBarChartProps {
  baselineMetrics: ScenarioMetrics;
  poolMetrics: ScenarioMetrics;
  currentMode: ScenarioMode;
}

export const OutageBarChart: React.FC<OutageBarChartProps> = ({
  baselineMetrics,
  poolMetrics,
  currentMode,
}) => {
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  const cohorts = [
    {
      id: 'hh_avg',
      label: 'All Households & Shops (Average)',
      description: 'Annual critical outage hours per node across all 220 feeder connections',
      baseline: baselineMetrics.critical_load_outage_hours_all_nodes_year,
      pool: poolMetrics.critical_load_outage_hours_all_nodes_year,
    },
    {
      id: 'pool_participants',
      label: 'Inverter Owners (Pool Members)',
      description: 'Households with active smart-coordinated 150Ah inverter batteries',
      baseline: baselineMetrics.critical_load_outage_hours_controllable_nodes ?? 26.4,
      pool: poolMetrics.critical_load_outage_hours_controllable_nodes ?? 7.4,
    },
    {
      id: 'no_inverter',
      label: 'Non-Inverter Households',
      description: 'Homes without backup batteries (rely on grid resilience & feeder shedding)',
      baseline: baselineMetrics.critical_load_outage_hours_no_inverter_nodes ?? 210.6,
      pool: poolMetrics.critical_load_outage_hours_no_inverter_nodes ?? 174.7,
    },
    {
      id: 'worst_10',
      label: 'Worst 10% Vulnerable Nodes',
      description: 'Most vulnerable connections experiencing peak gridlessness on feeder tail',
      baseline: baselineMetrics.critical_load_outage_hours_worst_10_percent,
      pool: poolMetrics.critical_load_outage_hours_worst_10_percent,
    },
  ];

  const maxVal = Math.max(...cohorts.flatMap(c => [c.baseline, c.pool]), 240);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Critical-Load Outage Hours Comparison</span>
            <span className="text-[11px] text-slate-400 font-normal">· Hours / Year</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrates resilience gains across community segments from fair load prioritization.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-slate-500"></span>
            <span className="text-slate-300">Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500"></span>
            <span className="text-amber-400 font-medium">Inverter Pool</span>
          </div>
        </div>
      </div>

      {/* Bar Group Grid */}
      <div className="space-y-4 pt-2">
        {cohorts.map((cohort) => {
          const delta = cohort.baseline - cohort.pool;
          const deltaPct = cohort.baseline > 0 ? ((delta / cohort.baseline) * 100).toFixed(1) : '0';
          const isSelected = selectedCohort === cohort.id;

          const baselineWidthPct = (cohort.baseline / maxVal) * 100;
          const poolWidthPct = (cohort.pool / maxVal) * 100;

          return (
            <div
              key={cohort.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500/40 bg-slate-800/80'
                  : 'border-slate-800/60 bg-slate-950/40 hover:border-slate-700'
              }`}
              onClick={() => setSelectedCohort(isSelected ? null : cohort.id)}
            >
              {/* Header row for cohort */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div>
                  <span className="font-semibold text-slate-200">{cohort.label}</span>
                  <span className="hidden sm:inline text-slate-500 ml-2">· {cohort.description}</span>
                </div>

                <div className="flex items-center gap-2 font-mono tabular-nums">
                  {delta > 0 ? (
                    <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      -{deltaPct}% outage hrs
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Parity</span>
                  )}
                </div>
              </div>

              {/* Dual Bars */}
              <div className="space-y-1.5">
                {/* Baseline Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[10px] text-slate-400 font-mono">Baseline</span>
                  <div className="relative flex-1 h-5 rounded bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-mono font-semibold text-slate-200 ${
                        currentMode === 'baseline' ? 'bg-slate-400' : 'bg-slate-600/80'
                      }`}
                      style={{ width: `${Math.max(8, baselineWidthPct)}%` }}
                    >
                      {cohort.baseline} hrs
                    </div>
                  </div>
                </div>

                {/* Inverter Pool Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[10px] text-amber-400 font-mono font-medium">Inv Pool</span>
                  <div className="relative flex-1 h-5 rounded bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-slate-950 ${
                        currentMode === 'pool'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm shadow-amber-500/30'
                          : 'bg-amber-600/70 text-slate-100'
                      }`}
                      style={{ width: `${Math.max(8, poolWidthPct)}%` }}
                    >
                      {cohort.pool} hrs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span>* Critical load includes refrigeration, medical essentials, lighting, and communication.</span>
        <span className="text-amber-400/90 font-medium">Simulated across 8,760 hours</span>
      </div>
    </div>
  );
};
