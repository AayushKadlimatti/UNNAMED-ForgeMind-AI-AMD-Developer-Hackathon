"""Single-worker local integration: simulator, real AMD inference, human work orders."""
import asyncio
import json
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from .configuration import trusted_origins, secure_cookie
from .simulator import ConveyorMotorSimulator
from .anomaly_detector import AnomalyDetectionEngine
from .amd_bridge import diagnose, amd_configured, AMDUnavailable
from .store import Store
from .arena_workflow.database import Base, build_database, get_db
from .arena_workflow.models import Machine, MachineStatus, MaintenanceTask, AuditLog
from .arena_workflow.security_routes import load_demo_credentials, User, get_current_user, require_admin, record_audit, commit_changes, router as security_router
from .arena_workflow.workflow_routes import router as workflow_router, add_task
from .arena_workflow.integration import router as integration_router
from .arena_workflow.schemas import IntegrationTaskRequest, TaskCreate, TaskResponse, ManualSearchRequest, ManualSearchResponse
from .arena_workflow.rag_engine import search_manual
from .documents import router as documents_router, search as search_references

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / '.env')
MACHINE = 'CONV-MTR-01'


def now():
    return datetime.now(timezone.utc).isoformat()


def require_machine(machine):
    if machine != MACHINE:
        raise HTTPException(404, 'Only CONV-MTR-01 has a configured demo profile')


async def tick(app):
    reading = app.state.simulator.tick()
    analysis = app.state.detector.evaluate(reading)
    packet = {**reading, **analysis, 'id': str(uuid4()), 'is_simulated': True,
              'vibration_unit': 'mm/s RMS', 'thresholds_validated': False,
              'context_id': app.state.context_id}
    app.state.latest = packet
    if reading['is_running']:
        app.state.store.save('telemetry', packet)
    if reading['is_running']:
        active = app.state.store.get(app.state.incident_id) if app.state.incident_id else None
        if analysis['health_status'] != 'HEALTHY':
            if active is None:
                active = {'id': 'ALR-' + uuid4().hex[:8], 'machine_id': MACHINE,
                    'timestamp': now(), 'is_simulated': True, 'acknowledged': False,
                    'state': 'active', 'title': 'Demo threshold exceeded'}
                app.state.incident_id = active['id']
            level = analysis['health_status'].lower()
            if active.get('severity') != level:
                active.setdefault('transitions', []).append({'severity': level, 'timestamp': now()})
            active['peak_severity'] = 'critical' if level == 'critical' or active.get('peak_severity') == 'critical' else 'warning'
            active.update(severity=analysis['health_status'].lower(),
                description='; '.join(analysis['anomaly_reasons']), updated_at=now(), parameters=reading)
            app.state.store.save('alert', active)
        elif active:
            active.update(state='resolved', resolved_at=now(), resolution='Readings returned within demo thresholds')
            app.state.store.save('alert', active)
            app.state.incident_id = None
    app.state.last_status = analysis['health_status']
    app.state.store.save('runtime', {'id': 'simulator-state', **app.state.simulator.get_status(),
                                   'context_id': app.state.context_id})
    return packet


async def worker(app):
    while True:
        await asyncio.sleep(1)
        try:
            await tick(app)
            app.state.monitor_error = None
        except Exception:
            app.state.monitor_error = 'Monitoring update failed. Last readings may be stale; retrying.'


