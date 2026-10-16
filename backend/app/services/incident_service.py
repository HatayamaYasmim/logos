from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)
from app.models.incident import Incident
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import (
    IncidentCreate,
    IncidentPage,
    IncidentStats,
    IncidentStatusUpdate,
    IncidentUpdate,
)


class IncidentService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = IncidentRepository(db)

    def create(self, data: IncidentCreate) -> Incident:
        incident = Incident(**data.model_dump())

        try:
            self.repository.create(incident)
            self.db.commit()
            self.db.refresh(incident)
            return incident
        except Exception:
            self.db.rollback()
            raise

    def get_by_id(self, incident_id: int) -> Incident:
        incident = self.repository.get_by_id(incident_id)

        if incident is None:
            raise HTTPException(
                status_code=404,
                detail="Incidente não encontrado.",
            )

        return incident

    def list_all(
        self,
        severity: IncidentSeverity | None = None,
        category: IncidentCategory | None = None,
        status: IncidentStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> IncidentPage:

        incidents = self.repository.list_all(
            severity=severity,
            category=category,
            status=status,
            skip=skip,
            limit=limit,
        )

        total = self.repository.count(
            severity=severity,
            category=category,
            status=status,
        )

        return IncidentPage.create(
            items=incidents,
            total=total,
            skip=skip,
            limit=limit,
        )

    def get_stats(self) -> IncidentStats:
        data = self.repository.get_stats()
        return IncidentStats(**data)

    def _update_with_version(
        self,
        incident_id: int,
        version: int,
        values: dict,
    ) -> Incident:
        # Verificação para distinguir 404 de 409.
        # A integridade é garantida pelo UPDATE atômico.
        self.get_by_id(incident_id)

        try:
            incident = self.repository.update_if_version(
                incident_id=incident_id,
                expected_version=version,
                values={
                    **values,
                    "updated_at": datetime.now(UTC),
                },
            )

            if incident is None:
                self.db.rollback()

                # O incidente pode ter sido excluído.
                self.get_by_id(incident_id)

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Este incidente foi alterado por outro "
                        "analista. Atualize os dados e tente novamente."
                    ),
                )

            self.db.commit()
            self.db.refresh(incident)
            return incident

        except Exception:
            self.db.rollback()
            raise

    def update(
        self,
        incident_id: int,
        data: IncidentUpdate,
    ) -> Incident:
        values = data.model_dump(
            exclude_unset=True,
            exclude={"version", "status"},
        )

        # Campos obrigatórios não podem ser anulados.
        for field in ("title", "description", "category", "severity"):
            if field in values and values[field] is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"O campo '{field}' não pode ser nulo.",
                )

        return self._update_with_version(
            incident_id,
            data.version,
            values,
        )

    def update_status(
        self,
        incident_id: int,
        data: IncidentStatusUpdate,
    ) -> Incident:
        return self._update_with_version(
            incident_id,
            data.version,
            {"status": data.status},
        )

    def delete(self, incident_id: int) -> None:
        self.get_by_id(incident_id)

        try:
            deleted = self.repository.delete(incident_id)

            if not deleted:
                self.db.rollback()
                raise HTTPException(
                    status_code=404,
                    detail="Incidente não encontrado.",
                )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise
