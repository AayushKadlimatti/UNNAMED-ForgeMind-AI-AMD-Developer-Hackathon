"""
backend/database.py - SQLAlchemy SQLite database storage for ForgeMind AI
Stores timestamped telemetry, anomaly alerts, and AI diagnostic records.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, List, Optional

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./forgemind.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    current = Column(Float, nullable=False)
    operating_status = Column(String(32), nullable=False)
    health_status = Column(String(32), nullable=False)
    anomaly_score = Column(Float, default=0.0)
    anomaly_reasons = Column(Text, default="[]")  # JSON list

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "machine_id": self.machine_id,
            "timestamp": self.timestamp.isoformat(),
            "temperature": round(self.temperature, 2),
            "vibration": round(self.vibration, 3),
            "current": round(self.current, 2),
            "operating_status": self.operating_status,
            "health_status": self.health_status,
            "anomaly_score": round(self.anomaly_score, 3),
            "anomaly_reasons": json.loads(self.anomaly_reasons or "[]"),
        }


class AlertRecord(Base):
    __tablename__ = "alert_records"

    id = Column(String(64), primary_key=True, index=True)
    machine_id = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), nullable=False)  # critical, warning, info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    acknowledged = Column(Boolean, default=False)
    parameters = Column(Text, default="{}")  # JSON object with trigger values

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "machine_id": self.machine_id,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "timestamp": self.timestamp.isoformat(),
            "acknowledged": self.acknowledged,
            "parameters": json.loads(self.parameters or "{}"),
        }


class DiagnosticRecord(Base):
    __tablename__ = "diagnostic_records"

    id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(String(64), index=True, nullable=True)
    machine_id = Column(String(64), index=True, nullable=False)
    confidence = Column(Integer, nullable=False)  # e.g. 92
    primary_hypothesis_title = Column(String(255), nullable=False)
    primary_hypothesis_desc = Column(Text, nullable=False)
    alternatives_json = Column(Text, default="[]")
    remediations_json = Column(Text, default="[]")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "machine_id": self.machine_id,
            "confidence": self.confidence,
            "primaryHypothesis": {
                "title": self.primary_hypothesis_title,
                "description": self.primary_hypothesis_desc,
            },
            "alternatives": json.loads(self.alternatives_json or "[]"),
            "remediationSteps": json.loads(self.remediations_json or "[]"),
            "timestamp": self.timestamp.isoformat(),
        }


# Create tables on import
Base.metadata.create_all(bind=engine)


def save_telemetry_reading(reading: dict[str, Any]) -> TelemetryRecord:
    session = SessionLocal()
    try:
        record = TelemetryRecord(
            machine_id=reading["machine_id"],
            temperature=reading["temperature"],
            vibration=reading["vibration"],
            current=reading["current"],
            operating_status=reading.get("operating_status", "RUNNING"),
            health_status=reading.get("health_status", "HEALTHY"),
            anomaly_score=reading.get("anomaly_score", 0.0),
            anomaly_reasons=json.dumps(reading.get("anomaly_reasons", [])),
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record
    finally:
        session.close()


def get_recent_telemetry(machine_id: str = "CONV-MTR-01", limit: int = 50) -> list[dict[str, Any]]:
    session = SessionLocal()
    try:
        records = (
            session.query(TelemetryRecord)
            .filter(TelemetryRecord.machine_id == machine_id)
            .order_by(TelemetryRecord.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [r.to_dict() for r in reversed(records)]
    finally:
        session.close()


def save_alert(alert: dict[str, Any]) -> AlertRecord:
    session = SessionLocal()
    try:
        record = AlertRecord(
            id=alert["id"],
            machine_id=alert["machine_id"],
            severity=alert["severity"],
            title=alert["title"],
            description=alert["description"],
            acknowledged=alert.get("acknowledged", False),
            parameters=json.dumps(alert.get("parameters", {})),
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record
    finally:
        session.close()


def get_recent_alerts(limit: int = 20) -> list[dict[str, Any]]:
    session = SessionLocal()
    try:
        records = (
            session.query(AlertRecord)
            .order_by(AlertRecord.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [r.to_dict() for r in records]
    finally:
        session.close()


def save_diagnostic(diag: dict[str, Any]) -> DiagnosticRecord:
    session = SessionLocal()
    try:
        record = DiagnosticRecord(
            id=diag["id"],
            alert_id=diag.get("alert_id"),
            machine_id=diag["machine_id"],
            confidence=diag["confidence"],
            primary_hypothesis_title=diag["primaryHypothesis"]["title"],
            primary_hypothesis_desc=diag["primaryHypothesis"]["description"],
            alternatives_json=json.dumps(diag.get("alternatives", [])),
            remediations_json=json.dumps(diag.get("remediationSteps", [])),
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record
    finally:
        session.close()


def get_latest_diagnostic(machine_id: str = "CONV-MTR-01") -> Optional[dict[str, Any]]:
    session = SessionLocal()
    try:
        record = (
            session.query(DiagnosticRecord)
            .filter(DiagnosticRecord.machine_id == machine_id)
            .order_by(DiagnosticRecord.timestamp.desc())
            .first()
        )
        return record.to_dict() if record else None
    finally:
        session.close()
