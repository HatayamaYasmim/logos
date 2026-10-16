
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base
from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)


def utc_now():
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    title: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    category: Mapped[IncidentCategory] = mapped_column(
        SQLEnum(IncidentCategory),
        nullable=False,
    )

    severity: Mapped[IncidentSeverity] = mapped_column(
        SQLEnum(IncidentSeverity),
        nullable=False,
    )

    status: Mapped[IncidentStatus] = mapped_column(
        SQLEnum(IncidentStatus),
        default=IncidentStatus.OPEN,
        nullable=False,
    )

    truck_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    location: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    assigned_to: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    updated_by: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    version: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )
