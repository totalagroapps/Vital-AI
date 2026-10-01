"""
Resumen del día para la pantalla de inicio del kiosko: la toma que toca ahora, la siguiente,
la lista de hoy y las próximas citas. Mismas reglas que las órdenes de voz: una toma por
medicamento y día, con la primera hora del horario.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
from services.active_medications import format_reminder
from services.medication_alerts import now_local, parse_times

# Minutos de antelación con los que una toma ya se muestra como "Ahora te toca" (igual que la voz)
DUE_AHEAD_MINUTES = 60
APPOINTMENT_DAYS_AHEAD = 30
MAX_APPOINTMENTS = 5


def _first_time(med: models.MedicationReminder):
    times = parse_times(med.time_of_day)
    return times[0] if times else None


def _minutes(t) -> int:
    return t[0] * 60 + t[1]


async def active_medications(db: AsyncSession, patient_id: str) -> List[models.MedicationReminder]:
    return (await db.execute(
        select(models.MedicationReminder)
        .where(models.MedicationReminder.user_id == patient_id, models.MedicationReminder.is_active == True)  # noqa: E712
        .order_by(models.MedicationReminder.id)
    )).scalars().all()


async def device_today(db: AsyncSession, patient_id: str, patient_name: str, now: Optional[datetime] = None) -> dict:
    now = now or now_local()
    today = now.strftime('%Y-%m-%d')
    meds = await active_medications(db, patient_id)
    logs = (await db.execute(
        select(models.MedicationLog)
        .where(models.MedicationLog.user_id == patient_id, models.MedicationLog.taken_date == today)
    )).scalars().all()
    taken_at = {log.medication_id: log.taken_time for log in logs}

    items = []
    for med in meds:
        t = _first_time(med)
        items.append({
            'id': med.id,
            'name': med.medication_name,
            'label': format_reminder(med.medication_name, med.dosage),
            'detail': (med.frequency or '').strip(),
            'time': f'{t[0]:02d}:{t[1]:02d}' if t else None,
            'taken': med.id in taken_at,
            'taken_time': taken_at.get(med.id),
            '_minutes': _minutes(t) if t else None,
        })
    items.sort(key=lambda m: (m['_minutes'] is None, m['_minutes'] or 0))

    limit = now.hour * 60 + now.minute + DUE_AHEAD_MINUTES
    pending = [m for m in items if not m['taken']]
    due = next((m for m in pending if m['_minutes'] is not None and m['_minutes'] <= limit), None)
    upcoming = next((m for m in pending if m is not due and m['_minutes'] is not None), None)
    for m in items:
        m.pop('_minutes')

    return {
        'patient_name': patient_name,
        'first_name': (patient_name or '').split(' ')[0],
        'server_time': now.strftime('%H:%M'),
        'has_meds': bool(items),
        'all_done': bool(items) and not pending,
        'due': due,
        'next': upcoming,
        'meds': items,
        'appointments': await upcoming_appointments(db, patient_id),
    }


async def upcoming_appointments(db: AsyncSession, patient_id: str) -> List[dict]:
    now = datetime.now(timezone.utc)
    rows = (await db.execute(
        select(models.ScheduledAppointment)
        .options(selectinload(models.ScheduledAppointment.doctor))
        .where(
            models.ScheduledAppointment.patient_id == str(patient_id),
            models.ScheduledAppointment.scheduled_at >= now,
            models.ScheduledAppointment.scheduled_at <= now + timedelta(days=APPOINTMENT_DAYS_AHEAD),
            models.ScheduledAppointment.status.in_([models.AppointmentStatus.pending, models.AppointmentStatus.confirmed]),
        )
        .order_by(models.ScheduledAppointment.scheduled_at)
        .limit(MAX_APPOINTMENTS)
    )).scalars().all()
    out = []
    for a in rows:
        starts = a.scheduled_at if a.scheduled_at.tzinfo else a.scheduled_at.replace(tzinfo=timezone.utc)
        out.append({
            'id': str(a.id),
            'starts_at': starts.isoformat(),
            'starts_ms': int(starts.timestamp() * 1000),
            'doctor': (a.doctor.full_name if a.doctor else '') or '',
            'video': a.modality == models.Modality.video,
            'reason': a.reason or '',
        })
    return out


async def set_taken(db: AsyncSession, patient_id: str, medication_id: int, taken: bool, now: Optional[datetime] = None) -> bool:
    """Marca o desmarca la toma de hoy. False si el medicamento no es de este paciente."""
    now = now or now_local()
    today = now.strftime('%Y-%m-%d')
    med = (await db.execute(
        select(models.MedicationReminder)
        .where(models.MedicationReminder.id == medication_id, models.MedicationReminder.user_id == patient_id)
    )).scalars().first()
    if not med:
        return False
    logs = (await db.execute(
        select(models.MedicationLog)
        .where(models.MedicationLog.user_id == patient_id, models.MedicationLog.medication_id == medication_id,
               models.MedicationLog.taken_date == today)
    )).scalars().all()
    if taken and not logs:
        db.add(models.MedicationLog(user_id=patient_id, medication_id=medication_id, taken_date=today,
                                    taken_time=now.strftime('%H:%M')))
    elif not taken:
        for log in logs:
            await db.delete(log)
    await db.commit()
    return True
