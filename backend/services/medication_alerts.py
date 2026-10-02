"""
Avisos de medicación para cuidadores (Modo Cuidador).

Una toma está «pendiente» cuando pasó su hora programada más un margen de gracia y el paciente
todavía no la registró hoy. Se calcula al vuelo (sin tareas programadas) cada vez que el cuidador
consulta sus avisos.
"""
import os
import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models

# Zona horaria en la que se interpretan los horarios y se fechan las tomas.
# El servidor corre en UTC: sin esto, desde las 19:00 en Colombia las tomas se registraban en el día siguiente.
APP_TIMEZONE = os.getenv("APP_TIMEZONE", "America/Bogota")

# Minutos de margen tras la hora programada antes de avisar al cuidador.
ALERT_GRACE_MINUTES = int(os.getenv("MEDICATION_ALERT_GRACE_MINUTES", "60"))

# «08:00», «8:30», «8.30», «8 am», «8:00 p.m.». Un número suelto («cada 8 horas») no cuenta como hora.
_TIME_RE = re.compile(r"(?<!\d)(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?(?![\d])", re.IGNORECASE)


def app_tz() -> ZoneInfo:
    try:
        return ZoneInfo(APP_TIMEZONE)
    except Exception:
        return ZoneInfo("America/Bogota")


def now_local() -> datetime:
    return datetime.now(app_tz())


def zone_or_default(name: Optional[str]) -> ZoneInfo:
    """Zona IANA válida ("Europe/Madrid") o la de la app si falta o no existe."""
    if name:
        try:
            return ZoneInfo(name)
        except Exception:
            pass
    return app_tz()


def is_valid_zone(name: Optional[str]) -> bool:
    if not name or len(name) > 64:
        return False
    try:
        ZoneInfo(name)
        return True
    except Exception:
        return False


async def patient_tz(db: AsyncSession, patient_id: str) -> ZoneInfo:
    """Zona horaria del paciente (la de su móvil o la que fijó el cuidador); por defecto la de la app."""
    name = (await db.execute(
        select(models.PatientProfile.timezone).where(models.PatientProfile.user_id == patient_id)
    )).scalars().first()
    return zone_or_default(name)


async def now_for(db: AsyncSession, patient_id: str, now: Optional[datetime] = None) -> datetime:
    """La hora "de reloj" del paciente: la toma de las 08:00 es a las 08:00 donde él vive."""
    # now_local() es el único reloj (los tests lo congelan); se pasa a la zona del paciente
    base = now or now_local()
    if base.tzinfo is None:
        base = base.replace(tzinfo=app_tz())
    return base.astimezone(await patient_tz(db, patient_id))


def parse_times(time_of_day: Optional[str]) -> List[Tuple[int, int]]:
    """Horas (h, m) que aparecen en el texto libre del horario, ordenadas."""
    times = set()
    for hour_s, minute_s, meridiem in _TIME_RE.findall(time_of_day or ""):
        if not minute_s and not meridiem:
            continue
        hour, minute = int(hour_s), int(minute_s or 0)
        if meridiem:
            if not 1 <= hour <= 12:
                continue
            is_pm = meridiem.lower().startswith("p")
            hour = (hour % 12) + (12 if is_pm else 0)
        if hour > 23 or minute > 59:
            continue
        times.add((hour, minute))
    return sorted(times)


async def pending_medications(db: AsyncSession, patient_id: str, now: Optional[datetime] = None) -> List[dict]:
    """
    Tomas vencidas y sin registrar hoy para un paciente.
    Solo se registra una toma por medicamento y día, así que se usa la primera hora del horario.
    """
    now = await now_for(db, patient_id, now)
    today = now.strftime("%Y-%m-%d")

    reminders = (await db.execute(
        select(models.MedicationReminder).where(
            models.MedicationReminder.user_id == patient_id,
            models.MedicationReminder.is_active == True,  # noqa: E712
        )
    )).scalars().all()
    if not reminders:
        return []

    taken_ids = set((await db.execute(
        select(models.MedicationLog.medication_id).where(
            models.MedicationLog.user_id == patient_id,
            models.MedicationLog.taken_date == today,
        )
    )).scalars().all())

    pending = []
    for med in reminders:
        if med.id in taken_ids:
            continue
        times = parse_times(med.time_of_day)
        if not times:
            continue
        hour, minute = times[0]
        scheduled = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if now < scheduled + timedelta(minutes=ALERT_GRACE_MINUTES):
            continue
        # Un medicamento dado de alta hoy después de su hora no cuenta como olvido.
        created = med.created_at
        if created is not None:
            if created.tzinfo is None:
                created = created.replace(tzinfo=ZoneInfo("UTC"))
            if created.astimezone(now.tzinfo) > scheduled:
                continue
        pending.append({
            "medication_id": med.id,
            "medication_name": med.medication_name,
            "dosage": med.dosage,
            "scheduled_time": f"{hour:02d}:{minute:02d}",
            "minutes_late": int((now - scheduled).total_seconds() // 60),
        })
    pending.sort(key=lambda p: p["scheduled_time"])
    return pending
