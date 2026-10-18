# Safe backend integration — handoff results

## Status and provenance

- GitHub baseline: `AayushKadlimatti/UNNAMED-ForgeMind-AI-AMD-Developer-Hackathon`.
- Inspected/cloned commit: `fd5e276e1800e55967ad7b2d76544aa7592ab90a`.
- Work location: separate `forgemind-integrated/` working copy, local branch `arena/safe-backend-integration`.
- No remote branch, main-branch commit, GitHub push, deployment, real AMD request, or real plant connection was made.
- This is the existing integrated backend with targeted changes, **not replacement with the standalone Arena application**.
- New setup guide: [START_HERE.md](START_HERE.md).

## Implemented changes

### Audit completeness and privacy

- Direct sample manual search records `MANUAL_SEARCHED`, including successful no-match searches.
- Reference creation records `REFERENCE_ADDED`; reference listing/search record `REFERENCE_LIBRARY_VIEWED` / `REFERENCE_SEARCHED`.
- Reference searches used to prepare an AMD request record a metadata-only `REFERENCE_SEARCHED` event with `source: amd_context`.
- Accepted AMD requests record `DIAGNOSIS_REQUESTED`. This describes queuing/requesting, not successful provider completion.
- Simulator changes record `SIMULATOR_SCENARIO_CHANGED` / `SIMULATOR_CONTROLLED`; these audit acceptance of a demo control before applying it. They are not an atomic transaction with in-memory simulator state and are not industrial control records.
- Incident acknowledgements record `INCIDENT_ACKNOWLEDGED` with the saved incident update.
- Rejected cookie-authenticated cross-origin writes now record `ACCESS_DENIED` without logging the supplied Origin value.
- Existing task/machine/approval/denial audit events remain in place.
- Audits do not copy free-form query text, document content/title/URL, diagnosis prose, bearer headers or keys. Resource IDs, action names, source labels and matched excerpt IDs are used instead.
- Reference URLs containing credentials, query strings or fragments are rejected. Use a clean public source URL, not a signed/private access link. This is intentionally stricter than the previous endpoint.
- Validation errors retain FastAPI's detail-array shape but no longer echo rejected input/context. SQLAlchemy hides bound parameters in error representations.

### Access rules

Guests can still see synthetic monitoring, simulator status and synthetic incident records. A technician or administrator must connect before changing the simulator or viewing saved diagnoses. Existing administrator-only inference, external intake, approval, reference creation and audit restrictions are retained. Task updates remain available to authenticated technicians/admins.

The frontend keeps its current layout/navigation and polls only public monitoring data until authenticated. Saved investigations are loaded after connecting a role. Logout/session-expiry clears private diagnosis/task/audit state and stale in-flight responses are guarded from repopulating it. Scenario buttons are disabled for guests.

Local cookie-origin and CORS allowlists are configurable via `FORGEMIND_CORS_ORIGINS`; secure-cookie behavior via `FORGEMIND_COOKIE_SECURE`. Defaults remain suitable only for localhost development.

### External diagnosis adapter

`POST /api/v1/integration/diagnoses` now saves accepted reports into the **same event history** read by the existing dashboard. It never invokes a detector, AMD provider or mock inference generator.

- Requires an administrator and a stable `external_id`.
- Same ID and validated payload: same saved investigation, no duplicate history/audit.
- Same ID with changed diagnosis: 409 conflict.
- Persists original readings/units, observation time, caller data-source label, diagnosis text, sample citations and explicit limitations.
- Maps only recognized, unambiguous sensor/unit combinations into the dashboard's standard channels. Acceleration in g is never silently mapped to mm/s velocity.
- Explicit `origin: external`; no fabricated model, hardware, confidence or provider timing metrics.
- DEMO is synthetic. REAL is stored/displayed as a caller assertion, not independently verified measurement provenance.
- New `diagnosis_id` response field links to saved dashboard history. Status `completed` means that an external report was received/saved, not that AMD ran or that a fault was confirmed.
- Incoming `task` objects are rejected with 422. Work-order creation must use the existing separate administrator-reviewed approval endpoint. No automatic task/repair is performed by intake.
- External snapshots always require explicit historical-context review before approval; they are not silently tied to the live simulator. Non-anomaly external reports cannot approve an anomaly work order.
- Only the dashboard's configured `CONV-MTR-01` is supported for external history. Other registered machines return 409; unknown ones return 404.
- Rejects intake while a real-provider request is pending, so a new report cannot hide an in-flight request in the dashboard.
- Existing workflow behavior that marks an externally reported anomaly CRITICAL is retained. This does not change the synthetic readings or verify a real failure.

