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

Validation: 24 automated backend/provider/setup tests and four frontend evidence/chart tests; frontend build and targeted lint passed. Browser verification covers incident opening/recovery, history display and keyboard navigation. Real AMD trend-context request succeeded in 12.5876 seconds. These checks do not establish industrial diagnostic accuracy.

Remaining inputs and release work:

- Supply actual permitted manuals or maintenance records. Reference upload/search is implemented, but real source material cannot be invented.
- Supply industrial measurements or a labelled dataset if claiming performance beyond the synthetic scenario.
- Final end-to-end acceptance by the team on its chosen computer and account.
- Public deployment, development-dependency advisories and final submission assets remain release tasks. The integrated application has already been published to the team GitHub repository.

Master design applied: supplied fonts and palette, 240px sidebar, responsive status summary, three live sensor cards, actionable incident cards, accessible native diagnostics modal, mobile drawer, and search. Local font assets remove runtime dependency on font CDNs. The main JavaScript entry is approximately 203 KB before compression; detailed charts load in a separate 359 KB chunk.


Judge-demo improvements (17 October 2026):

- Optional four-step walkthrough reflects actual saved incident, AMD, approval and recovery records. It is not an automatic demo or a current-run score. Visibility persists across refresh.
- New investigations preserve all trend readings sent to AMD. The evidence panel displays saved sensor values, detector reasons, optional captured trend rows, and source counts.
- Actual investigation report download includes sensor evidence, provider measurements, limitations, references and a linked task ID. Authorized loaded task details add assignment/status and assessment-to-approval timing.
- Historical work-order creation requires an explicit review acknowledgement enforced by the server and recorded in the approval audit event. Already approved requests remain idempotent.
- Incident timelines expose severity transitions, acknowledgement and recovery.
- Charts support 30/100/300 sample windows, use actual time spacing, and leave gaps across pauses instead of inventing measured transitions.
- Local credential preparation, read-only preflight and one-command Windows startup are provided. The launcher was used to start both servers successfully; persisted evidence and a completed task were verified after restart.
- A live rehearsal made exactly one DeepSeek-V4-Flash request: 18.6387 s, 378 completion tokens, 20.28 end-to-end tokens/s. It created a labelled rehearsal inspection, completed it, verified the detector remained critical, then observed synthetic recovery to HEALTHY with zero active incidents. No reference excerpts were supplied. This is connectivity/workflow evidence, not an industrial accuracy benchmark.
- Browser verification covered report download and contents, captured trend expansion, chart-window changes, persistent walkthrough visibility, 320px layout without horizontal overflow, modal Escape focus return and body-scroll recovery.
- Runtime npm dependency audit reported zero advisories. The full audit still reports seven development-tree advisories associated with the inherited Tailwind 3 toolchain; no major-version styling migration was attempted in this demo pass.

The prototype is ready for the team's local rehearsal. Genuine manuals/data, measured industrial impact, public hosting, video, cover and slides are not fabricated or implied complete. See docs/JUDGE-DEMO.md.
