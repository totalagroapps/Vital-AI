
import os
import json
import logging
from pywebpush import webpush, WebPushException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import PushSubscription

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgew+NrjmPbTDkklJZn3Fw5cgWKMijWS1eb1YkHbPHPLehRANCAASePkx45EyBSRospmsrDUii5gZ7UxKTwQy6sl2nqWEdzgjWi/YBD6Xvy9uMPrFhX3EfG/gdsb+dK5qFLe3uqCR+")
VAPID_CLAIMS = {
    "sub": "mailto:admin@mivor.ai"
}

async def send_push_notification(db: AsyncSession, user_id: str, title: str, body: str, url: str = "/paciente"):
    subs = (await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))).scalars().all()
    if not subs:
        return
        
    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/vite.svg"
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
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            logging.info(f"Push enviado a {user_id}")
        except WebPushException as ex:
            logging.error(f"Push failed: {repr(ex)}")
            if ex.response and ex.response.status_code in [404, 410]:
                await db.delete(sub)
    await db.commit()
