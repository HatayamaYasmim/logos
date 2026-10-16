from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.main import app


def test_incidents_without_token_returns_401():
    original_override = app.dependency_overrides.pop(get_current_user, None)

    try:
        with TestClient(app) as client:
            response = client.get("/incidents")

        assert response.status_code == 401
    finally:
        if original_override is not None:
            app.dependency_overrides[get_current_user] = original_override


def test_incidents_with_invalid_token_returns_401(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "chave-de-teste-exclusiva-com-32-caracteres",
    )

    original_override = app.dependency_overrides.pop(get_current_user, None)

    try:
        with TestClient(app) as client:
            response = client.get(
                "/incidents",
                headers={
                    "Authorization": "Bearer token-invalido",
                },
            )

        assert response.status_code == 401
    finally:
        if original_override is not None:
            app.dependency_overrides[get_current_user] = original_override
