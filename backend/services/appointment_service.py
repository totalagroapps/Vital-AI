"""Appointment booking / listing / cancellation.

Slot validity is delegated to `availability_service.compute_slots`.
"""
from datetime import datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import ScheduledAppointment, AppointmentStatus, Modality, User
from schemas.appointment import AppointmentCreate
from services import availability_service, doctor_service

_ACTIVE_STATUSES = (AppointmentStatus.pending, AppointmentStatus.confirmed)

_EAGER = (
    selectinload(ScheduledAppointment.doctor),
    selectinload(ScheduledAppointment.patient).selectinload(User.patient_profile),
)


class SlotUnavailable(ValueError):
    """Requested time is not an offered / free slot."""


async def create_appointment(
    db: AsyncSession, patient_id: str | UUID, payload: AppointmentCreate
) -> ScheduledAppointment:
    doctor = await doctor_service.get_doctor(db, payload.doctor_id)
    if doctor is None:
        raise ValueError("Médico no encontrado")

    now = datetime.now(timezone.utc)
    if payload.scheduled_at <= now:
        raise SlotUnavailable("El horario pedido ya pasó")

    if not availability_service._modality_matches(doctor.modality, payload.modality):
        raise SlotUnavailable(
            f"El médico no ofrece citas '{payload.modality.value}'"
        )

    local_date = payload.scheduled_at.astimezone(ZoneInfo(doctor.timezone or "Europe/Madrid")).date()
    slots = await availability_service.compute_slots(
        db, doctor, local_date - timedelta(days=1), 3, payload.modality
    )
    if not any(s.start == payload.scheduled_at for s in slots):
        raise SlotUnavailable("Ese horario no está disponible")

    duration = doctor.appointment_duration_minutes or 30
    appointment = ScheduledAppointment(
        patient_id=str(patient_id),
        doctor_id=doctor.id,
        scheduled_at=payload.scheduled_at,
        scheduled_end=payload.scheduled_at + timedelta(minutes=duration),
        duration_minutes=duration,
        modality=payload.modality,
        reason=payload.reason,
        status=AppointmentStatus.pending,
    )
    db.add(appointment)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise SlotUnavailable("Ese hueco acaba de ser reservado")
    return await get_appointment(db, appointment.id)


async def get_appointment(db: AsyncSession, appointment_id: UUID) -> ScheduledAppointment | None:
    return await db.scalar(
        select(ScheduledAppointment)
        .where(ScheduledAppointment.id == appointment_id)
        .options(*_EAGER)
    )


def _apply_when(stmt, when: str | None):
    now = datetime.now(timezone.utc)
    if when == "upcoming":
        return stmt.where(
            ScheduledAppointment.scheduled_at >= now,
            ScheduledAppointment.status.in_(_ACTIVE_STATUSES),
        )
    if when == "past":
        return stmt.where(
            (ScheduledAppointment.scheduled_at < now)
            | (ScheduledAppointment.status.notin_(_ACTIVE_STATUSES))
        ).order_by(None).order_by(ScheduledAppointment.scheduled_at.desc())
    return stmt


async def list_my_appointments(
    db: AsyncSession, patient_id: str | UUID, when: str | None = None
) -> list[ScheduledAppointment]:
    stmt = (
        select(ScheduledAppointment)
        .where(ScheduledAppointment.patient_id == str(patient_id))
        .options(*_EAGER)
        .order_by(ScheduledAppointment.scheduled_at)
    )
    return list(await db.scalars(_apply_when(stmt, when)))


async def list_doctor_appointments(
    db: AsyncSession, doctor_id: UUID, when: str | None = None
) -> list[ScheduledAppointment]:
    """Same as list_my_appointments but filtered by doctor_id instead."""
    stmt = (
        select(ScheduledAppointment)
        .where(ScheduledAppointment.doctor_id == doctor_id)
        .options(*_EAGER)
        .order_by(ScheduledAppointment.scheduled_at)
    )
    return list(await db.scalars(_apply_when(stmt, when)))


async def cancel_appointment(
    db: AsyncSession, appointment: ScheduledAppointment, reason: str | None
) -> ScheduledAppointment:
    if appointment.status not in _ACTIVE_STATUSES:
        raise ValueError(f"La cita ya está '{appointment.status.value}'")
    appointment.status = AppointmentStatus.cancelled
    appointment.cancellation_reason = reason
    await db.commit()
    return await get_appointment(db, appointment.id)
