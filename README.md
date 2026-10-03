# Inverter Pool — Virtual Power Plant (VPP) Feeder Simulation

A neighbourhood-scale virtual power plant (VPP) prototype that coordinates distributed home and commercial shop inverter batteries to improve 11kV distribution grid reliability, eliminate critical outage hours, and shave evening feeder peaks.

---

## 🚀 Quickstart

### 1. Run the Python Feeder Simulation (8,760 Hourly Timesteps)
```bash
python3 simulate_feeder.py
```
This executes the 1-year feeder simulation for both **Baseline** (uncoordinated) and **Inverter Pool** (coordinated VPP) scenarios, printing a console summary and generating:
- `results_baseline.json`
- `results_pool.json`
- `src/data/simulation_results.json`

### 2. Launch the React Dashboard
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 📊 Dashboard Views

1. **Overview View**:
   - Slide-11 core KPIs comparing Baseline vs Inverter Pool:
     - *Critical-load outage hours / household / year*
     - *Worst-served 10% outage hours*
     - *Evening feeder peak (kW)*
     - *Unserved electrical energy (kWh / year)*
   - Bar chart breakdown across customer cohorts.
   - 24-hour aggregated feeder load profile chart with peak stress windows.

2. **Household View**:
   - Customer profile viewer (`HH-001` to `HH-200` homes and `SH-01` to `SH-20` commercial shops).
   - "Tonight's Plan": Vernacular-friendly dispatch summary.
   - Critical lifeline load protection list vs Flexible load shedding status.
   - 24-hour battery State of Charge (SoC %) comparison curve.

3. **Operator Fleet View**:
   - Fleet manager for all 220 connected feeder nodes.
   - Smart plug status, controllable enrollment, 7-day curtailment credit ledger, next-in-rotation priority queue.
   - Live grid blackout stress test injector.

4. **DISCOM Console**:
   - 24-hour feeder stress & renewable gap forecast.
   - 24-hour automated Demand-Response signal grid (*Encourage Charging* / *Defer Charging* / *Neutral*).
   - Hourly shifted load delta (kW).
   - Commercial diesel generator abatement & peak purchase cost savings estimate.

---

## ⚙️ Configurable Simulation Parameters

You can adjust these parameters either in `simulate_feeder.py` (top of file) or interactively via the **Config** drawer in the UI:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `N_HOUSEHOLDS` | `200` | Number of residential households on 11kV feeder |
| `N_SHOPS` | `20` | Number of commercial shops / clinics / cafes |
| `CONTROLLABLE_SHARE` | `0.50` (50%) | Share of inverter owners enrolled in coordinated pool |
| `OUTAGE_SCENARIO` | `"medium"` | Frequency & duration of blackouts (`low`, `medium`, `high`) |
| `INVERTER_PENETRATION` | `0.85` (85%) | Percentage of homes/shops with inverter battery systems |
| `BATTERY_CAPACITY_AH` | `150` Ah | Typical 12V lead-acid / lithium inverter battery capacity |
| `MIN_SOC` | `0.20` (20%) | Deep discharge reserve protection floor |

---

## 🛡️ Core Mechanisms Modeled

1. **Off-Peak Valley Filling**: Inverters pre-charge during midday solar surplus (11:00 AM – 3:00 PM) and dawn off-peak windows, entering peak evening hours at 95–100% capacity without congesting the feeder.
2. **Critical Load Prioritization**: During grid outages, high-draw flexible appliances (ACs, geysers) are deferred, extending battery runtime for essential lifelines (refrigerators, fans, lighting, Wi-Fi).
3. **Fairness Credit Ledger**: A neighbourhood rotation ledger tracks curtailment debt across households so burden is balanced fairly over 365 days.
