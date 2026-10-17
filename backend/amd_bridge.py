from datetime import datetime, timezone
from .intelligence.amd_engine import AMDUnavailable, amd_configured, diagnose_with_amd
from .intelligence.schemas import Telemetry, Detection


async def diagnose(reading, analysis, client):
    # The simulator measures velocity, never relabel it as acceleration in g.
    telemetry = Telemetry(machine_id=reading['machine_id'], timestamp=reading['timestamp'],
        vibration_mm_s=reading['vibration'], temperature=reading['temperature'],
        current_amp=reading['current'], data_source='synthetic')
    detection = Detection(is_anomaly=analysis['health_status'] != 'HEALTHY',
        severity='CRITICAL' if analysis['health_status'] == 'CRITICAL' else 'MEDIUM',
        reasons=analysis['anomaly_reasons'])
    context = reading.get('analysis_context')
    if context:
        diagnostic, metrics = await diagnose_with_amd(telemetry, detection, client, context=context)
    else:
        diagnostic, metrics = await diagnose_with_amd(telemetry, detection, client)
    return {'primaryHypothesis': {'title': 'Possible causes require review', 'description': diagnostic.condition},
        'alternatives': [{'title': cause, 'description': '', 'likelihood': 'Not calibrated'} for cause in diagnostic.possible_causes],
        'remediationSteps': diagnostic.suggested_inspections, 'limitations': diagnostic.limitations,
        'confidence': None, 'requires_human_review': True, 'inference': metrics.model_dump(),
        'completed_at': datetime.now(timezone.utc).isoformat()}
