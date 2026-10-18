# Run the reconciled ForgeMind project

## What to download

Use **ForgeMind-reconciled-complete.zip**. Extract into a **new folder** and open the enclosed `forgemind-reconciled/` directory. Do not overwrite either input project.

**Both merged PRs are already present.** This package keeps all 158 files from your selected Arena integration unchanged and adds comparison reports. There is no manual code merge, cherry-pick, patch application or dependency upgrade to perform.

- [Comparison and fresh test results](RECONCILIATION_REPORT.md)
- [Every file compared](comparison/file-by-file.csv)
- [Every PR-changed path](comparison/pr-file-map.csv)
- [Retained detailed API/setup guide](START_HERE.md)

The retained START_HERE.md mentions the older delivery ZIP name. For this delivery, use the ZIP/folder names above; its API/role/Swagger guidance still applies.

## Prerequisites

- Python **3.11 or newer**.
- Node.js **20.19+ within 20.x, or 22.12+**.

You do not need Git commands or VS Code. Open a terminal in the folder containing `requirements-lock.txt`. On Windows, open that folder in File Explorer, type `powershell` in its address bar, and press Enter.

## Windows: install once

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts/configure_demo.py
cd frontend
npm ci
cd ..
```

The configuration helper generates your own random local demo tokens in `.env` without printing them or overwriting existing values. The downloaded project contains no populated `.env` or real credentials.

### Terminal 1 — backend

From the extracted project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main_integrated:app --host 127.0.0.1 --port 8001 --no-access-log
```

Use **one worker**. Disabling request access logs avoids recording reference-search query strings. SQLite audit logging still works.

### Terminal 2 — main frontend

Open another PowerShell in the same extracted project root:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:5173/**. Keep both terminals open; Ctrl+C stops them.

## macOS / Linux

First-time setup, project root:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-lock.txt
.venv/bin/python scripts/configure_demo.py
(cd frontend && npm ci)
```

Terminal 1:

```bash
.venv/bin/python -m uvicorn backend.main_integrated:app --host 127.0.0.1 --port 8001 --no-access-log
```

Terminal 2, project root:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

## Connect a role

1. Open your **local** `.env` in a text editor. Windows: `notepad .env`.
2. Copy the value of `FORGEMIND_ADMIN_TOKEN`, without quotation marks.
3. In ForgeMind, open **Settings**, paste it into Demo access token, and click Connect.
4. Keep `.env` private. Never use the AMD API key as the UI access token or include secrets in screenshots.

Guests can monitor synthetic readings; authenticated roles are needed for simulator changes and saved diagnoses. Administrators may add references, approve diagnosis-linked work orders and view audit history. Technicians may search references and update task assignments/statuses.

## Rehearse WITHOUT an AMD key

An AMD key is **not required** for the simulator, retrieval, references, tasks, audits or external intake. Without provider configuration the app must not claim a live AMD diagnosis. The Windows combined launcher still has an AMD-settings preflight, so use the two-terminal commands above for a no-key rehearsal.

1. As administrator, try Warning/Critical/Recovery scenarios and inspect incidents.
2. In AI Diagnostics, add only permitted reference text with a clean public citation URL; search for a related phrase.
3. Open **http://127.0.0.1:8001/docs** and authorize with your local administrator token, without the `Bearer ` prefix.
4. Try `POST /api/v1/integration/diagnoses` using the entire JSON from `examples/external-diagnosis.demo.json`.
5. Refresh AI Diagnostics in the UI. The investigation must say **EXTERNAL / DEMO**, not claim AMD execution.
6. Review its saved evidence, acknowledge historical context, and separately approve an inspection task. Intake itself creates no task.
7. In Maintenance, update **Pending → In Progress → Completed**.
8. View the real audit history in Settings. Restart the backend to check that saved investigation/task/history remain.

The example is synthetic input data, not an implementation of a teammate's detector or AMD engine. It does not spend provider quota. Reusing its `external_id` with the same diagnosis returns the same report; use a different stable ID for genuinely new data. Do not submit an intake `task` object.

Live AMD use requires your team's approved configuration and quota. No live request or hardware check was performed for this handoff.

## Run the same automated checks

Windows, project root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pip check
cd frontend
npm run build
node --test tests/investigation.test.mjs
npm run lint
```

On macOS/Linux use `.venv/bin/python` for the Python commands.

Fresh verified outcome: **93 backend tests, 6 frontend tests and the production build pass**. Full lint has 64 warnings and zero errors; the backend test client reports one upstream deprecation warning. These are not live provider or industrial-accuracy tests.

## Storage and boundaries

The existing local database defaults remain:

```text
data/events.sqlite3      telemetry, incidents, references, diagnoses and simulator state
data/workflow.sqlite3    machines, tasks and audit logs
```

Keep them as separate file-backed SQLite databases. Important hosted data needs verified persistent storage for BOTH files and backups; do not put it on ephemeral hosting. Telemetry keeps only the most recent 300 samples.

This is a shared-token local demo, not a public production deployment. Samples are not verified OEM instructions; REAL measurements in an external submission are caller assertions. Do not operate physical equipment from this app.

No input archive was modified and nothing was pushed or deployed. Test locally before approving any future deployment work.
