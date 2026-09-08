"""Tests for the unauthenticated health/root routes."""


def test_root_returns_service_info(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check_reports_database_connected(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
