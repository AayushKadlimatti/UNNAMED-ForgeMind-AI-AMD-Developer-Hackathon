"""Database constraints protect data even outside the HTTP API."""
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator):
    """SQLite stores naive timestamps; always expose them as UTC-aware values."""
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("A timezone-aware timestamp is required")
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc) if value is not None else None


class MachineStatus(str, Enum):
    HEALTHY = "HEALTHY"
    CRITICAL = "CRITICAL"


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"


class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


def enum_column(enum, name):
    return SAEnum(enum, name=name, native_enum=False, create_constraint=True,
                  validate_strings=True, values_callable=lambda e: [item.value for item in e])


class Machine(Base):
    __tablename__ = "machines"
    __table_args__ = (
        CheckConstraint("length(trim(id)) BETWEEN 1 AND 64", name="machine_id_length"),
        CheckConstraint("length(trim(name)) BETWEEN 1 AND 200", name="machine_name_length"),
    )
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[MachineStatus] = mapped_column(enum_column(MachineStatus, "machine_status"),
                                                 default=MachineStatus.HEALTHY, nullable=False)
    tasks: Mapped[list["MaintenanceTask"]] = relationship(back_populates="machine")


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"
    __table_args__ = (
        CheckConstraint("length(trim(title)) BETWEEN 1 AND 300", name="task_title_length"),
        CheckConstraint("length(trim(assigned_to)) BETWEEN 1 AND 100", name="assignee_length"),
    )
    id: Mapped[str] = mapped_column(String(41), primary_key=True, default=lambda: f"TASK-{uuid4().hex}")
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id", ondelete="RESTRICT"), index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    priority: Mapped[Priority] = mapped_column(enum_column(Priority, "task_priority"), default=Priority.MEDIUM)
    status: Mapped[TaskStatus] = mapped_column(enum_column(TaskStatus, "task_status"), default=TaskStatus.PENDING)
    assigned_to: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now, onupdate=utc_now)
    machine: Mapped[Machine] = relationship(back_populates="tasks")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"sqlite_autoincrement": True}
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now, index=True)
