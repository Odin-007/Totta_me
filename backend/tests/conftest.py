"""Shared pytest fixtures: an isolated SQLite database and a FastAPI test client.

The app is pointed at a throwaway SQLite file (instead of the default Postgres
DATABASE_URL) by setting the env var *before* `main`/`config` are imported, so
`Base.metadata.create_all()` and `ensure_allowed_users()` run against test data
via the normal FastAPI startup event -- no dependency overrides needed.
"""

import os
from pathlib import Path

import pytest

TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"


@pytest.fixture(scope="session", autouse=True)
def _test_environment():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()

    os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
    os.environ.setdefault("JWT_SECRET", "test-secret")

    yield

    # SQLAlchemy keeps pooled connections open, which blocks deleting the
    # file on Windows until they're explicitly disposed.
    from database import engine

    engine.dispose()
    try:
        TEST_DB_PATH.unlink(missing_ok=True)
    except PermissionError:
        pass


@pytest.fixture(scope="session")
def client(_test_environment):
    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def test_credentials():
    """The first configured user, read from config so tests work with or without a local .env."""
    from config import ALLOWED_USERS

    email, data = next(iter(ALLOWED_USERS.items()))
    return {"email": email, "password": data["password"]}


@pytest.fixture()
def auth_headers(client, test_credentials):
    response = client.post("/api/auth/login", json=test_credentials)
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
