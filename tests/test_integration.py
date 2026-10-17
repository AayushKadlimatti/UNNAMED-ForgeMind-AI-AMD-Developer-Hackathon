import asyncio
import time

import pytest
from fastapi.testclient import TestClient

from backend import integrated_server as server
from backend.amd_bridge import diagnose
from backend.intelligence.amd_engine import AMDUnavailable
from backend.store import Store

ADMIN = 'a' * 40
TECH = 't' * 40
AUTH = {'Authorization': 'Bearer ' + ADMIN}
TECH_AUTH = {'Authorization': 'Bearer ' + TECH}


@pytest.fixture(autouse=True)
def environment(monkeypatch, tmp_path):
    monkeypatch.setenv('FORGEMIND_ADMIN_TOKEN', ADMIN)
    monkeypatch.setenv('FORGEMIND_TECHNICIAN_TOKEN', TECH)
    monkeypatch.setenv('FORGEMIND_EVENT_DB', str(tmp_path / 'events.sqlite3'))
    monkeypatch.setenv('FORGEMIND_WORKFLOW_DATABASE_URL', 'sqlite:///' + (tmp_path / 'workflow.sqlite3').as_posix())
    monkeypatch.setenv('AMD_API_KEY', 'test-only')
    monkeypatch.setenv('AMD_TOKEN_FACTORY_URL', 'https://example.com/v1/chat/completions')
    monkeypatch.setenv('AMD_MODEL', 'test-model')


def wait_finished(client):
    for _ in range(100):
        result = client.get('/api/diagnostics/latest').json()['diagnostic']
        if result and result['status'] != 'pending':
            return result
        time.sleep(0.01)
    pytest.fail('Background analysis did not finish')


async def fake_diagnosis(reading, analysis, client):
    await asyncio.sleep(0.05)
    assert reading['health_status'] != 'HEALTHY'
    return {'primaryHypothesis': {'title': 'Review', 'description': 'Possible wear'},
            'alternatives': [], 'remediationSteps': ['Review trends'], 'confidence': None,
            'inference': {'model': 'test-model', 'request_latency_s': 1, 'completion_tokens': 20,
                          'end_to_end_tokens_per_sec': 20, 'hardware': None}}


def test_normal_empty_and_authentication():
    with TestClient(server.app) as client:
        assert client.get('/api/diagnostics/latest').json()['diagnostic'] is None
        assert client.get('/api/simulator/status').json()['latest_reading']['health_status'] == 'HEALTHY'
        assert client.post('/api/diagnostics/request').status_code == 401
        assert client.post('/api/diagnostics/request', headers=TECH_AUTH).status_code == 403
        assert client.post('/api/diagnostics/request', headers=AUTH).status_code == 409
        assert client.get('/api/session', headers=AUTH).json()['role'] == 'admin'
        assert client.get('/api/session', headers=TECH_AUTH).json()['role'] == 'technician'
        assert client.get('/api/telemetry/history?machine_id=unknown').status_code == 404
        assert client.post('/api/simulator/scenario', json={'scenario': 'typo'}).status_code == 422


def test_scenario_does_not_call_amd(monkeypatch):
    async def forbidden(*args):
        pytest.fail('Scenario changes must not consume provider quota')
    monkeypatch.setattr(server, 'diagnose', forbidden)
    with TestClient(server.app) as client:
        assert client.post('/api/simulator/scenario', json={'scenario': 'critical'}).status_code == 200
        reading = client.get('/api/simulator/status').json()['latest_reading']
        assert reading['vibration_unit'] == 'mm/s RMS'
        assert reading['health_status'] == 'CRITICAL'
        assert client.get('/api/alerts').json()['count'] > 0
        assert client.get('/api/diagnostics/latest').json()['diagnostic'] is None


