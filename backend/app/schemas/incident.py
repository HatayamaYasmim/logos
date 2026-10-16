
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import (
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
)


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=2000)
    category: IncidentCategory
    severity: IncidentSeverity
    truck_id: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)


class IncidentResponse(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: IncidentStatus
    assigned_to: str | None = None
    updated_by: str | None = None
    version: int
    created_at: datetime
    updated_at: datetime


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    version: int = Field(ge=1)
