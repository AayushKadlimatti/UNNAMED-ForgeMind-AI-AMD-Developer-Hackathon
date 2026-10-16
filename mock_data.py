"""
mock_data.py – Synthetic industrial telemetry for ResiliEdge v2.0
================================================================
Generates realistic vibration waveforms and provides a complete
mock payload so the Streamlit UI can run with zero external APIs.
"""

import numpy as np


def generate_vibration_waveform(
    n_points: int = 300,
    duration_s: float = 1.0,
    base_rpm_hz: float = 50.0,
    bpfo_hz: float = 142.4,
    defect_onset_s: float = 0.6,
    noise_std: float = 0.25,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """Return (time, amplitude) arrays for a synthetic vibration signal.

    The waveform contains:
      • 50 Hz sinusoidal base rotation
      • Gaussian background noise
      • A 142.4 Hz BPFO defect burst that activates after *defect_onset_s*

    Parameters
    ----------
    n_points : int
        Number of sample points.
    duration_s : float
        Total signal duration in seconds.
    base_rpm_hz : float
        Fundamental rotational frequency (Hz).
    bpfo_hz : float
        Ball-Pass Frequency Outer-Race defect harmonic (Hz).
    defect_onset_s : float
        Time (s) after which the defect burst appears.
    noise_std : float
        Standard deviation of additive Gaussian noise.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    t : np.ndarray
        Time vector (seconds).
    signal : np.ndarray
        Composite vibration amplitude (g).
    """
    rng = np.random.default_rng(seed)
    t = np.linspace(0, duration_s, n_points)

    # Base rotation component
    base = np.sin(2 * np.pi * base_rpm_hz * t)

    # Background noise
    noise = rng.normal(0, noise_std, n_points)

    # BPFO defect burst (exponentially growing after onset)
    defect = np.where(
        t > defect_onset_s,
        1.8 * np.sin(2 * np.pi * bpfo_hz * t) * np.exp(2.5 * (t - defect_onset_s)),
        0.0,
    )

    signal = base + noise + defect
    return t, signal


# ---------------------------------------------------------------------------
# Complete mock payload – mirrors the shape a real telemetry pipeline returns
# ---------------------------------------------------------------------------

MOCK_PAYLOAD: dict = {
    "telemetry": {
        "machine_id": "PUMP-4B-INJECTION",
        "bpfo_harmonic_hz": 142.4,
        "dsp_confidence_pct": 91.4,
        "dsp_uncertainty_margin": 3.2,
        "temperature_c": 84.6,
        "cost_of_delay_per_min": 18_500,
    },
    "amd_metrics": {
        "hardware": "AMD Instinct MI300X (ROCm / vLLM Continuous Batching)",
        "single_stream_latency_s": 1.18,
        "throughput_tok_s": 114.2,
        "burst_16_pumps_tok_s": 1_184.0,
        "batch_time_s": 2.35,
    },
    "evolus_dispatch": {
        "fault_code": "E-402 (Bearing Cage Degradation)",
        "severity": "CRITICAL",
        "extracted_sop": (
            "HydroPump Series 4 Manual §5.3: Execute Lockout/Tagout pump circuit. "
            "Torque casing bolts to 45 Nm."
        ),
        "translation_status": (
            "OEM Italian diagram translated to English via Evolus AI Tool run-file"
        ),
        "mcp_inventory": {
            "part_number": "SKF-6204",
            "warehouse_status": "IN STOCK",
            "location": "Bay 4, Shelf 12",
            "reservation_id": "RES-8941",
        },
    },
}