See `examples/external-diagnosis.demo.json` and the Swagger instructions in START_HERE.md. No real teammate module was replaced with this example.

### Storage consistency

No new models, tables, duplicate endpoints or schema migrations were added.

For reference creation, external intake, incident acknowledgement and AMD request creation, the event-store helper attaches the existing workflow SQLite file and writes the event plus audit metadata in **one SQLite transaction**. External machine-status updates participate in that transaction. Runtime audit-failure tests confirm rollback of event/machine/audit writes.

Both databases must be separate, file-backed SQLite files. This is a single-instance local-demo design; it is not a distributed transaction service or a crash-durability certification across every filesystem/journal configuration.

The existing diagnosis-approved-task link still spans workflow commit then event-store update. Its existing approval-audit recovery/idempotency mechanism is preserved and exercised after restart. Do not claim that every operation across both databases is universally atomic.

## Files changed and why

| Path | Change |
|---|---|
| `.env.example` | Non-secret documentation of origins, secure-cookie option and persistent storage overrides |
| `README.md` | Links to current handoff and distinction from inherited historical measurements |
| `INTEGRATION.md` | Current guide links; avoids implying provider validation was repeated |
| `backend/configuration.py` (new) | Shared validation/configuration for trusted origins and secure-cookie behavior |
| `backend/arena_workflow/database.py` | Hide SQL bound parameters in errors; existing session/model/storage setup retained |
| `backend/arena_workflow/integration.py` | External-result persistence/adapter, idempotency and reviewed-workflow boundary |
| `backend/arena_workflow/schemas.py` | Stable external event ID and saved diagnosis ID contract |
| `backend/arena_workflow/security_routes.py` | Configurable cookie-origin checks and denial audit |
| `backend/documents.py` | Reference audits, safe citation URL rules and audited persistence |
| `backend/store.py` | Attached-SQLite audited event transaction helper |
| `backend/integrated_server.py` | Missing audits, access restrictions, configurable cookies/CORS, safe validation responses and external approval provenance |
| `frontend/src/ConnectedApp.jsx` | Auth-aware history loading, external labels, private-state clearing and stale-response guards |
| `frontend/src/master/Dashboard.jsx` | Disable synthetic control buttons for guests; brief access message |
| `frontend/src/master/DemoGuide.jsx` | Do not mislabel an external assessment as AMD |
| `frontend/src/master/InvestigationEvidence.jsx` | Show original external readings with correct units and provenance |
| `frontend/src/master/investigation.js` | Export external provenance and original units without fabricated AMD metrics |
| `frontend/tests/investigation.test.mjs` | Two external-report/unit/provenance regressions |
| `tests/conftest.py` (new) | Shared temporary test databases and test-only credentials |
| `tests/test_integration.py` | Existing scenarios now authenticate where required; shared fixture extracted without removing existing test cases |
| `tests/test_rag_regression.py` (new) | Adapted standalone Arena keyword-search regression tests |
| `tests/test_workflow_regression.py` (new) | Adapted standalone Arena lifecycle/assignment/validation tests |
| `tests/test_safe_integration.py` (new) | Audit privacy/rollback, roles, external history, units, idempotency, restart, approval and config tests |
| `examples/external-diagnosis.demo.json` (new) | Clearly synthetic request for Swagger; contains no credentials |
| `START_HERE.md` / `INTEGRATION_RESULTS.md` (new) | Beginner instructions and this exact change/result record |

## Preserved files and dependencies

A byte-for-byte comparison against the baseline passed for **46 protected files**:

- Every tracked file under `resiliedge-ui/`.
- `backend/anomaly_detector.py`.
- `backend/intelligence/amd_engine.py` and `schemas.py`.
- `backend/amd_bridge.py`.
- `backend/simulator.py`.
- Root `requirements.txt` and `requirements-lock.txt`.
- Main frontend `package.json` and `package-lock.json`.

