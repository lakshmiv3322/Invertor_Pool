import React, { useState } from 'react';
import { OutageScenario, SimulationConfig } from '../types';
import { X, RotateCcw, Play, Sliders } from 'lucide-react';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
  onApplyConfig: (config: SimulationConfig) => void;
  onResetBenchmark: () => void;
  isCustomSim: boolean;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onApplyConfig,
  onResetBenchmark,
  isCustomSim,
}) => {
  const [tempConfig, setTempConfig] = useState<SimulationConfig>(config);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyConfig(tempConfig);
    onClose();
  };

  const handleReset = () => {
    onResetBenchmark();
    setTempConfig({
      n_households: 200,
      n_shops: 20,
      controllable_share: 0.70,
      outage_scenario: 'medium',
      inverter_penetration: 0.60,
      battery_capacity_ah: 150,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Sliders className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold">Feeder Simulation Parameters</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs">
          {/* Outage Scenario */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Grid Outage Frequency & Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as OutageScenario[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, outage_scenario: sc })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-colors ${
                    tempConfig.outage_scenario === sc
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sc} {sc === 'low' ? '(Low Stress)' : sc === 'medium' ? '(Base Scenario)' : '(High Stress)'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Affects random grid blackout frequency and outage duration (1–5 hours).
            </p>
          </div>

          {/* Controllable Share Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-300">
                Inverter Pool Enrollment (Controllable Share)
              </label>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(tempConfig.controllable_share * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="1.0"
              step="0.05"
              value={tempConfig.controllable_share}
              onChange={(e) =>
                setTempConfig({ ...tempConfig, controllable_share: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10% (Low pool)</span>
              <span>70% (Base benchmark)</span>
              <span>100% (Full feeder fleet)</span>
            </div>
          </div>

          {/* Inverter Penetration */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-300">
                Inverter Adoption Rate (Penetration)
              </label>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(tempConfig.inverter_penetration * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={tempConfig.inverter_penetration}
              onChange={(e) =>
                setTempConfig({ ...tempConfig, inverter_penetration: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30% Adoption</span>
              <span>60% (Base benchmark)</span>
              <span>95% Ubiquitous</span>
            </div>
          </div>

          {/* Battery Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-300">
                Typical Inverter Battery Capacity
              </label>
              <span className="font-mono text-amber-400 font-bold">
                {tempConfig.battery_capacity_ah} Ah ({(tempConfig.battery_capacity_ah * 12 / 1000).toFixed(2)} kWh)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[100, 150, 200].map((ah) => (
                <button
                  key={ah}
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, battery_capacity_ah: ah })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    tempConfig.battery_capacity_ah === ah
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ah} Ah ({(ah * 12 / 1000).toFixed(1)} kWh)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isCustomSim}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isCustomSim
                ? 'text-slate-400 hover:text-white bg-slate-800'
                : 'text-slate-600 bg-slate-900 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Benchmark</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Recalculate Model</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
