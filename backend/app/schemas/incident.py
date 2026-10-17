from datetime import datetime
from math import ceil
from typing import Self

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)


class IncidentWriteSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class IncidentCreate(IncidentWriteSchema):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=2000)
    category: IncidentCategory
    severity: IncidentSeverity
    truck_id: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)


class IncidentUpdate(IncidentWriteSchema):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=150,
    )
    description: str | None = Field(
        default=None,
        min_length=5,
        max_length=2000,
    )
    category: IncidentCategory | None = None
    severity: IncidentSeverity | None = None
    truck_id: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    version: int = Field(ge=1)


class IncidentStatusUpdate(IncidentWriteSchema):
    status: IncidentStatus
    version: int = Field(ge=1)


class IncidentResponse(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: IncidentStatus
    assigned_to: str | None = None
    updated_by: str | None = None
    version: int
    created_at: datetime
    updated_at: datetime


class IncidentPage(BaseModel):
    items: list[IncidentResponse]
    total: int = Field(ge=0)
    skip: int = Field(ge=0)
    limit: int = Field(ge=1)
    total_pages: int = Field(ge=0)

    @classmethod
    def create(
        cls,
        items: list[IncidentResponse],
        total: int,
        skip: int,
        limit: int,
    ) -> Self:
        return cls(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            total_pages=ceil(total / limit),
        )


class IncidentStats(BaseModel):
    total: int
    by_severity: dict[str, int]
    by_status: dict[str, int]
