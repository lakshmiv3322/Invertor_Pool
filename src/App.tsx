/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MasterSimulationData, ScenarioMode, SimulationConfig, ViewTab } from './types';
import { getPrecomputedData, runClientSimulation } from './engine/simulation';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { SensitivityView } from './components/SensitivityView';
import { AblationView } from './components/AblationView';
import { HouseholdView } from './components/HouseholdView';
import { OperatorView } from './components/OperatorView';
import { DiscomView } from './components/DiscomView';
import { ScenarioDrawer } from './components/ScenarioDrawer';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>('pool');
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isCustomSim, setIsCustomSim] = useState(false);

  // Default simulation configuration matching Python benchmark
  const [config, setConfig] = useState<SimulationConfig>({
    n_households: 200,
    n_shops: 20,
    controllable_share: 0.70,
    outage_scenario: 'medium',
    inverter_penetration: 0.60,
    battery_capacity_ah: 150,
  });

  // Master simulation dataset (derived from results_base.json)
  const [simulationData, setSimulationData] = useState<MasterSimulationData>(() =>
    getPrecomputedData()
  );

  // Apply custom simulation parameters
  const handleApplyConfig = (newConfig: SimulationConfig) => {
    setConfig(newConfig);
    const newResults = runClientSimulation(newConfig);
    setSimulationData(newResults);
    setIsCustomSim(true);
  };

  // Reset to static Python benchmark
  const handleResetBenchmark = () => {
    const defaultData = getPrecomputedData();
    setSimulationData(defaultData);
    setIsCustomSim(false);
  };

  // Live node controllable toggle
  const handleToggleNodeControllable = (nodeId: string) => {
    setSimulationData((prev) => {
      const updatedNodes = prev.nodes.map((node) => {
        if (node.id === nodeId && node.has_inverter) {
          return {
            ...node,
            is_controllable: !node.is_controllable,
          };
        }
        return node;
      });

      const controllableInverters = updatedNodes.filter((n) => n.is_controllable).length;
      const totalInverters = updatedNodes.filter((n) => n.has_inverter).length;
      const controllableBatteryKwh = +updatedNodes
        .filter((n) => n.is_controllable)
        .reduce((acc, n) => acc + n.battery_capacity_kwh, 0)
        .toFixed(1);
      const aggregateShiftableKw = +updatedNodes
        .filter((n) => n.is_controllable)
        .reduce((acc, n) => acc + n.flexible_load_base_kw, 0)
        .toFixed(1);

      return {
        ...prev,
        nodes: updatedNodes,
        feeder_summary: {
          ...prev.feeder_summary,
          controllable_inverters: controllableInverters,
          controllable_share_pct: totalInverters > 0 ? Math.round((controllableInverters / totalInverters) * 100) : 0,
          controllable_battery_kwh: controllableBatteryKwh,
          aggregate_shiftable_load_kw: aggregateShiftableKw,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Top Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        scenarioMode={scenarioMode}
        onToggleScenario={setScenarioMode}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        isCustomSim={isCustomSim}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <OverviewView
            data={simulationData}
            scenarioMode={scenarioMode}
            onToggleScenario={setScenarioMode}
          />
        )}

        {currentTab === 'sensitivity' && (
          <SensitivityView />
        )}

        {currentTab === 'ablation' && (
          <AblationView />
        )}

        {currentTab === 'household' && (
          <HouseholdView
            data={simulationData}
            scenarioMode={scenarioMode}
            onToggleScenario={setScenarioMode}
          />
        )}

        {currentTab === 'operator' && (
          <OperatorView
            data={simulationData}
            onToggleNodeControllable={handleToggleNodeControllable}
          />
        )}

        {currentTab === 'discom' && (
          <DiscomView data={simulationData} />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-5 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Inverter Pool</span>
            <span aria-hidden="true">·</span>
            <span>Neighbourhood Virtual Power Plant Prototype</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-500">11kV Feeder Model</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Synthetic 8,760-Hour Simulation (20 Monte Carlo Seeds)</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsScenarioModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Adjust Parameters
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-out Scenario Config Drawer */}
      <ScenarioDrawer
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        config={config}
        onApplyConfig={handleApplyConfig}
        onResetBenchmark={handleResetBenchmark}
        isCustomSim={isCustomSim}
      />
    </div>
  );
}
