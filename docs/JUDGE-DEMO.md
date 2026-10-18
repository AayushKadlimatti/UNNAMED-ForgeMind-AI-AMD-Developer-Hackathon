# Track 1 rehearsal guide

Reference: [official AMD ACT III brief](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii), checked 17 October 2026. Track 1 asks for a working industrial product, understandable operator results and measurable practical value. The event accepts TokenFactory API use. This guide maps the working prototype to those requirements; it is not a claim of production validation.

## Before recording

- Run `scripts/preflight.py`, backend tests and the frontend build on the presentation computer.
- Open the running app and connect the administrator demo token in Settings. Never show `.env`, private tokens or the AMD key in a recording.
- Keep the browser at a readable desktop width. The master design and detailed charts are part of the actual working app.
- Confirm shared team quota is available. Only one person should run the live AMD portion at a time. Requests have a 45-second cooldown and 90-second total deadline.
- Use the optional Demo walkthrough to orient viewers; hide it if the charts need more screen space.
- Add only genuine, permitted reference excerpts with accurate source/revision/page details. An empty library is preferable to an invented OEM citation.

## Three-minute demonstration

| Time | Show | What the viewer should understand |
| --- | --- | --- |
| 0:00–0:25 | Dashboard, normal readings and thresholds | A maintenance operator watches one conveyor's three sensor channels. The readings are synthetic; the workflow is live. |
| 0:25–0:50 | Warning, then Critical; expand Incident timeline | The deterministic detector creates and escalates an understandable incident without spending LLM quota. |
| 0:50–1:35 | Investigate → Request AMD diagnosis | AMD receives a captured sensor snapshot, recent trends and matched user-supplied references. Monitoring continues while it runs. |
| 1:35–2:05 | Saved evidence, possible causes and limitations | The assessment is an inspection aid with reviewable inputs, not a confirmed fault or autonomous repair instruction. Expand the captured trend table. |
| 2:05–2:35 | Approve work order; assign Demo technician; Start inspection | The operator makes the consequential decision. The task links back to its investigation. |
| 2:35–3:00 | Mark completed, select Recovery; export report | Task completion and sensor recovery are distinct. Exportable evidence and persisted history make the handoff reviewable. |

Allow more time if AMD is slow. Do not click repeatedly or retry automatically. For the first real request, a completed assessment is evidence of connectivity, not a universal reliability benchmark.

## Useful proof to show

- Detailed charts: use 30 samples to inspect a transition, or up to 300 for the retained window. Labels describe samples rather than pretending gaps are continuous minutes.
- Investigation evidence: exact sensor values and detector reasons at request time, plus the original trend readings for new investigations.
- Reference provenance: only supplied excerpts are cited. The UI labels them user-supplied and not independently verified.
- AMD Inference: real model ID, whole-request duration, completion tokens and end-to-end tokens/s. Unknown GPU hardware is shown as unavailable.
- Workflow timing: elapsed time from saved AMD completion to task creation, including human waiting. This is not a measured improvement against a manual baseline.
- Refresh: the same saved investigation and task remain. Re-approving the same diagnosis reuses the original work order.
- Recovery: the incident resolves from sensor readings. Acknowledgement or task completion alone does not resolve it.

## If the provider is unavailable

Show the saved sensor evidence and the unavailable status. Use Investigation history to open a previously completed, honestly labelled saved AMD result. The application does not substitute a canned diagnosis. Retry only after the cooldown and only if appropriate for the remaining demo time.

If the monitoring context has changed, explain the historical banner. A historical work order requires reviewing the saved evidence and checking the acknowledgement. The backend enforces this requirement too.

## Questions to be ready for

**Who uses it?** A maintenance operator or reliability technician who needs to turn a machine alert into a documented inspection handoff.

**Where is AMD used?** The provider adapter sends the actual analysis request to the configured AMD TokenFactory endpoint. The detector and workflow run locally, so the alert remains useful if the model provider is unavailable.

**What is distinctive?** The product preserves the evidence behind an AI-assisted recommendation and carries it into a human-approved task. It makes scenario changes, historical context and provider failure visible.

**What benefit has been measured?** Provider timing and the recorded assessment-to-approval interval are available. Actual downtime reduction, savings and a manual comparison study have not yet been measured. A pilot should compare time-to-approved-inspection and handoff completeness on matched cases.

**Is this predictive maintenance?** It is a threshold-triggered anomaly investigation prototype. It does not predict failure dates or remaining useful life.

**Can it run a factory?** No. It controls a simulator and an inspection workflow, not physical equipment. Production identity, deployment, operational controls and industrial validation remain future work.

## Submission items still owned by the team

The event page requests a public repository, demo/application URL, cover image, video and slide presentation, plus project descriptions and technology tags. The repository and local program do not themselves submit the project or provide public hosting. Review current event rules in the submission portal before submitting.
