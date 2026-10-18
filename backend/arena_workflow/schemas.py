"""Explicit API contracts; no arbitrary roles or client-selected task IDs."""
from datetime import datetime
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from .models import MachineStatus, Priority, TaskStatus

MachineID = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=64,
                                            pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$")]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300)]
Query = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class Schema(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class MachineCreate(Schema):
    id: MachineID
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    status: MachineStatus = MachineStatus.HEALTHY


class MachineResponse(MachineCreate):
    pass


class MachineStatusUpdate(Schema):
    status: MachineStatus


class TaskCreate(Schema):
    machine_id: MachineID
    title: Title
    priority: Priority = Priority.MEDIUM
    assigned_to: Name


class TaskResponse(TaskCreate):
    id: str
    status: TaskStatus
    created_at: datetime
    updated_at: datetime


class TaskStatusUpdate(Schema):
    status: TaskStatus


class TaskAssignmentUpdate(Schema):
    assigned_to: Name


class ManualSearchRequest(Schema):
    query: Query


class ManualMatch(Schema):
    excerpt_id: str
    citation: str
    content: str
    score: float
    matched_keywords: list[str]
    is_sample: Literal[True] = True


class ManualSearchResponse(Schema):
    query: str
    matched: bool
    matches: list[ManualMatch]
    message: str
    retrieval_method: Literal["keyword"] = "keyword"
    is_sample: Literal[True] = True
    disclaimer: str


class AuditLogResponse(Schema):
    id: int
    username: str
    action: str
    details: str
    timestamp: datetime


class ErrorResponse(Schema):
    detail: str


class DataSource(str, Enum):
    DEMO = "DEMO"
    REAL = "REAL"


class SensorReading(Schema):
    sensor: Name
    value: float = Field(allow_inf_nan=False)
    unit: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
    triggered: bool = Field(strict=True)


class DiagnosisPayload(Schema):
    """Teammate-supplied results, NOT a request to run detection or AMD inference."""
    machine_id: MachineID
    data_source: DataSource  # required: never silently call demo readings real
    observed_at: datetime = Field(description="Timezone-aware measurement timestamp")
    is_anomaly: bool = Field(strict=True)
    readings: list[SensorReading] = Field(min_length=1, max_length=100)
    diagnosis: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
    manual_query: Query

    @field_validator("observed_at")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("observed_at must include a timezone, for example +00:00")
        return value


class IntegrationTaskRequest(Schema):
    title: Title
    assigned_to: Name
    priority: Priority = Priority.HIGH


class DiagnosisRequest(Schema):
    external_id: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100,
                                               pattern=r"^[A-Za-z0-9_-]+$")]
    diagnosis: DiagnosisPayload
    task: IntegrationTaskRequest | None = None


class DiagnosisResponse(Schema):
    diagnosis_id: str
    diagnosis: DiagnosisPayload
    manual: ManualSearchResponse
    task: TaskResponse | None
    machine: MachineResponse
    advisory: str
