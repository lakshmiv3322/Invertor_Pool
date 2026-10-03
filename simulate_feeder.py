#!/usr/bin/env python3
"""
Inverter Pool — Feeder Virtual Power Plant (VPP) Simulator
Simulates one 11kV distribution feeder over 8,760 hours (1 year) comparing:
  1. Baseline Scenario: Uncoordinated charging & unmanaged flexible loads.
  2. Inverter Pool Scenario: Coordinated off-peak charging + critical load priority + fair dispatch credit ledger.

Outputs:
  - results_baseline.json
  - results_pool.json
  - src/data/simulation_results.json (for direct React bundle import)
"""

import json
import math
import os
import random
import statistics
import sys
from typing import Any, Dict, List, Tuple

# ==========================================
# FEEDER CONFIGURATION PARAMETERS
# ==========================================
N_HOUSEHOLDS = 200
N_SHOPS = 20
HOURS = 24 * 365  # 8760 hours
CONTROLLABLE_SHARE = 0.50  # 50% of inverters enrolled in coordinated pool
OUTAGE_SCENARIO = "medium"  # "low", "medium", "high"
INVERTER_PENETRATION = 0.85  # 85% of households and shops have inverter batteries

# Typical Inverter / Battery Specifications
BATTERY_CAPACITY_AH = 150  # Ah
BATTERY_VOLTAGE = 12  # V
BATTERY_ENERGY_KWH = (BATTERY_CAPACITY_AH * BATTERY_VOLTAGE) / 1000.0  # 1.8 kWh
MAX_CHARGE_POWER_KW = 0.65  # kW (~650W typical 12V 50A charger limit)
MIN_SOC = 0.20  # 20% minimum SoC to prevent battery degradation
MAX_SOC = 1.00  # 100% maximum SoC
ROUNDTRIP_EFFICIENCY = 0.90  # 90% inverter/charging efficiency
CHARGE_EFFICIENCY = math.sqrt(ROUNDTRIP_EFFICIENCY)
DISCHARGE_EFFICIENCY = math.sqrt(ROUNDTRIP_EFFICIENCY)

# Typical Loads (kW)
HOUSEHOLD_CRITICAL_MIN = 0.25
HOUSEHOLD_CRITICAL_MAX = 0.45
HOUSEHOLD_FLEXIBLE_MIN = 0.50
HOUSEHOLD_FLEXIBLE_MAX = 1.40

SHOP_CRITICAL_MIN = 0.60
SHOP_CRITICAL_MAX = 1.20
SHOP_FLEXIBLE_MIN = 1.00
SHOP_FLEXIBLE_MAX = 2.50


