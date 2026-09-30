"""
Fuente única de la medicación activa de un paciente.

Hay dos orígenes: los recordatorios de "Mi salud" (MedicationReminder activos) y el campo
de texto libre de la ficha (PatientProfile.current_medications). El pasaporte, el QR de
urgencias y la ficha del médico deben mostrar siempre la unión de ambos, para que un
paramédico nunca vea "Ninguna" cuando el paciente tiene tratamientos pautados.
"""
import re
from typing import Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models

# Valores de relleno que se han ido guardando en el campo de texto y no son fármacos
_PLACEHOLDERS = {
    'ninguna', 'ninguno', 'ninguna registrada', 'no registrada', 'no registradas',
    'sin medicación', 'sin medicacion', 'sin medicación base', 'none', 'n/a', 'n/d', '-', '--',
}


def _norm(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip().lower())


def format_reminder(name: Optional[str], dosage: Optional[str]) -> str:
    name = (name or '').strip()
    dosage = (dosage or '').strip()
    if dosage and _norm(dosage) not in _norm(name):
        return f"{name} {dosage}"
    return name


def merge_medications(profile_text: Optional[str], reminders: Iterable) -> List[str]:
    """Recordatorios activos primero; después las entradas manuales que no los repitan."""
    merged: List[str] = []
    seen_names: List[str] = []
    for r in reminders:
        label = format_reminder(r.medication_name, r.dosage)
        if not label:
            continue
        merged.append(label)
        seen_names.append(_norm(r.medication_name))

    for raw in (profile_text or '').split(','):
        entry = raw.strip()
        key = _norm(entry)
        if not key or key in _PLACEHOLDERS:
            continue
        # "Betaloc" o "Betaloc 100 mg" en la ficha ya está cubierto por el recordatorio "Betaloc"
        if any(key == n or key.startswith(n + ' ') or n.startswith(key + ' ') for n in seen_names if n):
            continue
        if key in (_norm(m) for m in merged):
            continue
        merged.append(entry)
    return merged


async def get_active_medications(db: AsyncSession, user_id: str, profile_text: Optional[str]) -> List[str]:
    res = await db.execute(
        select(models.MedicationReminder)
        .where(
            models.MedicationReminder.user_id == user_id,
            models.MedicationReminder.is_active == True,  # noqa: E712
        )
        .order_by(models.MedicationReminder.id)
    )
    return merge_medications(profile_text, res.scalars().all())
