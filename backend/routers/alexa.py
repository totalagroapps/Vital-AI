"""
Skill de Alexa "Asistente MIVOR" (endpoint HTTPS propio, sin AWS Lambda).

- Seguridad (requisito de Amazon): cada petición se verifica con la firma Signature-256 y la
  cadena de certificados de Amazon, se rechaza si tiene más de 150 s, y solo se acepta la
  skill cuyo ID está en ALEXA_SKILL_ID.
- Vinculación: igual que el kiosko. En MIVOR (Más > Kiosko MIVOR) se genera un código de 6
  cifras y se le dice a Alexa. La cuenta de Amazon queda como un dispositivo vinculado más
  (se ve y se desvincula desde la web). La identidad es el userId que Alexa da por skill.
- Órdenes: tomas de medicación y "qué me toca" (services/voice_commands.py, las mismas reglas
  que el kiosko) y "me he caído / necesito ayuda", que avisa a los cuidadores por push.
  Alexa no puede llamar a emergencias: la respuesta siempre dice el número local.
"""
import json
import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models
from database import get_db
from routers.devices import _hash, _patient_name, redeem_pairing_code
from services.push_service import send_push_notification
from services.voice_commands import handle_voice_command

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Alexa"])

DEVICE_NAME = 'Alexa (Echo)'
# El número depende del país del Echo (locale de la petición)
EMERGENCY_BY_LOCALE = {'es-ES': '112', 'es-MX': '911', 'es-US': '911'}
_PAIR_ATTEMPTS_LIMIT = 5

HELP_TEXT = ('Puedes decirme: ya me tomé la pastilla, me tomé el Betaloc, me tomé todas, '
             'qué me toca, o me he caído.')
LINK_TEXT = ('Para empezar tengo que conectarme con tu cuenta de MIVOR. En la web o app de MIVOR, '
             'entra en Más, Kiosko MIVOR, y pulsa Generar código. Después dime: mi código es, '
             'y los seis números.')


def _verify_request(headers: dict, body: str) -> None:
    """Firma y marca de tiempo con los verificadores oficiales de Amazon. Lanza si no son válidas."""
    from ask_sdk_core.serialize import DefaultSerializer
    from ask_sdk_model import RequestEnvelope
    from ask_sdk_webservice_support.verifier import RequestVerifier, TimestampVerifier

    envelope = DefaultSerializer().deserialize(body, RequestEnvelope)
    for verifier in (RequestVerifier(), TimestampVerifier()):
        verifier.verify(headers=headers, serialized_request_env=body, deserialized_request_env=envelope)


def _speak(text: str, end: bool = False, reprompt: Optional[str] = None) -> dict:
    response = {'outputSpeech': {'type': 'PlainText', 'text': text}, 'shouldEndSession': end}
    if reprompt and not end:
        response['reprompt'] = {'outputSpeech': {'type': 'PlainText', 'text': reprompt}}
    return {'version': '1.0', 'response': response}


def _slot(request: dict, name: str) -> Optional[str]:
    value = ((request.get('intent') or {}).get('slots') or {}).get(name, {}).get('value')
    return value.strip() if isinstance(value, str) and value.strip() else None


def _emergency_number(locale: str) -> str:
    return EMERGENCY_BY_LOCALE.get(locale, '112')


