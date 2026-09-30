
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import models
from database import get_db
from security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class PushSubIn(BaseModel):
    endpoint: str
    keys: dict

@router.post("/subscribe")
async def subscribe_push(sub: PushSubIn, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from sqlalchemy.future import select
    existing = (await db.execute(select(models.PushSubscription).where(models.PushSubscription.endpoint == sub.endpoint))).scalar_one_or_none()
    if not existing:
        new_sub = models.PushSubscription(
            user_id=current_user.id,
            endpoint=sub.endpoint,
            p256dh=sub.keys.get("p256dh"),
            auth=sub.keys.get("auth")
        )
        db.add(new_sub)
        await db.commit()
    return {"ok": True}
