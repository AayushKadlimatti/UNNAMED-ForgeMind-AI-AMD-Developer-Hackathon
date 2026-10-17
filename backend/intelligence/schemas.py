from datetime import datetime
from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Telemetry(StrictModel):
    machine_id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    timestamp: AwareDatetime
    vibration_mm_s: float = Field(ge=0, le=100, description="Vibration velocity RMS in mm/s")
    temperature: float = Field(ge=-100, le=500, description="Winding temperature in Celsius")
    current_amp: float = Field(ge=0, le=10000, description="Current in amperes")
    data_source: Literal["synthetic", "sensor"]


class Detection(StrictModel):
    is_anomaly: bool
    severity: Literal["LOW", "MEDIUM", "CRITICAL"]
    reasons: list[str]
    threshold_profile: str = "conveyor-velocity-demo-v1"
    thresholds_validated: bool = False


class Diagnostic(StrictModel):
    condition: str = Field(min_length=1, max_length=500)
    possible_causes: list[str] = Field(min_length=1, max_length=5)
    suggested_inspections: list[str] = Field(min_length=1, max_length=6)
    limitations: list[str] = Field(min_length=1, max_length=5)
    requires_human_review: Literal[True]


class InferenceMetrics(StrictModel):
    model: str
    request_latency_s: float
    completion_tokens: int | None
    end_to_end_tokens_per_sec: float | None
    hardware: str | None = None


class Analysis(StrictModel):
    analysis_id: str
    created_at: AwareDatetime
    telemetry: Telemetry
    machine_id: str
    timestamp: datetime
    data_source: Literal["synthetic", "sensor"]
    detection: Detection
    diagnosis_status: Literal["pending", "not_needed", "not_configured", "completed", "unavailable"]
    diagnostic: Diagnostic | None = None
    inference: InferenceMetrics | None = None
    message: str | None = None
