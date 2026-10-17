from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies.auth import get_current_user
from app.core.security import hash_password
from app.main import app
from app.models.user import User

TEST_PASSWORD = "SenhaDeTesteSegura123!"


@pytest.fixture
def auth_client(client, monkeypatch):
    """
    Reutiliza o banco de testes, mas remove a simulação
    de autenticação para utilizar cookies reais.

    Secure=false é utilizado apenas nos testes HTTP locais.
    """
    monkeypatch.setenv("COOKIE_SECURE", "false")

    original_override = app.dependency_overrides.pop(
        get_current_user,
        None,
    )

    try:
        yield client
    finally:
        if original_override is not None:
            app.dependency_overrides[get_current_user] = original_override


def create_user(db, name: str, active: bool = True) -> User:
    email = f"analista-{uuid4().hex}@logos.local"

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(TEST_PASSWORD),
        is_active=active,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def login(
    client: TestClient,
    email: str,
    password: str = TEST_PASSWORD,
):
    return client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )


def csrf_headers(login_response) -> dict[str, str]:
    return {
        "X-CSRF-Token": login_response.json()["csrf_token"],
    }


def test_login_real_and_protected_endpoint(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista de Integração",
    )

    response = login(auth_client, user.email)

    assert response.status_code == 200

    session_data = response.json()

    assert session_data["email"] == user.email
    assert session_data["csrf_token"]

    # O JWT não deve ser exposto no corpo da resposta.
    assert "access_token" not in session_data

    # O navegador deve receber o cookie de sessão.
    assert "logos_session" in auth_client.cookies

    set_cookie = response.headers["set-cookie"]

    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie

    # O próprio TestClient envia o cookie automaticamente.
    protected = auth_client.get("/incidents")

    assert protected.status_code == 200

    # A sessão também pode ser restaurada por /auth/me.
    restored = auth_client.get("/auth/me")

    assert restored.status_code == 200
    assert restored.json()["email"] == user.email
    assert restored.json()["csrf_token"] == session_data["csrf_token"]

    # Um novo cliente não possui o cookie de autenticação.
    with TestClient(app) as anonymous_client:
        without_cookie = anonymous_client.get("/incidents")

    assert without_cookie.status_code == 401


def test_inactive_user_cannot_login(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista Inativo",
        active=False,
    )

    response = login(auth_client, user.email)

    assert response.status_code == 401
    assert "logos_session" not in auth_client.cookies


def test_invalid_password_returns_401(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista de Teste",
    )

    response = login(
        auth_client,
        user.email,
        password="senha-incorreta",
    )

    assert response.status_code == 401
    assert "logos_session" not in auth_client.cookies


def test_logout_removes_session(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista Logout",
    )

    login_response = login(auth_client, user.email)

    assert login_response.status_code == 200
    assert "logos_session" in auth_client.cookies

    logout_response = auth_client.post(
        "/auth/logout",
        headers=csrf_headers(login_response),
    )

    assert logout_response.status_code == 200
    assert "Max-Age=0" in logout_response.headers["set-cookie"]

    # A sessão não deve mais funcionar.
    restored = auth_client.get("/auth/me")

    assert restored.status_code == 401

    protected = auth_client.get("/incidents")

    assert protected.status_code == 401


def test_logout_without_csrf_returns_403(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista CSRF",
    )

    login_response = login(auth_client, user.email)

    assert login_response.status_code == 200

    logout_response = auth_client.post("/auth/logout")

    assert logout_response.status_code == 403

    # A tentativa rejeitada não encerra a sessão.
    restored = auth_client.get("/auth/me")

    assert restored.status_code == 200


def test_create_incident_without_csrf_returns_403(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista sem CSRF",
    )

    login_response = login(auth_client, user.email)

    assert login_response.status_code == 200

    response = auth_client.post(
        "/incidents",
        json={
            "title": "Falha mecânica na BR-101",
            "description": "Caminhão apresentou falha nos freios.",
            "category": "Problema Mecânico",
            "severity": "Alta",
        },
    )

    assert response.status_code == 403


def test_create_incident_with_invalid_csrf_returns_403(
    auth_client,
    test_db,
):
    user = create_user(
        test_db,
        name="Analista CSRF Inválido",
    )

    login_response = login(auth_client, user.email)

    assert login_response.status_code == 200

    response = auth_client.post(
        "/incidents",
        headers={
            "X-CSRF-Token": "token-csrf-invalido",
        },
        json={
            "title": "Problema no sistema elétrico",
            "description": "Falha identificada durante a operação.",
            "category": "Problema Mecânico",
            "severity": "Média",
        },
    )

    assert response.status_code == 403


def test_two_analysts_preserve_version_and_authorship(
    auth_client,
    test_db,
):
    analyst_a = create_user(
        test_db,
        name="Analista A",
    )

    analyst_b = create_user(
        test_db,
        name="Analista B",
    )

    # Cada analista possui sua própria sessão/cookie.
    client_a = auth_client

    with TestClient(app) as client_b:
        login_a = login(client_a, analyst_a.email)
        login_b = login(client_b, analyst_b.email)

        assert login_a.status_code == 200
        assert login_b.status_code == 200

        headers_a = csrf_headers(login_a)
        headers_b = csrf_headers(login_b)

        # Analista A cria um incidente.
        created = client_a.post(
            "/incidents",
            headers=headers_a,
            json={
                "title": "Falha mecânica na BR-101",
                "description": ("Caminhão apresentou falha no sistema de freios."),
                "category": "Problema Mecânico",
                "severity": "Alta",
            },
        )

        assert created.status_code == 201

        incident = created.json()

        assert incident["updated_by"] == analyst_a.email

        incident_id = incident["id"]
        original_version = incident["version"]

        # Analista B atualiza o incidente.
        updated = client_b.patch(
            f"/incidents/{incident_id}/status",
            headers=headers_b,
            json={
                "status": "Em Investigação",
                "version": original_version,
            },
        )

        assert updated.status_code == 200
        assert updated.json()["updated_by"] == analyst_b.email
        assert updated.json()["version"] == original_version + 1

        # Analista A tenta usar a versão antiga.
        conflict = client_a.patch(
            f"/incidents/{incident_id}/status",
            headers=headers_a,
            json={
                "status": "Fechado",
                "version": original_version,
            },
        )

        assert conflict.status_code == 409

        # A alteração do Analista B permanece salva.
        current = client_a.get(
            f"/incidents/{incident_id}",
        )

        assert current.status_code == 200
        assert current.json()["status"] == "Em Investigação"
        assert current.json()["updated_by"] == analyst_b.email
        assert current.json()["version"] == original_version + 1
