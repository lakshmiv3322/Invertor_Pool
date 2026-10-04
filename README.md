# Inverter Pool — Neighbourhood Virtual Power Plant (VPP)

A neighbourhood-scale virtual power plant (VPP) prototype that coordinates distributed residential home and commercial shop inverter batteries across an 11kV distribution feeder over **8,760 hourly timesteps** (1 full year) to eliminate critical outage hours, shave evening peak transformer congestion, and protect distribution infrastructure.

---

## 📊 Benchmark Results Summary (`results_base.json`)

Simulated over 8,760 hours (200 households + 20 commercial shops, 60% inverter penetration, 70% enrollment, 20 Monte Carlo seeds):

| Metric | Baseline (Uncoordinated) | Inverter Pool (Coordinated) | Improvement / Delta |
| :--- | :--- | :--- | :--- |
| **Critical Outage (All Connections)** | **95.9 ± 10.6 hrs/yr** | **70.6 ± 8.6 hrs/yr** | **-26.4% outage reduction** |
| **Critical Outage (Inverter Members)** | **26.4 ± 5.0 hrs/yr** | **7.4 ± 2.2 hrs/yr** | **-72.0% outage reduction** |
| **Critical Outage (Non-Inverter Homes)** | **210.6 ± 16.7 hrs/yr** | **174.7 ± 14.9 hrs/yr** | **-17.1% outage reduction** |
| **Worst-Served 10% Vulnerable Nodes** | **217.5 ± 17.0 hrs/yr** | **174.7 ± 14.9 hrs/yr** | **-19.7% outage reduction** |
| **Peak Feeder Load ($C_0 = 134.6\text{ kW}$)** | **164.8 ± 2.7 kW** | **147.4 ± 2.4 kW** | **-17.4 kW peak shaved (-10.6%)** |
| **Annual Transformer Overload Hours** | **297.8 ± 15.9 hrs/yr** | **266.4 ± 14.0 hrs/yr** | **-31.4 hrs overload reduction** |
| **Unserved Electrical Energy** | **2,411.0 ± 278.2 kWh/yr** | **1,770.3 ± 223.8 kWh/yr** | **-26.6% unserved energy avoided** |
| **Annual Inverter Battery Cycles** | **75.3 ± 5.5 cycles/yr** | **46.8 ± 4.1 cycles/yr** | **-37.8% battery degradation relief** |

---

## 🚀 Quickstart

### 1. Run Python Feeder Simulation
```bash
python3 simulate_feeder.py
```
Generates clean benchmark datasets:
- `results_base.json` — Core base feeder metrics & 24h diurnal profiles
- `results_sens.json` — 9-scenario parameter sensitivity matrix (30%, 50%, 70% penetration vs Low, Base, High outage stress)
- `results_abl.json` — Component ablation study across 5 algorithmic control regimes

### 2. Launch the React Web Application
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖥️ Dashboard Views

The application provides 6 specialized operational interfaces:

### 1. 📈 Overview View
- **Slide-11 Core KPIs**: Instant side-by-side comparison of baseline vs. coordinated pool metrics with percentage improvements.
- **24-Hour Feeder Load Chart**: Interactive SVG curve showing baseline surge vs. Inverter Pool valley filling and peak shaving against the **134.6 kW ($C_0$) transformer capacity limit**.
- **Cohort Bar Chart**: Resilience breakdown across all homes, pool members, non-inverter households, and the worst-served 10%.

### 2. 🎛️ Sensitivity Matrix View (`results_sens.json`)
- **Interactive 3×3 Grid**: Explore model outputs across 9 combinations of inverter penetration (30%, 50%, 70%) and outage severity (Low, Medium/Base, High).
- **Diurnal Curve Overlay**: Dynamic hourly feeder load curve overlaid with transformer thermal limit.
- **Full Benchmark Table**: Detailed comparison of outage hours, peak demand, and battery cycle wear with standard deviations.

### 3. 🔬 Ablation Study View (`results_abl.json`)
- **Mechanism Attribution**: Disentangles the contribution of:
  1. *All three levers* (Full coordinated system)
  2. *Charging control only* (Off-peak solar valley filling only)
  3. *Critical-only on battery only* (Smart plug appliance isolation only)
  4. *Ride-through-first shedding only* (Immediate flexible load shedding on voltage dip)
  5. *No levers (enrolled but inactive)* (Unmanaged fallback baseline)
- Shows which mechanism drives peak shaving vs. lifeline protection vs. battery life preservation.