@router.post('/api/alexa')
async def alexa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = (await request.body()).decode('utf-8')
    try:
        _verify_request(dict(request.headers), body)
    except Exception as exc:  # firma, certificado o marca de tiempo no válidos
        logger.warning(f'Petición de Alexa rechazada: {exc}')
        raise HTTPException(status_code=400, detail='Petición no verificada.')

    envelope = json.loads(body)
    skill_id = os.getenv('ALEXA_SKILL_ID', '').strip()
    application_id = ((envelope.get('context') or {}).get('System') or {}).get('application', {}).get('applicationId')
    if not skill_id or application_id != skill_id:
        raise HTTPException(status_code=400, detail='Skill no autorizada.')

    req = envelope.get('request') or {}
    req_type = req.get('type')
    locale = req.get('locale') or 'es-ES'
    user_id = (((envelope.get('context') or {}).get('System') or {}).get('user') or {}).get('userId') or ''
    identity = _hash(f'alexa:{user_id}')

    if req_type == 'SessionEndedRequest':
        return {'version': '1.0', 'response': {}}

    link = (await db.execute(select(models.DeviceLink).where(models.DeviceLink.token_hash == identity))).scalars().first()
    if link and link.revoked:
        link = None
    intent = (req.get('intent') or {}).get('name') if req_type == 'IntentRequest' else None

    if intent in ('AMAZON.StopIntent', 'AMAZON.CancelIntent'):
        return _speak('Hasta luego. Cuídate mucho.', end=True)

    if intent == 'VincularIntent':
        return await _link(db, req, identity, user_id, already_linked=bool(link))

    if not link:
        return _speak(LINK_TEXT, reprompt='Dime: mi código es, y los seis números.')

    if req_type == 'LaunchRequest':
        name = await _patient_name(db, link.patient_id)
        return _speak(f'Hola{", " + name if name else ""}. ¿Qué necesitas? {HELP_TEXT}', reprompt=HELP_TEXT)

    if intent == 'AyudaUrgenteIntent':
        return await _ask_for_help(db, link, locale)

    if intent in ('AMAZON.HelpIntent', 'AMAZON.FallbackIntent', 'AMAZON.NavigateHomeIntent'):
        return _speak(HELP_TEXT, reprompt=HELP_TEXT)

    text = {
        'TomaIntent': 'ya me tomé la pastilla',
        'TomaTodasIntent': 'me tomé todas',
        'EstadoIntent': 'qué me toca',
    }.get(intent)
    if intent == 'TomaMedicamentoIntent':
        med = _slot(req, 'medicamento')
        text = f'me tomé el {med}' if med else 'ya me tomé la pastilla'
    if not text:
        return _speak(f'No te he entendido. {HELP_TEXT}', reprompt=HELP_TEXT)

    reply = await handle_voice_command(db, link.patient_id, text)
    if reply['intent'] == 'medication_ask':
        return _speak(reply['speech'], reprompt='Dime por ejemplo: me tomé el Betaloc, o me tomé todas.')
    return _speak(reply['speech'] or f'No te he entendido. {HELP_TEXT}', end=True)


async def _link(db: AsyncSession, req: dict, identity: str, user_id: str, already_linked: bool) -> dict:
    if already_linked:
        return _speak('Ya estoy conectada con tu cuenta de MIVOR. ' + HELP_TEXT, reprompt=HELP_TEXT)
    digits = ''.join(ch for ch in (_slot(req, 'codigo') or '') if ch.isdigit())
    if not digits or len(digits) > 6:
        return _speak('No he entendido el código. Dime: mi código es, y los seis números, uno a uno.',
                      reprompt='Dime los seis números del código.')
    # Mismo límite de intentos que el kiosko, por cuenta de Amazon, para que no se pueda adivinar
    from routers.devices import _apply_pair_rate_limit
    try:
        _apply_pair_rate_limit(f'alexa:{user_id}')
    except HTTPException:
        return _speak('Has hecho demasiados intentos. Espera un minuto y vuelve a probar.', end=True)
    # Un Echo desvinculado desde la web deja su fila revocada con la misma identidad (única):
    # se borra antes de volver a vincularlo
    for old in (await db.execute(select(models.DeviceLink).where(models.DeviceLink.token_hash == identity))).scalars().all():
        await db.delete(old)
    await db.flush()
    # AMAZON.NUMBER quita los ceros de delante ("012345" llega como 12345)
    link = await redeem_pairing_code(db, digits.zfill(6), DEVICE_NAME, token=f'alexa:{user_id}')
    if not link:
        return _speak('Ese código no es correcto o ha caducado. Genera uno nuevo en MIVOR y dímelo otra vez.',
                      reprompt='Dime: mi código es, y los seis números.')
    name = await _patient_name(db, link.patient_id)
    return _speak(f'¡Listo! Ya estoy conectada con la cuenta de {name or "MIVOR"}. {HELP_TEXT}', reprompt=HELP_TEXT)


async def _ask_for_help(db: AsyncSession, link: models.DeviceLink, locale: str) -> dict:
    emergency = _emergency_number(locale)
    caregivers = (await db.execute(
        select(models.CaregiverPatientLink.caregiver_id).where(models.CaregiverPatientLink.patient_id == link.patient_id)
    )).scalars().all()
    name = await _patient_name(db, link.patient_id) or 'Tu familiar'
    for caregiver_id in caregivers:
        await send_push_notification(db, caregiver_id, 'Aviso de ayuda',
                                     f'{name} ha pedido ayuda a través de Alexa. Llámale ahora.')
    if caregivers:
        return _speak(f'He avisado a tu familia a través de MIVOR. Si es una emergencia, llama ahora al {emergency}.', end=True)
    return _speak(f'No tienes familiares conectados en MIVOR para avisarles. Si es una emergencia, llama ahora al {emergency}.', end=True)
