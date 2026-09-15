import re
from datetime import datetime
from typing import Annotated
from uuid import UUID
from zoneinfo import ZoneInfo

from pydantic import (
    AfterValidator, BaseModel, ConfigDict, Field, model_validator,
)

from models import Modality
from schemas.availability import AvailabilityScheduleRead
from schemas.insurance_company import InsuranceCompanyRead
from schemas.language import LanguageRead
from schemas.specialty import SpecialtyRead


def _valid_iana_timezone(v: str) -> str:
    try:
        ZoneInfo(v)
    except Exception:
        raise ValueError(f"'{v}' is not a valid IANA timezone")
    return v


_HTTP_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def _valid_http_url(v: str) -> str:
    if not _HTTP_URL_RE.match(v):
        raise ValueError("debe ser una URL http:// o https://")
    return v


TimezoneStr = Annotated[str, AfterValidator(_valid_iana_timezone)]
DurationMinutes = Annotated[int, Field(ge=15, le=480)]
BufferMinutes = Annotated[int, Field(ge=0, le=240)]
HttpUrlStr = Annotated[str, AfterValidator(_valid_http_url)]


class DoctorSearchFilters(BaseModel):
    """All fields optional, combined with AND (specialty_ids combine with OR)."""

    specialty_ids: list[int] | None = None
    language_id: int | None = None
    insurance_company_id: int | None = None
    name: str | None = None
    modality: Modality | None = None
    lat: float | None = None
    lng: float | None = None
    radius_km: float | None = None

    @model_validator(mode="after")
    def _geo_todo_o_nada(self):
        geo = (self.lat, self.lng, self.radius_km)
        if any(v is not None for v in geo) and any(v is None for v in geo):
            raise ValueError(
                "Para buscar por distancia hacen falta lat, lng y radius_km juntos"
            )
        if self.radius_km is not None and self.radius_km <= 0:
            raise ValueError("radius_km debe ser mayor que 0")
        return self


class DoctorCard(BaseModel):
    """Reduced view for search results."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    rating: float | None = None
    modality: Modality | None = None
    specialties: list[SpecialtyRead] = Field(default_factory=list)
    languages: list[LanguageRead] = Field(default_factory=list)
    next_available_at: datetime | None = None
    distance_km: float | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    insurance_companies: list[InsuranceCompanyRead] = Field(default_factory=list)


class DoctorDetail(DoctorCard):
    """Full profile (GET /api/doctors/{id})."""

    user_id: UUID | str
    timezone: str | None = None
    appointment_duration_minutes: int | None = None
    appointment_buffer_minutes: int | None = None
    clinic_name: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    years_experience: int | None = None
    education: str | None = None
    availability_schedules: list[AvailabilityScheduleRead] = Field(default_factory=list)


class DoctorSearchPage(BaseModel):
    items: list[DoctorCard]
    total: int
    limit: int
    offset: int


class DoctorProfileCreate(BaseModel):
    """POST /api/doctors/me."""

    full_name: str
    modality: Modality
    specialty_ids: list[int] = Field(min_length=1)
    language_ids: list[int] = Field(min_length=1)
    insurance_companies: list[str] = Field(default_factory=list)  # names, not ids
    address: str | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    timezone: TimezoneStr = "Europe/Madrid"
    appointment_duration_minutes: DurationMinutes = 30
    appointment_buffer_minutes: BufferMinutes = 0
    avatar_url: HttpUrlStr | None = None
    clinic_name: str | None = None
    phone: str | None = None
    email: str | None = None
    website: HttpUrlStr | None = None
    years_experience: int | None = None
    education: str | None = None

    @model_validator(mode="after")
    def _presencial_needs_location(self):
        if self.modality in (Modality.in_person, Modality.both):
            faltan = [
                nombre
                for nombre, valor in (
                    ("address", self.address), ("lat", self.lat), ("lng", self.lng)
                )
                if valor is None
            ]
            if faltan:
                raise ValueError(
                    f"Un médico '{self.modality.value}' necesita {', '.join(faltan)}"
                )
        return self


class DoctorProfileUpdate(BaseModel):
    """PATCH /api/doctors/me. All fields optional; only what's provided is applied."""

    full_name: str | None = None
    modality: Modality | None = None
    specialty_ids: list[int] | None = None
    language_ids: list[int] | None = None
    insurance_companies: list[str] | None = None
    address: str | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    timezone: TimezoneStr | None = None
    appointment_duration_minutes: DurationMinutes | None = None
    appointment_buffer_minutes: BufferMinutes | None = None
    avatar_url: HttpUrlStr | None = None
    clinic_name: str | None = None
    phone: str | None = None
    email: str | None = None
    website: HttpUrlStr | None = None
    years_experience: int | None = None
    education: str | None = None

    @model_validator(mode="after")
    def _listas_no_vacias(self):
        for nombre in ("specialty_ids", "language_ids"):
            valor = getattr(self, nombre)
            if valor is not None and len(valor) == 0:
                raise ValueError(f"'{nombre}' no puede quedar vacío")
        return self
