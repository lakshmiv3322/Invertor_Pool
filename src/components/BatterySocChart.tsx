import React, { useState } from 'react';

interface BatterySocChartProps {
  baselineSoc: number[]; // 24 values
  poolSoc: number[]; // 24 values
  batteryCapacityKwh: number;
  nodeName: string;
  isControllable: boolean;
}

export const BatterySocChart: React.FC<BatterySocChartProps> = ({
  baselineSoc,
  poolSoc,
  batteryCapacityKwh,
  nodeName,
  isControllable,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (hour: number) => padLeft + (hour / 23) * chartWidth;
  const getY = (val: number) => padTop + chartHeight - (val / 100) * chartHeight;

  const makeLinePath = (data: number[]) => {
    return data
      .map((val, idx) => {
        const x = getX(idx);
        const y = getY(Math.max(0, Math.min(100, val)));
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const makeAreaPath = (data: number[]) => {
    const line = makeLinePath(data);
    const bottomY = getY(20); // down to min soc
    return `${line} L ${getX(23)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  };

  const baselinePath = makeLinePath(baselineSoc);
  const poolPath = makeLinePath(poolSoc);
  const poolArea = makeAreaPath(poolSoc);

  const formatHour = (h: number) => {
    const hr = h % 12 === 0 ? 12 : h % 12;
    const period = h < 12 ? 'AM' : 'PM';
    return `${hr} ${period}`;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Battery State of Charge (SoC) — {nodeName}</span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({batteryCapacityKwh} kWh Bank)
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            {isControllable
              ? 'Enrolled Inverter Pool: Coordinated charging enters evening peak near 100% and safeguards backup.'
              : 'Standard Operation: Uncoordinated charging and unmanaged load depletion.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-300">Baseline SoC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="text-amber-400 font-medium">Inverter Pool SoC</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[240px] select-none"
          onMouseLeave={() => setHoveredHour(null)}
        >
          <defs>
            <linearGradient id="socPoolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 20% Min SoC Buffer Zone */}
          <rect
            x={padLeft}
            y={getY(20)}
            width={chartWidth}
            height={getY(0) - getY(20)}
            fill="#ef4444"
            fillOpacity="0.08"
          />
          <text
            x={width - padRight - 4}
            y={getY(20) - 4}
            textAnchor="end"
            className="text-[9px] fill-rose-400/80 font-mono"
          >
            20% Reserve Protection Buffer
          </text>

          {/* Y Ticks (0%, 20%, 50%, 80%, 100%) */}
          {[20, 50, 80, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={tick === 20 ? '4 2' : '2 2'}
                  opacity={0.5}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* X Ticks (every 3 hours) */}
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

          {/* Pool SoC Area Fill */}
          <path d={poolArea} fill="url(#socPoolGrad)" />

          {/* Baseline SoC Line */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Pool SoC Line */}
          <path
            d={poolPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Hover indicator */}
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
                cy={getY(baselineSoc[hoveredHour] || 0)}
                r="4"
                fill="#94a3b8"
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={getX(hoveredHour)}
                cy={getY(poolSoc[hoveredHour] || 0)}
                r="4.5"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Hover detection rects */}
          {Array.from({ length: 24 }).map((_, h) => (
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
            className="absolute z-20 pointer-events-none rounded-md border border-slate-700 bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
            style={{
              left: `${Math.min(75, Math.max(20, (hoveredHour / 23) * 100))}%`,
              top: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-white mb-0.5 font-mono">
              {formatHour(hoveredHour)} ({String(hoveredHour).padStart(2, '0')}:00)
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
              <span className="text-slate-400">Baseline: {baselineSoc[hoveredHour]}%</span>
              <span className="text-amber-400 font-bold">Pool: {poolSoc[hoveredHour]}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