def generate_feeder_config(
    n_households: int = N_HOUSEHOLDS,
    n_shops: int = N_SHOPS,
    inverter_penetration: float = INVERTER_PENETRATION,
    controllable_share: float = CONTROLLABLE_SHARE,
    seed: int = 42,
) -> List[Dict[str, Any]]:
    """Generates the fleet of households and shops connected to the feeder."""
    random.seed(seed)
    nodes = []

    # 1. Generate Households
    for i in range(1, n_households + 1):
        has_inverter = random.random() < inverter_penetration
        has_double_battery = has_inverter and (random.random() < 0.25)
        battery_kwh = (BATTERY_ENERGY_KWH * 2) if has_double_battery else (BATTERY_ENERGY_KWH if has_inverter else 0.0)
        max_chg_kw = (MAX_CHARGE_POWER_KW * 1.5) if has_double_battery else (MAX_CHARGE_POWER_KW if has_inverter else 0.0)

        is_controllable = has_inverter and (random.random() < controllable_share)

        crit_kw = round(random.uniform(HOUSEHOLD_CRITICAL_MIN, HOUSEHOLD_CRITICAL_MAX), 3)
        flex_kw = round(random.uniform(HOUSEHOLD_FLEXIBLE_MIN, HOUSEHOLD_FLEXIBLE_MAX), 3)

        nodes.append({
            "id": f"HH-{i:03d}",
            "type": "household",
            "name": f"Household #{i}",
            "has_inverter": has_inverter,
            "is_controllable": is_controllable,
            "battery_capacity_kwh": battery_kwh,
            "max_charge_power_kw": max_chg_kw,
            "min_soc": MIN_SOC,
            "critical_load_base_kw": crit_kw,
            "flexible_load_base_kw": flex_kw,
            "smart_plug_installed": is_controllable or (has_inverter and random.random() < 0.3),
            "priority_weight": round(random.uniform(0.9, 1.1), 2),
            "critical_appliances": [
                {"name": "Refrigerator", "power_w": 180, "essential": True},
                {"name": "Ceiling Fans (2)", "power_w": 150, "essential": True},
                {"name": "LED Lighting", "power_w": 60, "essential": True},
                {"name": "Wi-Fi & Phones", "power_w": 40, "essential": True},
            ],
            "flexible_appliances": [
                {"name": "Bedroom Inverter AC", "power_w": 900, "essential": False},
                {"name": "Water Geyser", "power_w": 1200, "essential": False},
                {"name": "Washing Machine", "power_w": 450, "essential": False},
            ],
        })

    # 2. Generate Shops
    shop_types = [
        "Sanjeevani Pharmacy", "Gupta Grocery & Dairy", "Om Sai Bakery & Cafe",
        "Apex Electronics & Xerox", "Balaji General Store", "Modern Tailors & Cleaners",
        "Metro Hardware & Electricals", "Kalyan Sweets & Snacks", "City Dental Clinic",
        "Pooja Florist & Gifts"
    ]

    for j in range(1, n_shops + 1):
        has_inverter = random.random() < (inverter_penetration + 0.10)
        battery_multiplier = random.choice([2, 2, 3])
        battery_kwh = (BATTERY_ENERGY_KWH * battery_multiplier) if has_inverter else 0.0
        max_chg_kw = (MAX_CHARGE_POWER_KW * (1.8 if battery_multiplier == 2 else 2.5)) if has_inverter else 0.0

        is_controllable = has_inverter and (random.random() < controllable_share)

        crit_kw = round(random.uniform(SHOP_CRITICAL_MIN, SHOP_CRITICAL_MAX), 3)
        flex_kw = round(random.uniform(SHOP_FLEXIBLE_MIN, SHOP_FLEXIBLE_MAX), 3)

        shop_label = shop_types[(j - 1) % len(shop_types)]

        nodes.append({
            "id": f"SH-{j:02d}",
            "type": "shop",
            "name": f"{shop_label} (Shop #{j})",
            "has_inverter": has_inverter,
            "is_controllable": is_controllable,
            "battery_capacity_kwh": battery_kwh,
            "max_charge_power_kw": max_chg_kw,
            "min_soc": MIN_SOC,
            "critical_load_base_kw": crit_kw,
            "flexible_load_base_kw": flex_kw,
            "smart_plug_installed": is_controllable or (has_inverter and random.random() < 0.4),
            "priority_weight": round(random.uniform(1.0, 1.25), 2),
            "critical_appliances": [
                {"name": "Billing POS & Computer", "power_w": 250, "essential": True},
                {"name": "Commercial Fridge / Chiller", "power_w": 500, "essential": True},
                {"name": "Security CCTV & Wi-Fi", "power_w": 90, "essential": True},
                {"name": "Emergency Shop Lights", "power_w": 120, "essential": True},
            ],
            "flexible_appliances": [
                {"name": "Illuminated Signboard", "power_w": 400, "essential": False},
                {"name": "Comfort Air Conditioning", "power_w": 1500, "essential": False},
                {"name": "Auxiliary Showcase Spotlights", "power_w": 600, "essential": False},
            ],
        })

    return nodes


def generate_load_profiles(hours: int = HOURS, seed: int = 101) -> List[Dict[str, Any]]:
    """Generates synthetic 8,760 hours of 24h baseline demand factors and renewable gap factor."""
    random.seed(seed)

    hh_diurnal = [
        0.38, 0.35, 0.33, 0.34, 0.42, 0.65, 0.95, 1.25, 1.15, 0.90,
        0.78, 0.80, 0.85, 0.82, 0.75, 0.72, 0.85, 1.10, 1.45, 1.65,
        1.55, 1.30, 0.85, 0.55
    ]

    shop_diurnal = [
        0.18, 0.15, 0.15, 0.15, 0.18, 0.22, 0.35, 0.60, 0.95, 1.25,
        1.40, 1.45, 1.35, 1.40, 1.45, 1.55, 1.70, 1.85, 1.95, 1.75,
        1.30, 0.80, 0.40, 0.25
    ]

    solar_gap_diurnal = [
        0.28, 0.24, 0.20, 0.22, 0.28, 0.45, 0.60, 0.65, 0.55, 0.38,
        0.20, 0.15, 0.12, 0.14, 0.18, 0.30, 0.52, 0.78, 0.92, 0.95,
        0.88, 0.72, 0.50, 0.35
    ]

    hourly_profiles = []
    for h in range(hours):
        day = h // 24
        hour_of_day = h % 24
        day_of_year = day % 365
        month = int((day_of_year / 365.0) * 12)

        season_mult = 1.0 + 0.25 * math.sin((day_of_year - 80) / 365.0 * 2 * math.pi)
        weather_noise = random.gauss(1.0, 0.05)

        hh_factor = hh_diurnal[hour_of_day] * season_mult * weather_noise
        shop_factor = shop_diurnal[hour_of_day] * season_mult * weather_noise

        gap_factor = solar_gap_diurnal[hour_of_day] * (1.0 + 0.15 * math.sin((day_of_year - 120) / 365.0 * 2 * math.pi))
        gap_factor = max(0.05, min(0.99, gap_factor + random.gauss(0.0, 0.03)))

        is_weekend = (day % 7) in [5, 6]
        if is_weekend:
            hh_factor *= 1.10
            shop_factor *= 0.95

        hourly_profiles.append({
            "hour_index": h,
            "day": day,
            "hour_of_day": hour_of_day,
            "month": month,
            "hh_load_factor": max(0.2, hh_factor),
            "shop_load_factor": max(0.15, shop_factor),
            "renewable_gap_factor": round(gap_factor, 3),
        })

    return hourly_profiles


