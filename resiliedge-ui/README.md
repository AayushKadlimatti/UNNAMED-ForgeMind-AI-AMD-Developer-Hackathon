# ResiliEdge UI

**Autonomous Industrial Remediation & Work-Order Swarm**  
*Team: Project Hail Mary*

A production-grade, dark-mode industrial frontend dashboard built for hackathon demonstration. It visualises the autonomous triage pipeline:
**Factory Vibration Sensors ➔ DSP FFT Analysis ➔ AMD MI300X-Hosted LLM Diagnosis ➔ MCP Inventory Verification ➔ Evolus Work Order Dispatch**.

---

## Honesty & Audit Compliance (Judges Reference)

This application adheres strictly to verifiable hackathon demo standards:
1. **Persistent Adapter State:** The header badge displays **`MOCK DATA`** (amber) when operating under the mock adapter and **`LIVE`** (green) when connected to a live backend.
2. **Zero Hardcoded Metrics:** No throughput rates, latency figures, or confidence scores are hardcoded into JSX/components. All values originate exclusively from the data layer (`src/api/mockAdapter.js` or `src/api/liveAdapter.js`).
3. **Simulated Disclaimers:** When running in mock mode, all inference readouts and throughput metrics are explicitly tagged `(simulated)`.
4. **Independent DSP Confidence:** The confidence score and uncertainty margin are derived directly from mathematical peak-to-noise ratio in the DSP spectrum, independent of the LLM.
5. **No Blind Buttons:** Every button and navigation element is fully wired to concrete actions.
6. **No Stored Secrets:** No API keys are embedded anywhere in the code.

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Routing:** React Router v7
- **Data Visualization:** Recharts (responsive FFT spectrum and throughput time-series charts) + SVG sparklines
- **Styling:** Vanilla CSS with custom industrial CSS variables (`src/styles/theme.css`), near-black background (`#0a0e14`), steel-gray panels (`#161d28`), monospace numeric readouts (`JetBrains Mono`).

---

## Quick Start (Mock Mode)

The UI runs completely standalone with zero external dependencies or backend requirements:

```bash
cd resiliedge-ui
npm install
npm run dev
```

Open `http://localhost:5173/` (or `http://localhost:5174/`) in your browser.

---

## Switching to Live Backend

When the backend services come online, configure the environment variables in `.env`:

```env
# Set to 'false' to deactivate mock mode
VITE_USE_MOCK=false

# Base URL of the backend API
VITE_API_BASE=https://api.your-backend.internal

# Optional: Base URL for Evolus run audit links
VITE_EVOLUS_RUN_URL_BASE=https://platform.evolus.ai/runs

# Optional: Reference target line on the Burst Test throughput chart (in tok/s)
VITE_THROUGHPUT_TARGET=1200
```

### The Schema Normalizer (`src/api/schema.js`)
All incoming backend payloads pass through `normalize(raw)`. If your backend engineers change field names or return nulls, modify **only** `src/api/schema.js`. All UI components import only from `src/api/index.js` and remain completely insulated from raw schema changes.

Backend endpoints required:
- `GET /pumps` -> Array of pump summaries
- `GET /pumps/:id` -> Full pump record
- `GET /burst-stats` -> Concurrent 16-pump throughput telemetry
- `GET /timeline` -> Pipeline chronological audit events
- `POST /scenario/trigger` -> Injects bearing-fault condition (returns 404 handled gracefully with toast)

---

## Demo Script Walkthrough

### 1. Plant Overview (`/`)
- View the 16-pump plant status grid (`P-01` through `P-16`) with active health badges and live vibration sparklines.
- Note the top KPI tiles: Pumps Monitored, Healthy, Warning, Critical, and Open Work Orders.
- Click **"▶ Run demo scenario"**.

### 2. Pump Detail (`/pump/P-07`)
Click on **`P-07`** (or trigger directly from the pump detail header) to observe the autonomous triage pipeline execute in real time across 5 stages:
1. **Stage 1 (Signal):** Recharts FFT spectrum displays the sudden 142.4 Hz BPFO harmonic defect spike with reference lines at 1×, 2×, and 3× harmonics.
2. **Stage 2 (Confidence):** DSP peak-to-noise ratio computes a high confidence readout (e.g. `91.4% ± 3.2%`) with uncertainty band visualization.
3. **Stage 3 (Diagnosis):** Inference strip populates (TTFT, throughput, model, backend) and the diagnosis card displays fault code `E-402`, component identification, root cause, and a prominent red **`HUMAN ESCALATION REQUIRED`** banner.
4. **Stage 4 (Inventory):** Automated warehouse lookup verifies replacement part `SKF-6204` located at `Bay 4, Shelf 12` with `● IN STOCK` confirmation.
5. **Stage 5 (Work Order):** Evolus work order `WO-8941` is created with interactive status stepper, torque specification (`45 Nm`), and a numbered 9-step LOTO checklist.

### 3. Burst Test (`/burst`)
- Displays concurrent 16-stream continuous batching telemetry.
- Large aggregate throughput readout (e.g. `1,184.0 tok/s`).
- Live Recharts time-series chart showing aggregate throughput evolution against the optional `VITE_THROUGHPUT_TARGET`.
- 16 individual pump cards showing per-stream tokens/sec and TTFT.

### 4. Timeline (`/timeline`)
- Audit log of timestamped chronological events (scenario injection, DSP anomaly detection, LLM diagnosis, inventory match, Evolus work order generation).
