# ForgeMind integrated local demo

> **Current working-copy update:** see [START_HERE.md](START_HERE.md) for no-AMD-key startup, changed permissions and the external-intake contract; see [INTEGRATION_RESULTS.md](INTEGRATION_RESULTS.md) for newly reproduced checks. Live/provider/browser measurements below are historical repository records, not this handoff's verification.

Integration target: Joshua's `frontend/`, GitHub main at `56c7608`, with the ZIP's Arena maintenance workflow and the real AMD adapter developed in this workspace.

## Run on Windows

In this folder, create an environment and install backend dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts/configure_demo.py
```

For this already-configured workspace, keep the existing `.env` instead of copying over it. It contains the AMD endpoint, model, and private key, plus distinct randomly generated admin and technician demo tokens. Do not commit or share it.

For another computer, fill in AMD settings and two distinct random 32+ character demo tokens in `.env`. Never expose the AMD key to the browser. Protected routes reject requests if demo authentication is missing.

Start the backend with **one worker**, bound to localhost:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main_integrated:app --host 127.0.0.1 --port 8001
```

In a second terminal, start the selected frontend:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. Vite proxies `/api` to the integrated backend on port 8001. Port 8000 can keep serving the original independent backend. Backend documentation: http://127.0.0.1:8001/docs.

## Try the complete flow

1. Open Settings. Copy `FORGEMIND_ADMIN_TOKEN` from your local `.env` into **Demo access token**, then Connect. This is separate from the AMD key. The server sets an HttpOnly, SameSite=Strict local-demo session cookie for up to eight hours. Refresh restores your role; Disconnect clears the cookie. The token is not saved in localStorage.
2. Open Dashboard. Select **critical**. The charts show synthetic sensor readings and the deterministic detector creates an alert.
3. Select **Request AMD diagnosis**. Telemetry continues while the request runs. The UI polls for `pending`, `completed`, or `unavailable`; a provider request has a 90-second total deadline.
4. Review possible causes and limitations. Enter a task title and assignee, then select **Approve and save work order**. This creates an inspection task; no equipment is controlled.
5. Open Maintenance. Start the inspection, then mark it complete. Reload the page and refresh work orders to verify session and work-order persistence. Reassignment and status filters are available in Maintenance.
6. Inference shows measured completion tokens, whole-request latency, and end-to-end tokens per second. Unreported GPU identity stays unavailable.

Technician tokens can read tasks and progress them through Pending -> In Progress -> Completed. Only an admin can request AMD analysis or approve a diagnosis-linked task. Roles are assigned on the server, not selected by a UI toggle.

## What was connected

- `frontend/src/ConnectedApp.jsx` is the active React entry, using the user-approved master design, Cabinet Grotesk/JetBrains Mono, responsive status badges, detailed telemetry charts, incident cards and a keyboard-accessible diagnostics modal. The previous sample pages remain in the source for reference but are not mounted.
- `backend/integrated_server.py` is the active server. Both `backend.main_integrated:app` and `backend.main:app` point to it.
- `backend/intelligence/amd_engine.py` contains the real-provider request adapter (live execution was not revalidated in this handoff); `backend/amd_bridge.py` maps its JSON to the dashboard contract.
- The simulator's machine is `CONV-MTR-01`. Its vibration is **velocity RMS in mm/s**, not acceleration in g. The original `conveyor-01` profile cannot be directly reused; the integrated demo uses the shared simulator's illustrative thresholds with finite-value validation. Neither profile is calibrated or standards-certified.
- `backend/arena_workflow/` comes from the supplied ZIP. Its task routes, role checks, lifecycle, sample manual search, and audit trail are mounted here.
- Diagnosis-linked approvals are idempotent: one work order per diagnosis, including after restart, with the diagnosis ID recorded in the workflow audit transaction.
- Investigations include up to 20 recent readings and up to five keyword-matched reference excerpts. Add real document excerpts with a title, revision/page and optional source URL in AI Diagnostics. Sources remain labelled user-supplied, not independently verified. Matching content is sent to AMD when an admin explicitly requests analysis. No references are seeded or fabricated. Investigation history preserves the context captured at request time.
- A started provider request is saved before inference. On restart, pending records become unavailable and can be manually retried.
- `data/events.sqlite3` stores readings, incidents, diagnoses, reference excerpts, and the simulator state. Warning and critical scenarios are distinct. A fault opens an incident; escalation updates that incident; normal readings resolve it. Acknowledgement does not resolve a fault, and task completion does not alter machine readings. Pausing does not mark an incident recovered. Resetting readings retains work orders and diagnosis history. Simulator pause/scenario state survives a restart. Telemetry retains the most recent 300 readings. `data/workflow.sqlite3` stores tasks, machines, and audit records. The workflow machine status is an administrator-maintained record; the dashboard uses the latest detector state.

