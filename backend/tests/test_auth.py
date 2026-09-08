"""Tests for authentication: register, login, and the /me endpoint."""


def test_register_rejects_unknown_email(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "stranger@example.com", "password": "whatever123"},
    )
    assert response.status_code == 403


def test_login_with_valid_credentials_returns_token(client, test_credentials):
    response = client.post("/api/auth/login", json=test_credentials)
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_with_wrong_password_is_rejected(client, test_credentials):
    response = client.post(
        "/api/auth/login",
        json={"email": test_credentials["email"], "password": "not-the-password"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_rejects_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers, test_credentials):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == test_credentials["email"]
