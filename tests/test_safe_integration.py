"""Integration-gap regressions; all sensor/diagnosis examples are synthetic test data."""
import copy
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from backend import integrated_server as server
from backend.configuration import trusted_origins


REFERENCE = {'title': 'Private marker title', 'source': 'Private marker revision',
             'text': 'Synthetic test reference: inspect vibration trend records with qualified personnel.',
             'source_url': 'https://example.com/manual'}


def submission():
    return {'external_id': 'synthetic-test-001', 'diagnosis': {
        'machine_id': 'CONV-MTR-01', 'data_source': 'DEMO', 'observed_at': '2026-10-17T08:00:00+05:30',
        'is_anomaly': True, 'readings': [{'sensor': 'vibration', 'value': 3.5, 'unit': 'g', 'triggered': True}],
        'diagnosis': 'Unvalidated synthetic external assessment; review evidence.', 'manual_query': 'bearing vibration'}}


def audits(client, admin):
    result = client.get('/api/v1/admin/audit-logs?limit=200', headers=admin)
    assert result.status_code == 200
    return result.json()


def fail_audit(action):
    with server.app.state.arena_session_factory() as db:
        db.execute(text(f"CREATE TRIGGER reject_test_audit BEFORE INSERT ON audit_logs WHEN NEW.action='{action}' BEGIN SELECT RAISE(ABORT, 'test failure'); END"))
        db.commit()


def test_manual_search_audits_match_and_no_match_without_free_text(client, admin, tech):
    for query in ['bearing private-search-marker', 'unrelatedzz private-search-marker']:
        assert client.post('/api/v1/manual/search', json={'query': query}, headers=tech).status_code == 200
    rows = audits(client, admin)
    assert [row['action'] for row in rows] == ['MANUAL_SEARCHED', 'MANUAL_SEARCHED']
    assert [json.loads(row['details'])['matched'] for row in rows] == [True, False]
    assert 'private-search-marker' not in json.dumps(rows)
    assert admin['Authorization'] not in json.dumps(rows)
    assert all(row['timestamp'].endswith('Z') for row in rows)


def test_reference_audits_and_privacy(client, admin, tech):
    assert client.post('/api/documents', json=REFERENCE, headers=admin).status_code == 201
    assert client.get('/api/documents', headers=tech).status_code == 200
    assert client.get('/api/documents/search?q=vibration-private-marker', headers=tech).status_code == 200
    assert client.get('/api/documents/search?q=unknownzz', headers=tech).json()['matches'] == []
    rows = audits(client, admin)
    assert [r['action'] for r in rows] == ['REFERENCE_ADDED', 'REFERENCE_LIBRARY_VIEWED', 'REFERENCE_SEARCHED', 'REFERENCE_SEARCHED']
    serialized = json.dumps(rows)
    for private in [REFERENCE['title'], REFERENCE['text'], REFERENCE['source'], REFERENCE['source_url'], 'private-marker']:
        assert private not in serialized


@pytest.mark.parametrize('url', ['https://user:password@example.com/file', 'https://example.com/file?token=secret',
                                  'https://example.com/file#private'])
def test_source_url_must_not_embed_credentials_or_signed_secrets(client, admin, url):
    assert client.post('/api/documents', headers=admin, json={**REFERENCE, 'source_url': url}).status_code == 422
    assert server.app.state.store.list('document') == []


def test_reference_audit_failure_rolls_back_document(client, admin):
    fail_audit('REFERENCE_ADDED')
    result = client.post('/api/documents', json=REFERENCE, headers=admin)
    assert result.status_code == 503
    assert 'test failure' not in result.text
    assert server.app.state.store.list('document') == []


@pytest.mark.parametrize('path', ['/api/simulator/start', '/api/simulator/stop', '/api/simulator/reset', '/api/simulator/scenario'])
def test_guests_cannot_change_simulator(client, path):
    before = client.get('/api/simulator/status').json()
    kwargs = {'json': {'scenario': 'critical'}} if path.endswith('scenario') else {}
    assert client.post(path, **kwargs).status_code == 401
    after = client.get('/api/simulator/status').json()
    assert after['scenario'] == before['scenario']
    assert after['context_id'] == before['context_id']


def test_technician_can_operate_simulator_but_not_approve_or_view_audit(client, tech):
    assert client.post('/api/simulator/scenario', json={'scenario': 'critical'}, headers=tech).status_code == 200
    assert client.post('/api/simulator/stop', headers=tech).status_code == 200
    assert client.post('/api/v1/integration/diagnoses', json=submission(), headers=tech).status_code == 403
    assert client.get('/api/v1/admin/audit-logs', headers=tech).status_code == 403


@pytest.mark.parametrize('path', ['/api/diagnostics/latest', '/api/diagnostics/history'])
def test_saved_diagnosis_evidence_requires_authentication(client, tech, path):
    assert client.get(path).status_code == 401
    assert client.get(path, headers=tech).status_code == 200


