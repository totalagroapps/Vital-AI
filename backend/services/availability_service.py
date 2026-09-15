"""Availability rules CRUD + free-slot computation.

Slot engine and buffer logic for MIVOR doctors.
"""
from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import (
    ScheduledAppointment,
    AvailabilityException,
    AvailabilitySchedule,
    DoctorProfile,
    AppointmentStatus,
    AvailabilityExceptionKind,
    Modality,
)
from schemas.availability import (
    AvailabilityExceptionCreate,
    AvailabilityExceptionUpdate,
    AvailabilityScheduleCreate,
    AvailabilityScheduleUpdate,
    SlotRead,
)

MAX_SLOT_DAYS = 60


# ───────────────────────────── schedules CRUD ─────────────────────────────

async def list_schedules(db: AsyncSession, doctor_id: UUID) -> list[AvailabilitySchedule]:
    rows = await db.scalars(
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.doctor_id == doctor_id)
        .order_by(AvailabilitySchedule.weekday, AvailabilitySchedule.start_time)
    )
    return list(rows)


async def get_schedule(
    db: AsyncSession, doctor_id: UUID, schedule_id: UUID
) -> AvailabilitySchedule | None:
    return await db.scalar(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == schedule_id,
            AvailabilitySchedule.doctor_id == doctor_id,
        )
    )