def generate_outage_events(
    hours: int = HOURS, scenario: str = OUTAGE_SCENARIO, seed: int = 202
) -> List[bool]:
    """Generates stochastic grid availability array (True=Grid ON, False=Outage)."""
    random.seed(seed)
    grid_available = [True] * hours

    if scenario == "low":
        monthly_outages = 3
        duration_range = (1, 2)
    elif scenario == "high":
        monthly_outages = 14
        duration_range = (2, 5)
    else:  # "medium"
        monthly_outages = 7
        duration_range = (1, 4)

    total_days = hours // 24
    for month in range(12):
        for _ in range(monthly_outages):
            day_in_month = random.randint(0, 29)
            day = month * 30 + day_in_month
            if day >= total_days:
                continue

            if random.random() < 0.65:
                start_hour_of_day = random.randint(17, 21)
            else:
                start_hour_of_day = random.randint(7, 15)

            start_h = day * 24 + start_hour_of_day
            duration = random.randint(duration_range[0], duration_range[1])

            for h_offset in range(duration):
                h = start_h + h_offset
                if h < hours:
                    grid_available[h] = False

    return grid_available


def run_baseline_scenario(
    nodes: List[Dict[str, Any]],
    profiles: List[Dict[str, Any]],
    grid_available: List[bool],
) -> Dict[str, Any]:
    hours = len(profiles)
    num_nodes = len(nodes)

    soc = [
        (node["battery_capacity_kwh"] * 0.70) if node["has_inverter"] else 0.0
        for node in nodes
    ]

    total_unserved_energy_kwh = 0.0
    critical_outage_hours_per_node = [0] * num_nodes
    total_curtailed_flex_hours_per_node = [0] * num_nodes

    hourly_feeder_load_kw = [0.0] * hours
    hourly_unserved_load_kw = [0.0] * hours
    hourly_avg_soc = [0.0] * hours
    hourly_charging_load_kw = [0.0] * hours

    sample_hh_soc = []
    sample_shop_soc = []

    for h in range(hours):
        p = profiles[h]
        is_grid_on = grid_available[h]
        hh_factor = p["hh_load_factor"]
        shop_factor = p["shop_load_factor"]

        feeder_load_sum = 0.0
        unserved_load_sum = 0.0
        charging_load_sum = 0.0
        soc_pct_sum = 0.0
        inverter_count = 0

        for i, node in enumerate(nodes):
            is_hh = node["type"] == "household"
            factor = hh_factor if is_hh else shop_factor
            crit_req = node["critical_load_base_kw"] * factor
            flex_req = node["flexible_load_base_kw"] * factor
            total_req = crit_req + flex_req

            has_inv = node["has_inverter"]
            cap = node["battery_capacity_kwh"]
            min_kwh = cap * node["min_soc"]

            if is_grid_on:
                node_grid_draw = total_req
                if has_inv and soc[i] < cap:
                    room = cap - soc[i]
                    charge_power = min(node["max_charge_power_kw"], room / CHARGE_EFFICIENCY)
                    soc[i] += charge_power * CHARGE_EFFICIENCY
                    node_grid_draw += charge_power
                    charging_load_sum += charge_power
                feeder_load_sum += node_grid_draw
            else:
                if has_inv:
                    available_energy = max(0.0, soc[i] - min_kwh) * DISCHARGE_EFFICIENCY
                    if available_energy >= total_req:
                        soc[i] -= (total_req / DISCHARGE_EFFICIENCY)
                    elif available_energy > 0:
                        served = available_energy
                        unserved = total_req - served
                        soc[i] = min_kwh
                        total_unserved_energy_kwh += unserved
                        unserved_load_sum += unserved
                        if served < crit_req:
                            critical_outage_hours_per_node[i] += 1
                        total_curtailed_flex_hours_per_node[i] += 1
                    else:
                        unserved = total_req
                        total_unserved_energy_kwh += unserved
                        unserved_load_sum += unserved
                        critical_outage_hours_per_node[i] += 1
                        total_curtailed_flex_hours_per_node[i] += 1
                else:
                    unserved = total_req
                    total_unserved_energy_kwh += unserved
                    unserved_load_sum += unserved
                    critical_outage_hours_per_node[i] += 1
                    total_curtailed_flex_hours_per_node[i] += 1

            if has_inv:
                soc_pct_sum += (soc[i] / cap)
                inverter_count += 1

        hourly_feeder_load_kw[h] = round(feeder_load_sum, 2)
        hourly_unserved_load_kw[h] = round(unserved_load_sum, 2)
        hourly_charging_load_kw[h] = round(charging_load_sum, 2)
        hourly_avg_soc[h] = round((soc_pct_sum / inverter_count) * 100, 1) if inverter_count > 0 else 0.0

        if h < 24 * 7:
            sample_hh_soc.append(round((soc[0] / nodes[0]["battery_capacity_kwh"]) * 100, 1) if nodes[0]["has_inverter"] else 0)
            sample_shop_soc.append(round((soc[200] / nodes[200]["battery_capacity_kwh"]) * 100, 1) if nodes[200]["has_inverter"] else 0)

    return {
        "scenario": "baseline",
        "hourly_feeder_load_kw": hourly_feeder_load_kw,
        "hourly_unserved_load_kw": hourly_unserved_load_kw,
        "hourly_avg_soc": hourly_avg_soc,
        "hourly_charging_load_kw": hourly_charging_load_kw,
        "critical_outage_hours_per_node": critical_outage_hours_per_node,
        "total_curtailed_flex_hours_per_node": total_curtailed_flex_hours_per_node,
        "total_unserved_energy_kwh": round(total_unserved_energy_kwh, 2),
        "sample_hh_soc": sample_hh_soc,
        "sample_shop_soc": sample_shop_soc,
    }


