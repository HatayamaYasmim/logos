from sqlalchemy import case, delete, func, select, update
from sqlalchemy.orm import Session

from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)
from app.models.incident import Incident


class IncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, incident: Incident) -> Incident:
        self.db.add(incident)
        self.db.flush()
        return incident

    def get_by_id(self, incident_id: int) -> Incident | None:
        return self.db.get(Incident, incident_id)

    def _apply_filters(
        self,
        statement,
        severity: IncidentSeverity | None = None,
        category: IncidentCategory | None = None,
        status: IncidentStatus | None = None,
    ):
        if severity is not None:
            statement = statement.where(Incident.severity == severity)

        if category is not None:
            statement = statement.where(Incident.category == category)

        if status is not None:
            statement = statement.where(Incident.status == status)

        return statement

    def list_all(
        self,
        severity: IncidentSeverity | None = None,
        category: IncidentCategory | None = None,
        status: IncidentStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Incident]:

        statement = self._apply_filters(
            select(Incident),
            severity=severity,
            category=category,
            status=status,
        )

        # Ordenacao por criticidade:
        # Alta -> Media -> Baixa.
        priority_order = case(
            (Incident.severity == IncidentSeverity.HIGH, 1),
            (Incident.severity == IncidentSeverity.MEDIUM, 2),
            (Incident.severity == IncidentSeverity.LOW, 3),
            else_=4,
        )

        statement = (
            statement.order_by(
                priority_order,
                Incident.created_at.asc(),
                Incident.id.asc(),
            )
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(statement).all())

    def count(
        self,
        severity: IncidentSeverity | None = None,
        category: IncidentCategory | None = None,
        status: IncidentStatus | None = None,
    ) -> int:

        statement = self._apply_filters(
            select(func.count()).select_from(Incident),
            severity=severity,
            category=category,
            status=status,
        )

        return self.db.execute(statement).scalar_one()

    def get_stats(self) -> dict:

        total = self.db.execute(select(func.count()).select_from(Incident)).scalar_one()

        severity_query = select(
            Incident.severity,
            func.count(Incident.id),
        ).group_by(Incident.severity)

        status_query = select(
            Incident.status,
            func.count(Incident.id),
        ).group_by(Incident.status)

        by_severity = {severity.value: 0 for severity in IncidentSeverity}

        by_status = {status.value: 0 for status in IncidentStatus}

        for severity, count in self.db.execute(severity_query):
            by_severity[severity.value] = count

        for status, count in self.db.execute(status_query):
            by_status[status.value] = count

        return {
            "total": total,
            "by_severity": by_severity,
            "by_status": by_status,
        }

    def update_if_version(
        self,
        incident_id: int,
        expected_version: int,
        values: dict,
    ) -> Incident | None:

        statement = (
            update(Incident)
            .where(
                Incident.id == incident_id,
                Incident.version == expected_version,
            )
            .values(
                **values,
                version=Incident.version + 1,
            )
            .returning(Incident.id)
        )

        updated_id = self.db.execute(statement).scalar_one_or_none()

        if updated_id is None:
            return None

        self.db.expire_all()
        return self.get_by_id(updated_id)

    def delete_if_version(
        self,
        incident_id: int,
        expected_version: int,
    ) -> bool:
        statement = (
            delete(Incident)
            .where(
                Incident.id == incident_id,
                Incident.version == expected_version,
            )
            .returning(Incident.id)
        )

        deleted_id = self.db.execute(statement).scalar_one_or_none()

        return deleted_id is not None
