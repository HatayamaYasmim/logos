
import os
from datetime import UTC, datetime, timedelta

from sqlalchemy import inspect, select
from sqlalchemy.engine import make_url

from app.core.security import hash_password
from app.database.session import DATABASE_URL, SessionLocal, engine
from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)
from app.models.incident import Incident
from app.models.user import User

DEMO_PASSWORD = "123456789012"

DEMO_USERS = [
    {
        "name": "Analista Demonstração",
        "email": "demo@logos.local",
    },
    {
        "name": "Analista Operacional",
        "email": "analista@logos.local",
    },
]

DEMO_INCIDENTS = [
    {
        "title": "Falha no sistema de freios",
        "description": "Motorista identificou perda de eficiência nos freios durante a rota.",
        "category": IncidentCategory.MECHANICAL,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.OPEN,
        "truck_id": "DEMO-001",
        "location": "BR-101, Rio de Janeiro - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 1,
    },
    {
        "title": "Bloqueio total após queda de carga",
        "description": "Carga espalhada na rodovia impede a circulação de veículos.",
        "category": IncidentCategory.ROAD_BLOCK,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.INVESTIGATING,
        "truck_id": "DEMO-002",
        "location": "BR-116, São Paulo - SP",
        "assigned_to": "Analista Operacional",
        "days_ago": 2,
    },
    {
        "title": "Colisão entre caminhão e veículo",
        "description": "Colisão lateral durante manobra em trecho de pista simples.",
        "category": IncidentCategory.VEHICLE_ACCIDENT,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.INVESTIGATING,
        "truck_id": "DEMO-003",
        "location": "BR-040, Petrópolis - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 3,
    },
    {
        "title": "Acidente com vítima na rodovia",
        "description": "Equipe de emergência acionada após acidente envolvendo veículo de carga.",
        "category": IncidentCategory.VICTIM_ACCIDENT,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.CLOSED,
        "truck_id": "DEMO-004",
        "location": "BR-381, Belo Horizonte - MG",
        "assigned_to": "Analista Operacional",
        "days_ago": 6,
    },
    {
        "title": "Chuva intensa reduz visibilidade",
        "description": "Precipitação intensa dificulta o tráfego e aumenta o risco operacional.",
        "category": IncidentCategory.WEATHER,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.OPEN,
        "truck_id": "DEMO-005",
        "location": "BR-101, Niterói - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 1,
    },
    {
        "title": "Superaquecimento do motor",
        "description": "Temperatura do motor acima do limite durante transporte de mercadorias.",
        "category": IncidentCategory.MECHANICAL,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.INVESTIGATING,
        "truck_id": "DEMO-006",
        "location": "BR-153, Goiânia - GO",
        "assigned_to": "Analista Operacional",
        "days_ago": 4,
    },
    {
        "title": "Interdição parcial para manutenção",
        "description": "Uma faixa foi interditada para execução de reparos emergenciais.",
        "category": IncidentCategory.ROAD_BLOCK,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.CLOSED,
        "truck_id": "DEMO-007",
        "location": "BR-262, Vitória - ES",
        "assigned_to": "Analista Demonstração",
        "days_ago": 8,
    },
    {
        "title": "Colisão leve durante manobra",
        "description": "Veículo de carga sofreu danos superficiais em área de apoio.",
        "category": IncidentCategory.VEHICLE_ACCIDENT,
        "severity": IncidentSeverity.LOW,
        "status": IncidentStatus.CLOSED,
        "truck_id": "DEMO-008",
        "location": "Campinas - SP",
        "assigned_to": "Analista Operacional",
        "days_ago": 9,
    },
    {
        "title": "Neblina em trecho de serra",
        "description": "Visibilidade reduzida durante a madrugada em trecho sinuoso.",
        "category": IncidentCategory.WEATHER,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.INVESTIGATING,
        "truck_id": "DEMO-009",
        "location": "Serra de Petrópolis - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 2,
    },
    {
        "title": "Falha no sistema de iluminação",
        "description": "Faróis apresentaram funcionamento intermitente durante inspeção.",
        "category": IncidentCategory.MECHANICAL,
        "severity": IncidentSeverity.LOW,
        "status": IncidentStatus.OPEN,
        "truck_id": "DEMO-010",
        "location": "Duque de Caxias - RJ",
        "assigned_to": "Analista Operacional",
        "days_ago": 3,
    },
    {
        "title": "Pista bloqueada por deslizamento",
        "description": "Deslizamento de terra interrompeu o tráfego em trecho de serra.",
        "category": IncidentCategory.ROAD_BLOCK,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.OPEN,
        "truck_id": "DEMO-011",
        "location": "BR-116, Teresópolis - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 1,
    },
    {
        "title": "Ocorrência sem confirmação de vítimas",
        "description": "Informações recebidas não permitiram confirmar o relato inicial.",
        "category": IncidentCategory.VICTIM_ACCIDENT,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.INCONCLUSIVE,
        "truck_id": "DEMO-012",
        "location": "BR-101, Campos dos Goytacazes - RJ",
        "assigned_to": "Analista Operacional",
        "days_ago": 12,
    },
    {
        "title": "Ventos fortes durante transporte",
        "description": "Rajadas de vento exigiram interrupção temporária do deslocamento.",
        "category": IncidentCategory.WEATHER,
        "severity": IncidentSeverity.LOW,
        "status": IncidentStatus.CLOSED,
        "truck_id": "DEMO-013",
        "location": "BR-101, Macaé - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 7,
    },
    {
        "title": "Pane elétrica no veículo",
        "description": "Falha elétrica impediu a partida do caminhão após parada programada.",
        "category": IncidentCategory.MECHANICAL,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.CLOSED,
        "truck_id": "DEMO-014",
        "location": "Volta Redonda - RJ",
        "assigned_to": "Analista Operacional",
        "days_ago": 10,
    },
    {
        "title": "Acidente durante operação de descarga",
        "description": "Ocorrência envolvendo veículo em área de operação logística.",
        "category": IncidentCategory.VEHICLE_ACCIDENT,
        "severity": IncidentSeverity.LOW,
        "status": IncidentStatus.INCONCLUSIVE,
        "truck_id": "DEMO-015",
        "location": "Porto do Rio de Janeiro - RJ",
        "assigned_to": "Analista Demonstração",
        "days_ago": 14,
    },
]



