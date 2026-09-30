from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import models
from database import get_db
from security import get_authenticated_user_id
from services.push_service import vapid_public_key

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class PushSubIn(BaseModel):
    endpoint: str
    keys: dict


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Clave pública para suscribirse (no es secreta). Se deriva de VAPID_PRIVATE_KEY del servidor."""
    public_key = vapid_public_key()
    if not public_key:
        raise HTTPException(status_code=503, detail="Las notificaciones push no están configuradas en el servidor.")
    return {"public_key": public_key}

@router.post("/subscribe")
async def subscribe_push(sub: PushSubIn, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_authenticated_user_id)):
    """
    Registra (o actualiza) la suscripción push de este dispositivo. Es idempotente: la app la
    reenvía en cada sesión. Se asocia a la persona que ha iniciado sesión, no al perfil familiar
    que esté administrando, porque es su dispositivo el que recibe los avisos.
    """
    existing = (await db.execute(select(models.PushSubscription).where(models.PushSubscription.endpoint == sub.endpoint))).scalar_one_or_none()
    if existing:
        # El navegador puede renovar sus claves, y un dispositivo compartido pasa a quien lo usa ahora
        existing.user_id = user_id
        existing.p256dh = sub.keys.get("p256dh")
        existing.auth = sub.keys.get("auth")
    else:
        db.add(models.PushSubscription(
            user_id=user_id,
            endpoint=sub.endpoint,
            p256dh=sub.keys.get("p256dh"),
            auth=sub.keys.get("auth"),
        ))
    await db.commit()
    return {"ok": True}