def test_external_history_units_review_workflow_idempotency_and_restart(client, admin, tech, monkeypatch):
    async def forbidden(*args, **kwargs):
        pytest.fail('External intake must not call AMD')
    monkeypatch.setattr(server, 'diagnose', forbidden)
    body = submission()
    response = client.post('/api/v1/integration/diagnoses', json=body, headers=admin)
    assert response.status_code == 200, response.text
    identifier = response.json()['diagnosis_id']
    assert response.json()['task'] is None
    assert client.get('/api/v1/tasks', headers=admin).json() == []
    saved = client.get('/api/diagnostics/latest', headers=tech).json()['diagnostic']
    assert saved['id'] == identifier
    assert saved['origin'] == 'external' and saved['inference'] is None
    assert saved['data_source'] == 'synthetic'
    assert saved['telemetry_snapshot']['readings'][0]['unit'] == 'g'
    assert 'vibration' not in saved['telemetry_snapshot']  # g is never relabelled mm/s
    assert saved['telemetry_snapshot']['timestamp'].endswith('+00:00')
    assert saved['references'][0]['verification'] == 'sample'
    before = len(audits(client, admin))
    assert client.post('/api/v1/integration/diagnoses', json=body, headers=admin).json()['diagnosis_id'] == identifier
    assert len(audits(client, admin)) == before
    assert len(client.get('/api/diagnostics/history', headers=tech).json()) == 1
    changed = copy.deepcopy(body)
    changed['diagnosis']['diagnosis'] = 'Changed payload'
    assert client.post('/api/v1/integration/diagnoses', json=changed, headers=admin).status_code == 409
    endpoint = f'/api/diagnostics/{identifier}/work-order'
    task_payload = {'title': 'Review synthetic external evidence', 'assigned_to': 'Test technician', 'priority': 'HIGH'}
    assert client.post(endpoint, json=task_payload, headers=admin).status_code == 409
    assert client.post(endpoint, json=task_payload, headers=tech).status_code == 403
    created = client.post(endpoint, json={**task_payload, 'reviewed_historical_context': True}, headers=admin)
    assert created.status_code == 201
    task_id = created.json()['id']
    for status in ['In Progress', 'Completed']:
        assert client.patch(f'/api/v1/tasks/{task_id}/status', json={'status': status}, headers=tech).status_code == 200
    with TestClient(server.app) as restarted:
        restored = restarted.get('/api/diagnostics/history', headers=admin).json()[0]
        assert restored['work_order_id'] == task_id
        assert restarted.post(endpoint, json=task_payload, headers=admin).json()['id'] == task_id
        assert restarted.post('/api/v1/integration/diagnoses', json=body, headers=admin).json()['diagnosis_id'] == identifier
        assert restarted.get(f'/api/v1/tasks/{task_id}', headers=tech).json()['status'] == 'Completed'


def test_real_claims_and_velocity_mapping_preserved_without_claiming_hardware(client, admin):
    body = submission()
    body['diagnosis']['data_source'] = 'REAL'
    body['diagnosis']['readings'][0]['unit'] = 'mm/s RMS'
    assert client.post('/api/v1/integration/diagnoses', json=body, headers=admin).status_code == 200
    saved = client.get('/api/diagnostics/latest', headers=admin).json()['diagnostic']
    assert saved['data_source'] == 'sensor'
    assert saved['telemetry_snapshot']['is_simulated'] is False
    assert saved['telemetry_snapshot']['vibration'] == 3.5
    assert saved['inference'] is None
    assert 'not been independently verified' in saved['limitations'][0]


@pytest.mark.parametrize('change', ['task', 'missing_id', 'naive_time', 'no_trigger', 'false_with_trigger', 'unknown_machine', 'extra_field'])
def test_external_validation_does_not_create_history_or_tasks(client, admin, change):
    body = submission()
    if change == 'task': body['task'] = {'title': 'Not automatic', 'assigned_to': 'Test technician'}
    elif change == 'missing_id': body.pop('external_id')
    elif change == 'naive_time': body['diagnosis']['observed_at'] = '2026-10-17T08:00:00'
    elif change == 'no_trigger': body['diagnosis']['readings'][0]['triggered'] = False
    elif change == 'false_with_trigger': body['diagnosis']['is_anomaly'] = False
    elif change == 'unknown_machine': body['diagnosis']['machine_id'] = 'missing'
    else: body['user_role'] = 'admin'
    result = client.post('/api/v1/integration/diagnoses', json=body, headers=admin)
    assert result.status_code == (404 if change == 'unknown_machine' else 422)
    assert server.app.state.store.list('diagnosis') == []
    assert client.get('/api/v1/tasks', headers=admin).json() == []
    assert client.get('/api/v1/machines/CONV-MTR-01', headers=admin).json()['status'] == 'HEALTHY'