## Boundaries

This is a localhost hackathon demo, not a production service. Shared demo bearer tokens are not production identity management. Do not expose this server publicly.

Scenario changes do not call AMD automatically. Provider calls require explicit admin action, allow only one in flight, and enforce a 45-second interval, including after restarting. This does not coordinate limits across teammates or other programs. No automatic retries or 16-way load test runs.

Readings are synthetic; real AMD inference does not make them real machine measurements. AI suggestions require qualified review. The sample manual retrieval is explicitly labelled sample data and is not sent as verified OEM evidence to AMD. Confidence percentages, GPU memory, utilization, throughput history, financial savings, and fixed repair procedures from the old template are not shown in the active UI.

The active frontend polls the API every two seconds. The previous WebSocket client and template diagnostic generator are retained as legacy reference files and are not used. Inference metrics describe HTTP end-to-end timing, not isolated GPU decoding speed. Model output schema validation does not establish diagnostic accuracy or guarantee safe suggestions.

## Checks

```powershell
.\.venv\Scripts\python.exe -m pytest -q
cd frontend
npm run build
```

The 24 automated backend/provider/setup tests simulate AMD and cover role checks, units, no automatic provider calls, duplicate pending requests, cooldown, provider failure and retry, work-order idempotency, task lifecycle, sample-manual labels, saved data after restart, warning stability, incident escalation/acknowledgement/recovery, refresh-safe sessions, cross-origin rejection for cookie-authenticated writes, document permissions and search, captured trend/reference context, and reassignment rules. A separate live integration request completed in 26.2647 seconds with DeepSeek-V4-Flash, 338 completion tokens, and 12.87 end-to-end tokens/sec. That single run is evidence of connectivity, not a reliability benchmark.

## Latest completion checks

A live request with 20 trend readings completed in 12.5876 seconds using DeepSeek-V4-Flash, returning 311 completion tokens and 24.71 end-to-end tokens/sec. No reference document had been supplied for this request. Browser checks confirmed warning incidents appear as active and become resolved after readings return to normal. Reports export actual saved telemetry to CSV. Settings exposes the real workflow audit log to administrators.

The source document library still needs your team's actual permitted reference material. This software has not been validated against physical equipment or a labelled industrial dataset. The inherited frontend dependency tree reports package advisories ; public production hardening and deployment remain outside this local completion pass.

## Master design applied

The supplied specifications are saved under `design/`. Reusable connected components are in `frontend/src/master/`. The active app remains React/Tailwind so existing sessions, diagnosis requests, reference search, work orders, history and CSV export continue working. Dashboard charts include time/value axes, keyboard-accessible reading tooltips and illustrative threshold lines, using saved readings; no mock traces or fixed confidence scores are mounted. On mobile, open the menu button for navigation. Use Investigate on an incident or Open investigation below the feed to open the modal. Escape closes it and returns focus.


## Judge-demo tools

After setup, `scripts/start-demo.ps1` runs both local servers in one terminal. It checks setup, refuses occupied ports and keeps logs under ignored data/. `scripts/preflight.py` is read-only and never calls AMD. The launcher does not install dependencies or overwrite credentials.

The Dashboard's optional Demo walkthrough explains the real operator flow. Charts can display the latest 30, 100 or 300 saved samples, with actual time spacing and visible gaps for monitoring pauses. New AMD requests save the full trend input, which is available in the evidence panel. Export investigation downloads a Markdown evidence report; it does not claim a repaired machine or measured downtime savings.

A historical investigation can be used to approve an inspection only after explicitly acknowledging review of its saved evidence. The API requires reviewed_historical_context=true when the monitoring context differs, and records that acknowledgement in the audit log. Repeated approval of an already saved task remains idempotent.

Frontend evidence/report/chart tests: run `node --test tests/investigation.test.mjs` from frontend/. For an explicit live rehearsal, `python scripts/rehearse_live.py --live-amd` makes one real AMD request, creates a labelled rehearsal work order and changes synthetic scenarios. It does not reset or delete existing history. See docs/JUDGE-DEMO.md before recording.