def test_background_inference_cooldown_and_work_order_lifecycle(monkeypatch):
    monkeypatch.setattr(server, 'diagnose', fake_diagnosis)
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        start = client.post('/api/diagnostics/request', headers=AUTH)
        assert start.status_code == 202
        duplicate = client.post('/api/diagnostics/request', headers=AUTH).json()
        assert duplicate['diagnostic']['id'] == start.json()['diagnostic']['id']
        result = wait_finished(client)
        assert result['status'] == 'completed'
        assert result['confidence'] is None
        assert client.post('/api/diagnostics/request', headers=AUTH).status_code == 429
        payload = {'title': 'Review conveyor trends', 'assigned_to': 'Test technician', 'priority': 'HIGH'}
        endpoint = '/api/diagnostics/' + result['id'] + '/work-order'
        assert client.post(endpoint, json=payload, headers=TECH_AUTH).status_code == 403
        created = client.post(endpoint, json=payload, headers=AUTH)
        assert created.status_code == 201, created.text
        task = created.json()
        assert client.post(endpoint, json=payload, headers=AUTH).json()['id'] == task['id']
        path = '/api/v1/tasks/' + task['id'] + '/status'
        assert client.patch(path, headers=TECH_AUTH, json={'status': 'Completed'}).status_code == 409
        assert client.patch(path, headers=TECH_AUTH, json={'status': 'In Progress'}).status_code == 200
        assert client.patch(path, headers=TECH_AUTH, json={'status': 'Completed'}).status_code == 200
        logs = client.get('/api/v1/admin/audit-logs', headers=AUTH).json()
        assert any(log['action'] == 'DIAGNOSIS_WORK_ORDER_APPROVED' for log in logs)
    with TestClient(server.app) as client:
        assert client.get('/api/v1/tasks', headers=AUTH).json()[0]['status'] == 'Completed'
        assert client.get('/api/diagnostics/latest').json()['diagnostic']['status'] == 'completed'
        assert client.post(endpoint, json=payload, headers=AUTH).json()['id'] == task['id']


def test_provider_failure_preserved_and_manual_retry(monkeypatch):
    async def broken(*args):
        raise AMDUnavailable('AMD timed out')
    monkeypatch.setattr(server, 'diagnose', broken)
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        client.post('/api/diagnostics/request', headers=AUTH)
        result = wait_finished(client)
        assert result['status'] == 'unavailable'
        assert result['telemetry_snapshot']['health_status'] == 'CRITICAL'
        assert result['inference'] is None
        monkeypatch.setattr(server, 'diagnose', fake_diagnosis)
        server.app.state.last_requested -= 46
        client.post('/api/diagnostics/request', headers=AUTH)
        assert wait_finished(client)['status'] == 'completed'


def test_interrupted_restart_recovery(tmp_path):
    path = tmp_path / 'recover.sqlite3'
    store = Store(path)
    store.save('diagnosis', {'id': 'interrupted', 'status': 'pending'})
    assert Store(path).get('interrupted')['status'] == 'unavailable'


def test_units_are_not_relabelled_as_g(monkeypatch):
    import backend.amd_bridge as bridge
    async def capture(telemetry, detection, client):
        assert telemetry.vibration_mm_s == 5
        assert 'vibration_rms' not in telemetry.model_dump()
        assert detection.is_anomaly
        raise AMDUnavailable('capture done')
    monkeypatch.setattr(bridge, 'diagnose_with_amd', capture)
    with pytest.raises(AMDUnavailable, match='capture done'):
        asyncio.run(diagnose({'machine_id': server.MACHINE, 'timestamp': '2026-10-17T10:00:00Z',
            'temperature': 82, 'vibration': 5, 'current': 21},
            {'health_status': 'CRITICAL', 'anomaly_reasons': ['Demo threshold exceeded']}, None))


def test_sample_manual_labelled():
    with TestClient(server.app) as client:
        result = client.post('/api/v1/manual/search', headers=AUTH, json={'query': 'bearing vibration'})
        assert result.status_code == 200
        assert result.json()['is_sample'] is True


def test_warning_escalation_acknowledgement_and_recovery():
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'warning'})
        assert client.get('/api/simulator/status').json()['latest_reading']['health_status'] == 'WARNING'
        alert = client.get('/api/alerts').json()['alerts'][0]
        assert alert['state'] == 'active'
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        escalated = client.get('/api/alerts').json()['alerts']
        assert len(escalated) == 1
        assert escalated[0]['id'] == alert['id']
        assert escalated[0]['severity'] == 'critical'
        assert client.patch('/api/alerts/' + alert['id'] + '/acknowledge').status_code == 401
        acknowledged = client.patch('/api/alerts/' + alert['id'] + '/acknowledge', headers=TECH_AUTH).json()
        assert acknowledged['acknowledged'] is True
        assert acknowledged['state'] == 'active'
        client.post('/api/simulator/stop')
        assert client.get('/api/alerts').json()['alerts'][0]['state'] == 'active'
        client.post('/api/simulator/start')
        client.post('/api/simulator/scenario', json={'scenario': 'normal'})
        resolved = client.get('/api/alerts').json()['alerts'][0]
        assert resolved['state'] == 'resolved'
        assert resolved['resolved_at']
        assert client.get('/api/simulator/status').json()['active_incidents'] == 0
        client.post('/api/simulator/scenario', json={'scenario': 'warning'})
        assert client.get('/api/alerts').json()['count'] == 2


