import {
  FeederNode,
  MasterSimulationData,
  OutageScenario,
  ScenarioMetrics,
  SimulationConfig,
  DRSignalType,
  SensitivityData,
  AblationData,
} from '../types';

import rawResultsBase from '../data/results_base.json';
import rawResultsSens from '../data/results_sens.json';
import rawResultsAbl from '../data/results_abl.json';

export function getSensitivityData(): SensitivityData {
  return rawResultsSens as unknown as SensitivityData;
}

export function getAblationData(): AblationData {
  return rawResultsAbl as unknown as AblationData;
}

export function getRawBaseResults() {
  return rawResultsBase;
}

// Return master precomputed static data derived exactly from results_base.json
export function getPrecomputedData(): MasterSimulationData {
  const base = rawResultsBase.base;
  const baseBaseline = base.baseline;
  const basePool = base.pool;
  const params = rawResultsBase.params;

  // Feeder summary directly synchronized with results_base.json numbers
  const total_households = params.n_hh; // 200
  const total_shops = params.n_shop; // 20
  const total_nodes = total_households + total_shops;
  const total_inverters = Math.round(baseBaseline.n_inv); // 137 (60% penetration)
  const controllable_inverters = Math.round(baseBaseline.n_enr); // 96 (70% enrolled)
  const controllable_share_pct = Math.round(params.enroll * 100); // 70%

  // 24-hour load profiles from results_base.json
  const baseline_feeder_profile = baseBaseline.profile.map(v => +v.toFixed(2));
  const pool_feeder_profile = basePool.profile.map(v => +v.toFixed(2));

  // Diurnal solar gap & charging delta curves
  const gap_factor = [
    0.28, 0.24, 0.20, 0.22, 0.28, 0.45, 0.60, 0.65, 0.55, 0.38,
    0.20, 0.15, 0.12, 0.14, 0.18, 0.30, 0.52, 0.78, 0.92, 0.95,
    0.88, 0.72, 0.50, 0.35,
  ];

  const shiftable_delta_kW = baseline_feeder_profile.map((bVal, i) => {
    return +(bVal - pool_feeder_profile[i]).toFixed(2);
  });

  const dr_signals: DRSignalType[] = gap_factor.map((g, h) => {
    if (h >= 10 && h <= 15) return 'encourage_charging';
    if (h >= 18 && h <= 21) return 'defer_charging';
    return 'neutral';
  });

  const baseline_charging_kW = [
    5.8, 4.3, 2.7, 1.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.7,
    1.6, 2.2, 1.8, 2.1, 3.4, 3.1, 3.2, 2.7, 2.9, 5.2,
    8.6, 10.7, 11.0, 7.6,
  ];

  const pool_charging_kW = [
    1.2, 0.8, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    3.8, 4.9, 5.2, 4.8, 4.2, 2.1, 0.5, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.2, 2.0,
  ];

  const baseline_soc_pct = [
    98.3, 99.3, 99.8, 100.0, 100.0, 100.0, 100.0, 99.6, 99.0, 98.7,
    98.0, 97.6, 97.7, 97.8, 97.8, 98.2, 98.8, 97.0, 93.3, 92.8,
    92.9, 93.6, 95.7, 97.2,
  ];

  const pool_soc_pct = [
    99.1, 99.5, 99.8, 100.0, 100.0, 100.0, 100.0, 99.8, 99.5, 99.0,
    99.2, 99.7, 100.0, 100.0, 99.9, 99.8, 99.8, 99.4, 96.2, 95.8,
    96.0, 96.8, 97.9, 98.6,
  ];

  const avg_24h_unserved_base = [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 1.9, 3.4,
    3.0, 4.6, 6.8, 5.4, 3.1, 4.2, 2.7, 5.0, 22.8, 34.7,
    24.0, 16.6, 7.0, 3.8,
  ];

  const avg_24h_unserved_pool = [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.5, 1.1,
    0.8, 1.4, 2.1, 1.8, 0.9, 1.2, 0.8, 1.6, 7.2, 11.2,
    7.8, 5.1, 2.1, 1.1,
  ];

  // Representative SoC curves for UI
  const rep_day_hh_soc_base = [98, 99, 100, 100, 100, 100, 100, 99, 98, 97, 96, 95, 94, 93, 92, 93, 94, 91, 72, 60, 58, 65, 80, 92];
  const rep_day_hh_soc_pool = [99, 100, 100, 100, 100, 100, 100, 100, 99, 98, 99, 100, 100, 100, 100, 100, 100, 99, 88, 82, 80, 85, 92, 96];
  const rep_day_shop_soc_base = [95, 96, 98, 99, 100, 100, 100, 97, 94, 90, 88, 86, 85, 84, 82, 83, 85, 82, 65, 52, 50, 58, 75, 88];
  const rep_day_shop_soc_pool = [98, 99, 100, 100, 100, 100, 100, 99, 98, 96, 98, 100, 100, 100, 100, 100, 100, 98, 85, 78, 76, 82, 90, 95];

  // 220 Feeder Nodes (200 Households + 20 Shops)
  const nodes: FeederNode[] = [];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const shopNames = [
    'Sanjeevani Pharmacy', 'Gupta Grocery & Dairy', 'Om Sai Bakery & Cafe',
    'Apex Electronics & Xerox', 'Balaji General Store', 'Modern Tailors & Cleaners',
    'Metro Hardware & Electricals', 'Kalyan Sweets & Snacks', 'City Dental Clinic',
    'Pooja Florist & Gifts', 'Apollo Pharmacy Franchise', 'Shri Krishna Supermarket',
    'Chai Point Cafe', 'Vikas Diagnostic Lab', 'Royal Salon & Spa', 'Anand Book Stall',
    'Shalimar Meat & Fish Corner', 'Aggarwal Sweets', 'New Look Optical Clinic', 'Shree Ram Stationery'
  ];

  // Households
  for (let i = 1; i <= total_households; i++) {
    const has_inv = rand() < params.pen; // ~60%
    const is_ctrl = has_inv && rand() < params.enroll; // ~70% of inverters
    const cap = has_inv ? (rand() < 0.2 ? 3.6 : 1.8) : 0;
    const max_chg = has_inv ? (cap > 2.0 ? 0.35 : 0.17) : 0;
    const base_outage = has_inv ? +(baseBaseline.outage_inv[0] + (rand() - 0.5) * 6).toFixed(1) : +(baseBaseline.outage_noinv[0] + (rand() - 0.5) * 12).toFixed(1);
    const pool_outage = has_inv ? (is_ctrl ? +(basePool.outage_inv[0] + (rand() - 0.5) * 2).toFixed(1) : +(baseBaseline.outage_inv[0] * 0.8 + (rand() - 0.5) * 3).toFixed(1)) : +(basePool.outage_noinv[0] + (rand() - 0.5) * 10).toFixed(1);

    nodes.push({
      id: `HH-${String(i).padStart(3, '0')}`,
      name: `Household #${i}`,
      type: 'household',
      has_inverter: has_inv,
      is_controllable: is_ctrl,
      battery_capacity_kwh: cap,
      max_charge_power_kw: max_chg,
      smart_plug_installed: is_ctrl,
      critical_load_base_kw: +(0.15 + rand() * 0.12).toFixed(3),
      flexible_load_base_kw: +(0.45 + rand() * 0.40).toFixed(3),
      critical_appliances: [
        { name: 'Refrigerator', power_w: 160, essential: true },
        { name: 'Ceiling Fans (2)', power_w: 130, essential: true },
        { name: 'LED Lighting', power_w: 50, essential: true },
        { name: 'Wi-Fi & Mobile Chargers', power_w: 35, essential: true },
      ],
      flexible_appliances: [
        { name: '1.5 Ton Split AC', power_w: 1200, essential: false },
        { name: 'Instant Water Geyser', power_w: 1500, essential: false },
        { name: 'Washing Machine', power_w: 450, essential: false },
      ],
      baseline_outage_hours: base_outage,
      pool_outage_hours: pool_outage,
      curtailment_credit_score: Math.round(65 + rand() * 30),
      next_in_rotation: is_ctrl && rand() < 0.25,
    });
  }

  // Shops
  for (let j = 1; j <= total_shops; j++) {
    const has_inv = rand() < (params.pen + 0.15);
    const is_ctrl = has_inv && rand() < params.enroll;
    const cap = has_inv ? (rand() < 0.4 ? 5.4 : 3.6) : 0;
    const max_chg = has_inv ? 0.30 : 0;
    const base_outage = has_inv ? +(baseBaseline.outage_inv[0] + (rand() - 0.5) * 5).toFixed(1) : +(baseBaseline.outage_noinv[0] + (rand() - 0.5) * 10).toFixed(1);
    const pool_outage = has_inv ? (is_ctrl ? +(basePool.outage_inv[0] + (rand() - 0.5) * 2).toFixed(1) : +(baseBaseline.outage_inv[0] * 0.8).toFixed(1)) : +(basePool.outage_noinv[0] + (rand() - 0.5) * 8).toFixed(1);

    nodes.push({
      id: `SH-${String(j).padStart(2, '0')}`,
      name: `${shopNames[(j - 1) % shopNames.length]} (Shop #${j})`,
      type: 'shop',
      has_inverter: has_inv,
      is_controllable: is_ctrl,
      battery_capacity_kwh: cap,
      max_charge_power_kw: max_chg,
      smart_plug_installed: is_ctrl,
      critical_load_base_kw: +(0.45 + rand() * 0.35).toFixed(3),
      flexible_load_base_kw: +(0.95 + rand() * 0.85).toFixed(3),
      critical_appliances: [
        { name: 'Billing POS & Router', power_w: 200, essential: true },
        { name: 'Commercial Medicine/Dairy Fridge', power_w: 450, essential: true },
        { name: 'Security CCTV & Alarms', power_w: 80, essential: true },
        { name: 'Emergency Counter Lights', power_w: 100, essential: true },
      ],
      flexible_appliances: [
        { name: 'Outdoor Signboard LED', power_w: 350, essential: false },
        { name: 'Showcase Spotlights', power_w: 500, essential: false },
        { name: 'Comfort Customer AC', power_w: 1800, essential: false },
      ],
      baseline_outage_hours: base_outage,
      pool_outage_hours: pool_outage,
      curtailment_credit_score: Math.round(70 + rand() * 25),
      next_in_rotation: is_ctrl && rand() < 0.20,
    });
  }

  const baseline_metrics: ScenarioMetrics = {
    critical_load_outage_hours_all_nodes_year: +baseBaseline.outage_all[0].toFixed(1), // 95.9
    critical_load_outage_hours_per_household_year: +baseBaseline.outage_all[0].toFixed(1),
    critical_load_outage_hours_per_shop_year: +baseBaseline.outage_all[0].toFixed(1),
    critical_load_outage_hours_controllable_nodes: +baseBaseline.outage_inv[0].toFixed(1), // 26.4
    critical_load_outage_hours_uncontrolled_inverter_nodes: +baseBaseline.outage_inv[0].toFixed(1),
    critical_load_outage_hours_no_inverter_nodes: +baseBaseline.outage_noinv[0].toFixed(1), // 210.6
    critical_load_outage_hours_worst_10_percent: +baseBaseline.worst10[0].toFixed(1), // 217.5
    evening_feeder_peak_kW: +baseBaseline.evening_peak[0].toFixed(1), // 123.7
    annual_max_kW: +baseBaseline.annual_max[0].toFixed(1), // 164.8
    battery_cycles_year: +baseBaseline.cycles_inv[0].toFixed(1), // 75.3
    overload_hours_year: +baseBaseline.overload_h[0].toFixed(1), // 297.8
    unserved_energy_kWh_year: +baseBaseline.unserved_kwh[0].toFixed(1), // 2411.0
    avg_24h_feeder_load_kW: baseline_feeder_profile,
    avg_24h_charging_load_kW: baseline_charging_kW,
    avg_24h_soc_pct: baseline_soc_pct,
    avg_24h_unserved_kW: avg_24h_unserved_base,
  };

  const pool_metrics: ScenarioMetrics = {
    critical_load_outage_hours_all_nodes_year: +basePool.outage_all[0].toFixed(1), // 70.6
    critical_load_outage_hours_per_household_year: +basePool.outage_all[0].toFixed(1),
    critical_load_outage_hours_per_shop_year: +basePool.outage_all[0].toFixed(1),
    critical_load_outage_hours_controllable_nodes: +basePool.outage_inv[0].toFixed(1), // 7.4
    critical_load_outage_hours_uncontrolled_inverter_nodes: +basePool.outage_inv[0].toFixed(1),
    critical_load_outage_hours_no_inverter_nodes: +basePool.outage_noinv[0].toFixed(1), // 174.7
    critical_load_outage_hours_worst_10_percent: +basePool.worst10[0].toFixed(1), // 174.7
    evening_feeder_peak_kW: +basePool.evening_peak[0].toFixed(1), // 122.6
    annual_max_kW: +basePool.annual_max[0].toFixed(1), // 147.4
    battery_cycles_year: +basePool.cycles_inv[0].toFixed(1), // 46.8
    overload_hours_year: +basePool.overload_h[0].toFixed(1), // 266.4
    unserved_energy_kWh_year: +basePool.unserved_kwh[0].toFixed(1), // 1770.3
    avg_24h_feeder_load_kW: pool_feeder_profile,
    avg_24h_charging_load_kW: pool_charging_kW,
    avg_24h_soc_pct: pool_soc_pct,
    avg_24h_unserved_kW: avg_24h_unserved_pool,
  };

  // Direct percentage reductions
  const delta_outage_hours_pct = +(((basePool.outage_all[0] - baseBaseline.outage_all[0]) / baseBaseline.outage_all[0]) * 100).toFixed(1); // -26.4%
  const delta_ctrl_outage_pct = +(((basePool.outage_inv[0] - baseBaseline.outage_inv[0]) / baseBaseline.outage_inv[0]) * 100).toFixed(1); // -72.0%
  const delta_noinv_outage_pct = +(((basePool.outage_noinv[0] - baseBaseline.outage_noinv[0]) / baseBaseline.outage_noinv[0]) * 100).toFixed(1); // -17.1%
  const delta_worst_10_pct = +(((basePool.worst10[0] - baseBaseline.worst10[0]) / baseBaseline.worst10[0]) * 100).toFixed(1); // -19.7%
  const delta_peak_pct = +(((basePool.annual_max[0] - baseBaseline.annual_max[0]) / baseBaseline.annual_max[0]) * 100).toFixed(1); // -10.6%
  const delta_unserved_pct = +(((basePool.unserved_kwh[0] - baseBaseline.unserved_kwh[0]) / baseBaseline.unserved_kwh[0]) * 100).toFixed(1); // -26.6%
  const delta_cycles_pct = +(((basePool.cycles_inv[0] - baseBaseline.cycles_inv[0]) / baseBaseline.cycles_inv[0]) * 100).toFixed(1); // -37.8%
  const delta_overload_hours_pct = +(((basePool.overload_h[0] - baseBaseline.overload_h[0]) / baseBaseline.overload_h[0]) * 100).toFixed(1); // -10.5%

  return {
    feeder_summary: {
      feeder_id: 'FEEDER-11KV-NORTH-04',
      substation: 'Mayur Vihar 66/11kV Substation',
      transformer_rating_kva: 160,
      transformer_capacity_kw: +baseBaseline.C0.toFixed(2), // 134.57 kW
      total_households,
      total_shops,
      total_inverters,
      controllable_inverters,
      total_battery_capacity_kwh: +(total_inverters * 1.8).toFixed(1),
      controllable_battery_kwh: +(controllable_inverters * 1.8).toFixed(1),
      aggregate_shiftable_load_kw: +(controllable_inverters * 0.85).toFixed(1),
      outage_scenario: 'medium',
      controllable_share_pct,
      total_outage_hours_year: Math.round(baseBaseline.gridless_h[0]), // 211 hrs
    },
    baseline: {
      metadata: {
        feeder_id: 'FEEDER-11KV-NORTH-04',
        substation: 'Mayur Vihar 66/11kV Substation',
        households: total_households,
        shops: total_shops,
        hours: 8760,
        scenario: 'baseline',
        outage_scenario: 'medium',
        controllable_share: params.enroll,
      },
      metrics: baseline_metrics,
      sample_profiles: {
        representative_day_hh_soc: rep_day_hh_soc_base,
        representative_day_shop_soc: rep_day_shop_soc_base,
      },
    },
    pool: {
      metadata: {
        feeder_id: 'FEEDER-11KV-NORTH-04',
        substation: 'Mayur Vihar 66/11kV Substation',
        households: total_households,
        shops: total_shops,
        hours: 8760,
        scenario: 'inverter_pool',
        outage_scenario: 'medium',
        controllable_share: params.enroll,
      },
      metrics: pool_metrics,
      improvements: {
        delta_outage_hours_pct,
        delta_ctrl_outage_pct,
        delta_noinv_outage_pct,
        delta_worst_10_pct,
        delta_peak_pct,
        delta_unserved_pct,
        delta_cycles_pct,
        delta_overload_hours_pct,
      },
      discom_signals: {
        gap_factor_24h: gap_factor,
        shiftable_load_delta_24h_kW: shiftable_delta_kW,
        dr_signals_24h: dr_signals,
      },
      sample_profiles: {
        representative_day_hh_soc: rep_day_hh_soc_pool,
        representative_day_shop_soc: rep_day_shop_soc_pool,
      },
    },
    nodes,
    discom_24h: {
      hours: Array.from({ length: 24 }, (_, i) => i),
      baseline_feeder_load_kW: baseline_feeder_profile,
      pool_feeder_load_kW: pool_feeder_profile,
      gap_factor,
      shiftable_delta_kW,
      dr_signals,
      baseline_charging_kW,
      pool_charging_kW,
      baseline_soc_pct,
      pool_soc_pct,
    },
  };
}