### 4. 🏠 Household View
- **Node-by-Node Inspector**: View as any individual household (`HH-001` to `HH-200`) or commercial shop (`SH-01` to `SH-20`).
- **"Tonight's Plan" Smart Schedule**: Vernacular-friendly explanation of charge and protection windows.
- **24-Hour Battery SoC % Chart**: Real-time comparison showing how smart pre-charging maintains 95–100% capacity before evening peak.
- **Lifeline Appliance Checklist**: Critical loads (refrigerator, lighting, medical, Wi-Fi) vs. flexible loads (AC, geyser, washing machine).

### 5. 👥 Operator Fleet View
- **220-Node Management Table**: Filterable by installation status, battery capacity, outage severity, and controllability.
- **Live Enrollment Toggle**: Flip any individual node between autonomous pool participation and uncoordinated fallback.
- **Fairness Credit Ledger**: Transparent rotation score ensuring fair sharing of flexible load curtailment across neighbours.

### 6. ⚡ DISCOM Console
- **24-Hour Feeder Stress & Renewable Gap Forecast**: Hourly solar surplus vs. grid stress factor.
- **Automated DR Signal Matrix**: Real-time hourly dispatch directives (*Encourage Charging*, *Defer Charging*, *Neutral*).
- **Quantified Environmental & Economic Impact**:
  - Commercial diesel backup generator displacement & avoided $\text{CO}_2$ emissions.
  - Transformer thermal stress relief.
  - Avoided peak spot-market power purchase costs.

---

## ⚙️ Key Simulation Parameters

Configurable in `simulate_feeder.py` or interactively in the app via the **Config** drawer:

| Parameter | Base Value | Description |
| :--- | :--- | :--- |
| `n_hh` | `200` | Number of residential households on feeder |
| `n_shop` | `20` | Number of commercial shops / clinics / dairy |
| `pen` | `0.60` (60%) | Base inverter ownership penetration rate |
| `enroll` | `0.70` (70%) | Share of inverter owners enrolled in pool |
| `p_fault` | `0.24` | Probability factor for grid blackout events |
| `cap_margin` | `1.10` | Transformer sizing margin over nominal demand |
| `eff_chg` / `eff_inv` | `0.85` | Inverter charge and discharge efficiency |
| `dod` | `0.50` | Maximum usable depth of discharge (50% DoD) |
| `target_util` | `0.92` | Transformer target capacity utilization ceiling |
| `rt_hours` | `2.0` | Target ride-through buffer duration during outages |

---

## 📁 Repository Structure

```
├── README.md                      # Project documentation & benchmark overview
├── results_base.json              # Base feeder benchmark results (20 seeds)
├── results_sens.json              # 9-scenario sensitivity matrix data
├── results_abl.json               # 5-regime ablation study data
├── simulate_feeder.py             # Python 8,760-hour feeder simulation script
├── package.json                   # React + TypeScript + Vite configuration
├── src/
│   ├── App.tsx                    # Main viewport & navigation controller
│   ├── types/index.ts             # TypeScript definitions & data schemas
│   ├── engine/simulation.ts       # Client data ingestion & parametric simulation engine
│   ├── components/
│   │   ├── Header.tsx             # 3-Zone navigation header
│   │   ├── OverviewView.tsx       # Core KPI metrics & dual charts
│   │   ├── SensitivityView.tsx    # Interactive 9-cell sensitivity explorer
│   │   ├── AblationView.tsx       # 5-lever component attribution breakdown
│   │   ├── HouseholdView.tsx      # Consumer portal & 24h battery SoC visualizer
│   │   ├── OperatorView.tsx       # Fleet management table & live outage tester
│   │   ├── DiscomView.tsx         # Utility telemetry, DR matrix & savings
│   │   ├── FeederLoadChart.tsx    # 24-hour SVG feeder load profile curve
│   │   ├── OutageBarChart.tsx     # Cohort resilience comparison bar chart
│   │   ├── BatterySocChart.tsx    # 24-hour battery SoC percentage curve
│   │   ├── MetricCard.tsx         # Tabular figure KPI display card
│   │   └── ScenarioDrawer.tsx     # What-If parameter exploration modal
│   └── data/                      # Synchronized benchmark JSON datasets
└── vite.config.ts                 # Vite bundler configuration
```

---

## 🛡️ Core Algorithmic Pillars

1. **Off-Peak Solar Pre-Charging (Valley Filling)**: Inverters intelligently pre-charge during midday solar surplus (10:00 AM – 3:00 PM) and dawn off-peak windows, entering peak evening hours at full capacity with zero added feeder stress.
2. **Critical-Load Isolation (Lifeline Protection)**: During grid blackouts, IoT smart plugs shed high-draw flexible loads (ACs, geysers), extending battery runtime by up to $300\%$ for essential appliances.
3. **Fair Dispatch Credit Ledger**: A neighbourhood rotation ledger tracks curtailment debt across households so burden is balanced fairly over 365 days.
