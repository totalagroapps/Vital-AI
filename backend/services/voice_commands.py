"""
Órdenes de voz de dispositivos vinculados (kiosko, y en el futuro un reloj).

Reglas fijas, sin IA: "ya me tomé la pastilla / el Betaloc / todas" registra la toma en
Mi salud, "¿qué me toca?" dice lo que falta hoy y "tengo la tensión 130 85", "glucosa 110" o
"peso 72" apuntan un control de salud. Devuelve la frase que el dispositivo lee
en voz alta. Lo que no se entiende vuelve como 'unknown' para que el dispositivo lo trate.
Registrar tomas es adherencia, no diagnóstico: aquí no se interpreta ningún síntoma.
"""
import re
import unicodedata
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models
from services.health_readings import InvalidReading, add_reading, parse_voice_reading, spoken_value
from services.medication_alerts import now_for, parse_times

# "ya me tomé", "me la tomé", "ya tomé", "me he tomado", "ya las tomé"
_TAKEN_RE = re.compile(r"\b(tome|tomado)\b")
_ALL_RE = re.compile(r"\b(todas|todos|todo)\b")
_STATUS_RE = re.compile(
    r"que (me )?(toca|tengo que tomar|debo tomar|me falta)|cuando (me )?toca|"
    r"\b(mis|las|que) (pastillas|medicamentos|medicinas|remedios)\b|me falta (alguna|algo)"
)
# Minutos de antelación con los que una toma ya cuenta como "la de ahora"
_DUE_AHEAD_MINUTES = 60


def normalize(text: str) -> str:
    text = unicodedata.normalize('NFD', (text or '').lower())
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', ' ', text).strip()


def _name_words(name: str) -> List[str]:
    # "Betaloc 100mg" -> ["betaloc"]; se ignoran dosis y palabras cortas
    return [w for w in normalize(name).split() if len(w) >= 4 and not any(ch.isdigit() for ch in w)]


def _label(med: models.MedicationReminder) -> str:
    return f"{med.medication_name} {med.dosage}".strip() if med.dosage and med.dosage not in med.medication_name else med.medication_name


def _first_time(med: models.MedicationReminder):
    times = parse_times(med.time_of_day)
    return times[0] if times else None


def _time_label(med: models.MedicationReminder) -> str:
    t = _first_time(med)
    return f" a las {t[0]}:{t[1]:02d}" if t else ''


def _join(items: List[str]) -> str:
    return items[0] if len(items) == 1 else ', '.join(items[:-1]) + ' y ' + items[-1]


async def handle_voice_command(db: AsyncSession, patient_id: str, text: str, now: Optional[datetime] = None) -> dict:
    now = await now_for(db, patient_id, now)
    cmd = normalize(text)
    today = now.strftime('%Y-%m-%d')

    meds = (await db.execute(
        select(models.MedicationReminder)
        .where(models.MedicationReminder.user_id == patient_id, models.MedicationReminder.is_active == True)  # noqa: E712
        .order_by(models.MedicationReminder.id)
    )).scalars().all()
    taken_ids = set((await db.execute(
        select(models.MedicationLog.medication_id)
        .where(models.MedicationLog.user_id == patient_id, models.MedicationLog.taken_date == today)
    )).scalars().all())
    pending = [m for m in meds if m.id not in taken_ids]

    # Controles de salud. "Me tomé la pastilla de la tensión" (sin números) sigue siendo una toma.
    reading = parse_voice_reading(cmd)
    if reading:
        kind, numbers = reading
        enough = len(numbers) >= (2 if kind == 'blood_pressure' else 1)
        if enough:
            from services.push_service import send_push_notification
            try:
                data = await add_reading(db, patient_id, kind, numbers[0], numbers[1] if kind == 'blood_pressure' else None,
                                         source='voice', notify=send_push_notification)
            except InvalidReading as exc:
                return _reply('reading_ask', f'{exc} Dímelo otra vez, por ejemplo: tengo la tensión 130 85.')
            return _reply('reading_saved', f"Anotado: {spoken_value(kind, data['value1'], data['value2'])}. {data['message']}")
        if not _TAKEN_RE.search(cmd) and 'pastilla' not in cmd:
            example = {'blood_pressure': 'tengo la tensión 130 85', 'glucose': 'tengo la glucosa en 110',
                       'weight': 'peso 72 kilos'}[kind]
            return _reply('reading_ask', f'Dime los números, por ejemplo: {example}.')

    if _TAKEN_RE.search(cmd):
        if not meds:
            return _reply('medication_taken', 'Todavía no tienes medicamentos en Mi salud. Pídele a tu cuidador que los añada.')
        if not pending:
            return _reply('medication_taken', 'Ya tenías registradas todas las tomas de hoy. ¡Muy bien!')

        named = [m for m in pending if any(re.search(rf'\b{w}\b', cmd) for w in _name_words(m.medication_name))]
        if named:
            chosen = named
        elif _ALL_RE.search(cmd):
            chosen = _due(pending, now) or pending
        else:
            due = _due(pending, now)
            candidates = due or [m for m in pending if _first_time(m) is None] or pending
            if len(candidates) == 1:
                chosen = candidates
            else:
                names = _join([m.medication_name for m in candidates])
                return _reply('medication_ask',
                              f'¿Cuál te has tomado? Te faltan {names}. Dime por ejemplo: '
                              f'me tomé el {candidates[0].medication_name}, o me tomé todas.',
                              pending=[_label(m) for m in candidates])

        time_str = now.strftime('%H:%M')
        for med in chosen:
            db.add(models.MedicationLog(user_id=patient_id, medication_id=med.id, taken_date=today, taken_time=time_str))
        await db.commit()
        rest = [m for m in pending if m not in chosen]
        speech = f'Anotado: {_join([_label(m) for m in chosen])}.'
        speech += f' Te falta {_join([m.medication_name + _time_label(m) for m in rest])}.' if rest else ' Ya no te falta ninguna toma hoy.'
        return _reply('medication_taken', speech, logged=[_label(m) for m in chosen], pending=[_label(m) for m in rest])

    if _STATUS_RE.search(cmd):
        if not meds:
            return _reply('medication_status', 'Todavía no tienes medicamentos en Mi salud.')
        if not pending:
            return _reply('medication_status', 'Ya te has tomado todo lo de hoy. ¡Muy bien!')
        items = [_label(m) + _time_label(m) for m in sorted(pending, key=lambda m: _first_time(m) or (99, 0))]
        return _reply('medication_status', f'Hoy te falta tomar: {_join(items)}.', pending=[_label(m) for m in pending])

    return _reply('unknown', '')


def _due(pending: List[models.MedicationReminder], now: datetime) -> List[models.MedicationReminder]:
    """Tomas cuya hora ya pasó o llega dentro de _DUE_AHEAD_MINUTES."""
    limit = now.hour * 60 + now.minute + _DUE_AHEAD_MINUTES
    return [m for m in pending if (t := _first_time(m)) is not None and t[0] * 60 + t[1] <= limit]


def _reply(intent: str, speech: str, logged: Optional[List[str]] = None, pending: Optional[List[str]] = None) -> dict:
    return {'intent': intent, 'speech': speech, 'logged': logged or [], 'pending': pending or []}
