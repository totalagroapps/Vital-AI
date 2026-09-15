from datetime import date, datetime, time
from typing import Annotated
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator
from models import AvailabilityExceptionKind, Modality

Weekday = Annotated[int, Field(ge=0, le=6)]  # Monday=0 .. Sunday=6


class AvailabilityScheduleCreate(BaseModel):
    weekday: Weekday
    start_time: time
    end_time: time
    modality: Modality
    valid_from: date | None = None
    valid_until: date | None = None

    @model_validator(mode="after")
    def _check_ranges(self):
        if self.start_time >= self.end_time:
            raise ValueError("start_time debe ser anterior a end_time")
        if (
            self.valid_from is not None
            and self.valid_until is not None
            and self.valid_from > self.valid_until
        ):
            raise ValueError("valid_from no puede ser posterior a valid_until")
        return self


class AvailabilityScheduleUpdate(BaseModel):
    weekday: Weekday | None = None
    start_time: time | None = None
    end_time: time | None = None
    modality: Modality | None = None
    valid_from: date | None = None
    valid_until: date | None = None


class AvailabilityScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    weekday: int
    start_time: time
    end_time: time
    modality: Modality
    valid_from: date | None = None
    valid_until: date | None = None


class AvailabilityExceptionCreate(BaseModel):
    start_at: AwareDatetime
    end_at: AwareDatetime
    kind: AvailabilityExceptionKind
    modality: Modality | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def _check(self):
        if self.start_at >= self.end_at:
            raise ValueError("start_at debe ser anterior a end_at")
        if self.kind is AvailabilityExceptionKind.extra and self.modality is None:
            raise ValueError("una excepción 'extra' necesita modality")
        return self


class AvailabilityExceptionUpdate(BaseModel):
    start_at: AwareDatetime | None = None
    end_at: AwareDatetime | None = None
    kind: AvailabilityExceptionKind | None = None
    modality: Modality | None = None
    reason: str | None = None


class AvailabilityExceptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    start_at: datetime
    end_at: datetime
    kind: AvailabilityExceptionKind
    modality: Modality | None = None
    reason: str | None = None


class SlotRead(BaseModel):
    """A bookable slot, in UTC."""

    start: datetime
    end: datetime
    modality: Modality
