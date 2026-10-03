import {
  FeederNode,
  MasterSimulationData,
  OutageScenario,
  ScenarioMetrics,
  SimulationConfig,
  DRSignalType,
} from '../types';
import precomputedData from '../data/simulation_results.json';

// Return precomputed static data from Python simulation
export function getPrecomputedData(): MasterSimulationData {
  return precomputedData as unknown as MasterSimulationData;
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
  const max_chg_kw_base = 0.65 * (battery_capacity_ah / 150.0);
  const min_soc = 0.20;
  const charge_eff = Math.sqrt(0.90);
  const discharge_eff = Math.sqrt(0.90);

  // Generate nodes deterministically with pseudo-random seed
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const nodes: FeederNode[] = [];

  // Households
  for (let i = 1; i <= n_households; i++) {
    const has_inverter = rand() < inverter_penetration;
    const has_double = has_inverter && rand() < 0.25;
    const cap = has_inverter ? (has_double ? battery_kwh_base * 2 : battery_kwh_base) : 0;
    const max_chg = has_inverter ? (has_double ? max_chg_kw_base * 1.5 : max_chg_kw_base) : 0;
    const is_ctrl = has_inverter && rand() < controllable_share;

    const crit_kw = +(0.25 + rand() * 0.20).toFixed(3);
    const flex_kw = +(0.50 + rand() * 0.90).toFixed(3);

    nodes.push({
      id: `HH-${String(i).padStart(3, '0')}`,
      name: `Household #${i}`,
      type: 'household',
      has_inverter,
      is_controllable: is_ctrl,
      battery_capacity_kwh: cap,
      max_charge_power_kw: max_chg,
      smart_plug_installed: is_ctrl || (has_inverter && rand() < 0.3),
      critical_load_base_kw: crit_kw,
      flexible_load_base_kw: flex_kw,
      critical_appliances: [
        { name: 'Refrigerator', power_w: 180, essential: true },
        { name: 'Ceiling Fans (2)', power_w: 150, essential: true },
        { name: 'LED Lighting', power_w: 60, essential: true },
        { name: 'Wi-Fi & Phones', power_w: 40, essential: true },
      ],
      flexible_appliances: [
        { name: 'Bedroom Inverter AC', power_w: 900, essential: false },
        { name: 'Water Geyser', power_w: 1200, essential: false },
        { name: 'Washing Machine', power_w: 450, essential: false },
      ],
      baseline_outage_hours: 0,
      pool_outage_hours: 0,
      curtailment_credit_score: 0,
      next_in_rotation: false,
    });
  }

  // Shops
  const shopTypes = [
    'Sanjeevani Pharmacy', 'Gupta Grocery & Dairy', 'Om Sai Bakery & Cafe',
    'Apex Electronics & Xerox', 'Balaji General Store', 'Modern Tailors & Cleaners',
    'Metro Hardware & Electricals', 'Kalyan Sweets & Snacks', 'City Dental Clinic',
    'Pooja Florist & Gifts',
  ];

  for (let j = 1; j <= n_shops; j++) {
    const has_inverter = rand() < (inverter_penetration + 0.10);
    const mult = rand() < 0.6 ? 2 : 3;
    const cap = has_inverter ? battery_kwh_base * mult : 0;
    const max_chg = has_inverter ? max_chg_kw_base * (mult === 2 ? 1.8 : 2.5) : 0;
    const is_ctrl = has_inverter && rand() < controllable_share;

    const crit_kw = +(0.60 + rand() * 0.60).toFixed(3);
    const flex_kw = +(1.00 + rand() * 1.50).toFixed(3);

    const label = shopTypes[(j - 1) % shopTypes.length];

    nodes.push({
      id: `SH-${String(j).padStart(2, '0')}`,
      name: `${label} (Shop #${j})`,
      type: 'shop',
      has_inverter,
      is_controllable: is_ctrl,
      battery_capacity_kwh: cap,
      max_charge_power_kw: max_chg,
      smart_plug_installed: is_ctrl || (has_inverter && rand() < 0.4),
      critical_load_base_kw: crit_kw,
      flexible_load_base_kw: flex_kw,
      critical_appliances: [
        { name: 'Billing POS & Computer', power_w: 250, essential: true },
        { name: 'Commercial Fridge / Chiller', power_w: 500, essential: true },
        { name: 'Security CCTV & Wi-Fi', power_w: 90, essential: true },
        { name: 'Emergency Shop Lights', power_w: 120, essential: true },
      ],
      flexible_appliances: [
        { name: 'Illuminated Signboard', power_w: 400, essential: false },
        { name: 'Comfort Air Conditioning', power_w: 1500, essential: false },
        { name: 'Auxiliary Showcase Spotlights', power_w: 600, essential: false },
      ],
      baseline_outage_hours: 0,
      pool_outage_hours: 0,
      curtailment_credit_score: 0,
      next_in_rotation: false,
    });
  }

  // 24-hr Diurnal patterns
  const hh_diurnal = [
    0.38, 0.35, 0.33, 0.34, 0.42, 0.65, 0.95, 1.25, 1.15, 0.90,
    0.78, 0.80, 0.85, 0.82, 0.75, 0.72, 0.85, 1.10, 1.45, 1.65,
    1.55, 1.30, 0.85, 0.55,
  ];

  const shop_diurnal = [
    0.18, 0.15, 0.15, 0.15, 0.18, 0.22, 0.35, 0.60, 0.95, 1.25,
    1.40, 1.45, 1.35, 1.40, 1.45, 1.55, 1.70, 1.85, 1.95, 1.75,
    1.30, 0.80, 0.40, 0.25,
  ];

  const solar_gap_diurnal = [
    0.28, 0.24, 0.20, 0.22, 0.28, 0.45, 0.60, 0.65, 0.55, 0.38,
    0.20, 0.15, 0.12, 0.14, 0.18, 0.30, 0.52, 0.78, 0.92, 0.95,
    0.88, 0.72, 0.50, 0.35,
  ];

  // Outage configuration
  const totalHours = 8760;
  const gridAvailable = new Array(totalHours).fill(true);
  const monthlyOutages = outage_scenario === 'low' ? 3 : (outage_scenario === 'high' ? 14 : 7);
  const minDur = outage_scenario === 'low' ? 1 : (outage_scenario === 'high' ? 2 : 1);
  const maxDur = outage_scenario === 'low' ? 2 : (outage_scenario === 'high' ? 5 : 4);

  let outSeed = 202;
  const outRand = () => {
    outSeed = (outSeed * 9301 + 49297) % 233280;
    return outSeed / 233280;
  };

  for (let m = 0; m < 12; m++) {
    for (let o = 0; o < monthlyOutages; o++) {
      const day = m * 30 + Math.floor(outRand() * 30);
      if (day >= 365) continue;
      const startHOD = outRand() < 0.65 ? Math.floor(17 + outRand() * 5) : Math.floor(7 + outRand() * 8);
      const startH = day * 24 + startHOD;
      const dur = Math.floor(minDur + outRand() * (maxDur - minDur + 1));
      for (let dh = 0; dh < dur; dh++) {
        if (startH + dh < totalHours) {
          gridAvailable[startH + dh] = false;
        }
      }
    }
  }

  // Baseline Simulation
  const baseSoc = nodes.map(n => n.has_inverter ? n.battery_capacity_kwh * 0.70 : 0);
  const baseCritOutage = new Array(nodes.length).fill(0);
  let baseUnservedEnergy = 0;
  const baseHourlyFeeder = new Array(totalHours).fill(0);
  const baseHourlyCharging = new Array(totalHours).fill(0);
  const baseHourlySoc = new Array(totalHours).fill(0);
  const baseSampleHhSoc: number[] = [];
  const baseSampleShopSoc: number[] = [];

  for (let h = 0; h < totalHours; h++) {
    const hod = h % 24;
    const isGridOn = gridAvailable[h];
    const hhFactor = hh_diurnal[hod] * (1.0 + 0.15 * Math.sin((h / 8760) * 2 * Math.PI));
    const shopFactor = shop_diurnal[hod] * (1.0 + 0.15 * Math.sin((h / 8760) * 2 * Math.PI));

    let feederSum = 0;
    let chgSum = 0;
    let socPctSum = 0;
    let invCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const factor = node.type === 'household' ? hhFactor : shopFactor;
      const crit = node.critical_load_base_kw * factor;
      const flex = node.flexible_load_base_kw * factor;
      const req = crit + flex;
      const cap = node.battery_capacity_kwh;
      const minKwh = cap * min_soc;

      if (isGridOn) {
        let draw = req;
        if (node.has_inverter && baseSoc[i] < cap) {
          const room = cap - baseSoc[i];
          const chg = Math.min(node.max_charge_power_kw, room / charge_eff);
          baseSoc[i] += chg * charge_eff;
          draw += chg;
          chgSum += chg;
        }
        feederSum += draw;
      } else {
        if (node.has_inverter) {
          const avail = Math.max(0, baseSoc[i] - minKwh) * discharge_eff;
          if (avail >= req) {
            baseSoc[i] -= (req / discharge_eff);
          } else if (avail > 0) {
            const served = avail;
            const unserved = req - served;
            baseSoc[i] = minKwh;
            baseUnservedEnergy += unserved;
            if (served < crit) baseCritOutage[i]++;
          } else {
            baseUnservedEnergy += req;
            baseCritOutage[i]++;
          }
        } else {
          baseUnservedEnergy += req;
          baseCritOutage[i]++;
        }
      }

      if (node.has_inverter) {
        socPctSum += (baseSoc[i] / cap);
        invCount++;
      }
    }

    baseHourlyFeeder[h] = feederSum;
    baseHourlyCharging[h] = chgSum;
    baseHourlySoc[h] = invCount > 0 ? (socPctSum / invCount) * 100 : 0;

    if (h < 24) {
      baseSampleHhSoc.push(+(baseSoc[0] / nodes[0].battery_capacity_kwh * 100).toFixed(1));
      baseSampleShopSoc.push(+(baseSoc[n_households] / nodes[n_households].battery_capacity_kwh * 100).toFixed(1));
    }
  }

  // Pool Simulation
  const poolSoc = nodes.map(n => n.has_inverter ? n.battery_capacity_kwh * 0.70 : 0);
  const poolCredits = new Array(nodes.length).fill(0);
  const poolCritOutage = new Array(nodes.length).fill(0);
  let poolUnservedEnergy = 0;
  const poolHourlyFeeder = new Array(totalHours).fill(0);
  const poolHourlyCharging = new Array(totalHours).fill(0);
  const poolHourlySoc = new Array(totalHours).fill(0);
  const poolHourlyDR: DRSignalType[] = [];
  const poolSampleHhSoc: number[] = [];
  const poolSampleShopSoc: number[] = [];

  for (let h = 0; h < totalHours; h++) {
    const hod = h % 24;
    const isGridOn = gridAvailable[h];
    const hhFactor = hh_diurnal[hod] * (1.0 + 0.15 * Math.sin((h / 8760) * 2 * Math.PI));
    const shopFactor = shop_diurnal[hod] * (1.0 + 0.15 * Math.sin((h / 8760) * 2 * Math.PI));
    const gap = solar_gap_diurnal[hod];

    const isStress = (hod >= 18 && hod <= 22) || gap >= 0.78;
    const isChargeHour = (hod >= 11 && hod <= 15) || (hod >= 1 && hod <= 5 && gap < 0.35);

    const drSignal: DRSignalType = isStress ? 'defer_charging' : (isChargeHour ? 'encourage_charging' : 'neutral');
    if (h < 24) poolHourlyDR.push(drSignal);

    let feederSum = 0;
    let chgSum = 0;
    let socPctSum = 0;
    let invCount = 0;

    const avgCredits = poolCredits.reduce((a, b) => a + b, 0) / poolCredits.length;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const factor = node.type === 'household' ? hhFactor : shopFactor;
      const crit = node.critical_load_base_kw * factor;
      const flex = node.flexible_load_base_kw * factor;
      const req = crit + flex;
      const cap = node.battery_capacity_kwh;
      const minKwh = cap * min_soc;

      if (isGridOn) {
        if (node.is_controllable) {
          const needsEmergency = poolSoc[i] < (cap * 0.35);
          const canCharge = isChargeHour || needsEmergency;
          let draw = req;

          if (canCharge && poolSoc[i] < cap) {
            const room = cap - poolSoc[i];
            const chgRate = isChargeHour ? node.max_charge_power_kw : (node.max_charge_power_kw * 0.5);
            const chg = Math.min(chgRate, room / charge_eff);
            poolSoc[i] += chg * charge_eff;
            draw += chg;
            chgSum += chg;
          }

          // Peak shaving self-consumption
          if (isStress && poolSoc[i] > cap * 0.75) {
            const shave = Math.min(crit, (poolSoc[i] - cap * 0.70) * discharge_eff);
            poolSoc[i] -= (shave / discharge_eff);
            draw = Math.max(0, draw - shave);
          }
          feederSum += draw;
        } else {
          let draw = req;
          if (node.has_inverter && poolSoc[i] < cap) {
            const room = cap - poolSoc[i];
            const chg = Math.min(node.max_charge_power_kw, room / charge_eff);
            poolSoc[i] += chg * charge_eff;
            draw += chg;
            chgSum += chg;
          }
          feederSum += draw;
        }
      } else {
        if (node.has_inverter) {
          const avail = Math.max(0, poolSoc[i] - minKwh) * discharge_eff;
          if (node.is_controllable) {
            if (avail >= crit) {
              poolSoc[i] -= (crit / discharge_eff);
              const remainingAvail = avail - crit;
              const shouldGrantFlex = (poolCredits[i] > avgCredits + 1.2) && (poolSoc[i] > cap * 0.55);

              if (shouldGrantFlex && remainingAvail >= flex) {
                poolSoc[i] -= (flex / discharge_eff);
                poolCredits[i] = Math.max(0, poolCredits[i] - 1.2);
              } else {
                poolCredits[i] += 0.35;
                poolUnservedEnergy += (flex * 0.25);
              }
            } else {
              const served = avail;
              const unserved = crit - served;
              poolSoc[i] = minKwh;
              poolUnservedEnergy += (unserved + flex);
              poolCritOutage[i]++;
              poolCredits[i] += 1.0;
            }
          } else {
            if (avail >= req) {
              poolSoc[i] -= (req / discharge_eff);
            } else if (avail > 0) {
              const served = avail;
              const unserved = req - served;
              poolSoc[i] = minKwh;
              poolUnservedEnergy += unserved;
              if (served < crit) poolCritOutage[i]++;
            } else {
              poolUnservedEnergy += req;
              poolCritOutage[i]++;
            }
          }
        } else {
          poolUnservedEnergy += req;
          poolCritOutage[i]++;
        }
      }

      if (node.has_inverter) {
        socPctSum += (poolSoc[i] / cap);
        invCount++;
      }
    }

    if (hod === 0) {
      for (let k = 0; k < poolCredits.length; k++) {
        poolCredits[k] *= 0.98;
      }
    }

    poolHourlyFeeder[h] = feederSum;
    poolHourlyCharging[h] = chgSum;
    poolHourlySoc[h] = invCount > 0 ? (socPctSum / invCount) * 100 : 0;

    if (h < 24) {
      poolSampleHhSoc.push(+(poolSoc[0] / nodes[0].battery_capacity_kwh * 100).toFixed(1));
      poolSampleShopSoc.push(+(poolSoc[n_households] / nodes[n_households].battery_capacity_kwh * 100).toFixed(1));
    }
  }

  // Populate node outage stats
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].baseline_outage_hours = baseCritOutage[i];
    nodes[i].pool_outage_hours = poolCritOutage[i];
    nodes[i].curtailment_credit_score = +(poolCredits[i]).toFixed(2);
    nodes[i].next_in_rotation = poolCredits[i] > 1.0;
  }

  // 24-hr Diurnal aggregates
  const avg24BaseFeeder = new Array(24).fill(0);
  const avg24BaseChg = new Array(24).fill(0);
  const avg24BaseSoc = new Array(24).fill(0);
  const avg24BaseUnserved = new Array(24).fill(0);

  const avg24PoolFeeder = new Array(24).fill(0);
  const avg24PoolChg = new Array(24).fill(0);
  const avg24PoolSoc = new Array(24).fill(0);
  const avg24PoolUnserved = new Array(24).fill(0);

  for (let hod = 0; hod < 24; hod++) {
    let bFL = 0, bCh = 0, bSo = 0;
    let pFL = 0, pCh = 0, pSo = 0;
    let count = 0;
    for (let h = hod; h < totalHours; h += 24) {
      bFL += baseHourlyFeeder[h];
      bCh += baseHourlyCharging[h];
      bSo += baseHourlySoc[h];
      pFL += poolHourlyFeeder[h];
      pCh += poolHourlyCharging[h];
      pSo += poolHourlySoc[h];
      count++;
    }
    avg24BaseFeeder[hod] = +(bFL / count).toFixed(1);
    avg24BaseChg[hod] = +(bCh / count).toFixed(1);
    avg24BaseSoc[hod] = +(bSo / count).toFixed(1);

    avg24PoolFeeder[hod] = +(pFL / count).toFixed(1);
    avg24PoolChg[hod] = +(pCh / count).toFixed(1);
    avg24PoolSoc[hod] = +(pSo / count).toFixed(1);
  }

  // Metrics
  const hhCritBase = baseCritOutage.slice(0, n_households);
  const shopCritBase = baseCritOutage.slice(n_households);
  const hhCritPool = poolCritOutage.slice(0, n_households);
  const shopCritPool = poolCritOutage.slice(n_households);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const sortedHhBase = [...hhCritBase].sort((a, b) => b - a);
  const sortedHhPool = [...hhCritPool].sort((a, b) => b - a);
  const top10Count = Math.max(1, Math.floor(n_households * 0.10));

  const baseMetrics: ScenarioMetrics = {
    critical_load_outage_hours_per_household_year: +mean(hhCritBase).toFixed(1),
    critical_load_outage_hours_per_shop_year: +mean(shopCritBase).toFixed(1),
    critical_load_outage_hours_all_nodes_year: +mean(baseCritOutage).toFixed(1),
    critical_load_outage_hours_controllable_nodes: +mean(nodes.filter(n => n.is_controllable).map(n => n.baseline_outage_hours)).toFixed(1),
    critical_load_outage_hours_worst_10_percent: +mean(sortedHhBase.slice(0, top10Count)).toFixed(1),
    evening_feeder_peak_kW: +Math.max(...baseHourlyFeeder.filter((_, idx) => idx % 24 >= 18 && idx % 24 <= 22)).toFixed(1),
    unserved_energy_kWh_year: +baseUnservedEnergy.toFixed(1),
    avg_24h_feeder_load_kW: avg24BaseFeeder,
    avg_24h_charging_load_kW: avg24BaseChg,
    avg_24h_soc_pct: avg24BaseSoc,
    avg_24h_unserved_kW: avg24BaseUnserved,
  };

  const poolMetrics: ScenarioMetrics = {
    critical_load_outage_hours_per_household_year: +mean(hhCritPool).toFixed(1),
    critical_load_outage_hours_per_shop_year: +mean(shopCritPool).toFixed(1),
    critical_load_outage_hours_all_nodes_year: +mean(poolCritOutage).toFixed(1),
    critical_load_outage_hours_controllable_nodes: +mean(nodes.filter(n => n.is_controllable).map(n => n.pool_outage_hours)).toFixed(1),
    critical_load_outage_hours_worst_10_percent: +mean(sortedHhPool.slice(0, top10Count)).toFixed(1),
    evening_feeder_peak_kW: +Math.max(...poolHourlyFeeder.filter((_, idx) => idx % 24 >= 18 && idx % 24 <= 22)).toFixed(1),
    unserved_energy_kWh_year: +poolUnservedEnergy.toFixed(1),
    avg_24h_feeder_load_kW: avg24PoolFeeder,
    avg_24h_charging_load_kW: avg24PoolChg,
    avg_24h_soc_pct: avg24PoolSoc,
    avg_24h_unserved_kW: avg24PoolUnserved,
  };

  const deltaOutage = +(((baseMetrics.critical_load_outage_hours_per_household_year - poolMetrics.critical_load_outage_hours_per_household_year) / baseMetrics.critical_load_outage_hours_per_household_year) * 100).toFixed(1);
  const deltaPeak = +(((baseMetrics.evening_feeder_peak_kW - poolMetrics.evening_feeder_peak_kW) / baseMetrics.evening_feeder_peak_kW) * 100).toFixed(1);
  const deltaUnserved = +(((baseMetrics.unserved_energy_kWh_year - poolMetrics.unserved_energy_kWh_year) / baseMetrics.unserved_energy_kWh_year) * 100).toFixed(1);
  const deltaCtrl = +(((baseMetrics.critical_load_outage_hours_controllable_nodes! - poolMetrics.critical_load_outage_hours_controllable_nodes!) / baseMetrics.critical_load_outage_hours_controllable_nodes!) * 100).toFixed(1);

  const shiftableDelta = avg24BaseFeeder.map((v, i) => +(v - avg24PoolFeeder[i]).toFixed(1));

  return {
    feeder_summary: {
      feeder_id: 'FEEDER-11KV-NORTH-04',
      substation: 'Mayur Vihar 66/11kV Substation',
      transformer_rating_kva: 400,
      total_households: n_households,
      total_shops: n_shops,
      total_inverters: nodes.filter(n => n.has_inverter).length,
      controllable_inverters: nodes.filter(n => n.is_controllable).length,
      total_battery_capacity_kwh: +nodes.reduce((acc, n) => acc + n.battery_capacity_kwh, 0).toFixed(1),
      controllable_battery_kwh: +nodes.filter(n => n.is_controllable).reduce((acc, n) => acc + n.battery_capacity_kwh, 0).toFixed(1),
      aggregate_shiftable_load_kw: +nodes.filter(n => n.is_controllable).reduce((acc, n) => acc + n.flexible_load_base_kw, 0).toFixed(1),
      outage_scenario,
      controllable_share_pct: Math.round(controllable_share * 100),
      total_outage_hours_year: gridAvailable.filter(g => !g).length,
    },
    baseline: {
      metadata: { scenario: 'baseline', outage_scenario, controllable_share },
      metrics: baseMetrics,
      sample_profiles: {
        representative_day_hh_soc: baseSampleHhSoc,
        representative_day_shop_soc: baseSampleShopSoc,
      },
    },
    pool: {
      metadata: { scenario: 'inverter_pool', outage_scenario, controllable_share },
      metrics: poolMetrics,
      improvements: {
        delta_outage_hours_pct: deltaOutage,
        delta_ctrl_outage_pct: deltaCtrl,
        delta_worst_10_pct: 0.0,
        delta_peak_pct: deltaPeak,
        delta_unserved_pct: deltaUnserved,
      },
      discom_signals: {
        gap_factor_24h: solar_gap_diurnal,
        shiftable_load_delta_24h_kW: shiftableDelta,
        dr_signals_24h: poolHourlyDR,
      },
      sample_profiles: {
        representative_day_hh_soc: poolSampleHhSoc,
        representative_day_shop_soc: poolSampleShopSoc,
      },
    },
    nodes,
    discom_24h: {
      hours: Array.from({ length: 24 }, (_, i) => i),
      baseline_feeder_load_kW: avg24BaseFeeder,
      pool_feeder_load_kW: avg24PoolFeeder,
      gap_factor: solar_gap_diurnal,
      shiftable_delta_kW: shiftableDelta,
      dr_signals: poolHourlyDR,
      baseline_charging_kW: avg24BaseChg,
      pool_charging_kW: avg24PoolChg,
      baseline_soc_pct: avg24BaseSoc,
      pool_soc_pct: avg24PoolSoc,
    },
  };
}
