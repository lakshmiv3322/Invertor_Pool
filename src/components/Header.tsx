import React from 'react';
import { ViewTab, ScenarioMode } from '../types';
import { SlidersHorizontal, Zap, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  scenarioMode: ScenarioMode;
  onToggleScenario: (mode: ScenarioMode) => void;
  onOpenScenarioModal: () => void;
  isCustomSim: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  scenarioMode,
  onToggleScenario,
  onOpenScenarioModal,
  isCustomSim,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Inverter Pool</span>
              <span className="text-[11px] font-medium tracking-normal text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Feeder VPP
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'overview'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('sensitivity')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'sensitivity'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sensitivity Matrix
          </button>
          <button
            onClick={() => onSelectTab('ablation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'ablation'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ablation Study
          </button>
          <button
            onClick={() => onSelectTab('household')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'household'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Household View
          </button>
          <button
            onClick={() => onSelectTab('operator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'operator'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operator Fleet
          </button>
          <button
            onClick={() => onSelectTab('discom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentTab === 'discom'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DISCOM Console
          </button>
        </nav>

        {/* Zone 3: Global Actions (Mode Toggle + Scenario Drawer) */}
        <div className="flex items-center gap-3">
          {/* Global Scenario Mode Switcher */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => onToggleScenario('baseline')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                scenarioMode === 'baseline'
                  ? 'bg-slate-700 text-slate-100 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Baseline</span>
            </button>
            <button
              onClick={() => onToggleScenario('pool')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                scenarioMode === 'pool'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Inverter Pool</span>
            </button>
          </div>

          {/* Adjust Parameters Action Button */}
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Config</span>
            {isCustomSim && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-2 overflow-x-auto flex gap-1.5 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'sensitivity', label: 'Sensitivity' },
          { id: 'ablation', label: 'Ablation' },
          { id: 'household', label: 'Household' },
          { id: 'operator', label: 'Operator' },
          { id: 'discom', label: 'DISCOM' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as ViewTab)}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              currentTab === tab.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