def test_warning_is_stable_and_recovery_reaches_normal():
    from backend.simulator import ConveyorMotorSimulator
    from backend.anomaly_detector import AnomalyDetectionEngine
    simulator = ConveyorMotorSimulator()
    simulator.start()
    simulator.set_scenario('warning')
    detector = AnomalyDetectionEngine()
    assert {detector.evaluate(simulator.tick())['health_status'] for _ in range(100)} == {'WARNING'}
    simulator.set_scenario('critical')
    for _ in range(30):
        simulator.tick()
    simulator.set_scenario('recovery')
    for _ in range(180):
        reading = simulator.tick()
    assert reading['scenario'] == 'normal'
    assert detector.evaluate(reading)['health_status'] == 'HEALTHY'


def test_cookie_session_refresh_logout_and_cross_origin_denial():
    with TestClient(server.app) as client:
        connected = client.post('/api/session', headers=AUTH)
        assert connected.status_code == 200
        assert 'HttpOnly' in connected.headers['set-cookie']
        assert 'SameSite=strict' in connected.headers['set-cookie']
        assert client.get('/api/session').json()['role'] == 'admin'
        assert client.post('/api/diagnostics/request', headers={'Origin': 'https://unrelated.example'}).status_code == 403
        assert client.delete('/api/session').status_code == 200
        assert client.get('/api/session').status_code == 401
        client.post('/api/session', headers=TECH_AUTH)
        assert client.post('/api/diagnostics/request').status_code == 403


def test_simulator_pause_and_context_survive_restart():
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        client.post('/api/simulator/stop')
        previous = client.get('/api/simulator/status').json()
    with TestClient(server.app) as client:
        resumed = client.get('/api/simulator/status').json()
        assert resumed['is_running'] is False
        assert resumed['scenario'] == 'critical'
        assert resumed['context_id'] == previous['context_id']
        assert resumed['tick_count'] == previous['tick_count']
        client.post('/api/simulator/reset')
        reset = client.get('/api/simulator/status').json()
        assert reset['context_id'] != previous['context_id']
        assert reset['scenario'] == 'normal'
        assert reset['is_running'] is False


REFERENCE = {'title': 'Team conveyor maintenance note', 'source': 'User supplied note, revision 1',
             'text': 'Review motor bearing vibration trends and cooling airflow records before planning a qualified inspection.',
             'source_url': 'https://example.com/manual'}


def test_reference_library_permissions_validation_and_search():
    with TestClient(server.app) as client:
        assert client.post('/api/documents', json=REFERENCE).status_code == 401
        assert client.post('/api/documents', json=REFERENCE, headers=TECH_AUTH).status_code == 403
        assert client.get('/api/documents/search?q=bearing').status_code == 401
        assert client.get('/api/documents/search?q=bearing', headers=AUTH).json()['matches'] == []
        assert client.post('/api/documents', json={**REFERENCE, 'source_url': 'javascript:alert(1)'}, headers=AUTH).status_code == 422
        response = client.post('/api/documents', json=REFERENCE, headers=AUTH)
        assert response.status_code == 201
        assert response.json()['verification'] == 'user_supplied'
        results = client.get('/api/documents/search?q=bearing+vibration', headers=TECH_AUTH).json()['matches']
        assert results[0]['excerpt'] == REFERENCE['text']
        assert client.get('/api/documents/search?q=unrelatedzz', headers=AUTH).json()['matches'] == []
    with TestClient(server.app) as client:
        assert client.get('/api/documents', headers=AUTH).json()[0]['title'] == REFERENCE['title']


def test_inference_captures_trends_references_and_original_context(monkeypatch):
    seen = {}
    async def capture(reading, analysis, client):
        seen.update(reading['analysis_context'])
        return await fake_diagnosis(reading, analysis, client)
    monkeypatch.setattr(server, 'diagnose', capture)
    with TestClient(server.app) as client:
        client.post('/api/documents', json=REFERENCE, headers=AUTH)
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        original_context = client.get('/api/simulator/status').json()['context_id']
        client.post('/api/diagnostics/request', headers=AUTH)
        client.post('/api/simulator/scenario', json={'scenario': 'normal'})
        result = wait_finished(client)
        assert result['context_id'] == original_context
        assert result['telemetry_snapshot']['scenario'] == 'critical'
        assert result['trend_readings'] >= 2
        assert seen['references'][0]['verification'] == 'user_supplied'
        assert seen['recent_readings'][-1]['health_status'] == 'CRITICAL'
        assert result['references'][0]['excerpt'] == REFERENCE['text']
        assert client.get('/api/diagnostics/history').json()[0]['id'] == result['id']


