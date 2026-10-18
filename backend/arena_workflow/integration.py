"""External-result adapter. Never calls or replaces a detector or AMD engine.

Results are unverified caller assertions. Work orders require separate human approval.
"""
import hashlib
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .database import get_db
from .rag_engine import search_manual
from .schemas import DiagnosisRequest, DiagnosisResponse
from .security_routes import User, require_admin
from .workflow_routes import find_machine

router = APIRouter(prefix='/api/v1/integration', tags=['Teammate integration'])


def dashboard_record(payload: DiagnosisRequest):
    """Preserve original units; only map exact known units to the dashboard's channels."""
    source = payload.diagnosis
    submitted = source.model_dump(mode='json')
    fingerprint = hashlib.sha256(json.dumps(submitted, sort_keys=True).encode()).hexdigest()
    identifier = 'DIAG-EXT-' + hashlib.sha256((source.machine_id + ':' + payload.external_id).encode()).hexdigest()
    now = datetime.now(timezone.utc).isoformat()
    manual = search_manual(source.manual_query)
    snapshot = {'machine_id': source.machine_id, 'timestamp': source.observed_at.astimezone(timezone.utc).isoformat(),
                'health_status': 'CRITICAL' if source.is_anomaly else 'HEALTHY',
                'anomaly_reasons': [f'Caller flagged {r.sensor} ({r.value} {r.unit})' for r in source.readings if r.triggered],
                'readings': [r.model_dump() for r in source.readings],
                'is_simulated': source.data_source.value == 'DEMO', 'thresholds_validated': False}
    channels = {
        'temperature': ({'temperature', 'winding_temperature'}, {'c', '°c', 'degc'}),
        'vibration': ({'vibration', 'vibration_mm_s'}, {'mm/s', 'mm/s rms'}),
        'current': ({'current', 'current_amp'}, {'a', 'amp', 'amps'}),
    }
    for field, (names, units) in channels.items():
        compatible = [r for r in source.readings if r.sensor.lower() in names and r.unit.lower() in units]
        if len(compatible) == 1:
            snapshot[field] = compatible[0].value
    references = [{'excerpt_id': m['excerpt_id'], 'title': 'SAMPLE — ' + m['citation'],
                   'source': manual['disclaimer'], 'excerpt': m['content'], 'verification': 'sample'}
                  for m in manual['matches']]
    return {
        'id': identifier, 'machine_id': source.machine_id, 'timestamp': now, 'completed_at': now,
        'status': 'completed', 'origin': 'external', 'external_is_anomaly': source.is_anomaly,
        'submission_hash': fingerprint, 'telemetry_snapshot': snapshot,
        'data_source': 'synthetic' if source.data_source.value == 'DEMO' else 'sensor',
        'context_id': 'external:' + identifier, 'requires_human_review': True, 'confidence': None,
        'message': 'External, unvalidated submission. No AMD request or hardware execution was performed by this adapter.',
        'primaryHypothesis': {'title': 'External assessment — qualified review required', 'description': source.diagnosis},
        'alternatives': [], 'remediationSteps': [], 'inference': None,
        'limitations': ['External sensor/diagnosis claims have not been independently verified.',
                        'Sample manual excerpts are not approved OEM maintenance instructions.',
                        'This snapshot is separate from the synthetic monitoring context; review it explicitly before approval.'],
        'references': references, 'trend_readings': 0, 'context_readings': [],
    }, manual


@router.post('/diagnoses', response_model=DiagnosisResponse)
async def accept_diagnosis(payload: DiagnosisRequest, request: Request,
                           user: User = Depends(require_admin), db: Session = Depends(get_db)):
    source = payload.diagnosis
    machine = find_machine(db, source.machine_id)
    if source.machine_id != request.app.state.simulator.machine_id:
        raise HTTPException(409, 'This dashboard supports only its configured demo machine')
    if payload.task is not None:
        raise HTTPException(422, 'Direct task creation is disabled for external intake. Omit task, review the saved investigation, then use its work-order approval endpoint.')
    triggered = any(r.triggered for r in source.readings)
    if source.is_anomaly != triggered:
        raise HTTPException(422, 'is_anomaly must agree with whether at least one reading is triggered')
    record, manual = dashboard_record(payload)
    async with request.app.state.diagnosis_lock:
        pending = request.app.state.inference_task
        if pending and not pending.done():
            raise HTTPException(409, 'An AMD request is in progress; retry external intake after it finishes')
        stored, _ = request.app.state.store.save_audited('diagnosis', record, db, user, 'DIAGNOSIS_RECEIVED',
            {'diagnosis_id': record['id'], 'machine_id': machine.id, 'origin': 'external',
             'data_source': source.data_source.value, 'is_anomaly': source.is_anomaly},
            immutable=True, critical_machine=machine.id if source.is_anomaly else None,
            extra_audits=[('MANUAL_SEARCHED', {'source': 'integration', 'matched': manual['matched'],
                                             'excerpt_ids': [m['excerpt_id'] for m in manual['matches']]})])
    db.refresh(machine)
    return {'diagnosis_id': stored['id'], 'diagnosis': source, 'manual': manual, 'task': None, 'machine': machine,
            'advisory': 'Saved to dashboard history as an external, unvalidated assessment. No AMD execution or failure-prediction accuracy is claimed. DEMO is synthetic; REAL is a caller assertion. No work order was created. Review evidence and separately approve an inspection. Sample manual content is not approved maintenance guidance.'}
