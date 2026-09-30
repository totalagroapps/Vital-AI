"""
Clave VAPID solo desde el entorno, clave pública derivada de la privada, y limpieza de
suscripciones que el servicio de push rechaza (caducadas o creadas con otra clave).
"""
import base64

import pytest
import requests
import pytest_asyncio
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from httpx import ASGITransport, AsyncClient
from pywebpush import WebPushException
from sqlalchemy import select

import models
from services import push_service


def _new_private_key() -> str:
    der = ec.generate_private_key(ec.SECP256R1()).private_bytes(
        serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    return base64.urlsafe_b64encode(der).decode().rstrip("=")


@pytest.fixture
def vapid_key(monkeypatch):
    key = _new_private_key()
    monkeypatch.setenv("VAPID_PRIVATE_KEY", key)
    return key


def test_public_key_is_derived_from_private_key(vapid_key):
    public = push_service.vapid_public_key()
    raw = base64.urlsafe_b64decode(public + "=" * (-len(public) % 4))
    assert len(raw) == 65 and raw[0] == 4  # punto P-256 sin comprimir, lo que pide el navegador


def test_no_key_means_no_public_key(monkeypatch):
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    assert push_service.vapid_public_key() is None


@pytest_asyncio.fixture
async def subs(db):
    db.add_all([
        models.PushSubscription(user_id="u1", endpoint="https://push.example/ok", p256dh="k", auth="a"),
        models.PushSubscription(user_id="u1", endpoint="https://push.example/old-key", p256dh="k", auth="a"),
        models.PushSubscription(user_id="u1", endpoint="https://push.example/server-error", p256dh="k", auth="a"),
    ])
    await db.commit()
    return db


@pytest.mark.asyncio
async def test_send_without_key_does_nothing(subs, monkeypatch):
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    calls = []
    monkeypatch.setattr(push_service, "webpush", lambda **kw: calls.append(kw))
    await push_service.send_push_notification(subs, "u1", "t", "b")
    assert calls == []


@pytest.mark.asyncio
async def test_rejected_subscriptions_are_removed(subs, vapid_key, monkeypatch):
    sent = []

    def fake_webpush(subscription_info, **kwargs):
        endpoint = subscription_info["endpoint"]
        if endpoint.endswith("old-key"):
            # Respuesta real de requests con error: es "falsy", por eso antes nunca se borraban
            response = requests.Response()
            response.status_code = 403
            assert not response
            raise WebPushException("forbidden", response=response)
        if endpoint.endswith("server-error"):
            response = requests.Response()
            response.status_code = 500
            raise WebPushException("boom", response=response)
        assert kwargs["vapid_private_key"] == vapid_key
        sent.append(endpoint)

    monkeypatch.setattr(push_service, "webpush", fake_webpush)
    await push_service.send_push_notification(subs, "u1", "Recordatorio", "Hora de tu pastilla")

    remaining = sorted((await subs.execute(select(models.PushSubscription.endpoint))).scalars().all())
    assert sent == ["https://push.example/ok"]
    # La rechazada por clave distinta se borra; un error 500 del servicio no borra nada
    assert remaining == ["https://push.example/ok", "https://push.example/server-error"]


@pytest.mark.asyncio
async def test_public_key_endpoint(monkeypatch):
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
        assert (await client.get("/api/notifications/vapid-public-key")).status_code == 503
        monkeypatch.setenv("VAPID_PRIVATE_KEY", _new_private_key())
        res = await client.get("/api/notifications/vapid-public-key")
        assert res.status_code == 200 and res.json()["public_key"] == push_service.vapid_public_key()
