"""
Avisos push de tomas olvidadas: al cumplirse el margen se avisa al paciente y a sus
cuidadores vinculados; y la suscripción push es de quien usa el dispositivo.
"""
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models
from services.medication_alerts import app_tz
from services.medication_push import notify_overdue_medications

CREATED = datetime(2026, 9, 1, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def world(db):
    db.add_all([
        models.User(id="hijo", username="hijo@test", role="patient"),
        models.User(id="papa", username="papa@test", role="patient"),
    ])
    db.add(models.PatientProfile(user_id="papa", full_name="Henry López"))
    # Perfil sin nombre: antes rompía el proceso con AttributeError (first_name)
    db.add(models.PatientProfile(user_id="sin-nombre"))
    db.add(models.CaregiverPatientLink(caregiver_id="hijo", patient_id="papa", relationship="Padre"))
    db.add(models.MedicationReminder(user_id="papa", medication_name="Losartán", dosage="50 mg", time_of_day="08:00", created_at=CREATED))
    db.add(models.MedicationReminder(user_id="sin-nombre", medication_name="Aspirina", time_of_day="08:00", created_at=CREATED))
    await db.commit()
    return db


async def _run(db, hour, minute):
    sent = []

    async def fake_send(_db, user_id, title, body):
        sent.append((user_id, title, body))

    await notify_overdue_medications(db, fake_send, now=datetime(2026, 9, 28, hour, minute, tzinfo=app_tz()))
    return sent


@pytest.mark.asyncio
async def test_patient_and_caregiver_are_notified_when_grace_period_ends(world):
    sent = await _run(world, 9, 0)  # 08:00 + 60 min
    by_user = {u: body for u, _, body in sent}
    assert "Losartán (50 mg)" in by_user["papa"] and "08:00" in by_user["papa"]
    assert by_user["hijo"].startswith("Henry López no ha registrado la toma de Losartán (50 mg)")
    # El perfil sin nombre también recibe su recordatorio (no se cae el proceso)
    assert "sin-nombre" in by_user


@pytest.mark.asyncio
async def test_no_notification_outside_the_exact_minute(world):
    assert await _run(world, 8, 59) == []
    assert await _run(world, 9, 1) == []


@pytest.mark.asyncio
async def test_taken_medication_is_not_notified(world):
    world.add(models.MedicationLog(user_id="papa", medication_id=1, taken_date="2026-09-28", taken_time="08:10"))
    await world.commit()
    sent = await _run(world, 9, 0)
    assert all(u == "sin-nombre" for u, _, _ in sent)


@pytest.mark.asyncio
async def test_subscription_is_idempotent_and_follows_the_logged_in_user(session_maker, db):
    from main import app
    from database import get_db
    from security import get_authenticated_user_id

    async def _db():
        async with session_maker() as s:
            yield s

    body = {"endpoint": "https://push.example/abc", "keys": {"p256dh": "k1", "auth": "a1"}}
    app.dependency_overrides[get_db] = _db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            app.dependency_overrides[get_authenticated_user_id] = lambda: "papa"
            assert (await client.post("/api/notifications/subscribe", json=body)).status_code == 200
            assert (await client.post("/api/notifications/subscribe", json=body)).status_code == 200
            # Mismo dispositivo, ahora con otra sesión y claves renovadas
            app.dependency_overrides[get_authenticated_user_id] = lambda: "hijo"
            body["keys"] = {"p256dh": "k2", "auth": "a2"}
            assert (await client.post("/api/notifications/subscribe", json=body)).status_code == 200
    finally:
        app.dependency_overrides.clear()

    async with session_maker() as s:
        subs = (await s.execute(select(models.PushSubscription))).scalars().all()
    assert [(x.user_id, x.p256dh, x.auth) for x in subs] == [("hijo", "k2", "a2")]