The existing main frontend entry, styling files, navigation shell, assets and remaining components are retained. No dependency version change was needed. The legacy database, Streamlit demo, mock-data files and unmounted frontend pages are preserved rather than activated or deleted.

## Actual checks performed

Environment: Python **3.13.16**, Node **20.20.2**, npm **10.8.2**, SQLite **3.46.1**. Backend dependencies were installed in a separate virtual environment using the repository's unchanged lockfile. Frontend dependencies were installed with `npm ci` using its unchanged lockfile.

| Check | Actual result |
|---|---|
| `python -m pytest -q` in isolated environment | **93 passed**, one upstream deprecation warning |
| `python -m pip check` | **No broken requirements found** |
| `npm run build` in `frontend/` | **Passed**, Vite 8.3.4 production build |
| `node --test tests/investigation.test.mjs` | **6 passed**, zero failed |
| Oxlint on five modified application JS/JSX files | **0 warnings, 0 errors** |
| Full `npm run lint` | Exit 0; **64 warnings, 0 errors**, remaining in retained source |
| `git diff --check` | Passed |
| Byte comparison of protected files | **46 unchanged** |
| Local secret configuration | No `.env` created or included during implementation |

The upstream backend warning says the repository's Starlette TestClient use of `httpx` is deprecated in favor of `httpx2`. Tests pass. No dependency change was made just to suppress it.

The full lint warnings include unused variables/imports and legacy React-hook/render issues. They were not hidden or mass-fixed because those files were intentionally preserved. The five modified application files were checked separately and are clean. A scratch inspection of original source also produced existing warnings; no clean full-project lint result is claimed.

The 93 tests include the original 24 integrated/provider/setup cases, adapted Arena retrieval/workflow regressions and new security/audit/intake checks. Provider calls are mocked; test-only dummy credentials are never real deployment credentials.

### New end-to-end behavior exercised in tests

1. Authenticated external DEMO result submitted without calling AMD.
2. Report appears in protected dashboard history with original g units preserved, not falsely mapped to mm/s.
3. No task created on intake; direct task payload rejected.
4. Explicit historical review required; technician approval denied.
5. Administrator approves a task; technician advances it sequentially to Completed.
6. Restart preserves report/task/link; duplicate intake/approval returns the original resources.
7. Conflicting same-ID payload rejected.
8. Forced audit failure rolls back earlier history insert and machine update.
9. REAL caller label, sample references and absent provider metrics preserved honestly.
10. Guest simulator writes and private-history reads denied; authenticated operations retain their workflows.

## Not verified / remaining limitations

- **No live AMD call or hardware verification.** Earlier repository metrics are historical claims, not this handoff's results.
- **No browser/manual UI acceptance test**, public deployment, load test, security certification, industrial dataset evaluation or real-machine validation.
- The standalone prototype was preserved byte-for-byte; it was not built/tested as the selected frontend.
- No new PDF parser, embeddings or FAISS. Both retrieval implementations remain lightweight keyword methods.
- Shared bearer/cookie credentials are still local-demo identity, not individual technician accountability, revocable production sessions or OAuth/OIDC.
- No production rate limiting, schema migration system, tamper-proof audit sink, retention policy or verified backup/restore workflow was added.
- Existing telemetry retention remains 300 samples. Audit/history growth still needs a retention plan.
- Important state must not be placed on ephemeral hosting. Persistent disks for both database files (or a separately reviewed database migration) are required before hosting real data.
- The Windows/macOS/Linux commands are documented; this run took place in Linux, so Windows startup was not executed here.
- No dependency security/advisory audit was run in this pass. Installing/building successfully is not proof of dependency security.

## Distribution and next action

`ForgeMind-integrated-safe.zip` contains the complete source working copy, examples and guides. It excludes `.git`, virtual environments, node_modules, build/cache outputs, runtime databases/logs and local secret files. Only `.env.example` templates are permitted; they are not populated credentials. Original test/mock fixtures remain clearly test/demo data.

Extract into a NEW folder and follow START_HERE.md. Review/rehearse locally before authorizing any separate deployment work. Nothing has been pushed or deployed.
