
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.database.session import get_db
from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)
from app.models.user import User
from app.schemas.incident import (
    IncidentCreate,
    IncidentPage,
    IncidentResponse,
    IncidentStats,
    IncidentStatusUpdate,
    IncidentUpdate,
)
from app.services.incident_service import IncidentService

router = APIRouter(
    prefix="/incidents",
    tags=["Incidentes"],
    dependencies=[Depends(get_current_user)],
)


def get_service(
    db: Session = Depends(get_db),
) -> IncidentService:
    return IncidentService(db)


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    data: IncidentCreate,
    service: IncidentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    return service.create(
        data,
        updated_by=current_user.email,
    )


@router.get(
    "",
    response_model=IncidentPage,
)
def list_incidents(
    severity: IncidentSeverity | None = None,
    category: IncidentCategory | None = None,
    incident_status: IncidentStatus | None = Query(
        default=None,
        alias="status",
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    service: IncidentService = Depends(get_service),
):
    return service.list_all(
        severity=severity,
        category=category,
        status=incident_status,
        skip=skip,
        limit=limit,
    )


# Rotas estáticas antes das rotas dinâmicas.
@router.get(
    "/stats",
    response_model=IncidentStats,
)
def get_incident_stats(
    service: IncidentService = Depends(get_service),
):
    return service.get_stats()


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: int,
    service: IncidentService = Depends(get_service),
):
    return service.get_by_id(incident_id)


@router.patch(
    "/{incident_id}/status",
    response_model=IncidentResponse,
)
def update_incident_status(
    incident_id: int,
    data: IncidentStatusUpdate,
    service: IncidentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    return service.update_status(
        incident_id,
        data,
        updated_by=current_user.email,
    )


@router.patch(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    service: IncidentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    return service.update(
        incident_id,
        data,
        updated_by=current_user.email,
    )



@router.delete(
    "/{incident_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_incident(
    incident_id: int,
    version: int = Query(ge=1),
    service: IncidentService = Depends(get_service),
):
    service.delete(
        incident_id=incident_id,
        version=version,
    )