def test_assignment_persists_and_completed_tasks_cannot_be_reassigned(monkeypatch):
    monkeypatch.setattr(server, 'diagnose', fake_diagnosis)
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        client.post('/api/diagnostics/request', headers=AUTH)
        diagnosis = wait_finished(client)
        task = client.post('/api/diagnostics/' + diagnosis['id'] + '/work-order', headers=AUTH,
            json={'title': 'Inspect recorded trends', 'assigned_to': 'First technician', 'priority': 'MEDIUM'}).json()
        path = '/api/v1/tasks/' + task['id']
        assert client.patch(path + '/assign', headers=TECH_AUTH, json={'assigned_to': 'Second technician'}).status_code == 200
        assert client.get(path, headers=AUTH).json()['assigned_to'] == 'Second technician'
        for status in ('In Progress', 'Completed'):
            client.patch(path + '/status', headers=TECH_AUTH, json={'status': status})
        assert client.patch(path + '/assign', headers=AUTH, json={'assigned_to': 'Third technician'}).status_code == 409

def test_historical_approval_requires_explicit_review_and_is_idempotent(monkeypatch):
    monkeypatch.setattr(server, 'diagnose', fake_diagnosis)
    with TestClient(server.app) as client:
        client.post('/api/simulator/scenario', json={'scenario': 'critical'})
        client.post('/api/diagnostics/request', headers=AUTH)
        diagnosis = wait_finished(client)
        assert diagnosis['context_readings'][-1]['health_status'] == 'CRITICAL'
        original_readings = diagnosis['context_readings']
        client.post('/api/simulator/scenario', json={'scenario': 'normal'})
        endpoint = '/api/diagnostics/' + diagnosis['id'] + '/work-order'
        payload = {'title': 'Historical evidence review', 'assigned_to': 'Reviewer', 'priority': 'HIGH'}
        assert client.post(endpoint, headers=AUTH, json=payload).status_code == 409
        assert client.post(endpoint, headers=AUTH, json={**payload, 'reviewed_historical_context': 'true'}).status_code == 422
        approved = client.post(endpoint, headers=AUTH, json={**payload, 'reviewed_historical_context': True})
        assert approved.status_code == 201
        task_id = approved.json()['id']
        # Retrying an already approved task remains idempotent, even after context changes.
        assert client.post(endpoint, headers=AUTH, json=payload).json()['id'] == task_id
        audit = client.get('/api/v1/admin/audit-logs', headers=AUTH).json()
        import json
        approval = next(json.loads(row['details']) for row in audit if row['action'] == 'DIAGNOSIS_WORK_ORDER_APPROVED')
        assert approval['historical_context'] is True
        assert approval['reviewed_historical_context'] is True
    with TestClient(server.app) as client:
        saved = client.get('/api/diagnostics/latest').json()['diagnostic']
        assert saved['context_readings'] == original_readings
        assert saved['work_order_id'] == task_id

def test_configure_demo_preserves_existing_secrets_and_generates_distinct_roles(tmp_path):
    from scripts.configure_demo import configure
    from dotenv import dotenv_values
    (tmp_path / '.env.example').write_text('AMD_API_KEY=\nFORGEMIND_ADMIN_TOKEN=\nFORGEMIND_TECHNICIAN_TOKEN=\n', encoding='utf-8')
    assert configure(tmp_path) is False
    first = dotenv_values(tmp_path / '.env')
    assert len(first['FORGEMIND_ADMIN_TOKEN']) >= 32
    assert first['FORGEMIND_ADMIN_TOKEN'] != first['FORGEMIND_TECHNICIAN_TOKEN']
    with (tmp_path / '.env').open('a', encoding='utf-8') as stream:
        stream.write('\nAMD_API_KEY=local-test-value\n')
    assert configure(tmp_path) is True
    second = dotenv_values(tmp_path / '.env')
    assert second['FORGEMIND_ADMIN_TOKEN'] == first['FORGEMIND_ADMIN_TOKEN']
    assert second['AMD_API_KEY'] == 'local-test-value'
