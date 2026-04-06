from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_and_list_tasks():
    response = client.post("/tasks", json={"title": "Test Task", "description": "A test", "priority": "high"})
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "Test Task"

    response = client.get("/tasks")
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_get_task_not_found():
    response = client.get("/tasks/nonexistent")
    assert response.status_code == 404

def test_update_task():
    response = client.post("/tasks", json={"title": "Update Me"})
    task_id = response.json()["id"]
    response = client.patch(f"/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 200
    assert response.json()["status"] == "done"

def test_delete_task():
    response = client.post("/tasks", json={"title": "Delete Me"})
    task_id = response.json()["id"]
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204
