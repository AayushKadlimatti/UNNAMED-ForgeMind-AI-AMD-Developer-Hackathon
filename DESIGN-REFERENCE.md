# Master design reference lock

The user approved design/Design.md as the master visual specification, supported by design/Component-Library.md and design/Integration-Guide.md. These take precedence over the previous simplified interface.

Applied foundations: Cabinet Grotesk and JetBrains Mono stored locally; #1F2937 main background, #111827 surfaces, #374151 borders/elevated surfaces, #F3F4F6 primary text, #9CA3AF secondary text, #06B6D4 cyan actions, and the four specified status colors. The desktop sidebar is 240px, the header 70px, page title 48px and section headers 28px. Responsive rules follow the supplied one/two/three-column layout, with a mobile navigation drawer.

Reusable components live in frontend/src/master/: ConsoleShell, StatusSummary, TelemetryCard, IncidentCard and DiagnosticsModal. They replace the old simplified dashboard shell and use the existing backend contracts and authenticated workflow. No external design-generation service was needed because the supplied specification is the locked source. The linked preview could not be retrieved; implementation was checked against the provided Markdown and component code.

Operational adaptations to example content:

- The backend monitors one actual synthetic conveyor. The three telemetry cards represent vibration, temperature and current channels, not three invented machines.
- Summary counts come from live machine state. Maintenance count is unavailable until authorized task data loads.
- Detailed telemetry charts use recorded readings, time and value axes, interactive tooltips, and illustrative warning/critical threshold lines. Window max and trend describe the available sample window, not an unsupported 24-hour dataset.
- Diagnostics use actual AMD output. There are no invented confidence percentages or probabilities; the interface explicitly states that confidence is not calibrated.
- Dispatch opens human review and task assignment, and requires current completed analysis and administrator access. Sample shutdown instructions and template diagnoses are not copied into the working flow.
- Native dialogs provide modal focus containment, Escape dismissal and focus return; mobile navigation and search remain available. Reduced-motion rules override animation.

Validation: production build and targeted frontend lint passed; 24 backend/provider/setup tests and four frontend evidence/chart tests passed. Browser checks covered loaded local fonts, search filtering, three desktop sensor columns, mobile widths, menu navigation, modal Escape dismissal and restored focus. Primary palette text/action combinations exceed 4.5:1 contrast; this is not a claim of a complete accessibility audit.

Judge-demo extensions preserve the same master tokens and components: optional operational walkthrough, saved-evidence panel, chronological incident details and sample-window selector. Detailed charts are lazy-loaded; timestamps represent actual observed spacing and pauses remain gaps. The walkthrough is optional so the detailed telemetry view remains available without extra instructional content.
