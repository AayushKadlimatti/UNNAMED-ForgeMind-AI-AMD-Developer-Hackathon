# ForgeMind AI

An industrial maintenance investigation workspace for **AMD Hackathon Track 1: Intelligent Industry**. ForgeMind turns a conveyor's abnormal sensor readings into an explainable alert, a real AMD-assisted assessment, and a human-approved inspection work order.

The prototype uses **clearly labelled synthetic telemetry**, an independent deterministic detector, AMD TokenFactory inference, and SQLite persistence. No physical machine is controlled. Thresholds and AI suggestions are not validated industrial safety guidance.

## The working loop

1. Observe temperature, vibration velocity RMS and motor current with detailed charts and illustrative threshold lines.
2. Inject a warning or critical scenario. Review the alert and its escalation timeline.
3. Explicitly request AMD analysis. The request captures the sensor snapshot, recent trends and relevant user-supplied reference excerpts.
4. Inspect the saved evidence, possible causes, limitations and measured inference metrics.
5. Approve an inspection task, assign a technician and record its progress. Historical-context approvals require an explicit review acknowledgement.
6. Select Recovery and watch the detector resolve the incident as readings settle. Completing a task does not alter the simulated machine.

Export actual readings as CSV or an investigation as Markdown. Demo progress, evidence, incidents and work orders survive backend restarts. The walkthrough's visibility preference survives page refresh.

## Run locally on Windows

Requires Python 3.11+ and Node.js compatible with Vite: Node 20.19+ within 20.x, or Node 22.12+.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts/configure_demo.py
cd frontend
npm ci
cd ..
```

Fill `AMD_API_KEY` in your local `.env`. The configuration helper creates distinct administrator and technician tokens without printing them and preserves existing settings.

```powershell
.\scripts\start-demo.ps1
```

Open **http://127.0.0.1:5173/**. Keep the terminal open; Ctrl+C stops the processes started by the launcher. If PowerShell blocks scripts, use the two-terminal commands in [INTEGRATION.md](INTEGRATION.md). Do not change your system execution policy just to run this demo.

In Settings, enter `FORGEMIND_ADMIN_TOKEN` from `.env` to request AI analysis or approve work orders. It is separate from your AMD API key. Protected access uses an HttpOnly local-demo session cookie. Do not expose this demo server publicly.

## Verify

```powershell
.\.venv\Scripts\python.exe scripts/preflight.py
.\.venv\Scripts\python.exe -m pytest -q
cd frontend
npm run build
node --test tests/investigation.test.mjs
```

[INTEGRATION.md](INTEGRATION.md) describes the backend contracts, credentials, provider behavior and setup details. [JUDGE-DEMO.md](docs/JUDGE-DEMO.md) contains a rehearsal sequence and honest answers for judging. [PROGRAM-STATUS.md](PROGRAM-STATUS.md) records implementation and validation boundaries.

Active code: `frontend/src/ConnectedApp.jsx`, `frontend/src/master/`, and `backend/integrated_server.py`. Older template pages are retained as references and are not mounted.

## Limits

This is a local hackathon prototype. No industrial dataset evaluation, calibrated failure probability, remaining-life estimate, demonstrated downtime reduction or cost savings is claimed. Actual permitted maintenance references still need to come from the team. AMD availability and shared rate limits can affect requests; failures retain detector evidence and never fabricate an AI result.
