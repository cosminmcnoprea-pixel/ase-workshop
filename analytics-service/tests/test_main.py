import pytest
import httpx
from fastapi.testclient import TestClient
from main import app, Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_health():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "analytics-service"}

def test_get_task_analytics():
    """Test getting task analytics"""
    response = client.get("/analytics/tasks?days=7")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 7  # Should not exceed requested days
    
    if data:  # If data exists
        assert "date" in data[0]
        assert "total_tasks" in data[0]
        assert "completed_tasks" in data[0]
        assert "completion_rate" in data[0]
        assert "avg_priority_score" in data[0]

def test_get_user_analytics():
    """Test getting user analytics"""
    response = client.get("/analytics/users?days=7")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 7
    
    if data:
        assert "date" in data[0]
        assert "active_users" in data[0]
        assert "new_users" in data[0]
        assert "tasks_per_user" in data[0]

def test_get_notification_analytics():
    """Test getting notification analytics"""
    response = client.get("/analytics/notifications?days=7")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 7
    
    if data:
        assert "date" in data[0]
        assert "total_notifications" in data[0]
        assert "read_notifications" in data[0]
        assert "read_rate" in data[0]
        assert "notifications_by_type" in data[0]

def test_get_analytics_summary():
    """Test getting analytics summary"""
    response = client.get("/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert "users" in data
    assert "notifications" in data
    
    # Check task summary structure
    assert "total_today" in data["tasks"]
    assert "completed_today" in data["tasks"]
    assert "completion_rate" in data["tasks"]
    
    # Check user summary structure
    assert "active_today" in data["users"]
    assert "new_today" in data["users"]
    assert "tasks_per_user" in data["users"]
    
    # Check notification summary structure
    assert "total_today" in data["notifications"]
    assert "read_today" in data["notifications"]
    assert "read_rate" in data["notifications"]

def test_refresh_analytics():
    """Test refreshing analytics"""
    response = client.post("/analytics/refresh")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "Analytics refreshed successfully"
