from datetime import datetime
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict

from models import AppointmentStatus, Modality


class DoctorMini(BaseModel):
    """Doctor summary embedded in an appointment (for the 'my appointments' list)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None


class PatientMini(BaseModel):
    """Patient summary embedded in an appointment (for the doctor's agenda)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID | str
    username: str | None = None
    full_name: str | None = None


class AppointmentCreate(BaseModel):
    doctor_id: UUID
    scheduled_at: AwareDatetime
    modality: Modality
    reason: str | None = None


class AppointmentCancel(BaseModel):
    cancellation_reason: str | None = None


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doctor_id: UUID
    patient_id: UUID | str
    scheduled_at: datetime
    scheduled_end: datetime
    duration_minutes: int
    modality: Modality
    status: AppointmentStatus
    reason: str | None = None
    cancellation_reason: str | None = None
    payment_token: str | None = None
    created_at: datetime | None = None
    doctor: DoctorMini | None = None
    patient: PatientMini | None = None
