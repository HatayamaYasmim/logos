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

    def create(
        self,
        data: IncidentCreate,
        updated_by: str,
    ) -> Incident:
        values = data.model_dump(
            exclude={"updated_by"},
        )

        incident = Incident(
            **values,
            updated_by=updated_by,
        )

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
        # Verifica se o incidente existe.
        # A integridade é garantida pelo UPDATE atômico
        # executado pelo repository.
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

                # Verifica novamente se o incidente foi excluído.
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
        updated_by: str,
    ) -> Incident:
        values = data.model_dump(
            exclude_unset=True,
            exclude={
                "version",
                "status",
                "updated_by",
            },
        )

        # Campos obrigatórios não podem ser anulados.
        for field in (
            "title",
            "description",
            "category",
            "severity",
        ):
            if field in values and values[field] is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"O campo '{field}' não pode ser nulo.",
                )

        # A autoria vem do usuário autenticado via JWT.
        values["updated_by"] = updated_by

        return self._update_with_version(
            incident_id,
            data.version,
            values,
        )

    def update_status(
        self,
        incident_id: int,
        data: IncidentStatusUpdate,
        updated_by: str,
    ) -> Incident:
        return self._update_with_version(
            incident_id,
            data.version,
            {
                "status": data.status,
                "updated_by": updated_by,
            },
        )

    def delete(
        self,
        incident_id: int,
        version: int,
    ) -> None:
        # Confirma que o incidente existe.
        self.get_by_id(incident_id)

        try:
            deleted = self.repository.delete_if_version(
                incident_id=incident_id,
                expected_version=version,
            )

            if not deleted:
                self.db.rollback()

                # Se não existe mais, retorna 404.
                self.get_by_id(incident_id)

                # Se existe, a versão mudou.
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Este incidente foi alterado por outro "
                        "analista. Atualize os dados antes de excluir."
                    ),
                )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise
