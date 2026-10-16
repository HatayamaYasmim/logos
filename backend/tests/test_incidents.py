from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def incident_payload(
    title="Falha mecânica na BR-101",
    severity="Alta",
    category="Problema Mecânico",
):
    return {
        "title": title,
        "description": "Caminhão apresentou falha durante a rota.",
        "category": category,
        "severity": severity,
        "truck_id": "CAM-1042",
        "location": "BR-101, RJ",
    }


def create_incident(client, **kwargs):
    response = client.post(
        "/incidents",
        json=incident_payload(**kwargs),
    )
    assert response.status_code == 201
    return response.json()


def test_create_incident(client):
    response = client.post(
        "/incidents",
        json=incident_payload(),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] > 0
    assert data["severity"] == "Alta"
    assert data["status"] == "Aberto"
    assert data["version"] == 1


def test_create_incident_invalid(client):
    payload = incident_payload()
    payload["severity"] = "Urgente"

    response = client.post("/incidents", json=payload)

    assert response.status_code == 422


def test_get_incident(client):
    incident = create_incident(client)

    response = client.get(f"/incidents/{incident['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == incident["id"]


def test_incident_not_found(client):
    response = client.get("/incidents/999999")

    assert response.status_code == 404


def test_pagination(client):
    for index in range(5):
        create_incident(
            client,
            title=f"Incidente de teste {index}",
        )

    response = client.get(
        "/incidents",
        params={"skip": 0, "limit": 2},
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["total_pages"] == 3
    assert data["skip"] == 0
    assert data["limit"] == 2


def test_severity_filter_and_priority(client):
    create_incident(
        client,
        title="Baixa prioridade",
        severity="Baixa",
    )
    create_incident(
        client,
        title="Alta prioridade",
        severity="Alta",
    )
    create_incident(
        client,
        title="Média prioridade",
        severity="Média",
    )

    response = client.get("/incidents")
    assert response.status_code == 200

    severities = [item["severity"] for item in response.json()["items"]]

    assert severities == ["Alta", "Média", "Baixa"]

    filtered = client.get(
        "/incidents",
        params={"severity": "Alta"},
    )

    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["items"][0]["severity"] == "Alta"


def test_combined_filters(client):
    create_incident(client, severity="Alta")
    create_incident(
        client,
        severity="Alta",
        category="Bloqueio de Pista",
    )
    create_incident(client, severity="Baixa")

    response = client.get(
        "/incidents",
        params={
            "severity": "Alta",
            "category": "Problema Mecânico",
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_stats(client):
    create_incident(client, severity="Alta")
    create_incident(client, severity="Alta")
    create_incident(client, severity="Baixa")

    response = client.get("/incidents/stats")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 3
    assert data["by_severity"]["Alta"] == 2
    assert data["by_severity"]["Média"] == 0
    assert data["by_severity"]["Baixa"] == 1
    assert data["by_status"]["Aberto"] == 3


def test_update_status(client):
    incident = create_incident(client)

    response = client.patch(
        f"/incidents/{incident['id']}/status",
        json={
            "status": "Em Investigação",
            "version": 1,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Em Investigação"
    assert data["version"] == 2


def test_version_conflict(client):
    incident = create_incident(client)
    url = f"/incidents/{incident['id']}/status"

    # Primeiro analista utiliza a versão 1.
    first = client.patch(
        url,
        json={
            "status": "Em Investigação",
            "version": 1,
        },
    )

    assert first.status_code == 200

    # Segundo analista tenta utilizar a versão antiga.
    second = client.patch(
        url,
        json={
            "status": "Fechado",
            "version": 1,
        },
    )

    assert second.status_code == 409

    # Confirma que a segunda alteração não sobrescreveu a primeira.
    current = client.get(f"/incidents/{incident['id']}")

    assert current.status_code == 200
    assert current.json()["status"] == "Em Investigação"
    assert current.json()["version"] == 2


def test_update_incident(client):
    incident = create_incident(client)

    response = client.patch(
        f"/incidents/{incident['id']}",
        json={
            "title": "Falha mecânica resolvida parcialmente",
            "version": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["version"] == 2
    assert response.json()["title"] == ("Falha mecânica resolvida parcialmente")


def test_delete_incident(client):
    incident = create_incident(client)

    response = client.delete(f"/incidents/{incident['id']}")

    assert response.status_code == 204

    get_response = client.get(f"/incidents/{incident['id']}")

    assert get_response.status_code == 404


def test_concurrent_status_updates(client):
    """Duas requisições simultâneas não podem sobrescrever o incidente."""

    incident = create_incident(client)
    incident_id = incident["id"]
    url = f"/incidents/{incident_id}/status"

    # A barreira sincroniza o início das duas requisições.
    barrier = Barrier(2, timeout=10)

    def update_status(new_status: str):
        barrier.wait()

        return client.patch(
            url,
            json={
                "status": new_status,
                "version": 1,
            },
        )

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_a = executor.submit(
            update_status,
            "Em Investigação",
        )

        future_b = executor.submit(
            update_status,
            "Fechado",
        )

        response_a = future_a.result(timeout=15)
        response_b = future_b.result(timeout=15)

    # A ordem das respostas não é garantida.
    status_codes = sorted(
        [
            response_a.status_code,
            response_b.status_code,
        ]
    )

    assert status_codes == [200, 409]

    # Confirma que a versão foi incrementada apenas uma vez.
    current = client.get(f"/incidents/{incident_id}")

    assert current.status_code == 200
    assert current.json()["version"] == 2

    successful_response = next(
        response for response in (response_a, response_b) if response.status_code == 200
    )

    # O banco preserva a alteração vencedora.
    assert current.json()["status"] == successful_response.json()["status"]


def test_create_incident_records_authenticated_user(client):
    payload = {
        "title": "Falha mecânica na rodovia",
        "description": "Veículo apresentou falha no sistema de freios.",
        "category": "Problema Mecânico",
        "severity": "Alta",
        "truck_id": "TRK-001",
        "location": "BR-101",
    }

    response = client.post("/incidents", json=payload)

    assert response.status_code == 201

    incident = response.json()

    assert incident["updated_by"] == "teste@logos.local"
    assert incident["version"] == 1



def test_update_status_records_authenticated_user(client):
    payload = {
        "title": "Bloqueio parcial da rodovia",
        "description": "Uma faixa está bloqueada após um acidente.",
        "category": "Bloqueio de Pista",
        "severity": "Alta",
    }

    created = client.post("/incidents", json=payload)

    assert created.status_code == 201

    incident = created.json()

    response = client.patch(
        f"/incidents/{incident['id']}/status",
        json={
            "status": "Em Investigação",
            "version": incident["version"],
        },
    )

    assert response.status_code == 200

    updated = response.json()

    assert updated["updated_by"] == "teste@logos.local"
    assert updated["status"] == "Em Investigação"
    assert updated["version"] == incident["version"] + 1

    # Tentativa com a versão antiga.
    conflict = client.patch(
        f"/incidents/{incident['id']}/status",
        json={
            "status": "Fechado",
            "version": incident["version"],
        },
    )

    assert conflict.status_code == 409

    # Confirma que a tentativa rejeitada não sobrescreveu os dados.
    current = client.get(f"/incidents/{incident['id']}")

    assert current.status_code == 200
    assert current.json()["status"] == "Em Investigação"
    assert current.json()["updated_by"] == "teste@logos.local"
    assert current.json()["version"] == updated["version"]
