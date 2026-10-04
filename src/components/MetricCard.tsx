import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  baselineValue: string | number;
  poolValue: string | number;
  deltaPct: number;
  isLowerBetter?: boolean;
  description: string;
  isPoolActive: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  baselineValue,
  poolValue,
  deltaPct,
  isLowerBetter = true,
  description,
  isPoolActive,
}) => {
  const isPositiveImprovement = isLowerBetter ? deltaPct > 0 : deltaPct < 0;
  const absDelta = Math.abs(deltaPct);

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition-all hover:border-slate-700">
      {/* Top row: Metric title + scenario indicator */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        {deltaPct !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
              isPositiveImprovement ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositiveImprovement ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            <span>{absDelta > 0 ? `${absDelta.toFixed(1)}%` : '0%'}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              {isPositiveImprovement ? 'better' : 'change'}
            </span>
          </div>
        )}
      </div>

      {/* Main big value display */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>

      {/* Contextual Description */}
      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
        {description}
      </p>

      {/* Side-by-Side Scenario Footprint */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Baseline:</span>
          <span
            className={`font-mono tabular-nums ${
              !isPoolActive ? 'font-bold text-slate-200' : 'text-slate-400'
            }`}
          >
            {typeof baselineValue === 'number' ? baselineValue.toLocaleString() : baselineValue} {unit}
          </span>
        </div>

        <span className="text-slate-600">vs</span>

        <div className="flex items-center gap-1.5">
          <span className="text-amber-500/80">Inverter Pool:</span>
          <span
            className={`font-mono tabular-nums ${
              isPoolActive ? 'font-bold text-amber-400' : 'text-slate-400'
            }`}
          >
            {typeof poolValue === 'number' ? poolValue.toLocaleString() : poolValue} {unit}
          </span>
        </div>
      </div>
    </div>
  );
};
