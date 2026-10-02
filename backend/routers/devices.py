"""
Dispositivos vinculados al paciente (kiosko Android; en el futuro, un reloj).

1. Desde la web, el paciente o su cuidador genera un código de 6 cifras (caduca en 10 minutos).
2. El kiosko lo canjea en /api/devices/pair y recibe su propia llave, sin usar contraseñas.
3. Con esa llave (cabecera X-Device-Token) el dispositivo solo puede usar /api/device/*.
   Desde la web se puede desvincular en cualquier momento.
"""
import hashlib
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

import models
from database import get_db
from security import get_authenticated_user_id, get_current_user_id
from services.medication_alerts import now_local, parse_times
from services.device_today import device_today, set_taken
from services.health_readings import InvalidReading, add_reading, list_readings
from services.push_service import send_push_notification
from services.voice_commands import handle_voice_command

router = APIRouter(tags=["Dispositivos vinculados"])

PAIRING_CODE_TTL = timedelta(minutes=10)
_PAIR_WINDOW_SECONDS = 60
_PAIR_MAX_ATTEMPTS = 10
_pair_attempts = defaultdict(list)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def _apply_pair_rate_limit(client_ip: str):
    # Un código tiene 6 cifras: se limita el número de intentos por IP para que no se pueda adivinar
    now = time.time()
    _pair_attempts[client_ip] = [t for t in _pair_attempts[client_ip] if now - t < _PAIR_WINDOW_SECONDS]
    if len(_pair_attempts[client_ip]) >= _PAIR_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail='Demasiados intentos. Espera un minuto.',
                            headers={'Retry-After': str(_PAIR_WINDOW_SECONDS)})
    _pair_attempts[client_ip].append(now)


async def _patient_name(db: AsyncSession, patient_id: str) -> str:
    profile = (await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == patient_id))).scalars().first()
    if profile and profile.full_name:
        return profile.full_name
    user = (await db.execute(select(models.User).where(models.User.id == patient_id))).scalars().first()
    return user.username if user else ''


# ---------------------------------------------------------------------------
# Web: generar código, listar y desvincular (paciente o cuidador con el perfil del familiar)
# ---------------------------------------------------------------------------

@router.post('/api/devices/pairing-code')
async def create_pairing_code(
    db: AsyncSession = Depends(get_db),
    patient_id: str = Depends(get_current_user_id),
    requester_id: str = Depends(get_authenticated_user_id),
):
    # Un código nuevo invalida los anteriores sin usar de este paciente
    await db.execute(update(models.DevicePairingCode)
                     .where(models.DevicePairingCode.patient_id == patient_id, models.DevicePairingCode.used == False)  # noqa: E712
                     .values(used=True))
    code = f'{secrets.randbelow(1_000_000):06d}'
    db.add(models.DevicePairingCode(
        code_hash=_hash(code), patient_id=patient_id, created_by=requester_id,
        expires_at=datetime.now(timezone.utc) + PAIRING_CODE_TTL,
    ))
    await db.commit()
    return {'code': code, 'expires_in': int(PAIRING_CODE_TTL.total_seconds())}


@router.get('/api/devices')
async def list_devices(db: AsyncSession = Depends(get_db), patient_id: str = Depends(get_current_user_id)):
    links = (await db.execute(
        select(models.DeviceLink)
        .where(models.DeviceLink.patient_id == patient_id, models.DeviceLink.revoked == False)  # noqa: E712
        .order_by(models.DeviceLink.created_at.desc())
    )).scalars().all()
    return [{
        'id': link.id,
        'device_name': link.device_name,
        'created_at': link.created_at.isoformat() if link.created_at else None,
        'last_seen_at': link.last_seen_at.isoformat() if link.last_seen_at else None,
    } for link in links]


@router.delete('/api/devices/{device_id}')
async def revoke_device(device_id: int, db: AsyncSession = Depends(get_db), patient_id: str = Depends(get_current_user_id)):
    link = (await db.execute(
        select(models.DeviceLink).where(models.DeviceLink.id == device_id, models.DeviceLink.patient_id == patient_id)
    )).scalars().first()
    if not link or link.revoked:
        raise HTTPException(status_code=404, detail='Dispositivo no encontrado.')
    link.revoked = True
    await db.commit()
    return {'status': 'revoked', 'id': device_id}


# ---------------------------------------------------------------------------
# Dispositivo: canjear el código y usar la llave
# ---------------------------------------------------------------------------

class PairRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)
    device_name: str = Field(default='Kiosko MIVOR', max_length=80)