def test_external_audit_failure_rolls_back_history_machine_and_metadata(client, admin):
    fail_audit('DIAGNOSIS_RECEIVED')
    result = client.post('/api/v1/integration/diagnoses', json=submission(), headers=admin)
    assert result.status_code == 503
    assert server.app.state.store.list('diagnosis') == []
    assert client.get('/api/v1/machines/CONV-MTR-01', headers=admin).json()['status'] == 'HEALTHY'
    assert audits(client, admin) == []


def test_non_anomaly_can_be_saved_but_cannot_approve_an_anomaly_order(client, admin):
    body = submission()
    body['diagnosis']['is_anomaly'] = False
    body['diagnosis']['readings'][0]['triggered'] = False
    result = client.post('/api/v1/integration/diagnoses', json=body, headers=admin)
    assert result.status_code == 200
    endpoint = '/api/diagnostics/' + result.json()['diagnosis_id'] + '/work-order'
    assert client.post(endpoint, headers=admin, json={'title': 'Review', 'assigned_to': 'Test', 'reviewed_historical_context': True}).status_code == 409


def test_role_spoof_and_cookie_origin_denials_are_logged_without_origin_secret(client, admin):
    assert client.get('/api/v1/admin/audit-logs', headers={'X-User-Role': 'admin'}).status_code == 401
    assert client.post('/api/session', headers=admin).status_code == 200
    assert client.post('/api/simulator/reset', headers={'Origin': 'https://secret-origin.example'}).status_code == 403
    rows = audits(client, admin)
    assert any(r['action'] == 'ACCESS_DENIED' for r in rows)
    assert 'secret-origin' not in json.dumps(rows)


@pytest.mark.parametrize('origin', ['*', 'https://user:secret@example.com', 'https://example.com/path', 'file:///tmp'])
def test_invalid_origin_configuration_rejected(monkeypatch, origin):
    monkeypatch.setenv('FORGEMIND_CORS_ORIGINS', origin)
    with pytest.raises(ValueError): trusted_origins()


def test_secure_cookie_setting_supported(client, admin, monkeypatch):
    monkeypatch.setenv('FORGEMIND_COOKIE_SECURE', 'true')
    result = client.post('/api/session', headers=admin)
    assert result.status_code == 200
    assert '; Secure' in result.headers['set-cookie']


def test_duplicate_active_routes_absent(client):
    routes = [(r.path, method) for r in server.app.routes for method in getattr(r, 'methods', [])]
    assert len(routes) == len(set(routes))
    assert client.get('/docs').status_code == 200


def test_validation_does_not_reflect_rejected_secrets(client, admin):
    marker = 'private-password-marker'
    response = client.post('/api/documents', headers=admin,
                           json={**REFERENCE, 'source_url': f'https://user:{marker}@example.com/manual'})
    assert response.status_code == 422
    assert marker not in response.text
    assert 'input' not in response.json()['detail'][0]
    response = client.post('/api/v1/manual/search', headers=admin, json={'query': marker * 100})
    assert response.status_code == 422
    assert marker not in response.text


def test_external_intake_does_not_hide_pending_amd_request(client, admin):
    class Pending:
        def done(self): return False
    server.app.state.inference_task = Pending()
    try:
        response = client.post('/api/v1/integration/diagnoses', headers=admin, json=submission())
        assert response.status_code == 409
        assert server.app.state.store.list('diagnosis') == []
    finally:
        server.app.state.inference_task = None


def test_external_storage_failure_after_history_insert_rolls_back_all_writes(client, admin):
    # Failure in the final metadata audit must also undo the earlier history insert and machine update.
    fail_audit('MANUAL_SEARCHED')
    response = client.post('/api/v1/integration/diagnoses', headers=admin, json=submission())
    assert response.status_code == 503
    assert server.app.state.store.list('diagnosis') == []
    assert audits(client, admin) == []
    assert client.get('/api/v1/machines/CONV-MTR-01', headers=admin).json()['status'] == 'HEALTHY'


def test_amd_context_search_is_audited_without_reference_text(client, admin, monkeypatch):
    from test_integration import fake_diagnosis, wait_finished
    monkeypatch.setattr(server, 'diagnose', fake_diagnosis)
    client.post('/api/documents', headers=admin, json=REFERENCE)
    client.post('/api/simulator/scenario', headers=admin, json={'scenario': 'critical'})
    assert client.post('/api/diagnostics/request', headers=admin).status_code == 202
    wait_finished(client)
    rows = audits(client, admin)
    assert any(r['action'] == 'DIAGNOSIS_REQUESTED' for r in rows)
    contexts = [json.loads(r['details']) for r in rows if r['action'] == 'REFERENCE_SEARCHED']
    assert contexts[0]['source'] == 'amd_context' and contexts[0]['matched'] is True
    assert REFERENCE['text'] not in json.dumps(rows)
