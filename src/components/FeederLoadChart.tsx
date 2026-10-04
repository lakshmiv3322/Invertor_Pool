import React, { useState } from 'react';
import { ScenarioMode } from '../types';

interface FeederLoadChartProps {
  baselineLoads: number[]; // 24 values
  poolLoads: number[]; // 24 values
  baselineCharging?: number[];
  poolCharging?: number[];
  currentMode: ScenarioMode;
}

export const FeederLoadChart: React.FC<FeederLoadChartProps> = ({
  baselineLoads,
  poolLoads,
  baselineCharging,
  poolCharging,
  currentMode,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [showChargingOverlay, setShowChargingOverlay] = useState(false);

  // Transformer Capacity Limit C0 = 134.57 kW
  const transformerCapacityKw = 134.57;

  // Determine max Y scale
  const allValues = [...baselineLoads, ...poolLoads, transformerCapacityKw];
  const maxVal = Math.max(...allValues, 140);
  const yMax = Math.ceil(maxVal / 20) * 20;

  // Chart coordinates
  const width = 760;
  const height = 280;
  const padLeft = 55;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 45;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (hour: number) => padLeft + (hour / 23) * chartWidth;
  const getY = (val: number) => padTop + chartHeight - (val / yMax) * chartHeight;

  // Generate SVG path for a line
  const makeLinePath = (data: number[]) => {
    return data
      .map((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate SVG path for area fill
  const makeAreaPath = (data: number[]) => {
    const line = makeLinePath(data);
    const bottomY = getY(0);
    return `${line} L ${getX(23)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  };

  const baselinePath = makeLinePath(baselineLoads);
  const poolPath = makeLinePath(poolLoads);

  const baselineArea = makeAreaPath(baselineLoads);
  const poolArea = makeAreaPath(poolLoads);

  // Y-axis ticks (5 ticks)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const formatHour = (h: number) => {
    const period = h < 12 ? 'AM' : 'PM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${period}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>24-Hour Aggregated Feeder Load Profile</span>
            <span className="text-[11px] text-slate-400 font-normal">· Hourly kW</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares uncoordinated grid demand against Inverter Pool load shifting & peak shaving against transformer rating.
          </p>
        </div>

        {/* Legend & Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 border border-slate-300"></span>
            <span className="text-slate-300 font-medium">Baseline</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
            <span className="text-amber-400 font-bold">Inverter Pool</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-rose-500 border-b border-dashed border-rose-400"></span>
            <span className="text-rose-400 font-semibold text-[11px]">C0 (134.6 kW)</span>
          </div>

          <button
            onClick={() => setShowChargingOverlay(!showChargingOverlay)}
            className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
              showChargingOverlay
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showChargingOverlay ? 'Hide Chg Load' : 'Show Chg Load'}
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[320px] select-none"
          onMouseLeave={() => setHoveredHour(null)}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={currentMode === 'baseline' ? '0.35' : '0.08'} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={currentMode === 'pool' ? '0.45' : '0.12'} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>

            {/* Shaded Evening Peak Stress Window 18:00 - 22:00 */}
            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.03" />
            </linearGradient>

            {/* Shaded Solar Window 10:00 - 15:00 */}
            <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Shaded Solar Charging Window (10:00 - 15:00) */}
          <rect
            x={getX(10)}
            y={padTop}
            width={getX(15) - getX(10)}
            height={chartHeight}
            fill="url(#solarGrad)"
            rx="4"
          />
          <text
            x={(getX(10) + getX(15)) / 2}
            y={padTop + 14}
            textAnchor="middle"
            className="text-[9px] fill-emerald-400 font-bold uppercase tracking-wider"
          >
            Solar Pre-Charge Window
          </text>

          {/* Shaded Evening Peak Stress Window (18:00 - 22:00) */}
          <rect
            x={getX(18)}
            y={padTop}
            width={getX(22) - getX(18)}
            height={chartHeight}
            fill="url(#stressGrad)"
            rx="4"
          />
          <text
            x={(getX(18) + getX(22)) / 2}
            y={padTop + 14}
            textAnchor="middle"
            className="text-[9px] fill-rose-400 font-bold uppercase tracking-wider"
          >
            Evening Peak Window
          </text>

          {/* Y Axis Grid Lines & Labels */}
          {yTicks.map((tickVal) => {
            const y = getY(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={tickVal === 0 ? '0' : '3 3'}
                  opacity={0.6}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono tabular-nums"
                >
                  {Math.round(tickVal)} kW
                </text>
              </g>
            );
          })}

          {/* Transformer Capacity Line */}
          {(() => {
            const yC0 = getY(transformerCapacityKw);
            return (
              <g>
                <line
                  x1={padLeft}
                  y1={yC0}
                  x2={padLeft + chartWidth}
                  y2={yC0}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft + chartWidth - 6}
                  y={yC0 - 6}
                  textAnchor="end"
                  fill="#fb7185"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  C0 Limit: {transformerCapacityKw.toFixed(1)} kW
                </text>
              </g>
            );
          })()}

          {/* X Axis Ticks & Labels */}
          {Array.from({ length: 24 }).map((_, h) => {
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
                      y2={padTop + chartHeight + 5}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padTop + chartHeight + 18}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-mono tabular-nums"
                    >
                      {String(h).padStart(2, '0')}:00
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={baselineArea} fill="url(#baselineGrad)" />
          <path d={poolArea} fill="url(#poolGrad)" />

          {/* Lines */}
          {/* Baseline Curve */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={currentMode === 'baseline' ? '2.5' : '1.8'}
            strokeDasharray={currentMode === 'pool' ? '4 2' : '0'}
            opacity={currentMode === 'pool' ? 0.65 : 1}
          />

          {/* Inverter Pool Curve */}
          <path
            d={poolPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={currentMode === 'pool' ? '3' : '2'}
          />

          {/* Optional Charging component overlay */}
          {showChargingOverlay && baselineCharging && (
            <path
              d={makeLinePath(baselineCharging)}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}
          {showChargingOverlay && poolCharging && (
            <path
              d={makeLinePath(poolCharging)}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
            />
          )}

          {/* Interactive hover line & dots */}
          {hoveredHour !== null && (
            <g>
              <line
                x1={getX(hoveredHour)}
                y1={padTop}
                x2={getX(hoveredHour)}
                y2={padTop + chartHeight}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />

              {/* Baseline Dot */}
              <circle
                cx={getX(hoveredHour)}
                cy={getY(baselineLoads[hoveredHour])}
                r="4.5"
                fill="#94a3b8"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Pool Dot */}
              <circle
                cx={getX(hoveredHour)}
                cy={getY(poolLoads[hoveredHour])}
                r="5"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Transparent Hover Hitboxes */}
          {Array.from({ length: 24 }).map((_, h) => {
            const x = getX(h) - chartWidth / 48;
            const w = chartWidth / 24;
            return (
              <rect
                key={h}
                x={x}
                y={padTop}
                width={w}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHour(h)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredHour !== null && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur transition-all"
            style={{
              left: `${Math.min(75, Math.max(15, (hoveredHour / 23) * 100))}%`,
              top: '12px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-white mb-1 flex items-center justify-between gap-4">
              <span>{formatHour(hoveredHour)} ({String(hoveredHour).padStart(2, '0')}:00)</span>
              {hoveredHour >= 18 && hoveredHour <= 22 && (
                <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded font-semibold">
                  Peak Stress
                </span>
              )}
            </div>

            <div className="space-y-1 font-mono text-[11px] tabular-nums">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="text-slate-400">Baseline Feeder:</span>
                <span className="font-semibold">{baselineLoads[hoveredHour]} kW</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-amber-400">
                <span>Inverter Pool:</span>
                <span className="font-bold">{poolLoads[hoveredHour]} kW</span>
              </div>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-4">
                <span className="text-slate-400">Shift / Shave Delta:</span>
                <span
                  className={`font-semibold ${
                    baselineLoads[hoveredHour] - poolLoads[hoveredHour] > 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {(baselineLoads[hoveredHour] - poolLoads[hoveredHour]) > 0 ? '-' : '+'}
                  {Math.abs(+(baselineLoads[hoveredHour] - poolLoads[hoveredHour]).toFixed(1))} kW
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Narrative Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>
            <strong className="text-slate-200">Off-Peak Pre-Charging:</strong> +10:00–15:00 solar window utilized at zero marginal stress.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
          <span>
            <strong className="text-slate-200">Peak Shaving:</strong> Shaves evening surge, keeping load below {transformerCapacityKw.toFixed(1)} kW transformer rating.
          </span>
        </div>
      </div>
    </div>
  );
};