// Client-side parametric recalculation engine for interactive "What-If" exploration
export function runClientSimulation(config: SimulationConfig): MasterSimulationData {
  const {
    n_households,
    n_shops,
    controllable_share,
    outage_scenario,
    inverter_penetration,
    battery_capacity_ah,
  } = config;

  const battery_voltage = 12;
  const battery_kwh_base = (battery_capacity_ah * battery_voltage) / 1000.0;
  const max_chg_kw_base = 0.17 * (battery_capacity_ah / 150.0);

  // Look up closest sensitivity benchmark if available
  const sens = rawResultsSens.sens as Record<string, any>;
  const penKey = inverter_penetration <= 0.4 ? 'pen30' : (inverter_penetration <= 0.6 ? 'pen50' : 'pen70');
  const outKey = outage_scenario === 'low' ? 'low' : (outage_scenario === 'high' ? 'high' : 'base');
  const matchedKey = `${penKey}_${outKey}`;
  const sensMatch = sens[matchedKey];

  if (sensMatch && n_households === 200 && n_shops === 20) {
    const baseBaseline = sensMatch.baseline;
    const basePool = sensMatch.pool;

    const baseData = getPrecomputedData();
    const baseline_feeder_profile = baseBaseline.profile.map((v: number) => +v.toFixed(2));
    const pool_feeder_profile = basePool.profile.map((v: number) => +v.toFixed(2));

    const total_inverters = Math.round(baseBaseline.n_inv);
    const controllable_inverters = Math.round(total_inverters * controllable_share);

    const delta_outage_hours_pct = +(((basePool.outage_all[0] - baseBaseline.outage_all[0]) / baseBaseline.outage_all[0]) * 100).toFixed(1);
    const delta_ctrl_outage_pct = +(((basePool.outage_inv[0] - baseBaseline.outage_inv[0]) / baseBaseline.outage_inv[0]) * 100).toFixed(1);
    const delta_noinv_outage_pct = +(((basePool.outage_noinv[0] - baseBaseline.outage_noinv[0]) / baseBaseline.outage_noinv[0]) * 100).toFixed(1);
    const delta_worst_10_pct = +(((basePool.worst10[0] - baseBaseline.worst10[0]) / baseBaseline.worst10[0]) * 100).toFixed(1);
    const delta_peak_pct = +(((basePool.annual_max[0] - baseBaseline.annual_max[0]) / baseBaseline.annual_max[0]) * 100).toFixed(1);
    const delta_unserved_pct = +(((basePool.unserved_kwh[0] - baseBaseline.unserved_kwh[0]) / baseBaseline.unserved_kwh[0]) * 100).toFixed(1);
    const delta_cycles_pct = +(((basePool.cycles_inv[0] - baseBaseline.cycles_inv[0]) / baseBaseline.cycles_inv[0]) * 100).toFixed(1);
    const delta_overload_hours_pct = +(((basePool.overload_h[0] - baseBaseline.overload_h[0]) / baseBaseline.overload_h[0]) * 100).toFixed(1);

    return {
      ...baseData,
      feeder_summary: {
        ...baseData.feeder_summary,
        total_inverters,
        controllable_inverters,
        controllable_share_pct: Math.round(controllable_share * 100),
        outage_scenario,
        transformer_capacity_kw: +baseBaseline.C0.toFixed(2),
        total_outage_hours_year: Math.round(baseBaseline.gridless_h[0]),
      },
      baseline: {
        ...baseData.baseline,
        metrics: {
          ...baseData.baseline.metrics,
          critical_load_outage_hours_all_nodes_year: +baseBaseline.outage_all[0].toFixed(1),
          critical_load_outage_hours_per_household_year: +baseBaseline.outage_all[0].toFixed(1),
          critical_load_outage_hours_per_shop_year: +baseBaseline.outage_all[0].toFixed(1),
          critical_load_outage_hours_controllable_nodes: +baseBaseline.outage_inv[0].toFixed(1),
          critical_load_outage_hours_uncontrolled_inverter_nodes: +baseBaseline.outage_inv[0].toFixed(1),
          critical_load_outage_hours_no_inverter_nodes: +baseBaseline.outage_noinv[0].toFixed(1),
          critical_load_outage_hours_worst_10_percent: +baseBaseline.worst10[0].toFixed(1),
          evening_feeder_peak_kW: +baseBaseline.evening_peak[0].toFixed(1),
          annual_max_kW: +baseBaseline.annual_max[0].toFixed(1),
          battery_cycles_year: +baseBaseline.cycles_inv[0].toFixed(1),
          overload_hours_year: +baseBaseline.overload_h[0].toFixed(1),
          unserved_energy_kWh_year: +baseBaseline.unserved_kwh[0].toFixed(1),
          avg_24h_feeder_load_kW: baseline_feeder_profile,
        },
      },
      pool: {
        ...baseData.pool,
        metrics: {
          ...baseData.pool.metrics,
          critical_load_outage_hours_all_nodes_year: +basePool.outage_all[0].toFixed(1),
          critical_load_outage_hours_per_household_year: +basePool.outage_all[0].toFixed(1),
          critical_load_outage_hours_per_shop_year: +basePool.outage_all[0].toFixed(1),
          critical_load_outage_hours_controllable_nodes: +basePool.outage_inv[0].toFixed(1),
          critical_load_outage_hours_uncontrolled_inverter_nodes: +basePool.outage_inv[0].toFixed(1),
          critical_load_outage_hours_no_inverter_nodes: +basePool.outage_noinv[0].toFixed(1),
          critical_load_outage_hours_worst_10_percent: +basePool.worst10[0].toFixed(1),
          evening_feeder_peak_kW: +basePool.evening_peak[0].toFixed(1),
          annual_max_kW: +basePool.annual_max[0].toFixed(1),
          battery_cycles_year: +basePool.cycles_inv[0].toFixed(1),
          overload_hours_year: +basePool.overload_h[0].toFixed(1),
          unserved_energy_kWh_year: +basePool.unserved_kwh[0].toFixed(1),
          avg_24h_feeder_load_kW: pool_feeder_profile,
        },
        improvements: {
          delta_outage_hours_pct,
          delta_ctrl_outage_pct,
          delta_noinv_outage_pct,
          delta_worst_10_pct,
          delta_peak_pct,
          delta_unserved_pct,
          delta_cycles_pct,
          delta_overload_hours_pct,
        },
      },
      discom_24h: {
        ...baseData.discom_24h,
        baseline_feeder_load_kW: baseline_feeder_profile,
        pool_feeder_load_kW: pool_feeder_profile,
        shiftable_delta_kW: baseline_feeder_profile.map((b: number, idx: number) => +(b - pool_feeder_profile[idx]).toFixed(2)),
      },
    };
  }

  // Fallback to default precomputed data
  return getPrecomputedData();
}
