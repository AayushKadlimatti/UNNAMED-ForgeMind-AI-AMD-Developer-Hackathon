"""Integration boundary ONLY: does not import or reimplement detector.py/amd_engine.py.

Teammate 2 sends detector/diagnosis output here; frontend consumes standard tasks.
Submission is advisory and explicitly requests a work order (optional).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import MachineStatus
from .rag_engine import search_manual
from .schemas import DiagnosisRequest, DiagnosisResponse, TaskCreate
from .security_routes import User, commit_changes, record_audit, require_admin
from .workflow_routes import add_task, find_machine

router = APIRouter(prefix="/api/v1/integration", tags=["Teammate integration"])


@router.post("/diagnoses", response_model=DiagnosisResponse)
def accept_diagnosis(payload: DiagnosisRequest, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    diagnosis = payload.diagnosis
    machine = find_machine(db, diagnosis.machine_id)
    if diagnosis.is_anomaly and not any(reading.triggered for reading in diagnosis.readings):
        raise HTTPException(status_code=422, detail="An anomaly must identify at least one triggered sensor reading.")
    if not diagnosis.is_anomaly and (payload.task is not None or any(r.triggered for r in diagnosis.readings)):
        raise HTTPException(status_code=422, detail="A non-anomaly must not have triggered readings or request an anomaly work order.")
    manual = search_manual(diagnosis.manual_query)
    record_audit(db, user, "MANUAL_SEARCHED", {"matched": manual["matched"],
                 "excerpt_ids": [m["excerpt_id"] for m in manual["matches"]], "source": "integration"})
    task = None
    if diagnosis.is_anomaly:
        old = machine.status
        machine.status = MachineStatus.CRITICAL
        record_audit(db, user, "MACHINE_STATUS_CHANGED", {"machine_id": machine.id,
                     "from": old.value, "to": "CRITICAL", "source": "reported_anomaly"})
    if payload.task is not None:
        task = add_task(db, TaskCreate(machine_id=machine.id, **payload.task.model_dump()), user)
    record_audit(db, user, "DIAGNOSIS_RECEIVED", {"machine_id": machine.id,
                 "data_source": diagnosis.data_source.value, "is_anomaly": diagnosis.is_anomaly,
                 "task_id": task.id if task else None})
    commit_changes(db)
    return {"diagnosis": diagnosis, "manual": manual, "task": task, "machine": machine,
            "advisory": "Unvalidated teammate-supplied diagnosis, not a verified failure prediction. Sample manual instructions are not approved maintenance guidance. A human must review; no equipment is controlled. DEMO readings are synthetic; REAL is a caller assertion, not independently verified."}