async def redeem_pairing_code(db: AsyncSession, raw_code: str, device_name: str, token: str) -> Optional[models.DeviceLink]:
    """
    Canjea un código de vinculación y crea el dispositivo con la llave indicada (se guarda su hash).
    Devuelve None si el código no existe, ya se usó o caducó. Lo usan el kiosko y la skill de Alexa.
    """
    code = (await db.execute(
        select(models.DevicePairingCode).where(models.DevicePairingCode.code_hash == _hash(raw_code.strip()))
    )).scalars().first()
    expires_at = code.expires_at if code else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not code or code.used or expires_at < datetime.now(timezone.utc):
        return None

    code.used = True
    link = models.DeviceLink(
        patient_id=code.patient_id, created_by=code.created_by,
        device_name=device_name.strip() or 'Kiosko MIVOR', token_hash=_hash(token),
    )
    db.add(link)
    await db.commit()
    return link


@router.post('/api/devices/pair')
async def pair_device(payload: PairRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _apply_pair_rate_limit(request.client.host if request.client else 'unknown')
    token = secrets.token_urlsafe(32)
    link = await redeem_pairing_code(db, payload.code, payload.device_name, token)
    if not link:
        raise HTTPException(status_code=400, detail='Código incorrecto o caducado. Genera uno nuevo en MIVOR.')
    return {'device_token': token, 'patient_name': await _patient_name(db, link.patient_id)}


async def get_device_link(
    x_device_token: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> models.DeviceLink:
    if not x_device_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Falta la llave del dispositivo.')
    link = (await db.execute(
        select(models.DeviceLink).where(models.DeviceLink.token_hash == _hash(x_device_token))
    )).scalars().first()
    if not link or link.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Dispositivo no vinculado o desvinculado.')
    link.last_seen_at = datetime.now(timezone.utc)
    await db.commit()
    return link


@router.get('/api/device/me')
async def device_me(link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    return {'patient_name': await _patient_name(db, link.patient_id), 'device_name': link.device_name}


@router.get('/api/device/medications')
async def device_medications(link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    today = now_local().strftime('%Y-%m-%d')
    meds = (await db.execute(
        select(models.MedicationReminder)
        .where(models.MedicationReminder.user_id == link.patient_id, models.MedicationReminder.is_active == True)  # noqa: E712
        .order_by(models.MedicationReminder.id)
    )).scalars().all()
    taken = set((await db.execute(
        select(models.MedicationLog.medication_id)
        .where(models.MedicationLog.user_id == link.patient_id, models.MedicationLog.taken_date == today)
    )).scalars().all())
    out = []
    for m in meds:
        times = parse_times(m.time_of_day)
        out.append({
            'id': m.id, 'name': m.medication_name, 'dosage': m.dosage, 'frequency': m.frequency,
            'time': f'{times[0][0]:02d}:{times[0][1]:02d}' if times else None, 'taken_today': m.id in taken,
        })
    return out


@router.get('/api/device/today')
async def device_today_summary(link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    """Pantalla de inicio del kiosko: toma de ahora, siguiente, lista de hoy y próximas citas."""
    return await device_today(db, link.patient_id, await _patient_name(db, link.patient_id))


async def _set_taken(db: AsyncSession, link: models.DeviceLink, medication_id: int, taken: bool) -> dict:
    if not await set_taken(db, link.patient_id, medication_id, taken):
        raise HTTPException(status_code=404, detail='Medicamento no encontrado.')
    return await device_today(db, link.patient_id, await _patient_name(db, link.patient_id))


@router.post('/api/device/medications/{medication_id}/taken')
async def device_mark_taken(medication_id: int, link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    return await _set_taken(db, link, medication_id, True)


@router.delete('/api/device/medications/{medication_id}/taken')
async def device_unmark_taken(medication_id: int, link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    # "Me he equivocado, deshacer"
    return await _set_taken(db, link, medication_id, False)


class DeviceReading(BaseModel):
    kind: Literal['blood_pressure', 'glucose', 'weight']
    value1: float
    value2: Optional[float] = None


@router.get('/api/device/readings')
async def device_readings(link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    return await list_readings(db, link.patient_id, 30)


@router.post('/api/device/readings')
async def device_add_reading(payload: DeviceReading, link: models.DeviceLink = Depends(get_device_link),
                             db: AsyncSession = Depends(get_db)):
    try:
        return await add_reading(db, link.patient_id, payload.kind, payload.value1, payload.value2,
                                 source='kiosk', notify=send_push_notification)
    except InvalidReading as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


@router.post('/api/device/voice')
async def device_voice(payload: VoiceRequest, link: models.DeviceLink = Depends(get_device_link), db: AsyncSession = Depends(get_db)):
    return await handle_voice_command(db, link.patient_id, payload.text)