def validate_environment():
    if os.getenv("DEMO_SEED_ENABLED", "").lower() != "true":
        raise RuntimeError(
            "Seed bloqueado. Configure DEMO_SEED_ENABLED=true "
            "somente no ambiente de demonstração."
        )

    database_url = make_url(DATABASE_URL)
    database_name = database_url.database
    expected_database = os.getenv("DEMO_DATABASE_NAME", "").strip()

    if not expected_database:
        raise RuntimeError(
            "Seed bloqueado. Configure DEMO_DATABASE_NAME "
            "com o nome exato do banco de demonstração."
        )

    if database_name != expected_database:
        raise RuntimeError(
            "Seed bloqueado: DATABASE_URL não corresponde "
            "ao banco definido em DEMO_DATABASE_NAME."
        )

    if database_name == "logos_test":
        raise RuntimeError(
            "Seed bloqueado: não é permitido popular logos_test."
        )

    if not {"users", "incidents"}.issubset(
        set(inspect(engine).get_table_names())
    ):
        raise RuntimeError(
            "Tabelas não encontradas. Execute as migrations antes do seed."
        )


def seed_users(db):
    users_created = 0

    for user_data in DEMO_USERS:
        existing = db.scalar(
            select(User).where(User.email == user_data["email"])
        )

        if existing is not None:
            continue

        db.add(
            User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=hash_password(DEMO_PASSWORD),
                is_active=True,
            )
        )
        users_created += 1

    db.flush()
    return users_created


def seed_incidents(db):
    incidents_created = 0
    now = datetime.now(UTC)

    for index, data in enumerate(DEMO_INCIDENTS):
        existing = db.scalar(
            select(Incident).where(
                Incident.truck_id == data["truck_id"]
            )
        )

        if existing is not None:
            continue

        author = DEMO_USERS[index % len(DEMO_USERS)]["email"]
        created_at = now - timedelta(days=data["days_ago"])

        db.add(
            Incident(
                title=data["title"],
                description=data["description"],
                category=data["category"],
                severity=data["severity"],
                status=data["status"],
                truck_id=data["truck_id"],
                location=data["location"],
                assigned_to=data["assigned_to"],
                updated_by=author,
                version=1,
                created_at=created_at,
                updated_at=created_at,
            )
        )
        incidents_created += 1

    return incidents_created


def main():
    validate_environment()

    with SessionLocal.begin() as db:
        users_created = seed_users(db)
        incidents_created = seed_incidents(db)

    print("\nSeed de demonstração concluído!")
    print(f"Usuários criados: {users_created}")
    print(f"Incidentes criados: {incidents_created}")
    print("\nCredenciais de demonstração:")
    print("E-mail: demo@logos.local")
    print("E-mail alternativo: analista@logos.local")
    print(f"Senha para ambas as contas: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