def run_pool_scenario(
    nodes: List[Dict[str, Any]],
    profiles: List[Dict[str, Any]],
    grid_available: List[bool],
) -> Dict[str, Any]:
    hours = len(profiles)
    num_nodes = len(nodes)

    soc = [
        (node["battery_capacity_kwh"] * 0.70) if node["has_inverter"] else 0.0
        for node in nodes
    ]

    curtailment_credits = [0.0] * num_nodes
    critical_outage_hours_per_node = [0] * num_nodes
    total_curtailed_flex_hours_per_node = [0] * num_nodes
    total_unserved_energy_kwh = 0.0

    hourly_feeder_load_kw = [0.0] * hours
    hourly_unserved_load_kw = [0.0] * hours
    hourly_avg_soc = [0.0] * hours
    hourly_charging_load_kw = [0.0] * hours
    hourly_dr_signal = ["neutral"] * hours

    sample_hh_soc = []
    sample_shop_soc = []

    for h in range(hours):
        p = profiles[h]
        is_grid_on = grid_available[h]
        hh_factor = p["hh_load_factor"]
        shop_factor = p["shop_load_factor"]
        gap = p["renewable_gap_factor"]
        hour_of_day = p["hour_of_day"]

        is_stress_hour = (18 <= hour_of_day <= 22) or (gap >= 0.78)
        is_charge_friendly_hour = (11 <= hour_of_day <= 15) or (1 <= hour_of_day <= 5 and gap < 0.35)

        if is_stress_hour:
            dr_signal = "defer_charging"
        elif is_charge_friendly_hour:
            dr_signal = "encourage_charging"
        else:
            dr_signal = "neutral"
        hourly_dr_signal[h] = dr_signal

        feeder_load_sum = 0.0
        unserved_load_sum = 0.0
        charging_load_sum = 0.0
        soc_pct_sum = 0.0
        inverter_count = 0

        avg_credits = statistics.mean(curtailment_credits) if curtailment_credits else 0.0

        for i, node in enumerate(nodes):
            is_hh = node["type"] == "household"
            factor = hh_factor if is_hh else shop_factor
            crit_req = node["critical_load_base_kw"] * factor
            flex_req = node["flexible_load_base_kw"] * factor
            total_req = crit_req + flex_req

            has_inv = node["has_inverter"]
            is_ctrl = node["is_controllable"]
            cap = node["battery_capacity_kwh"]
            min_kwh = cap * node["min_soc"]

            if is_grid_on:
                if is_ctrl:
                    needs_emergency_charge = soc[i] < (cap * 0.35)
                    can_charge = is_charge_friendly_hour or needs_emergency_charge

                    node_grid_draw = total_req

                    if can_charge and soc[i] < cap:
                        room = cap - soc[i]
                        charge_rate = node["max_charge_power_kw"] if is_charge_friendly_hour else (node["max_charge_power_kw"] * 0.5)
                        charge_power = min(charge_rate, room / CHARGE_EFFICIENCY)
                        soc[i] += charge_power * CHARGE_EFFICIENCY
                        node_grid_draw += charge_power
                        charging_load_sum += charge_power

                    # Peak shaving during evening peak
                    if is_stress_hour and soc[i] > (cap * 0.75):
                        shave_amount = min(crit_req, (soc[i] - (cap * 0.70)) * DISCHARGE_EFFICIENCY)
                        soc[i] -= (shave_amount / DISCHARGE_EFFICIENCY)
                        node_grid_draw = max(0.0, node_grid_draw - shave_amount)

                    feeder_load_sum += node_grid_draw
                else:
                    node_grid_draw = total_req
                    if has_inv and soc[i] < cap:
                        room = cap - soc[i]
                        charge_power = min(node["max_charge_power_kw"], room / CHARGE_EFFICIENCY)
                        soc[i] += charge_power * CHARGE_EFFICIENCY
                        node_grid_draw += charge_power
                        charging_load_sum += charge_power
                    feeder_load_sum += node_grid_draw
            else:
                if has_inv:
                    available_energy = max(0.0, soc[i] - min_kwh) * DISCHARGE_EFFICIENCY

                    if is_ctrl:
                        # Protect critical load first
                        if available_energy >= crit_req:
                            soc[i] -= (crit_req / DISCHARGE_EFFICIENCY)
                            available_energy -= crit_req

                            # Check fairness credit ledger for flexible load permission
                            should_grant_flex = (curtailment_credits[i] > avg_credits + 1.2) and (soc[i] > cap * 0.55)

                            if should_grant_flex and available_energy >= flex_req:
                                soc[i] -= (flex_req / DISCHARGE_EFFICIENCY)
                                curtailment_credits[i] = max(0.0, curtailment_credits[i] - 1.2)
                            else:
                                total_curtailed_flex_hours_per_node[i] += 1
                                curtailment_credits[i] += 0.35
                                total_unserved_energy_kwh += (flex_req * 0.25)
                        else:
                            served = available_energy
                            unserved = crit_req - served
                            soc[i] = min_kwh
                            total_unserved_energy_kwh += (unserved + flex_req)
                            unserved_load_sum += (unserved + flex_req)
                            critical_outage_hours_per_node[i] += 1
                            total_curtailed_flex_hours_per_node[i] += 1
                            curtailment_credits[i] += 1.0
                    else:
                        if available_energy >= total_req:
                            soc[i] -= (total_req / DISCHARGE_EFFICIENCY)
                        elif available_energy > 0:
                            served = available_energy
                            unserved = total_req - served
                            soc[i] = min_kwh
                            total_unserved_energy_kwh += unserved
                            unserved_load_sum += unserved
                            if served < crit_req:
                                critical_outage_hours_per_node[i] += 1
                            total_curtailed_flex_hours_per_node[i] += 1
                        else:
                            unserved = total_req
                            total_unserved_energy_kwh += unserved
                            unserved_load_sum += unserved
                            critical_outage_hours_per_node[i] += 1
                            total_curtailed_flex_hours_per_node[i] += 1
                else:
                    unserved = total_req
                    total_unserved_energy_kwh += unserved
                    unserved_load_sum += unserved
                    critical_outage_hours_per_node[i] += 1
                    total_curtailed_flex_hours_per_node[i] += 1

            if has_inv:
                soc_pct_sum += (soc[i] / cap)
                inverter_count += 1

        if hour_of_day == 0:
            curtailment_credits = [c * 0.98 for c in curtailment_credits]

        hourly_feeder_load_kw[h] = round(feeder_load_sum, 2)
        hourly_unserved_load_kw[h] = round(unserved_load_sum, 2)
        hourly_charging_load_kw[h] = round(charging_load_sum, 2)
        hourly_avg_soc[h] = round((soc_pct_sum / inverter_count) * 100, 1) if inverter_count > 0 else 0.0

        if h < 24 * 7:
            sample_hh_soc.append(round((soc[0] / nodes[0]["battery_capacity_kwh"]) * 100, 1) if nodes[0]["has_inverter"] else 0)
            sample_shop_soc.append(round((soc[200] / nodes[200]["battery_capacity_kwh"]) * 100, 1) if nodes[200]["has_inverter"] else 0)

    return {
        "scenario": "inverter_pool",
        "hourly_feeder_load_kw": hourly_feeder_load_kw,
        "hourly_unserved_load_kw": hourly_unserved_load_kw,
        "hourly_avg_soc": hourly_avg_soc,
        "hourly_charging_load_kw": hourly_charging_load_kw,
        "hourly_dr_signal": hourly_dr_signal,
        "critical_outage_hours_per_node": critical_outage_hours_per_node,
        "total_curtailed_flex_hours_per_node": total_curtailed_flex_hours_per_node,
        "curtailment_credits": [round(c, 2) for c in curtailment_credits],
        "total_unserved_energy_kwh": round(total_unserved_energy_kwh, 2),
        "sample_hh_soc": sample_hh_soc,
        "sample_shop_soc": sample_shop_soc,
    }


