
from uuid import uuid4

import pytest

from app.api.dependencies.auth import get_current_user
from app.core.security import hash_password
from app.main import app
from app.models.user import User

TEST_PASSWORD = "SenhaDeTesteSegura123!"


@pytest.fixture
def auth_client(client):
    """
    Reutiliza o TestClient e o banco de testes,
    mas remove a simulação de usuário autenticado.
    """
    original_override = app.dependency_overrides.pop(
        get_current_user,
        None,
    )

    try:
        yield client
    finally:
        if original_override is not None:
            app.dependency_overrides[get_current_user] = (
                original_override
            )


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


def login(client, email: str, password: str = TEST_PASSWORD):
    return client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )


def authorization_header(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
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

    token_data = response.json()

    assert token_data["token_type"] == "bearer"
    assert token_data["access_token"]

    headers = authorization_header(
        token_data["access_token"]
    )

    protected = auth_client.get(
        "/incidents",
        headers=headers,
    )

    assert protected.status_code == 200

    without_token = auth_client.get("/incidents")

    assert without_token.status_code == 401


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

    login_a = login(auth_client, analyst_a.email)
    login_b = login(auth_client, analyst_b.email)

    assert login_a.status_code == 200
    assert login_b.status_code == 200

    headers_a = authorization_header(
        login_a.json()["access_token"]
    )
    headers_b = authorization_header(
        login_b.json()["access_token"]
    )

    # Analista A cria um incidente.
    created = auth_client.post(
        "/incidents",
        headers=headers_a,
        json={
            "title": "Falha mecânica na BR-101",
            "description": (
                "Caminhão apresentou falha "
                "no sistema de freios."
            ),
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
    updated = auth_client.patch(
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

    # Analista A tenta alterar usando a versão antiga.
    conflict = auth_client.patch(
        f"/incidents/{incident_id}/status",
        headers=headers_a,
        json={
            "status": "Fechado",
            "version": original_version,
        },
    )

    assert conflict.status_code == 409

    # A alteração feita pelo Analista B permanece salva.
    current = auth_client.get(
        f"/incidents/{incident_id}",
        headers=headers_a,
    )

    assert current.status_code == 200
    assert current.json()["status"] == "Em Investigação"
    assert current.json()["updated_by"] == analyst_b.email
    assert current.json()["version"] == original_version + 1
