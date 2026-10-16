"""
app.py – ResiliEdge v2.0: Autonomous Industrial Remediation & Work-Order Swarm
===============================================================================
Streamlit dashboard  •  Team: Project Hail Mary
Run:  streamlit run app.py
"""

from __future__ import annotations

import streamlit as st
import pandas as pd

from mock_data import generate_vibration_waveform, MOCK_PAYLOAD

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="ResiliEdge v2.0 – Project Hail Mary",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Dark-mode industrial CSS ────────────────────────────────────────────────
_CSS = """
<style>
/* ── Global ─────────────────────────────────────────────────────── */
html, body, [data-testid="stAppViewContainer"],
[data-testid="stApp"] {
    background-color: #0E1117;
    color: #C9D1D9;
}
[data-testid="stSidebar"] {
    background-color: #161B22;
}
[data-testid="stHeader"] {
    background-color: #0E1117;
}

/* ── Card panels ────────────────────────────────────────────────── */
.card {
    background-color: #161B22;
    border: 1px solid #30363D;
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
}

/* ── Accent badges ──────────────────────────────────────────────── */
.badge-amd {
    display: inline-block;
    background: #ED1C24;
    color: #FFFFFF;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    margin-right: 0.5rem;
    letter-spacing: 0.03em;
}
.badge-evolus {
    display: inline-block;
    background: #3B82F6;
    color: #FFFFFF;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    letter-spacing: 0.03em;
}

/* ── Section headers ────────────────────────────────────────────── */
.section-hdr {
    font-size: 1.10rem;
    font-weight: 700;
    color: #E6EDF3;
    margin-bottom: 0.5rem;
    border-bottom: 2px solid #30363D;
    padding-bottom: 0.35rem;
}

/* ── Financial ticker ───────────────────────────────────────────── */
.fin-ticker {
    background: linear-gradient(135deg, #3D1214 0%, #161B22 100%);
    border: 1px solid #ED1C24;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    margin-top: 1rem;
}
.fin-ticker .amount {
    font-size: 1.75rem;
    font-weight: 800;
    color: #ED1C24;
}
.fin-ticker .label {
    font-size: 0.80rem;
    color: #8B949E;
}

/* ── Alert boxes ────────────────────────────────────────────────── */
.alert-critical {
    background: linear-gradient(135deg, #3D1214 0%, #1A0607 100%);
    border-left: 4px solid #ED1C24;
    border-radius: 6px;
    padding: 0.9rem 1.1rem;
    color: #FF6B6B;
    font-weight: 600;
    margin-bottom: 0.75rem;
}
.alert-info-blue {
    background: linear-gradient(135deg, #0C2D57 0%, #0E1117 100%);
    border-left: 4px solid #3B82F6;
    border-radius: 6px;
    padding: 0.9rem 1.1rem;
    color: #93C5FD;
    margin-bottom: 0.75rem;
}

/* ── Expander tweaks ────────────────────────────────────────────── */
[data-testid="stExpander"] {
    background-color: #161B22;
    border: 1px solid #30363D;
    border-radius: 8px;
}

/* ── Metric value colour override ───────────────────────────────── */
[data-testid="stMetricValue"] {
    color: #E6EDF3 !important;
}
</style>
"""
st.markdown(_CSS, unsafe_allow_html=True)

# ── Unpack mock data ─────────────────────────────────────────────────────────
tel = MOCK_PAYLOAD["telemetry"]
amd = MOCK_PAYLOAD["amd_metrics"]
evo = MOCK_PAYLOAD["evolus_dispatch"]
inv = evo["mcp_inventory"]

# ── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🏭 Control Panel")
    machine = st.selectbox(
        "Machine Selector",
        [
            "PUMP-4B-INJECTION",
            "PUMP-1A-MAIN",
            "PUMP-7C-BOOSTER",
            "COMP-2D-AIR",
        ],
        index=0,
    )

    run_anomaly = st.button("🚨 Simulate Telemetry Anomaly", use_container_width=True)
    surge_mode = st.checkbox("⚡ Simulate 16-Pump Concurrency Surge")

    # Financial exposure ticker
    st.markdown(
        """
        <div class="fin-ticker">
            <div class="amount">$18,500 / min</div>
            <div class="label">COST OF UNPLANNED DOWNTIME</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.caption(
        "⏱ Legacy triage ≈ 75 min → **\\$1.38 M** exposure\n\n"
        "⚡ ResiliEdge < 2.5 min → **\\$46 K** exposure"
    )

# ── Header & Badges ─────────────────────────────────────────────────────────
st.markdown("# ⚙️ ResiliEdge v2.0")
st.markdown(
    "**Autonomous Industrial Remediation & Work-Order Swarm** &nbsp;|&nbsp; "
    "Team: *Project Hail Mary*"
)
st.markdown(
    '<span class="badge-amd">AMD ROCm / vLLM</span>'
    '<span class="badge-evolus">Evolus AI Platform</span>',
    unsafe_allow_html=True,
)
st.markdown("---")

# ── Determine active AMD throughput based on surge toggle ────────────────────
active_throughput = (
    amd["burst_16_pumps_tok_s"] if surge_mode else amd["throughput_tok_s"]
)
throughput_label = "1,184.0 tok/s (16-pump burst)" if surge_mode else "114.2 tok/s"

# ── Layout: two main columns ────────────────────────────────────────────────
col_left, col_right = st.columns([1.15, 1], gap="large")

# ═══════════════════════════════════════════════════════════════════════════
# LEFT COLUMN – Signal & Compute HUD
# ═══════════════════════════════════════════════════════════════════════════
with col_left:
    # ── Section 1: Edge Telemetry & DSP Harmonic Filter ──────────────────
    st.markdown('<div class="section-hdr">📡 Edge Telemetry &amp; DSP Harmonic Filter</div>', unsafe_allow_html=True)

    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)

        # Vibration waveform chart
        t, sig = generate_vibration_waveform()
        waveform_df = pd.DataFrame({"Time (s)": t, "Amplitude (g)": sig})
        st.line_chart(
            waveform_df,
            x="Time (s)",
            y="Amplitude (g)",
            use_container_width=True,
            color="#ED1C24",
        )

        # Metrics row
        m1, m2, m3 = st.columns(3)
        m1.metric("Detected BPFO Harmonic", f"{tel['bpfo_harmonic_hz']} Hz")
        m2.metric("Mathematical Confidence", f"{tel['dsp_confidence_pct']}%")
        m3.metric("Uncertainty Margin", f"± {tel['dsp_uncertainty_margin']}%")

        st.markdown('</div>', unsafe_allow_html=True)

    # DSP compliance callout
    st.info(
        "🔬 **DSP Pipeline Note:** SciPy FFT harmonic extraction is used for "
        "numerical signal analysis.  This complies with the hackathon rule of "
        "*not* relying solely on an LLM for numerical forecasting — the LLM "
        "interprets the DSP output, it does not produce the frequency estimate.",
        icon="ℹ️",
    )

    st.markdown("")

    # ── Section 2: AMD Instinct Hardware Acceleration HUD ────────────────
    st.markdown(
        '<div class="section-hdr">🔴 AMD Instinct Hardware Acceleration HUD</div>',
        unsafe_allow_html=True,
    )

    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)

        a1, a2, a3 = st.columns(3)
        a1.metric("Target Accelerator", "MI300X")
        a2.metric("vLLM Throughput", throughput_label)
        a3.metric("Inference Latency", f"{amd['single_stream_latency_s']} s")

        # Dynamic banner
        if surge_mode:
            st.markdown(
                '<div class="alert-critical">'
                "⚡ <b>16-PUMP CONCURRENCY SURGE ACTIVE</b> — ROCm continuous "
                "batching is processing 16 simultaneous fault-diagnosis streams at "
                "1,184 tok/s aggregate throughput (batch window: 2.35 s)."
                "</div>",
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                '<div class="alert-info-blue">'
                "🔵 <b>Single-Stream Mode</b> — AMD ROCm / vLLM continuous batching "
                "ready. Toggle the sidebar checkbox to simulate multi-pump burst "
                "inference on the MI300X."
                "</div>",
                unsafe_allow_html=True,
            )

        st.caption(f"Hardware: {amd['hardware']}")
        st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════
# RIGHT COLUMN – Agent Dispatch & Human Oversight
# ═══════════════════════════════════════════════════════════════════════════
with col_right:
    # ── Section 3: Evolus Agentic Orchestration ──────────────────────────
    st.markdown(
        '<div class="section-hdr">🤖 Evolus Agentic Orchestration</div>',
        unsafe_allow_html=True,
    )

    # Critical fault alert
    st.markdown(
        f'<div class="alert-critical">'
        f"🚨 <b>CRITICAL FAULT DETECTED</b><br/>"
        f"<span style='font-size:0.95rem'>{evo['fault_code']}</span>"
        f"</div>",
        unsafe_allow_html=True,
    )

    # Expander: Document Extractor
    with st.expander("📄 Document Extractor — Extracted SOP & Translation", expanded=True):
        st.markdown(
            f"""
**Extracted Standard Operating Procedure:**
> {evo['extracted_sop']}

**Translation Status:**
> 🌐 {evo['translation_status']}
"""
        )

    # Expander: MCP Warehouse Inventory
    with st.expander("📦 MCP Warehouse Inventory — Spare Part Lookup", expanded=True):
        st.markdown(
            f"""
| Field | Value |
|-------|-------|
| **Part Number** | `{inv['part_number']}` |
| **Status** | 🟢 `{inv['warehouse_status']}` |
| **Location** | {inv['location']} |
| **Reservation ID** | `{inv['reservation_id']}` |
"""
        )

    st.markdown("")

    # ── Section 4: Human-in-the-Loop Supervisor Gate ─────────────────────
    st.markdown(
        '<div class="section-hdr">🛡️ Human-in-the-Loop Supervisor Gate</div>',
        unsafe_allow_html=True,
    )

    st.markdown(
        '<div class="card">', unsafe_allow_html=True,
    )

    b1, b2, b3 = st.columns(3)

    with b1:
        if st.button("✅ Approve & Dispatch", use_container_width=True):
            st.success(
                "✅ **Work Order #WO-8941 dispatched.**  "
                "Field technician notified — ETA 12 min.  "
                "Part SKF-6204 reserved at Bay 4, Shelf 12.",
                icon="🎉",
            )
            st.balloons()

    with b2:
        if st.button("✏️ Modify & Teach", use_container_width=True):
            st.warning(
                "✏️ **Manual torque override recorded** (45 Nm → operator-specified).  "
                "Correction written back to Evolus Knowledge Library for future "
                "retrieval-augmented generation.",
                icon="📝",
            )

    with b3:
        if st.button("❌ Reject (Drift)", use_container_width=True):
            st.info(
                "❌ **Incident dismissed** — supervisor classified anomaly as "
                "sensor drift.  Telemetry tag flagged for recalibration.",
                icon="🔄",
            )

    st.markdown('</div>', unsafe_allow_html=True)

# ── Footer ───────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption(
    "ResiliEdge v2.0  •  Team: Project Hail Mary  •  "
    "AMD Instinct MI300X + Evolus AI Platform  •  "
    "Built for the hackathon — zero external API dependencies"
)
