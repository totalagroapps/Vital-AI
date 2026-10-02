"""
Controles de salud del paciente: tensión, glucosa y peso.

La valoración usa umbrales generales y frases sencillas ("dentro de lo habitual",
"más alta de lo habitual: coméntalo con tu médico"). No es un diagnóstico: el médico es quien
interpreta. Solo los valores muy fuera de rango avisan a la familia por push.
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models

logger = logging.getLogger(__name__)

KINDS = ('blood_pressure', 'glucose', 'weight')
UNITS = {'blood_pressure': 'mmHg', 'glucose': 'mg/dL', 'weight': 'kg'}
NAMES = {'blood_pressure': 'tensión', 'glucose': 'glucosa', 'weight': 'peso'}

# Rangos posibles (para descartar errores de escritura, no para valorar)
_LIMITS = {
    'blood_pressure': ((50, 260), (25, 160)),
    'glucose': ((20, 600), None),
    'weight': ((20, 300), None),
}

ASSESSMENT_TEXT = {
    'normal': 'Dentro de lo habitual.',
    'high': 'Más alta de lo habitual. Coméntalo con tu médico.',
    'low': 'Más baja de lo habitual. Coméntalo con tu médico.',
    'urgent_high': 'Muy alta. Si te encuentras mal, llama a emergencias.',
    'urgent_low': 'Muy baja. Si te encuentras mal, llama a emergencias.',
}
FAMILY_ALERTED = ' Hemos avisado a tu familia.'


class InvalidReading(ValueError):
    pass


def validate(kind: str, value1: float, value2: Optional[float]) -> Tuple[float, Optional[float]]:
    if kind not in KINDS:
        raise InvalidReading('Tipo de control no válido.')
    (lo1, hi1), second = _LIMITS[kind]
    if not lo1 <= value1 <= hi1:
        raise InvalidReading(f'El valor de {NAMES[kind]} no parece correcto. Revísalo.')
    if kind == 'blood_pressure':
        lo2, hi2 = second
        if value2 is None or not lo2 <= value2 <= hi2:
            raise InvalidReading('Falta la tensión baja (la diastólica) o no parece correcta.')
        if value2 >= value1:
            raise InvalidReading('La tensión alta debe ser mayor que la baja. Revisa los números.')
        return round(value1), round(value2)
    return (round(value1, 1) if kind == 'weight' else round(value1)), None


def assess(kind: str, value1: float, value2: Optional[float]) -> Optional[str]:
    """'normal' | 'high' | 'low' | 'urgent_high' | 'urgent_low', o None (el peso no se valora)."""
    if kind == 'blood_pressure':
        if value1 >= 180 or (value2 or 0) >= 120:
            return 'urgent_high'
        if value1 >= 140 or (value2 or 0) >= 90:
            return 'high'
        if value1 < 90 or (value2 or 999) < 60:
            return 'low'
        return 'normal'
    if kind == 'glucose':
        if value1 >= 300:
            return 'urgent_high'
        if value1 < 54:
            return 'urgent_low'
        if value1 > 180:
            return 'high'
        if value1 < 70:
            return 'low'
        return 'normal'
    return None


def format_value(kind: str, value1: float, value2: Optional[float]) -> str:
    if kind == 'blood_pressure':
        return f'{value1:g}/{value2:g} {UNITS[kind]}'
    return f'{value1:g} {UNITS[kind]}'


def spoken_value(kind: str, value1: float, value2: Optional[float]) -> str:
    if kind == 'blood_pressure':
        return f'tensión {value1:g} sobre {value2:g}'
    if kind == 'glucose':
        return f'glucosa {value1:g}'
    return f'peso {value1:g} kilos'.replace('.', ' coma ')


def serialize(reading: models.HealthReading) -> dict:
    level = assess(reading.kind, reading.value1, reading.value2)
    measured = reading.measured_at
    if measured is not None and measured.tzinfo is None:
        measured = measured.replace(tzinfo=timezone.utc)
    return {
        'id': reading.id,
        'kind': reading.kind,
        'value1': reading.value1,
        'value2': reading.value2,
        'unit': UNITS[reading.kind],
        'display': format_value(reading.kind, reading.value1, reading.value2),
        'level': level,
        'message': ASSESSMENT_TEXT.get(level, 'Anotado.') if level else 'Anotado.',
        'source': reading.source,
        'measured_at': measured.isoformat() if measured else None,
    }


async def add_reading(db: AsyncSession, patient_id: str, kind: str, value1: float, value2: Optional[float],
                      source: str = 'app', created_by: Optional[str] = None, notify=None) -> dict:
    """Valida, guarda y, si el valor es muy alto o muy bajo, avisa a la familia (notify = send_push_notification)."""
    value1, value2 = validate(kind, value1, value2)
    reading = models.HealthReading(patient_id=patient_id, created_by=created_by, kind=kind, value1=value1,
                                   value2=value2, source=source, measured_at=datetime.now(timezone.utc))
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    data = serialize(reading)
    if data['level'] in ('urgent_high', 'urgent_low') and notify is not None:
        # Solo se dice "hemos avisado a tu familia" si de verdad había a quién avisar
        if await _alert_family(db, patient_id, data, notify):
            data['message'] += FAMILY_ALERTED
    return data


async def _alert_family(db: AsyncSession, patient_id: str, data: dict, notify) -> int:
    """Avisa por push a los cuidadores vinculados. Devuelve a cuántos se intentó avisar."""
    caregivers = (await db.execute(
        select(models.CaregiverPatientLink.caregiver_id).where(models.CaregiverPatientLink.patient_id == patient_id)
    )).scalars().all()
    profile = (await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == patient_id))).scalars().first()
    name = (profile.full_name if profile and profile.full_name else '') or 'Tu familiar'
    for caregiver_id in caregivers:
        try:
            await notify(db, caregiver_id, 'Aviso de salud',
                         f"{name} ha anotado {NAMES[data['kind']]} {data['display']}, un valor muy fuera de lo habitual.")
        except Exception:
            logger.exception('No se pudo avisar a un cuidador de un control de salud')
    return len(caregivers)


async def list_readings(db: AsyncSession, patient_id: str, days: int = 30) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=max(1, min(days, 365)))
    rows = (await db.execute(
        select(models.HealthReading)
        .where(models.HealthReading.patient_id == patient_id, models.HealthReading.measured_at >= since)
        .order_by(models.HealthReading.measured_at.desc(), models.HealthReading.id.desc())
    )).scalars().all()
    items = [serialize(r) for r in rows]
    latest = {}
    for item in items:
        latest.setdefault(item['kind'], item)
    return {'latest': latest, 'items': items}


async def delete_reading(db: AsyncSession, patient_id: str, reading_id: int) -> bool:
    reading = (await db.execute(
        select(models.HealthReading)
        .where(models.HealthReading.id == reading_id, models.HealthReading.patient_id == patient_id)
    )).scalars().first()
    if not reading:
        return False
    await db.delete(reading)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Voz: "tengo la tensión 130 85", "la presión 13 8", "glucosa 110", "peso 72 5"
# ---------------------------------------------------------------------------
_BP_RE = re.compile(r'\b(tension|presion)\b')
_GLUCOSE_RE = re.compile(r'\b(glucosa|azucar|glucemia)\b')
_WEIGHT_RE = re.compile(r'\b(peso|pese|kilos|kg)\b')
_NUMBERS_RE = re.compile(r'\d+')


def parse_voice_reading(cmd: str) -> Optional[Tuple[str, List[float]]]:
    """(tipo, números) si la frase habla de un control de salud; números vacío si no dijo valores."""
    numbers = [float(n) for n in _NUMBERS_RE.findall(cmd)]
    if _BP_RE.search(cmd):
        if len(numbers) >= 2:
            high, low = numbers[0], numbers[1]
            # "trece ocho" / "13 8": así se dice a menudo la tensión en centímetros de mercurio
            if high < 30:
                high *= 10
            if low < 20:
                low *= 10
            return 'blood_pressure', [high, low]
        return 'blood_pressure', []
    if _GLUCOSE_RE.search(cmd):
        return 'glucose', numbers[:1]
    if _WEIGHT_RE.search(cmd):
        if not numbers:
            return 'weight', []
        weight = numbers[0]
        # "72 5" (de "72,5") -> 72.5
        if len(numbers) >= 2 and numbers[1] < 10:
            weight += numbers[1] / 10
        return 'weight', [weight]
    return None
