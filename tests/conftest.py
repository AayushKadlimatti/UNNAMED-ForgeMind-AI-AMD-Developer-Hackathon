"""Shared, temporary file-backed databases. Never uses a developer's AMD credentials."""
import pytest
from fastapi.testclient import TestClient

from backend import integrated_server as server


@pytest.fixture(autouse=True)
def environment(monkeypatch, tmp_path):
    monkeypatch.setenv('FORGEMIND_ADMIN_TOKEN', 'a' * 40)
    monkeypatch.setenv('FORGEMIND_TECHNICIAN_TOKEN', 't' * 40)
    monkeypatch.setenv('FORGEMIND_EVENT_DB', str(tmp_path / 'events.sqlite3'))
    monkeypatch.setenv('FORGEMIND_WORKFLOW_DATABASE_URL', 'sqlite:///' + (tmp_path / 'workflow.sqlite3').as_posix())
    monkeypatch.setenv('FORGEMIND_COOKIE_SECURE', 'false')
    monkeypatch.delenv('FORGEMIND_CORS_ORIGINS', raising=False)
    monkeypatch.setenv('AMD_API_KEY', 'test-only')
    monkeypatch.setenv('AMD_TOKEN_FACTORY_URL', 'https://example.com/v1/chat/completions')
    monkeypatch.setenv('AMD_MODEL', 'test-model')


@pytest.fixture
def client():
    with TestClient(server.app) as result:
        yield result


@pytest.fixture
def admin():
    return {'Authorization': 'Bearer ' + 'a' * 40}


@pytest.fixture
def tech():
    return {'Authorization': 'Bearer ' + 't' * 40}


@pytest.fixture
def machine(client, admin):
    return client.get('/api/v1/machines/CONV-MTR-01', headers=admin).json()


@pytest.fixture
def task(client, tech, machine):
    result = client.post('/api/v1/tasks', headers=tech,
                        json={'machine_id': machine['id'], 'title': 'Review demo alert',
                              'assigned_to': 'Asha', 'priority': 'HIGH'})
    assert result.status_code == 201
    return result.json()