@asynccontextmanager
async def lifespan(app):
    app.state.store = Store(os.getenv('FORGEMIND_EVENT_DB', str(ROOT / 'data/events.sqlite3')))
    engine, factory = build_database(os.getenv('FORGEMIND_WORKFLOW_DATABASE_URL', 'sqlite:///' + (ROOT / 'data/workflow.sqlite3').as_posix()))
    Base.metadata.create_all(engine)
    app.state.arena_session_factory = factory
    app.state.demo_credentials = load_demo_credentials()
    with factory() as db:
        if db.get(Machine, MACHINE) is None:
            db.add(Machine(id=MACHINE, name='Conveyor Motor 01 (synthetic demo)', status=MachineStatus.HEALTHY))
            db.commit()
    app.state.simulator = ConveyorMotorSimulator(MACHINE)
    saved = app.state.store.get('simulator-state')
    if saved:
        app.state.simulator.scenario = saved['scenario']
        app.state.simulator.is_running = saved['is_running']
        app.state.simulator.tick_count = saved['tick_count']
        for field, value in saved['current_values'].items():
            setattr(app.state.simulator, 'current_' + ('current' if field == 'current' else field), value)
    else:
        app.state.simulator.start()
    app.state.detector = AnomalyDetectionEngine()
    app.state.last_status = 'HEALTHY'
    app.state.monitor_error = None
    app.state.context_id = saved['context_id'] if saved else str(uuid4())
    active = [item for item in app.state.store.list('alert', 1000) if item.get('state') == 'active']
    app.state.incident_id = active[0]['id'] if active else None
    app.state.latest = None
    app.state.inference_task = None
    app.state.last_requested = -float('inf')
    previous = app.state.store.list('diagnosis', 1)
    if previous:
        elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(previous[0]['timestamp'])).total_seconds()
        app.state.last_requested = time.monotonic() - max(0, elapsed)
    app.state.diagnosis_lock = asyncio.Lock()
    app.state.work_order_lock = asyncio.Lock()
    async with httpx.AsyncClient(timeout=httpx.Timeout(90, connect=10), follow_redirects=False) as client:
        app.state.amd_client = client
        await tick(app)
        task = asyncio.create_task(worker(app))
        try:
            yield
        finally:
            task.cancel()
            if app.state.inference_task:
                app.state.inference_task.cancel()
            await asyncio.gather(task, *([app.state.inference_task] if app.state.inference_task else []), return_exceptions=True)
            engine.dispose()


app = FastAPI(title='ForgeMind integrated demo', version='3.0.0', lifespan=lifespan)
@app.exception_handler(RequestValidationError)
async def safe_validation_error(request: Request, exc: RequestValidationError):
    # Keep FastAPI's normal detail-array shape without reflecting rejected body data or context.
    return JSONResponse(status_code=422, content={'detail': [
        {key: error[key] for key in ('type', 'loc', 'msg') if key in error} for error in exc.errors()
    ]})


app.add_middleware(CORSMiddleware, allow_origins=list(trusted_origins()), allow_credentials=True, allow_methods=['*'], allow_headers=['Content-Type', 'Authorization'])
app.include_router(workflow_router)
app.include_router(security_router)
app.include_router(integration_router)
app.include_router(documents_router)


@app.get('/health')
def health(request: Request):
    return {'status': 'degraded' if request.app.state.monitor_error else 'ok',
            'amd_configured': amd_configured(), 'data_source': 'synthetic'}


@app.get('/api/session')
def session(user: User = Depends(get_current_user)):
    return {'username': user.username, 'role': user.role}


@app.post('/api/session')
def connect_session(request: Request, response: Response, user: User = Depends(get_current_user)):
    authorization = request.headers.get('authorization', '')
    if not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Enter a demo access token to connect')
    response.set_cookie('forgemind_session', authorization[7:], httponly=True,
                        samesite='strict', max_age=8 * 3600, secure=secure_cookie(), path='/')
    return {'username': user.username, 'role': user.role}


@app.delete('/api/session')
def disconnect_session(response: Response, user: User = Depends(get_current_user)):
    response.delete_cookie('forgemind_session', path='/', httponly=True, samesite='strict', secure=secure_cookie())
    return {'disconnected': True}


@app.get('/api/simulator/status')
def simulator_status(request: Request):
    state = request.app.state
    return {**state.simulator.get_status(), 'latest_reading': state.latest, 'is_simulated': True,
            'amd_configured': amd_configured(),
            'context_id': state.context_id, 'monitor_error': state.monitor_error,
            'retry_after_s': round(max(0, 45 - (time.monotonic() - state.last_requested))),
            'active_incidents': sum(item.get('state') == 'active' for item in state.store.list('alert', 1000))}


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    scenario: str = Field(min_length=1, max_length=20)


