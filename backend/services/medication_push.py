"""
Avisos push de tomas de medicación olvidadas (se ejecuta cada minuto desde main.py).

Cuando una toma lleva ALERT_GRACE_MINUTES sin registrarse:
  · el paciente recibe un recordatorio en sus dispositivos, y
  · cada cuidador vinculado (CaregiverPatientLink) recibe el aviso en los suyos.
"""
import logging
from datetime import datetime
from typing import Awaitable, Callable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models
from services.medication_alerts import ALERT_GRACE_MINUTES, pending_medications

logger = logging.getLogger(__name__)

SendFn = Callable[[AsyncSession, str, str, str], Awaitable[None]]


def _med_label(med: dict) -> str:
    return f"{med['medication_name']} ({med['dosage']})" if med.get('dosage') else med['medication_name']


async def notify_overdue_medications(db: AsyncSession, send: SendFn, now: Optional[datetime] = None) -> int:
    """Envía los avisos del minuto actual. Devuelve cuántos push se han intentado enviar."""
    sent = 0
    profiles = (await db.execute(select(models.PatientProfile))).scalars().all()
    for profile in profiles:
        try:
            pending = await pending_medications(db, profile.user_id, now=now)
            # Solo en el minuto exacto en que se cumple el margen, para no repetir el aviso
            due = [m for m in pending if m['minutes_late'] == ALERT_GRACE_MINUTES]
            if not due:
                continue
            caregivers = (await db.execute(
                select(models.CaregiverPatientLink.caregiver_id)
                .where(models.CaregiverPatientLink.patient_id == profile.user_id)
            )).scalars().all()
            name = profile.full_name or 'Tu familiar'
            for med in due:
                label = _med_label(med)
                await send(db, profile.user_id, 'Recordatorio de medicación',
                           f"¿Has tomado {label}? Estaba prevista a las {med['scheduled_time']}. Márcala en Mi salud.")
                sent += 1
                for caregiver_id in caregivers:
                    await send(db, caregiver_id, 'Aviso de medicación',
                               f"{name} no ha registrado la toma de {label} de las {med['scheduled_time']}.")
                    sent += 1
        except Exception:
            # Un paciente con datos raros no debe impedir los avisos del resto
            logger.exception(f'Error enviando avisos de medicación para {profile.user_id}')
    return sent
