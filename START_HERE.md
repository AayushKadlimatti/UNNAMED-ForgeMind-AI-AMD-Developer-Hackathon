# Start here — ForgeMind safe backend integration

This is a **separate integrated working copy**, based on GitHub commit `fd5e276e1800e55967ad7b2d76544aa7592ab90a`. Your online repository was not changed. No deployment or real AMD request was made during this work.

**Preserved:** the main `frontend/`, its design and navigation, the entire `resiliedge-ui/` prototype, the simulator, detector, AMD engine and bridge. Dependency manifests/locks are unchanged. The standalone Arena app was not substituted for the existing backend.

See [INTEGRATION_RESULTS.md](INTEGRATION_RESULTS.md) for exact changes, tests and limitations.

## 1. Extract into a NEW folder

Do not overwrite your existing downloaded project. Extract `ForgeMind-integrated-safe.zip`, then open its `forgemind-integrated` folder.

You need Python **3.11+** and Node **20.19+ within 20.x, or 22.12+**. Keep the folder containing `requirements-lock.txt` as your project root.

Arena can show these files, but running Python/Node on your own computer still requires a terminal. These copy/paste steps do not require VS Code, Git commands, or a push. Do not upload credentials to Arena or GitHub.

## 2. Windows: first-time setup

Open PowerShell in the extracted project folder. You can use File Explorer's address bar to type `powershell` and press Enter.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts/configure_demo.py
cd frontend
npm ci
cd ..
```

The helper creates your **own random demo tokens** in a new local `.env`. It preserves existing settings if a `.env` already exists. The download does not contain anyone's credentials. Do not copy secrets from another project or put a token in source code.

You do **not** need an AMD API key to test the simulator, manual/reference search, work orders, audit logs or external intake. Leave `AMD_API_KEY` empty unless your team is ready to configure the provider. Real AMD diagnosis will correctly report unavailable without it; no fake AMD answer replaces it.

### Start backend — Terminal 1

From the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main_integrated:app --host 127.0.0.1 --port 8001 --no-access-log
```

Keep it open. Use **one worker** for this demo. Disabling access logs avoids recording reference-search query strings; application audit records still work.

### Start main frontend — Terminal 2