async def create_schedule(
    db: AsyncSession, doctor_id: UUID, payload: AvailabilityScheduleCreate
) -> AvailabilitySchedule:
    row = AvailabilitySchedule(doctor_id=doctor_id, **payload.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def update_schedule(
    db: AsyncSession, row: AvailabilitySchedule, payload: AvailabilityScheduleUpdate
) -> AvailabilitySchedule:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(row, field, value)
    _validate_schedule_ranges(row)
    await db.commit()
    await db.refresh(row)
    return row


async def delete_schedule(db: AsyncSession, row: AvailabilitySchedule) -> None:
    await db.delete(row)
    await db.commit()


def _validate_schedule_ranges(row: AvailabilitySchedule) -> None:
    if row.start_time >= row.end_time:
        raise ValueError("start_time debe ser anterior a end_time")
    if row.valid_from and row.valid_until and row.valid_from > row.valid_until:
        raise ValueError("valid_from no puede ser posterior a valid_until")


# ──────────────────────────── exceptions CRUD ────────────────────────────

async def list_exceptions(
    db: AsyncSession, doctor_id: UUID
) -> list[AvailabilityException]:
    rows = await db.scalars(
        select(AvailabilityException)
        .where(AvailabilityException.doctor_id == doctor_id)
        .order_by(AvailabilityException.start_at)
    )
    return list(rows)


async def get_exception(
    db: AsyncSession, doctor_id: UUID, exception_id: UUID
) -> AvailabilityException | None:
    return await db.scalar(
        select(AvailabilityException).where(
            AvailabilityException.id == exception_id,
            AvailabilityException.doctor_id == doctor_id,
        )
    )


async def create_exception(
    db: AsyncSession, doctor_id: UUID, payload: AvailabilityExceptionCreate
) -> AvailabilityException:
    row = AvailabilityException(doctor_id=doctor_id, **payload.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def update_exception(
    db: AsyncSession, row: AvailabilityException, payload: AvailabilityExceptionUpdate
) -> AvailabilityException:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(row, field, value)
    if row.start_at >= row.end_at:
        raise ValueError("start_at debe ser anterior a end_at")
    if row.kind is AvailabilityExceptionKind.extra and row.modality is None:
        raise ValueError("una excepción 'extra' necesita modality")
    await db.commit()
    await db.refresh(row)
    return row


async def delete_exception(db: AsyncSession, row: AvailabilityException) -> None:
    await db.delete(row)
    await db.commit()


# ────────────────────────────── slot engine ──────────────────────────────

def _modality_matches(offered: Modality, requested: Modality | None) -> bool:
    if requested is None or requested is Modality.both:
        return True
    return offered is Modality.both or offered is requested


def _report_modality(offered: Modality, requested: Modality | None) -> Modality:
    if offered is Modality.both and requested is not None and requested is not Modality.both:
        return requested
    return offered


def _to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return _to_utc(a_start) < _to_utc(b_end) and _to_utc(b_start) < _to_utc(a_end)


async def compute_slots(
    db: AsyncSession,
    doctor: DoctorProfile,
    from_date: date,
    days: int,
    modality: Modality | None = None,
) -> list[SlotRead]:
    days = max(1, min(days, MAX_SLOT_DAYS))
    tz = ZoneInfo(doctor.timezone or "Europe/Madrid")
    duration = timedelta(minutes=doctor.appointment_duration_minutes or 30)
    buffer = timedelta(minutes=doctor.appointment_buffer_minutes or 0)
    step = duration + buffer
    now = datetime.now(timezone.utc)

    window_start = datetime.combine(from_date, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
    window_end = datetime.combine(
        from_date + timedelta(days=days), datetime.min.time(), tzinfo=tz
    ).astimezone(timezone.utc)

    schedules = await list_schedules(db, doctor.id)
    exceptions = await db.scalars(
        select(AvailabilityException).where(
            AvailabilityException.doctor_id == doctor.id,
            AvailabilityException.end_at > window_start - timedelta(days=1),
            AvailabilityException.start_at < window_end + timedelta(days=1),
        )
    )
    exceptions = list(exceptions)
    appointments = await db.scalars(
        select(ScheduledAppointment).where(
            ScheduledAppointment.doctor_id == doctor.id,
            ScheduledAppointment.status != AppointmentStatus.cancelled,
            ScheduledAppointment.scheduled_at > window_start - timedelta(days=1),
            ScheduledAppointment.scheduled_at < window_end + timedelta(days=1),
        )
    )
    busy: list[tuple[datetime, datetime]] = [
        (_to_utc(a.scheduled_at), _to_utc(a.scheduled_end or (a.scheduled_at + timedelta(minutes=a.duration_minutes))))
        for a in appointments
    ]
    busy += [
        (_to_utc(e.start_at), _to_utc(e.end_at))
        for e in exceptions
        if e.kind is AvailabilityExceptionKind.unavailable
    ]

    candidates: dict[datetime, tuple[datetime, datetime, Modality]] = {}

    def _walk(win_start: datetime, win_end: datetime, offered: Modality) -> None:
        cursor = win_start
        while cursor + duration <= win_end:
            start_utc = cursor.astimezone(timezone.utc)
            if start_utc >= now and start_utc not in candidates:
                candidates[start_utc] = (
                    start_utc,
                    start_utc + duration,
                    _report_modality(offered, modality),
                )
            cursor += step

    for offset in range(days):
        day = from_date + timedelta(days=offset)
        for s in schedules:
            if s.weekday != day.weekday():
                continue
            if s.valid_from and day < s.valid_from:
                continue
            if s.valid_until and day > s.valid_until:
                continue
            if not _modality_matches(s.modality, modality):
                continue
            block_start = datetime.combine(day, s.start_time, tzinfo=tz)
            block_end = datetime.combine(day, s.end_time, tzinfo=tz)
            _walk(block_start, block_end, s.modality)

    for e in exceptions:
        if e.kind is not AvailabilityExceptionKind.extra:
            continue
        if not _modality_matches(e.modality, modality):
            continue
        _walk(_to_utc(e.start_at).astimezone(tz), _to_utc(e.end_at).astimezone(tz), e.modality)

    slots: list[SlotRead] = []
    for start_utc, end_utc, slot_modality in candidates.values():
        padded_start = start_utc - buffer
        padded_end = end_utc + buffer
        if any(_overlaps(padded_start, padded_end, b_start, b_end) for b_start, b_end in busy):
            continue
        slots.append(SlotRead(start=start_utc, end=end_utc, modality=slot_modality))

    slots.sort(key=lambda x: x.start)
    return slots