@app.post('/api/simulator/scenario')
async def scenario(payload: ScenarioRequest, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    selected = payload.scenario.lower()
    if selected not in ('normal', 'warning', 'critical', 'abnormal', 'recovery'):
        raise HTTPException(422, 'Use normal, warning, critical, abnormal, or recovery')
    record_audit(db, user, 'SIMULATOR_SCENARIO_CHANGED', {'scenario': 'critical' if selected == 'abnormal' else selected})
    commit_changes(db)
    request.app.state.simulator.set_scenario(selected)
    request.app.state.context_id = str(uuid4())
    await tick(request.app)
    return simulator_status(request)


@app.post('/api/simulator/{action}')
async def control(action: str, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if action not in ('start', 'stop', 'reset'):
        raise HTTPException(404, 'Unknown simulator action')
    record_audit(db, user, 'SIMULATOR_CONTROLLED', {'action': action})
    commit_changes(db)
    getattr(request.app.state.simulator, action)()
    if action == 'reset':
        request.app.state.context_id = str(uuid4())
    await tick(request.app)
    return simulator_status(request)


@app.get('/api/telemetry/history')
def telemetry(request: Request, machine_id: str = MACHINE, limit: int = Query(50, ge=1, le=300)):
    require_machine(machine_id)
    history = list(reversed(request.app.state.store.list('telemetry', limit)))
    return {'machine_id': machine_id, 'count': len(history), 'history': history, 'is_simulated': True}


@app.get('/api/alerts')
def alerts(request: Request, limit: int = Query(20, ge=1, le=100)):
    items = request.app.state.store.list('alert', limit)
    return {'alerts': items, 'count': len(items)}


@app.patch('/api/alerts/{alert_id}/acknowledge')
def acknowledge(alert_id: str, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = request.app.state.store.get(alert_id)
    if not alert or not alert_id.startswith('ALR-'):
        raise HTTPException(404, 'Alert not found')
    if not alert.get('acknowledged'):
        alert.update(acknowledged=True, acknowledged_at=now(), acknowledged_by=user.username)
        request.app.state.store.save_audited('alert', alert, db, user, 'INCIDENT_ACKNOWLEDGED',
                                          {'alert_id': alert_id}, replace_existing=True)
    return alert


@app.get('/api/diagnostics/latest')
def latest_diagnosis(request: Request, machine_id: str = MACHINE, user: User = Depends(get_current_user)):
    require_machine(machine_id)
    results = request.app.state.store.list('diagnosis', 1)
    return {'diagnostic': results[0] if results else None, 'status': results[0]['status'] if results else 'not_requested'}


@app.get('/api/diagnostics/history')
def diagnosis_history(request: Request, limit: int = Query(20, ge=1, le=100), user: User = Depends(get_current_user)):
    return request.app.state.store.list('diagnosis', limit)


async def infer(app, record, reading):
    try:
        async with asyncio.timeout(90):
            result = await diagnose(reading, app.state.detector.evaluate(reading), app.state.amd_client)
        record.update(result, status='completed', message=None)
    except (AMDUnavailable, TimeoutError) as exc:
        record.update(status='unavailable', message=str(exc) or 'AMD request exceeded 90 seconds')
    except Exception:
        record.update(status='unavailable', message='Diagnosis failed; detector readings are preserved')
    finally:
        app.state.store.save('diagnosis', record)


@app.post('/api/diagnostics/request', status_code=202)
async def request_diagnosis(request: Request, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # External intake must not hide an in-flight AMD request in the dashboard.
    async with request.app.state.diagnosis_lock:
        state = request.app.state
        if state.inference_task and not state.inference_task.done():
            return latest_diagnosis(request)
        reading = state.latest
        if not reading or not reading['is_running'] or reading['health_status'] == 'HEALTHY':
            raise HTTPException(409, 'Start the simulator and select an abnormal scenario before requesting diagnosis')
        if not amd_configured():
            raise HTTPException(503, 'AMD credentials are not configured')
        if time.monotonic() - state.last_requested < 45:
            remaining = max(1, int(45 - (time.monotonic() - state.last_requested)))
            raise HTTPException(429, f'Wait {remaining} seconds before retrying AMD', headers={'Retry-After': str(remaining)})
        readings = list(reversed(state.store.list('telemetry', 20)))
        references = search_references(state.store, 'conveyor motor vibration temperature current bearing cooling maintenance')
        context = {'recent_readings': [{key: row.get(key) for key in ('timestamp', 'temperature', 'vibration', 'current', 'health_status')} for row in readings],
                   'references': references, 'reference_disclaimer': 'User-supplied; not independently verified OEM instructions'}
        record = {'id': 'DIAG-' + uuid4().hex, 'machine_id': MACHINE, 'timestamp': now(),
                  'status': 'pending', 'origin': 'amd', 'message': 'Waiting for AMD', 'confidence': None,
                  'telemetry_snapshot': reading, 'data_source': 'synthetic', 'requires_human_review': True,
                  'primaryHypothesis': None, 'alternatives': [], 'remediationSteps': [], 'inference': None,
                  'context_id': state.context_id, 'references': references, 'trend_readings': len(readings),
                  'context_readings': context['recent_readings']}
        state.store.save_audited('diagnosis', record, db, user, 'DIAGNOSIS_REQUESTED',
            {'diagnosis_id': record['id'], 'machine_id': MACHINE, 'origin': 'amd'},
            extra_audits=[('REFERENCE_SEARCHED', {'source': 'amd_context', 'matched': bool(references),
                                                'excerpt_ids': [r['excerpt_id'] for r in references]})])
        state.last_requested = time.monotonic()
        state.inference_task = asyncio.create_task(infer(request.app, record, {**reading, 'analysis_context': context}))
        return {'diagnostic': record, 'status': 'pending'}


class ReviewedWorkOrder(IntegrationTaskRequest):
    reviewed_historical_context: bool = Field(default=False, strict=True)


@app.post('/api/diagnostics/{diagnosis_id}/work-order', response_model=TaskResponse, status_code=201)
async def create_work_order(diagnosis_id: str, payload: ReviewedWorkOrder, request: Request,
                            user: User = Depends(require_admin), db: Session = Depends(get_db)):
    async with request.app.state.work_order_lock:
        record = request.app.state.store.get(diagnosis_id)
        if not diagnosis_id.startswith('DIAG-') or not record or record.get('status') != 'completed':
            raise HTTPException(409, 'A completed diagnosis is required before approving an inspection task')
        if record.get('external_is_anomaly') is False:
            raise HTTPException(409, 'A non-anomaly external report cannot approve an anomaly work order')
        for log in db.query(AuditLog).filter(AuditLog.action == 'DIAGNOSIS_WORK_ORDER_APPROVED').all():
            details = json.loads(log.details)
            if details['diagnosis_id'] == diagnosis_id:
                record['work_order_id'] = details['task_id']
                request.app.state.store.save('diagnosis', record)
                return db.get(MaintenanceTask, details['task_id'])
        historical = record.get('context_id') != request.app.state.context_id
        if historical and not payload.reviewed_historical_context:
            raise HTTPException(409, 'Monitoring context changed. Review the saved evidence and explicitly confirm historical context before approval.')
        task = add_task(db, TaskCreate(machine_id=MACHINE, **payload.model_dump(exclude={'reviewed_historical_context'})), user)
        record_audit(db, user, 'DIAGNOSIS_WORK_ORDER_APPROVED', {'diagnosis_id': diagnosis_id, 'task_id': task.id, 'data_source': record.get('data_source', 'synthetic'), 'origin': record.get('origin', 'amd'),
                    'historical_context': historical, 'reviewed_historical_context': payload.reviewed_historical_context})
        commit_changes(db)
        record['work_order_id'] = task.id
        request.app.state.store.save('diagnosis', record)
        return task


@app.post('/api/v1/manual/search', response_model=ManualSearchResponse)
def manual_search(payload: ManualSearchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = search_manual(payload.query)
    record_audit(db, user, 'MANUAL_SEARCHED', {'source': 'api', 'matched': result['matched'],
                 'excerpt_ids': [match['excerpt_id'] for match in result['matches']]})
    commit_changes(db)
    return result
