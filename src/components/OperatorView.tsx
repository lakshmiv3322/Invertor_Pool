import React, { useState } from 'react';
import { MasterSimulationData } from '../types';
import {
  Cpu,
  Zap,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Play,
} from 'lucide-react';

interface OperatorViewProps {
  data: MasterSimulationData;
  onToggleNodeControllable?: (nodeId: string) => void;
}

export const OperatorView: React.FC<OperatorViewProps> = ({
  data,
  onToggleNodeControllable,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'household' | 'shop'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'controllable' | 'uncontrolled' | 'next_rotation'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Live stress test simulation state
  const [simulatedOutageActive, setSimulatedOutageActive] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  const handleTriggerOutageTest = () => {
    setSimulatedOutageActive(true);
    setTestCountdown(5);
    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setSimulatedOutageActive(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const summary = data.feeder_summary;
  const nodes = data.nodes;

  // Filtered nodes
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || node.type === typeFilter;

    let matchesStatus = true;
    if (statusFilter === 'controllable') matchesStatus = node.is_controllable;
    else if (statusFilter === 'uncontrolled') matchesStatus = !node.is_controllable;
    else if (statusFilter === 'next_rotation') matchesStatus = node.next_in_rotation;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNodes.length / pageSize);
  const paginatedNodes = filteredNodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Dynamic KPI calculation
  const controllableCount = nodes.filter((n) => n.is_controllable).length;
  const totalShiftableKw = nodes
    .filter((n) => n.is_controllable)
    .reduce((acc, n) => acc + n.flexible_load_base_kw, 0);
  const totalBatteryKwh = nodes
    .filter((n) => n.is_controllable)
    .reduce((acc, n) => acc + n.battery_capacity_kwh, 0);

  return (
    <div className="space-y-6">
      {/* Fleet Operator KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Enrolled Inverters
            </span>
            <Cpu className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">
              {controllableCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {summary.total_inverters} Inverters ({summary.controllable_share_pct}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Active smart telemetry & coordinated schedule.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aggregate Shiftable Load
            </span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {totalShiftableKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">kW</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Demand-response capacity available for peak shedding.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pooled Storage Energy
            </span>
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white tabular-nums">
              {totalBatteryKwh.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">kWh</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Distributed reserve capacity on 11kV feeder.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Fairness Rotation Status
            </span>
            <RotateCw className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
              {nodes.filter((n) => n.next_in_rotation).length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Nodes queued</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            High-credit nodes prioritized for next flexible run.
          </p>
        </div>
      </div>

      {/* Live Feeder Outage Stress Simulator Tool */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${
            simulatedOutageActive
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {simulatedOutageActive ? 'Grid Blackout Injected — Inverter Pool Active' : 'Live Feeder Outage Stress Test'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {simulatedOutageActive
                ? `Simulating grid loss (${testCountdown}s remaining): ${controllableCount} inverters shed flexible loads; critical lifelines sustained.`
                : 'Inject a simulated 11kV grid trip to observe automated critical-load isolation and fair load shedding in real-time.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerOutageTest}
          disabled={simulatedOutageActive}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${
            simulatedOutageActive
              ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>{simulatedOutageActive ? `Simulating (${testCountdown}s)` : 'Inject Grid Outage Event'}</span>
        </button>
      </div>

      {/* Fleet Filter & Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Node ID (e.g. HH-042) or Customer Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Type Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({nodes.length})
              </button>
              <button
                onClick={() => { setTypeFilter('household'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'household' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Homes ({summary.total_households})
              </button>
              <button
                onClick={() => { setTypeFilter('shop'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === 'shop' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shops ({summary.total_shops})
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => { setStatusFilter('controllable'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'controllable' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
                }`}
              >
                Pool Members
              </button>
              <button
                onClick={() => { setStatusFilter('next_rotation'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === 'next_rotation' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
                }`}
              >
                Next in Rotation
              </button>
            </div>
          </div>
        </div>

        {/* Fleet Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Node & Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Battery Bank</th>
                <th className="py-3 px-3">Installation Status</th>
                <th className="py-3 px-3">Pool Enrolled</th>
                <th className="py-3 px-3">7-Day Curtailment</th>
                <th className="py-3 px-3">Next in Rotation</th>
                <th className="py-3 px-3 text-right">Outage Hrs (Base → Pool)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedNodes.map((node) => {
                const isControllable = node.is_controllable;
                const hoursSaved = node.baseline_outage_hours - node.pool_outage_hours;

                return (
                  <tr
                    key={node.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Node ID & Name */}
                    <td className="py-2.5 px-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-semibold">{node.id}</span>
                        <span className="text-white font-medium">{node.name}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3">
                      <span className="text-slate-400 capitalize">{node.type}</span>
                    </td>

                    {/* Battery Bank */}
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {node.has_inverter ? (
                        <span className="text-slate-200">
                          {node.battery_capacity_kwh} kWh <span className="text-[10px] text-slate-500">({node.max_charge_power_kw}kW)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Installation Status */}
                    <td className="py-2.5 px-3">
                      {node.smart_plug_installed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Smart Plug Installed
                        </span>
                      ) : node.has_inverter ? (
                        <span className="text-slate-400">Standard Inverter</span>
                      ) : (
                        <span className="text-slate-500">No Inverter</span>
                      )}
                    </td>

                    {/* Controllable Pool Toggle/Badge */}
                    <td className="py-2.5 px-3">
                      {node.has_inverter ? (
                        <button
                          type="button"
                          onClick={() => onToggleNodeControllable?.(node.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer hover:opacity-90 ${
                            isControllable
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Click to toggle Inverter Pool enrollment for this node"
                        >
                          {isControllable ? '⚡ Active Pool' : 'Uncontrolled'}
                        </button>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>

                    {/* 7-Day Curtailment Index */}
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{
                              width: `${Math.min(100, node.curtailment_credit_score * 35)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-slate-300 text-[11px]">
                          {node.curtailment_credit_score.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Next in Rotation */}
                    <td className="py-2.5 px-3">
                      {node.next_in_rotation ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold text-[10px]">
                          ⭐ Priority Queue
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Standard</span>
                      )}
                    </td>

                    {/* Outage Hrs */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="text-slate-500">{node.baseline_outage_hours}h</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span
                        className={`font-semibold ${
                          hoursSaved > 0 ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        {node.pool_outage_hours}h
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredNodes.length)} of {filteredNodes.length} nodes
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
