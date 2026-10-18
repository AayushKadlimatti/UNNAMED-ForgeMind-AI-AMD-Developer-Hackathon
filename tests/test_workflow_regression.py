from datetime import datetime

import pytest


def test_task_creation_defaults_and_persistence(client, tech, task):
    assert task["id"].startswith("TASK-")
    assert task["status"] == "Pending"
    assert datetime.fromisoformat(task["created_at"].replace("Z", "+00:00")).utcoffset().total_seconds() == 0
    assert client.get(f"/api/v1/tasks/{task['id']}", headers=tech).json() == task
    assert client.get("/api/v1/tasks?status=Pending&machine_id=CONV-MTR-01", headers=tech).json() == [task]
    assert client.get("/api/v1/tasks?status=Completed", headers=tech).json() == []


def test_full_lifecycle_and_no_reopening(client, tech, admin, task):
    path = f"/api/v1/tasks/{task['id']}/status"
    assert client.patch(path, headers=tech, json={"status": "Completed"}).status_code == 409
    assert client.patch(path, headers=tech, json={"status": "Pending"}).status_code == 409
    previous = task["updated_at"]
    for status in ["In Progress", "Completed"]:
        response = client.patch(path, headers=tech, json={"status": status})
        assert response.status_code == 200
        assert response.json()["status"] == status
        assert response.json()["updated_at"] >= previous
        previous = response.json()["updated_at"]
    for status in ["Pending", "In Progress", "Completed"]:
        assert client.patch(path, headers=tech, json={"status": status}).status_code == 409
    actions = [row["action"] for row in client.get("/api/v1/admin/audit-logs", headers=admin).json()]
    assert actions.count("TASK_STATUS_CHANGED") == 2


def test_no_backwards_transition(client, tech, task):
    path = f"/api/v1/tasks/{task['id']}/status"
    assert client.patch(path, headers=tech, json={"status": "In Progress"}).status_code == 200
    assert client.patch(path, headers=tech, json={"status": "Pending"}).status_code == 409
    assert client.patch(path, headers=tech, json={"status": "In Progress"}).status_code == 409


def test_assign_reassign_and_completed_lock(client, tech, task):
    base = f"/api/v1/tasks/{task['id']}"
    for name in ["Ravi", "Meera"]:
        response = client.patch(base + "/assign", headers=tech, json={"assigned_to": name})
        assert response.status_code == 200
        assert response.json()["assigned_to"] == name
        assert client.get(base, headers=tech).json()["assigned_to"] == name
    for status in ["In Progress", "Completed"]:
        client.patch(base + "/status", headers=tech, json={"status": status})
    assert client.patch(base + "/assign", headers=tech, json={"assigned_to": "Ravi"}).status_code == 409


def test_task_requires_existing_machine(client, tech):
    assert client.post("/api/v1/tasks", headers=tech,
                       json={"machine_id": "missing", "title": "Demo", "assigned_to": "Asha"}).status_code == 404


@pytest.mark.parametrize("field,value", [("title", " "), ("title", "x" * 301),
    ("assigned_to", ""), ("assigned_to", "x" * 101), ("priority", "URGENT"),
    ("status", "Completed"), ("id", "TASK-manual")])
def test_task_validation(client, tech, machine, field, value):
    payload = {"machine_id": machine["id"], "title": "Demo", "assigned_to": "Asha"}
    payload[field] = value
    assert client.post("/api/v1/tasks", headers=tech, json=payload).status_code == 422


def test_status_assignment_and_missing_validation(client, tech, task):
    base = f"/api/v1/tasks/{task['id']}"
    assert client.patch(base + "/status", headers=tech, json={"status": "done"}).status_code == 422
    assert client.patch(base + "/assign", headers=tech, json={"assigned_to": " "}).status_code == 422
    assert client.patch("/api/v1/tasks/missing/status", headers=tech, json={"status": "In Progress"}).status_code == 404
    assert client.patch("/api/v1/tasks/missing/assign", headers=tech, json={"assigned_to": "Asha"}).status_code == 404


def test_unique_task_ids(client, tech, machine):
    ids = set()
    for _ in range(20):
        response = client.post("/api/v1/tasks", headers=tech,
                               json={"machine_id": machine["id"], "title": "Demo", "assigned_to": "Asha"})
        assert response.status_code == 201
        ids.add(response.json()["id"])
    assert len(ids) == 20


def test_pagination(client, tech, machine, task):
    assert len(client.get("/api/v1/tasks?limit=1", headers=tech).json()) == 1
    assert client.get("/api/v1/tasks?offset=1", headers=tech).json() == []
    for path in ["/api/v1/tasks?limit=201", "/api/v1/tasks?offset=-1", "/api/v1/machines?limit=0"]:
        assert client.get(path, headers=tech).status_code == 422
