"""
backend/anomaly_detector.py - Real-Time Anomaly Detection Engine for ForgeMind AI
Evaluates demo telemetry using illustrative thresholds and multi-parameter
anomaly distance metrics (independent of the LLM).
"""

from __future__ import annotations

from datetime import datetime, timezone
from math import isfinite
from typing import Any, Dict, List, Tuple


class AnomalyDetectionEngine:
    """Illustrative velocity-based demo limits; not calibrated or standards-certified."""

    # Temperature Thresholds (°C) - Stator & Bearing Housing
    TEMP_NORMAL_MAX = 72.0
    TEMP_WARNING_MAX = 80.0

    # Vibration RMS Thresholds (mm/s) - ISO 10816-3 Group 2 Rigid Foundation
    # Zone A/B (Good/Acceptable): < 2.8 mm/s
    # Zone C (Restricted / Alert): 2.8 - 4.5 mm/s
    # Zone D (Dangerous / Critical): > 4.5 mm/s
    VIB_NORMAL_MAX = 2.80
    VIB_WARNING_MAX = 4.50

    # Electrical Current Thresholds (Amperes) - 11kW motor (15.5A FLA)
    # Warning at 115% FLA, Critical at 130% FLA
    CURR_NORMAL_MAX = 17.50
    CURR_WARNING_MAX = 20.50

    def evaluate(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a single telemetry reading without calling any LLM.
        Returns health status, composite anomaly score, responsible parameters, and timestamp.
        """
        temp = float(reading["temperature"])
        vib = float(reading["vibration"])
        curr = float(reading["current"])
        if not all(isfinite(v) for v in (temp, vib, curr)) or vib < 0 or curr < 0:
            raise ValueError("Invalid sensor reading")

        reasons: List[str] = []
        is_critical = False
        is_warning = False

        # 1. Temperature evaluation
        if temp > self.TEMP_WARNING_MAX:
            is_critical = True
            reasons.append(f"Temperature Critical: {temp:.1f}°C exceeds {self.TEMP_WARNING_MAX}°C limit")
        elif temp > self.TEMP_NORMAL_MAX:
            is_warning = True
            reasons.append(f"Temperature Warning: {temp:.1f}°C exceeds {self.TEMP_NORMAL_MAX}°C threshold")

        # 2. Vibration evaluation
        if vib > self.VIB_WARNING_MAX:
            is_critical = True
            reasons.append(f"Vibration Critical: {vib:.2f} mm/s exceeds demo critical limit ({self.VIB_WARNING_MAX} mm/s)")
        elif vib > self.VIB_NORMAL_MAX:
            is_warning = True
            reasons.append(f"Vibration Warning: {vib:.2f} mm/s exceeds demo warning threshold ({self.VIB_NORMAL_MAX} mm/s)")

        # 3. Current evaluation
        if curr > self.CURR_WARNING_MAX:
            is_critical = True
            reasons.append(f"Current Critical: {curr:.1f}A exceeds demo critical threshold ({self.CURR_WARNING_MAX}A)")
        elif curr > self.CURR_NORMAL_MAX:
            is_warning = True
            reasons.append(f"Current Warning: {curr:.1f}A exceeds demo warning threshold ({self.CURR_NORMAL_MAX}A)")

        # Determine overall health status
        if is_critical:
            health_status = "CRITICAL"
        elif is_warning:
            health_status = "WARNING"
        else:
            health_status = "HEALTHY"

        # Calculate continuous normalized anomaly score [0.0 - 1.0]
        # Baseline normal = 0.05 - 0.20
        # Warning = 0.35 - 0.65
        # Critical = 0.70 - 0.99
        temp_score = max(0.0, min(1.0, (temp - 60.0) / 40.0))
        vib_score = max(0.0, min(1.0, (vib - 1.5) / 6.0))
        curr_score = max(0.0, min(1.0, (curr - 14.0) / 12.0))

        # Weighted composite score (Vibration and Temp carry highest weight for mechanical health)
        composite_score = 0.45 * vib_score + 0.35 * temp_score + 0.20 * curr_score
        anomaly_score = max(0.02, min(0.99, composite_score))

        return {
            "health_status": health_status,
            "anomaly_score": round(anomaly_score, 3),
            "anomaly_reasons": reasons,
            "parameters": {
                "temperature": {"value": temp, "status": "CRITICAL" if temp > self.TEMP_WARNING_MAX else "WARNING" if temp > self.TEMP_NORMAL_MAX else "OK"},
                "vibration": {"value": vib, "status": "CRITICAL" if vib > self.VIB_WARNING_MAX else "WARNING" if vib > self.VIB_NORMAL_MAX else "OK"},
                "current": {"value": curr, "status": "CRITICAL" if curr > self.CURR_WARNING_MAX else "WARNING" if curr > self.CURR_NORMAL_MAX else "OK"},
            },
            "detection_timestamp": datetime.now(timezone.utc).isoformat(),
        }
