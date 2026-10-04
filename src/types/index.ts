export type ScenarioMode = 'baseline' | 'pool';
export type ViewTab = 'overview' | 'sensitivity' | 'ablation' | 'household' | 'operator' | 'discom';
export type OutageScenario = 'low' | 'medium' | 'high';
export type DRSignalType = 'encourage_charging' | 'defer_charging' | 'neutral';

export interface Appliance {
  name: string;
  power_w: number;
  essential: boolean;
}

export interface FeederNode {
  id: string;
  name: string;
  type: 'household' | 'shop';
  has_inverter: boolean;
  is_controllable: boolean;
  battery_capacity_kwh: number;
  max_charge_power_kw: number;
  smart_plug_installed: boolean;
  critical_load_base_kw: number;
  flexible_load_base_kw: number;
  critical_appliances: Appliance[];
  flexible_appliances: Appliance[];
  baseline_outage_hours: number;
  pool_outage_hours: number;
  curtailment_credit_score: number;
  next_in_rotation: boolean;
}

export interface FeederSummary {
  feeder_id: string;
  substation: string;
  transformer_rating_kva: number;
  transformer_capacity_kw?: number;
  total_households: number;
  total_shops: number;
  total_inverters: number;
  controllable_inverters: number;
  total_battery_capacity_kwh: number;
  controllable_battery_kwh: number;
  aggregate_shiftable_load_kw: number;
  outage_scenario: OutageScenario;
  controllable_share_pct: number;
  total_outage_hours_year: number;
}

export interface ScenarioMetrics {
  critical_load_outage_hours_per_household_year: number;
  critical_load_outage_hours_per_shop_year: number;
  critical_load_outage_hours_all_nodes_year: number;
  critical_load_outage_hours_controllable_nodes?: number;
  critical_load_outage_hours_uncontrolled_inverter_nodes?: number;
  critical_load_outage_hours_no_inverter_nodes?: number;
  critical_load_outage_hours_worst_10_percent: number;
  evening_feeder_peak_kW: number;
  annual_max_kW?: number;
  battery_cycles_year?: number;
  overload_hours_year?: number;
  unserved_energy_kWh_year: number;
  avg_24h_feeder_load_kW: number[];
  avg_24h_charging_load_kW: number[];
  avg_24h_soc_pct: number[];
  avg_24h_unserved_kW: number[];
}

export interface ScenarioImprovements {
  delta_outage_hours_pct: number;
  delta_ctrl_outage_pct?: number;
  delta_noinv_outage_pct?: number;
  delta_worst_10_pct: number;
  delta_peak_pct: number;
  delta_unserved_pct: number;
  delta_cycles_pct?: number;
  delta_overload_hours_pct?: number;
}

export interface DiscomSignals {
  gap_factor_24h: number[];
  shiftable_load_delta_24h_kW: number[];
  dr_signals_24h: DRSignalType[];
}

export interface MasterSimulationData {
  feeder_summary: FeederSummary;
  baseline: {
    metadata: any;
    metrics: ScenarioMetrics;
    sample_profiles: {
      representative_day_hh_soc: number[];
      representative_day_shop_soc: number[];
      representative_week_hh_soc?: number[];
    };
  };
  pool: {
    metadata: any;
    metrics: ScenarioMetrics;
    improvements: ScenarioImprovements;
    discom_signals: DiscomSignals;
    sample_profiles: {
      representative_day_hh_soc: number[];
      representative_day_shop_soc: number[];
      representative_week_hh_soc?: number[];
    };
  };
  nodes: FeederNode[];
  discom_24h: {
    hours: number[];
    baseline_feeder_load_kW: number[];
    pool_feeder_load_kW: number[];
    gap_factor: number[];
    shiftable_delta_kW: number[];
    dr_signals: DRSignalType[];
    baseline_charging_kW: number[];
    pool_charging_kW: number[];
    baseline_soc_pct: number[];
    pool_soc_pct: number[];
  };
}

export interface SimulationConfig {
  n_households: number;
  n_shops: number;
  controllable_share: number;
  outage_scenario: OutageScenario;
  inverter_penetration: number;
  battery_capacity_ah: number;
}

export interface SensitivityRecord {
  outage_all: [number, number];
  outage_inv: [number, number];
  outage_noinv: [number, number];
  worst10: [number, number];
  unserved_kwh: [number, number];
  gridless_h: [number, number];
  gridless_inv: [number, number];
  gridless_noinv: [number, number];
  cycles_inv: [number, number];
  evening_peak: [number, number];
  annual_max: [number, number];
  overload_h: [number, number];
  profile: number[];
  C0: number;
  n_inv: number;
  n_enr: number;
}

export interface SensitivityScenario {
  baseline: SensitivityRecord;
  pool: SensitivityRecord;
}

export interface SensitivityData {
  seeds: number;
  sens: Record<string, SensitivityScenario>;
}

export interface AblationData {
  seeds: number;
  abl: Record<string, SensitivityScenario>;
}
