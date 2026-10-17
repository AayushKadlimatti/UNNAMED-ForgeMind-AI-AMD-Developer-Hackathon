"""Human-controlled work orders. No automatic machine actuation or inference."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .database import get_db
from .models import Machine, MachineStatus, MaintenanceTask, TaskStatus, utc_now
from .schemas import (MachineCreate, MachineResponse, MachineStatusUpdate, TaskAssignmentUpdate,
                     TaskCreate, TaskResponse, TaskStatusUpdate)
from .security_routes import User, commit_changes, get_current_user, record_audit, require_admin

router = APIRouter(prefix="/api/v1", tags=["Machines and maintenance"])


def find_machine(db: Session, machine_id: str) -> Machine:
    machine = db.get(Machine, machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found.")
    return machine


def find_task(db: Session, task_id: str) -> MaintenanceTask:
    task = db.get(MaintenanceTask, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Maintenance task not found.")
    return task


def add_task(db: Session, payload: TaskCreate, user: User) -> MaintenanceTask:
    """Shared service for HTTP creation and the integration adapter; no commit."""
    find_machine(db, payload.machine_id)
    task = MaintenanceTask(**payload.model_dump())
    db.add(task)
    db.flush()  # UUID generated before audit references it
    record_audit(db, user, "TASK_CREATED", {"task_id": task.id, "machine_id": task.machine_id,
                                          "priority": task.priority.value})
    return task


@router.post("/machines", response_model=MachineResponse, status_code=201)
def create_machine(payload: MachineCreate, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.get(Machine, payload.id) is not None:
        raise HTTPException(status_code=409, detail="Machine ID already exists.")
    machine = Machine(**payload.model_dump())
    db.add(machine)
    record_audit(db, user, "MACHINE_CREATED", {"machine_id": machine.id, "status": machine.status.value})
    commit_changes(db)
    return machine


@router.get("/machines", response_model=list[MachineResponse])
def list_machines(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Machine).order_by(Machine.id).offset(offset).limit(limit)).all()


@router.get("/machines/{machine_id}", response_model=MachineResponse)
def get_machine(machine_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return find_machine(db, machine_id)


@router.patch("/machines/{machine_id}/status", response_model=MachineResponse)
def update_machine_status(machine_id: str, payload: MachineStatusUpdate,
                          user: User = Depends(require_admin), db: Session = Depends(get_db)):
    machine = find_machine(db, machine_id)
    old = machine.status
    machine.status = payload.status
    record_audit(db, user, "MACHINE_STATUS_CHANGED", {"machine_id": machine.id,
                  "from": old.value, "to": payload.status.value})
    commit_changes(db)
    return machine


@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(payload: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = add_task(db, payload, user)
    commit_changes(db)
    return task


@router.get("/tasks", response_model=list[TaskResponse])
def list_tasks(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
               machine_id: str | None = None, status: TaskStatus | None = None,
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    statement = select(MaintenanceTask)
    if machine_id is not None:
        statement = statement.where(MaintenanceTask.machine_id == machine_id)
    if status is not None:
        statement = statement.where(MaintenanceTask.status == status)
    return db.scalars(statement.order_by(MaintenanceTask.created_at, MaintenanceTask.id)
                      .offset(offset).limit(limit)).all()


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return find_task(db, task_id)


@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: str, payload: TaskStatusUpdate,
                       user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = find_task(db, task_id)
    old = task.status
    allowed = {TaskStatus.PENDING: TaskStatus.IN_PROGRESS, TaskStatus.IN_PROGRESS: TaskStatus.COMPLETED}
    if allowed.get(old) != payload.status:
        raise HTTPException(status_code=409, detail=f"Invalid transition: {old.value} → {payload.status.value}. Required lifecycle: Pending → In Progress → Completed; no reopening.")
    # Compare-and-swap prevents competing requests from bypassing the lifecycle.
    result = db.execute(update(MaintenanceTask).where(MaintenanceTask.id == task_id,
                        MaintenanceTask.status == old).values(status=payload.status, updated_at=utc_now())
                        .execution_options(synchronize_session=False))
    if result.rowcount != 1:
        raise HTTPException(status_code=409, detail="Task changed concurrently; reload and retry.")
    record_audit(db, user, "TASK_STATUS_CHANGED", {"task_id": task_id, "from": old.value, "to": payload.status.value})
    commit_changes(db)
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}/assign", response_model=TaskResponse)
def assign_task(task_id: str, payload: TaskAssignmentUpdate,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = find_task(db, task_id)
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Completed tasks cannot be reassigned.")
    result = db.execute(update(MaintenanceTask).where(MaintenanceTask.id == task_id,
                        MaintenanceTask.status != TaskStatus.COMPLETED)
                        .values(assigned_to=payload.assigned_to, updated_at=utc_now())
                        .execution_options(synchronize_session=False))
    if result.rowcount != 1:
        raise HTTPException(status_code=409, detail="Task changed concurrently; reload and retry.")
    # Do not copy arbitrary technician names into audit text; identity remains in task record.
    record_audit(db, user, "TASK_ASSIGNED", {"task_id": task_id, "assignment_changed": True})
    commit_changes(db)
    db.refresh(task)
    return task