Open another PowerShell in the same project root:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:5173/**. Keep both terminals open. Ctrl+C stops each process. The previous `scripts/start-demo.ps1` remains available, but its preflight requires AMD settings, so use these two-terminal commands for a no-key demo.

## 3. macOS / Linux alternative

From the project root, first-time setup:

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

Terminal 2, from project root:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

## 4. Connect your demo role in the existing UI

1. Open your **local** `.env` with Notepad or another plain text editor. Windows: `notepad .env`.
2. Find `FORGEMIND_ADMIN_TOKEN`. Copy just its value, without surrounding quotation marks.
3. In ForgeMind, select **Settings**, paste it into Demo access token, and click **Connect**.
4. Do not use your AMD API key in that field. Do not share screenshots of `.env`.

The application uses the existing HttpOnly local-demo session cookie. It is still shared-token demo authentication, not a production login.

### What each role can do

| Operation | Guest | Technician | Administrator |
|---|---|---|---|
| View synthetic monitoring/incidents | Yes | Yes | Yes |
| Change synthetic scenario/start/stop/reset | No | Yes | Yes |
| View saved diagnosis evidence | No | Yes | Yes |
| Search sample/manual references | No | Yes | Yes |
| Add reference text | No | No | Yes |
| Update task progress/assignment | No | Yes | Yes |
| Request AMD / submit external diagnosis / approve diagnosis work order | No | No | Yes |
| View audit logs | No | No | Yes |

Changes to reference search and audit access work through the current interface. Use **AI Diagnostics → Maintenance reference library** to add/search permitted text excerpts. Use **Settings → View audit log** as administrator.

## 5. Test external diagnosis intake WITHOUT AMD

A labelled example is in:

```text
examples/external-diagnosis.demo.json
```

It is sample data, not a detector or a claimed AMD result. The adapter does not call inference, change synthetic telemetry, or create a work order automatically.

1. Open **http://127.0.0.1:8001/docs**.
2. Click **Authorize**, paste your local administrator demo token (without `Bearer `), and authorize.
3. Expand `POST /api/v1/integration/diagnoses`, click **Try it out**.
4. Replace the entire request body with the example JSON. Click **Execute**.
5. A 200 response includes `diagnosis_id` and `task: null`.
6. Return to the frontend, connect the administrator role if needed, open **AI Diagnostics** and refresh/select the new investigation.
7. Confirm the **EXTERNAL ASSESSMENT / DEMO** label, original readings, sample citations, and absence of claimed AMD metrics.
8. Review the snapshot and check the historical-context acknowledgement. This is always required for external results because they are separate from the live simulator context.
9. Enter a task title and technician; approve the inspection. In Maintenance, advance **Pending → In Progress → Completed**.
10. Open Settings → View audit log. The history includes diagnosis intake, sample/manual search, approval and task updates. Reference creation/search and simulator controls also produce audit events.

### Important contract changes for your teammate

- `external_id` is now required: a stable source event identifier, 1–100 letters/digits/underscores/hyphens.
- Retrying the same ID and validated diagnosis returns the same investigation without duplicate history/audits. Changing its payload returns **409**. Use a NEW ID for a genuinely new event.
- Omit `task` or send `null`. A task object now returns **422** with directions to the separate approval endpoint. This intentionally prevents automatic work orders from external intake.
- `data_source` must be `DEMO` or `REAL`. REAL is a caller assertion, not verification. The UI's main monitoring charts remain synthetic.
- Supported dashboard machine: `CONV-MTR-01`. Unknown machines return 404; other registered machines return 409 until a multi-machine dashboard is implemented.
- An anomaly must have at least one `triggered: true` reading. A non-anomaly must have none. Non-anomaly reports are saved, but cannot approve an anomaly work order.
- Preserve units: **g is not mm/s**. All original readings are saved/displayed. Only unambiguous known sensor/unit combinations populate the standard temperature/velocity/current snapshot fields; other units remain in the original-readings list.
- If AMD inference is already pending, intake returns **409**; retry after it completes so it cannot hide the pending request.
- New saved evidence reads require a valid role. Guest synthetic monitoring still works.

## 6. Local storage and configuration

The existing tables and defaults are retained:

```text
data/events.sqlite3      readings, incidents, references, diagnoses, runtime state
data/workflow.sqlite3    machines, tasks, audit logs
```

No schema migration or duplicate model/table was added. Existing databases should be **backed up before** testing with this working copy. Safest beginner path: use the new empty project folder first. Do not copy unknown `.env` or runtime databases into the distributable ZIP.

Telemetry still retains only the latest **300 samples**. This is not a production measurement archive.

Optional environment settings are documented in `.env.example`:

- `FORGEMIND_CORS_ORIGINS`: exact trusted origins, comma separated; no wildcards/paths/embedded credentials. Defaults support the local ports above.
- `FORGEMIND_COOKIE_SECURE=false` for local HTTP. HTTPS would need `true` and an actual deployment/security review, not just this switch.
- `FORGEMIND_EVENT_DB`: event SQLite **file path**.
- `FORGEMIND_WORKFLOW_DATABASE_URL`: workflow SQLite **URL**.

Keep event/workflow databases as **separate file-backed SQLite files**. Audited event writes use SQLite ATTACH to commit a reference/report and its audit together. In-memory databases are intentionally rejected for this operation. Use a single local instance; this is not a distributed transaction system.

Never use ephemeral hosting for important state. Any future host needs a verified persistent disk for BOTH databases or a planned storage migration, backups and security controls. No hosting was configured or deployed here.

## 7. Repeat the checks

Windows, project root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pip check
cd frontend
npm run build
node --test tests/investigation.test.mjs
npm run lint
```

macOS/Linux: use `.venv/bin/python` instead of the Windows Python path.

Actual results and remaining warnings are in [INTEGRATION_RESULTS.md](INTEGRATION_RESULTS.md). Tests isolate data and mock provider responses; they do not validate AMD hardware or industrial accuracy.

## 8. Boundaries

- Sample manual excerpts are **unverified demonstration text**, not maintenance instructions.
- Reference-library text is user-supplied, not independently verified. Share only material your team may send to the provider.
- No PDFs, embeddings or FAISS were added or claimed.
- No physical machine is controlled. Completing a task does not repair equipment or change detector readings.
- No live provider request, browser acceptance test or deployment was performed in this handoff.
- No password/API key/token is copied into audit metadata. Do not put secrets in business fields. Reference URLs containing credentials, query strings or fragments are now rejected; use a clean public citation URL.
- Do not expose this shared-token demo to the public internet. Real identity, individual accounts, rate limiting, revocation, audit retention, migrations and production backup procedures remain future work.

**Next action:** extract into a new folder, follow sections 2–4, then use the Swagger example in section 5. There is nothing to push or deploy at this stage.
