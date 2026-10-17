import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy.orm import Session

from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)
from app.schemas.incident import IncidentResponse
from app.services.incident_service import IncidentService


class ListIncidentsArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    severity: IncidentSeverity | None = None
    category: IncidentCategory | None = None
    status: IncidentStatus | None = None
    limit: int = Field(default=10, ge=1, le=20)


class GetIncidentArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    incident_id: int = Field(gt=0)


class EmptyArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")


TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "list_incidents",
            "description": (
                "Lista incidentes reais cadastrados no Logos. "
                "Permite filtrar por gravidade, categoria e status. "
                "Os resultados são ordenados por prioridade."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "severity": {
                        "type": "string",
                        "enum": [item.value for item in IncidentSeverity],
                        "description": "Gravidade do incidente.",
                    },
                    "category": {
                        "type": "string",
                        "enum": [item.value for item in IncidentCategory],
                        "description": "Categoria do incidente.",
                    },
                    "status": {
                        "type": "string",
                        "enum": [item.value for item in IncidentStatus],
                        "description": "Status atual do incidente.",
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,
                        "description": "Máximo de 20 incidentes.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_incident",
            "description": (
                "Consulta os detalhes de um incidente pelo ID. "
                "Utilize quando o analista mencionar um incidente específico."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "incident_id": {
                        "type": "integer",
                        "minimum": 1,
                        "description": "ID do incidente.",
                    },
                },
                "required": ["incident_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_incident_stats",
            "description": (
                "Consulta indicadores reais do Logos: total de incidentes, "
                "quantidades por gravidade e quantidades por status."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        },
    },
]


def _serialize_incident(incident: Any) -> dict[str, Any]:
    return IncidentResponse.model_validate(incident).model_dump(mode="json")


def execute_tool(
    name: str,
    arguments: str,
    db: Session,
) -> dict[str, Any]:
    """
    Executa exclusivamente ferramentas autorizadas.

    O modelo não recebe acesso à sessão do banco;
    somente o backend executa as consultas.
    """
    try:
        raw_args = json.loads(arguments or "{}")

        if not isinstance(raw_args, dict):
            return {"error": "Os argumentos devem ser um objeto JSON."}

        service = IncidentService(db)

        if name == "list_incidents":
            args = ListIncidentsArgs.model_validate(raw_args)

            page = service.list_all(
                severity=args.severity,
                category=args.category,
                status=args.status,
                limit=args.limit,
                skip=0,
            )

            return {
                "total": page.total,
                "returned": len(page.items),
                "limit": args.limit,
                "items": [_serialize_incident(incident) for incident in page.items],
            }

        if name == "get_incident":
            args = GetIncidentArgs.model_validate(raw_args)

            incident = service.get_by_id(args.incident_id)

            return {
                "incident": _serialize_incident(incident),
            }

        if name == "get_incident_stats":
            EmptyArgs.model_validate(raw_args)

            stats = service.get_stats()

            return stats.model_dump(mode="json")

        return {
            "error": "Ferramenta não autorizada.",
        }

    except json.JSONDecodeError:
        return {
            "error": "Argumentos JSON inválidos.",
        }

    except ValidationError:
        return {
            "error": "Parâmetros inválidos para a ferramenta.",
        }

    except Exception as exc:
        # Erros de consulta não devem expor detalhes
        # internos do servidor ao modelo.
        from fastapi import HTTPException

        if isinstance(exc, HTTPException) and exc.status_code == 404:
            return {"error": "Incidente não encontrado."}

        raise