def compute_metrics(
    nodes: List[Dict[str, Any]],
    res: Dict[str, Any],
    hours: int = HOURS,
) -> Dict[str, Any]:
    crit_hours = res["critical_outage_hours_per_node"]
    hh_indices = [i for i, n in enumerate(nodes) if n["type"] == "household"]
    shop_indices = [i for i, n in enumerate(nodes) if n["type"] == "shop"]
    ctrl_indices = [i for i, n in enumerate(nodes) if n["is_controllable"]]
    unctrl_inv_indices = [i for i, n in enumerate(nodes) if n["has_inverter"] and not n["is_controllable"]]
    no_inv_indices = [i for i, n in enumerate(nodes) if not n["has_inverter"]]

    hh_crit_hours = [crit_hours[i] for i in hh_indices]
    shop_crit_hours = [crit_hours[i] for i in shop_indices]

    avg_hh_outage_hours = round(statistics.mean(hh_crit_hours), 1)
    avg_shop_outage_hours = round(statistics.mean(shop_crit_hours), 1)
    avg_all_outage_hours = round(statistics.mean(crit_hours), 1)

    avg_ctrl_outage_hours = round(statistics.mean([crit_hours[i] for i in ctrl_indices]), 1) if ctrl_indices else 0.0
    avg_unctrl_inv_outage_hours = round(statistics.mean([crit_hours[i] for i in unctrl_inv_indices]), 1) if unctrl_inv_indices else 0.0
    avg_no_inv_outage_hours = round(statistics.mean([crit_hours[i] for i in no_inv_indices]), 1) if no_inv_indices else 0.0

    sorted_hh_crit = sorted(hh_crit_hours, reverse=True)
    top_10_pct_count = max(1, int(len(sorted_hh_crit) * 0.10))
    worst_10_percent_outage_hours = round(statistics.mean(sorted_hh_crit[:top_10_pct_count]), 1)

    evening_peaks = []
    for h in range(hours):
        hour_of_day = h % 24
        if 18 <= hour_of_day <= 22:
            evening_peaks.append(res["hourly_feeder_load_kw"][h])
    evening_feeder_peak_kw = round(max(evening_peaks) if evening_peaks else 0.0, 1)

    avg_24h_feeder_load = [0.0] * 24
    avg_24h_charging_load = [0.0] * 24
    avg_24h_soc = [0.0] * 24
    avg_24h_unserved = [0.0] * 24

    for hod in range(24):
        hod_loads = [res["hourly_feeder_load_kw"][h] for h in range(hod, hours, 24)]
        hod_chg = [res["hourly_charging_load_kw"][h] for h in range(hod, hours, 24)]
        hod_soc = [res["hourly_avg_soc"][h] for h in range(hod, hours, 24)]
        hod_unserved = [res["hourly_unserved_load_kw"][h] for h in range(hod, hours, 24)]

        avg_24h_feeder_load[hod] = round(statistics.mean(hod_loads), 1)
        avg_24h_charging_load[hod] = round(statistics.mean(hod_chg), 1)
        avg_24h_soc[hod] = round(statistics.mean(hod_soc), 1)
        avg_24h_unserved[hod] = round(statistics.mean(hod_unserved), 2)

    return {
        "critical_load_outage_hours_per_household_year": avg_hh_outage_hours,
        "critical_load_outage_hours_per_shop_year": avg_shop_outage_hours,
        "critical_load_outage_hours_all_nodes_year": avg_all_outage_hours,
        "critical_load_outage_hours_controllable_nodes": avg_ctrl_outage_hours,
        "critical_load_outage_hours_uncontrolled_inverter_nodes": avg_unctrl_inv_outage_hours,
        "critical_load_outage_hours_no_inverter_nodes": avg_no_inv_outage_hours,
        "critical_load_outage_hours_worst_10_percent": worst_10_percent_outage_hours,
        "evening_feeder_peak_kW": evening_feeder_peak_kw,
        "unserved_energy_kWh_year": res["total_unserved_energy_kwh"],
        "avg_24h_feeder_load_kW": avg_24h_feeder_load,
        "avg_24h_charging_load_kW": avg_24h_charging_load,
        "avg_24h_soc_pct": avg_24h_soc,
        "avg_24h_unserved_kW": avg_24h_unserved,
    }


