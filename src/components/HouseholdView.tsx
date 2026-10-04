import React, { useState } from 'react';
import { FeederNode, MasterSimulationData, ScenarioMode } from '../types';
import { BatterySocChart } from './BatterySocChart';
import {
  Home,
  Store,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';

interface HouseholdViewProps {
  data: MasterSimulationData;
  scenarioMode: ScenarioMode;
  onToggleScenario: (mode: ScenarioMode) => void;
}

export const HouseholdView: React.FC<HouseholdViewProps> = ({
  data,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('HH-001');

  // Find selected node
  const selectedNode = data.nodes.find((n) => n.id === selectedNodeId) || data.nodes[0];
  const isShop = selectedNode.type === 'shop';
  const hasInverter = selectedNode.has_inverter;
  const isControllable = selectedNode.is_controllable;

  // Representative 24h SoC data for selected node
  const baselineSoc = isShop
    ? data.baseline.sample_profiles.representative_day_shop_soc
    : data.baseline.sample_profiles.representative_day_hh_soc;

  const poolSoc = isShop
    ? data.pool.sample_profiles.representative_day_shop_soc
    : data.pool.sample_profiles.representative_day_hh_soc;

  // Tonight's plan dynamic calculation based on node status
  const getTonightsPlan = (node: FeederNode) => {
    if (!node.has_inverter) {
      return {
        title: 'Standard Grid Connection (No Inverter Installed)',
        summary: 'Your home relies directly on grid power. During feeder outages, all household loads will experience interruption. Consider installing an Inverter Pool kit to protect essential loads.',
        badge: 'Unprotected',
        badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      };
    }

    if (!node.is_controllable) {
      return {
        title: 'Uncoordinated Inverter (Stand-alone Mode)',
        summary: 'Your inverter will charge immediately when grid is live. Flexible loads are unmanaged and will drain battery reserves within ~1.5 hours of an outage.',
        badge: 'Manual Inverter',
        badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
      };
    }

    return {
      title: 'Inverter Pool Smart Dispatch Plan',
      summary: `Your ${node.battery_capacity_kwh} kWh battery is scheduled to charge between 02:00 AM – 05:00 AM at off-peak rates. Critical loads (refrigerator, lighting, fans) are 100% protected during tonight's 07:00 PM – 09:30 PM peak stress window.`,
      badge: 'Protected & Coordinated',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    };
  };

  const plan = getTonightsPlan(selectedNode);

  // Quick preset shortcuts
  const presets = [
    { id: 'HH-001', label: 'HH-001 (Enrolled Pool Member)' },
    { id: 'HH-003', label: 'HH-003 (Standard Inverter)' },
    { id: 'HH-005', label: 'HH-005 (Non-Inverter Home)' },
    { id: 'SH-01', label: 'SH-01 (Sanjeevani Pharmacy)' },
    { id: 'SH-03', label: 'SH-03 (Om Sai Bakery & Cafe)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Household Selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              isShop
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {isShop ? <Store className="h-6 w-6" /> : <Home className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedNode.name}
                </h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Feeder Node ID: <span className="font-mono text-slate-300 font-semibold">{selectedNode.id}</span> · Connected to 11kV Mayur Vihar Feeder
              </p>
            </div>
          </div>

          {/* Node Selector Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Select Customer:</label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition-colors"
            >
              <optgroup label="Sample Highlight Nodes">
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Households (HH-001 to HH-200)">
                {data.nodes
                  .filter((n) => n.type === 'household')
                  .slice(0, 30)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} {n.is_controllable ? '⚡ (Pool Member)' : ''}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Commercial Shops (SH-01 to SH-20)">
                {data.nodes
                  .filter((n) => n.type === 'shop')
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} {n.is_controllable ? '⚡ (Pool Member)' : ''}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 mr-1 text-[11px]">Quick Jump:</span>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedNodeId(p.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedNodeId === p.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* "Tonight's Plan" Banner (Vernacular-Friendly Actionable Summary) */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 backdrop-blur">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Tonight’s Plan & Battery Strategy
              </h3>
              <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Automated by Inverter Pool
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {plan.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Household Hardware & Reliability Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Battery Bank
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">
              {selectedNode.battery_capacity_kwh}
            </span>
            <span className="text-xs text-slate-400 font-medium">kWh ({selectedNode.battery_capacity_kwh > 0 ? (selectedNode.battery_capacity_kwh >= 3.6 ? '2x 150Ah' : '150Ah 12V') : 'None'})</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Max Charge: {selectedNode.max_charge_power_kw} kW
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Annual Outage Hours
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {selectedNode.pool_outage_hours}
            </span>
            <span className="text-xs text-slate-400 font-medium">hrs (vs {selectedNode.baseline_outage_hours} hrs baseline)</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {selectedNode.baseline_outage_hours > selectedNode.pool_outage_hours
              ? `Avoided ${selectedNode.baseline_outage_hours - selectedNode.pool_outage_hours} hrs of blackouts`
              : 'Standard Grid Reliability'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Fairness Priority Credit
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white">
              {selectedNode.curtailment_credit_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">pts</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {selectedNode.next_in_rotation ? '⭐ Priority for next flexible run' : 'Nominal ledger score'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Smart Plug Automation
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
              selectedNode.smart_plug_installed ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              <Check className="h-4 w-4" />
              {selectedNode.smart_plug_installed ? 'Installed & Linked' : 'Standard Inverter'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Automatic flexible load shedding
          </span>
        </div>
      </div>

      {/* 24h Battery SoC Curve for this node */}
      {hasInverter && (
        <BatterySocChart
          baselineSoc={baselineSoc}
          poolSoc={poolSoc}
          batteryCapacityKwh={selectedNode.battery_capacity_kwh}
          nodeName={selectedNode.name}
          isControllable={isControllable}
        />
      )}

      {/* Appliance Load Breakdown & Critical Protection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Critical Loads Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
              <h4 className="text-sm font-bold text-white">Critical Lifeline Loads (Protected)</h4>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Never Shed
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            These essential loads are guaranteed power during outages and feeder congestion events.
          </p>

          <div className="divide-y divide-slate-800/80">
            {selectedNode.critical_appliances.map((app, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-200">{app.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-slate-400">{app.power_w} W</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Critical Baseline Draw:</span>
            <span className="text-white font-bold">{selectedNode.critical_load_base_kw} kW</span>
          </div>
        </div>

        {/* Right: Flexible Loads Table (Managed by Pool) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
              <h4 className="text-sm font-bold text-white">Flexible Loads (Demand Response)</h4>
            </div>
            <span className="text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Auto-Managed
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Deferred automatically during peak grid stress or outages to preserve battery lifelines.
          </p>

          <div className="divide-y divide-slate-800/80">
            {selectedNode.flexible_appliances.map((app, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200">{app.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-slate-400">{app.power_w} W</span>
                  <span className="text-[10px] text-amber-400/90 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Smart Deferrable
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Shiftable Flexible Capacity:</span>
            <span className="text-amber-400 font-bold">{selectedNode.flexible_load_base_kw} kW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
