"""
Skill de Alexa: verificación de Amazon, vinculación con el código de MIVOR y órdenes de voz.
"""
import json
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models
from routers import alexa as alexa_router
from routers import devices as devices_router

SKILL_ID = "amzn1.ask.skill.test-mivor"
AMAZON_USER = "amzn1.ask.account.abuelo"
CREATED = datetime(2026, 9, 1, tzinfo=timezone.utc)


def envelope(request: dict, user=AMAZON_USER, skill=SKILL_ID) -> dict:
    return {
        "version": "1.0",
        "context": {"System": {"application": {"applicationId": skill}, "user": {"userId": user}}},
        "request": {"requestId": "r1", "timestamp": datetime.now(timezone.utc).isoformat(), "locale": "es-ES", **request},
    }


def intent(name: str, locale="es-ES", **slots) -> dict:
    return {"type": "IntentRequest", "locale": locale,
            "intent": {"name": name, "slots": {k: {"name": k, "value": v} for k, v in slots.items()}}}


def speech(res) -> str:
    return res.json()["response"]["outputSpeech"]["text"]


@pytest_asyncio.fixture
async def world(db):
    db.add_all([
        models.User(id="papa", username="papa@test", role="patient"),
        models.User(id="hijo", username="hijo@test", role="patient"),
    ])
    db.add(models.PatientProfile(user_id="papa", full_name="Henry López"))
    db.add(models.CaregiverPatientLink(caregiver_id="hijo", patient_id="papa"))
    db.add_all([
        models.MedicationReminder(id=1, user_id="papa", medication_name="Betaloc", dosage="100 mg", time_of_day="00:00", created_at=CREATED),
        models.MedicationReminder(id=2, user_id="papa", medication_name="Omeprazol", dosage="20 mg", time_of_day="00:00", created_at=CREATED),
    ])
    # Código "012345" generado en la web (empieza por 0: AMAZON.NUMBER lo entrega como 12345)
    db.add(models.DevicePairingCode(code_hash=devices_router._hash("012345"), patient_id="papa", created_by="hijo",
                                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)))
    await db.commit()
    return db


@pytest_asyncio.fixture
async def client(session_maker, world, monkeypatch):
    from main import app
    from database import get_db

    async def _db():
        async with session_maker() as s:
            yield s

    monkeypatch.setenv("ALEXA_SKILL_ID", SKILL_ID)
    monkeypatch.setattr(alexa_router, "_verify_request", lambda headers, body: None)
    devices_router._pair_attempts.clear()
    app.dependency_overrides[get_db] = _db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def post(client, request, **kw):
    return await client.post("/api/alexa", content=json.dumps(envelope(request, **kw)),
                             headers={"Content-Type": "application/json"})


@pytest.mark.asyncio
async def test_unsigned_requests_are_rejected(session_maker, world, monkeypatch):
    """Sin la firma de Amazon (verificador real), la petición no se procesa."""
    from main import app
    from database import get_db

    async def _db():
        async with session_maker() as s:
            yield s

    monkeypatch.setenv("ALEXA_SKILL_ID", SKILL_ID)
    app.dependency_overrides[get_db] = _db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            res = await c.post("/api/alexa", content=json.dumps(envelope({"type": "LaunchRequest"})))
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_other_skills_are_rejected(client, monkeypatch):
    assert (await post(client, {"type": "LaunchRequest"}, skill="amzn1.ask.skill.otra")).status_code == 400
    monkeypatch.delenv("ALEXA_SKILL_ID")
    assert (await post(client, {"type": "LaunchRequest"})).status_code == 400


@pytest.mark.asyncio
async def test_link_then_log_doses_by_voice(client, session_maker):
    res = await post(client, {"type": "LaunchRequest"})
    assert "Generar código" in speech(res)  # sin vincular: explica cómo conseguir el código

    assert "no es correcto" in speech(await post(client, intent("VincularIntent", codigo="999999")))
    res = await post(client, intent("VincularIntent", codigo="12345"))
    assert "Henry López" in speech(res)

    async with session_maker() as s:
        links = (await s.execute(select(models.DeviceLink))).scalars().all()
    assert [(l.patient_id, l.device_name) for l in links] == [("papa", "Alexa (Echo)")]

    res = await post(client, intent("TomaIntent"))
    assert "Betaloc" in speech(res) and "Omeprazol" in speech(res)  # varias pendientes: pregunta cuál
    assert res.json()["response"]["shouldEndSession"] is False

    res = await post(client, intent("TomaMedicamentoIntent", medicamento="betaloc"))
    assert speech(res).startswith("Anotado: Betaloc 100 mg")
    assert "Omeprazol" in speech(await post(client, intent("EstadoIntent")))

    async with session_maker() as s:
        taken = (await s.execute(select(models.MedicationLog.medication_id))).scalars().all()
    assert taken == [1]


@pytest.mark.asyncio
async def test_help_request_notifies_caregivers_with_local_number(client, monkeypatch):
    await post(client, intent("VincularIntent", codigo="12345"))
    sent = []

    async def fake_push(db, user_id, title, body, url="/paciente"):
        sent.append((user_id, body))

    monkeypatch.setattr(alexa_router, "send_push_notification", fake_push)
    res = await post(client, intent("AyudaUrgenteIntent"))
    assert "112" in speech(res) and "He avisado" in speech(res)
    assert sent == [("hijo", "Henry López ha pedido ayuda a través de Alexa. Llámale ahora.")]
    assert "911" in speech(await post(client, intent("AyudaUrgenteIntent", locale="es-MX")))


@pytest.mark.asyncio
async def test_revoked_echo_can_be_linked_again(client, session_maker):
    await post(client, intent("VincularIntent", codigo="12345"))
    async with session_maker() as s:
        link = (await s.execute(select(models.DeviceLink))).scalars().one()
        link.revoked = True
        s.add(models.DevicePairingCode(code_hash=devices_router._hash("654321"), patient_id="papa", created_by="hijo",
                                       expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)))
        await s.commit()

    assert "Generar código" in speech(await post(client, intent("EstadoIntent")))  # desvinculado
    assert "Henry López" in speech(await post(client, intent("VincularIntent", codigo="654321")))
    assert "Omeprazol" in speech(await post(client, intent("EstadoIntent")))


@pytest.mark.asyncio
async def test_session_end_and_stop(client):
    res = await post(client, {"type": "SessionEndedRequest", "reason": "USER_INITIATED"})
    assert res.status_code == 200 and res.json()["response"] == {}
    res = await post(client, intent("AMAZON.StopIntent"))
    assert res.json()["response"]["shouldEndSession"] is True
