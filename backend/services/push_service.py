import os
import json
import base64
import logging
from functools import lru_cache
from typing import Optional

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid
from pywebpush import webpush, WebPushException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import PushSubscription

logger = logging.getLogger(__name__)

# La clave privada VAPID firma los avisos push. Solo se lee del entorno (Railway): nunca se
# guarda en el código. Sin ella la app funciona, pero no envía notificaciones push.
VAPID_CLAIMS = {"sub": os.getenv("VAPID_SUBJECT", "mailto:admin@mivor.ai")}

# El servicio de push rechaza la suscripción: caducada (404/410) o creada con otra clave
# VAPID (401/403, p. ej. tras rotarla). El navegador la vuelve a crear en la siguiente sesión.
_STALE_SUBSCRIPTION_STATUSES = {401, 403, 404, 410}


def vapid_private_key() -> Optional[str]:
    return (os.getenv("VAPID_PRIVATE_KEY") or "").strip() or None


@lru_cache(maxsize=4)
def _public_key_for(private_key: str) -> str:
    public = Vapid.from_string(private_key).public_key.public_bytes(
        serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
    )
    return base64.urlsafe_b64encode(public).decode().rstrip("=")


def vapid_public_key() -> Optional[str]:
    """Clave pública (applicationServerKey del navegador), derivada de la privada: nunca pueden desparejarse."""
    private_key = vapid_private_key()
    return _public_key_for(private_key) if private_key else None


async def send_push_notification(db: AsyncSession, user_id: str, title: str, body: str, url: str = "/paciente"):
    private_key = vapid_private_key()
    if not private_key:
        logger.warning("VAPID_PRIVATE_KEY no configurada: no se envían notificaciones push")
        return

    subs = (await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))).scalars().all()
    if not subs:
        return

    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/logo.png"
    })

    for sub in subs:
        sub_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth
            }
        }
        try:
            webpush(
                subscription_info=sub_info,
                data=payload,
                vapid_private_key=private_key,
                vapid_claims=dict(VAPID_CLAIMS),
            )
            logger.info(f"Push enviado a {user_id}")
        except WebPushException as ex:
            # Ojo: una Response de requests con error es "falsy"; hay que comparar con None
            status = ex.response.status_code if ex.response is not None else None
            logger.error(f"Push failed ({status}): {repr(ex)}")
            if status in _STALE_SUBSCRIPTION_STATUSES:
                await db.delete(sub)
    await db.commit()
