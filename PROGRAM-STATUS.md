# Program status

Implemented and checked locally:

- Separate normal, warning, critical and recovery simulator states, pause/start/reset, persisted state.
- Deterministic velocity-based threshold detection, active incidents, escalation, acknowledgement and recovery history.
- Real AMD requests with trend context, optional user-supplied references, structured output validation, background status, cooldown, retry and restart recovery.
- Historical diagnosis snapshots and explicit stale-context labels.
- Human-approved, diagnosis-linked work orders, priorities, assignment, sequential status changes, persistence and audit logs.
- Server-verified admin/technician access and refresh-safe local sessions.
- Machine detail screen, filtered incidents/tasks, reference search, measured inference metrics and telemetry CSV export.
- Request timeouts, connection-error retry, empty/loading/error/success states, keyboard focus and reduced-motion styling.

Validation: 22 automated backend/provider tests; frontend build and targeted lint passed. Browser verification covers incident opening/recovery, history display and keyboard navigation. Real AMD trend-context request succeeded in 12.5876 seconds. These checks do not establish industrial diagnostic accuracy.

Remaining inputs and release work:

- Supply actual permitted manuals or maintenance records. Reference upload/search is implemented, but real source material cannot be invented.
- Supply industrial measurements or a labelled dataset if claiming performance beyond the synthetic scenario.
- Final end-to-end acceptance by the team on its chosen computer and account.
- Public deployment, dependency-advisory resolution, submission assets and GitHub publication are separate release tasks.

Master design applied: supplied fonts and palette, 240px sidebar, responsive status summary, three live sensor cards, actionable incident cards, accessible native diagnostics modal, mobile drawer, and search. Local font assets remove runtime dependency on font CDNs. The active JavaScript bundle is approximately 189 KB before compression.