def save_results(
    nodes: List[Dict[str, Any]],
    profiles: List[Dict[str, Any]],
    grid_available: List[bool],
    res_base: Dict[str, Any],
    res_pool: Dict[str, Any],
    metrics_base: Dict[str, Any],
    metrics_pool: Dict[str, Any],
) -> None:
    gap_24h = []
    for hod in range(24):
        gaps = [profiles[h]["renewable_gap_factor"] for h in range(hod, len(profiles), 24)]
        gap_24h.append(round(statistics.mean(gaps), 3))

    shiftable_delta_24h = [
        round(metrics_base["avg_24h_feeder_load_kW"][i] - metrics_pool["avg_24h_feeder_load_kW"][i], 1)
        for i in range(24)
    ]

    delta_outage_pct = round(
        ((metrics_base["critical_load_outage_hours_per_household_year"] - metrics_pool["critical_load_outage_hours_per_household_year"])
         / max(0.1, metrics_base["critical_load_outage_hours_per_household_year"])) * 100, 1
    )
    delta_ctrl_outage_pct = round(
        ((metrics_base["critical_load_outage_hours_controllable_nodes"] - metrics_pool["critical_load_outage_hours_controllable_nodes"])
         / max(0.1, metrics_base["critical_load_outage_hours_controllable_nodes"])) * 100, 1
    )
    delta_peak_pct = round(
        ((metrics_base["evening_feeder_peak_kW"] - metrics_pool["evening_feeder_peak_kW"])
         / max(0.1, metrics_base["evening_feeder_peak_kW"])) * 100, 1
    )
    delta_unserved_pct = round(
        ((metrics_base["unserved_energy_kWh_year"] - metrics_pool["unserved_energy_kWh_year"])
         / max(0.1, metrics_base["unserved_energy_kWh_year"])) * 100, 1
    )

    baseline_payload = {
        "metadata": {
            "feeder_id": "FEEDER-11KV-NORTH-04",
            "substation": "Mayur Vihar 66/11kV Substation",
            "households": N_HOUSEHOLDS,
            "shops": N_SHOPS,
            "hours": HOURS,
            "scenario": "baseline",
            "outage_scenario": OUTAGE_SCENARIO,
            "controllable_share": CONTROLLABLE_SHARE,
        },
        "metrics": metrics_base,
        "sample_profiles": {
            "representative_day_hh_soc": res_base["sample_hh_soc"][:24],
            "representative_day_shop_soc": res_base["sample_shop_soc"][:24],
            "representative_week_hh_soc": res_base["sample_hh_soc"][:168],
        },
    }

    pool_payload = {
        "metadata": {
            "feeder_id": "FEEDER-11KV-NORTH-04",
            "substation": "Mayur Vihar 66/11kV Substation",
            "households": N_HOUSEHOLDS,
            "shops": N_SHOPS,
            "hours": HOURS,
            "scenario": "inverter_pool",
            "outage_scenario": OUTAGE_SCENARIO,
            "controllable_share": CONTROLLABLE_SHARE,
        },
        "metrics": metrics_pool,
        "improvements": {
            "delta_outage_hours_pct": delta_outage_pct,
            "delta_ctrl_outage_pct": delta_ctrl_outage_pct,
            "delta_peak_pct": delta_peak_pct,
            "delta_unserved_pct": delta_unserved_pct,
        },
        "discom_signals": {
            "gap_factor_24h": gap_24h,
            "shiftable_load_delta_24h_kW": shiftable_delta_24h,
            "dr_signals_24h": res_pool["hourly_dr_signal"][:24],
        },
        "sample_profiles": {
            "representative_day_hh_soc": res_pool["sample_hh_soc"][:24],
            "representative_day_shop_soc": res_pool["sample_shop_soc"][:24],
            "representative_week_hh_soc": res_pool["sample_hh_soc"][:168],
        },
    }

    with open("results_baseline.json", "w") as f:
        json.dump(baseline_payload, f, indent=2)

    with open("results_pool.json", "w") as f:
        json.dump(pool_payload, f, indent=2)

    fleet_nodes = []
    for i, node in enumerate(nodes):
        fleet_nodes.append({
            "id": node["id"],
            "name": node["name"],
            "type": node["type"],
            "has_inverter": node["has_inverter"],
            "is_controllable": node["is_controllable"],
            "battery_capacity_kwh": node["battery_capacity_kwh"],
            "max_charge_power_kw": node["max_charge_power_kw"],
            "smart_plug_installed": node["smart_plug_installed"],
            "critical_load_base_kw": node["critical_load_base_kw"],
            "flexible_load_base_kw": node["flexible_load_base_kw"],
            "critical_appliances": node["critical_appliances"],
            "flexible_appliances": node["flexible_appliances"],
            "baseline_outage_hours": res_base["critical_outage_hours_per_node"][i],
            "pool_outage_hours": res_pool["critical_outage_hours_per_node"][i],
            "curtailment_credit_score": res_pool["curtailment_credits"][i] if "curtailment_credits" in res_pool else 0.0,
            "next_in_rotation": (res_pool["curtailment_credits"][i] > 1.0) if "curtailment_credits" in res_pool else False,
        })

    os.makedirs("src/data", exist_ok=True)
    master_dataset = {
        "feeder_summary": {
            "feeder_id": "FEEDER-11KV-NORTH-04",
            "substation": "Mayur Vihar 66/11kV Substation",
            "transformer_rating_kva": 400,
            "total_households": N_HOUSEHOLDS,
            "total_shops": N_SHOPS,
            "total_inverters": sum(1 for n in nodes if n["has_inverter"]),
            "controllable_inverters": sum(1 for n in nodes if n["is_controllable"]),
            "total_battery_capacity_kwh": round(sum(n["battery_capacity_kwh"] for n in nodes), 1),
            "controllable_battery_kwh": round(sum(n["battery_capacity_kwh"] for n in nodes if n["is_controllable"]), 1),
            "aggregate_shiftable_load_kw": round(sum(n["flexible_load_base_kw"] for n in nodes if n["is_controllable"]), 1),
            "outage_scenario": OUTAGE_SCENARIO,
            "controllable_share_pct": int(CONTROLLABLE_SHARE * 100),
            "total_outage_hours_year": sum(1 for g in grid_available if not g),
        },
        "baseline": baseline_payload,
        "pool": pool_payload,
        "nodes": fleet_nodes,
        "discom_24h": {
            "hours": list(range(24)),
            "baseline_feeder_load_kW": metrics_base["avg_24h_feeder_load_kW"],
            "pool_feeder_load_kW": metrics_pool["avg_24h_feeder_load_kW"],
            "gap_factor": gap_24h,
            "shiftable_delta_kW": shiftable_delta_24h,
            "dr_signals": res_pool["hourly_dr_signal"][:24],
            "baseline_charging_kW": metrics_base["avg_24h_charging_load_kW"],
            "pool_charging_kW": metrics_pool["avg_24h_charging_load_kW"],
            "baseline_soc_pct": metrics_base["avg_24h_soc_pct"],
            "pool_soc_pct": metrics_pool["avg_24h_soc_pct"],
        },
    }

    with open("src/data/simulation_results.json", "w") as f:
        json.dump(master_dataset, f, indent=2)

    print("\n" + "=" * 68)
    print("           INVERTER POOL — FEEDER SIMULATION RESULTS")
    print("=" * 68)
    print(f"Feeder: 11kV Substation ({N_HOUSEHOLDS} Households, {N_SHOPS} Shops)")
    print(f"Inverter Adoption: {sum(1 for n in nodes if n['has_inverter'])} / {len(nodes)} ({(sum(1 for n in nodes if n['has_inverter'])/len(nodes))*100:.1f}%)")
    print(f"Controllable Inverter Pool: {sum(1 for n in nodes if n['is_controllable'])} nodes ({CONTROLLABLE_SHARE*100:.0f}%)")
    print(f"Outage Scenario: {OUTAGE_SCENARIO.upper()} ({sum(1 for g in grid_available if not g)} grid outage hours/year)")
    print("-" * 68)
    print(f"{'METRIC':<42} | {'BASELINE':<10} | {'INVERTER POOL':<12}")
    print("-" * 68)
    print(f"{'Crit Outage (hrs/household/yr)':<42} | {metrics_base['critical_load_outage_hours_per_household_year']:<10.1f} | {metrics_pool['critical_load_outage_hours_per_household_year']:<12.1f} (-{delta_outage_pct}%)")
    print(f"{'Pool Participant Outage (hrs/yr)':<42} | {metrics_base['critical_load_outage_hours_controllable_nodes']:<10.1f} | {metrics_pool['critical_load_outage_hours_controllable_nodes']:<12.1f} (-{delta_ctrl_outage_pct}%)")
    print(f"{'Evening Feeder Peak (kW)':<42} | {metrics_base['evening_feeder_peak_kW']:<10.1f} | {metrics_pool['evening_feeder_peak_kW']:<12.1f} (-{delta_peak_pct}%)")
    print(f"{'Unserved Energy (kWh/yr)':<42} | {metrics_base['unserved_energy_kWh_year']:<10.1f} | {metrics_pool['unserved_energy_kWh_year']:<12.1f} (-{delta_unserved_pct}%)")
    print("=" * 68 + "\n")


def main():
    nodes = generate_feeder_config()
    profiles = generate_load_profiles()
    grid_available = generate_outage_events()
    res_base = run_baseline_scenario(nodes, profiles, grid_available)
    metrics_base = compute_metrics(nodes, res_base)
    res_pool = run_pool_scenario(nodes, profiles, grid_available)
    metrics_pool = compute_metrics(nodes, res_pool)
    save_results(nodes, profiles, grid_available, res_base, res_pool, metrics_base, metrics_pool)


if __name__ == "__main__":
    main()
