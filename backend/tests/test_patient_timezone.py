"""
Zona horaria por paciente: las tomas de las 08:00 son a las 08:00 donde vive cada uno.
La envían su móvil (app) y su kiosko; el cuidador puede fijarla a mano.
"""
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models
from services.device_today import device_today, set_taken
from services.medication_alerts import now_for, pending_medications

CREATED = datetime(2026, 9, 1, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def two_patients(db):
    db.add_all([
        models.User(id="madrid", username="madrid@test", role="patient"),
        models.User(id="bogota", username="bogota@test", role="patient"),
        models.User(id="hija", username="hija@test", role="patient"),
        models.PatientProfile(user_id="madrid", full_name="Carmen", timezone="Europe/Madrid"),
        models.PatientProfile(user_id="bogota", full_name="Henry"),  # sin zona: la de la app (Bogotá)
        models.PatientProfile(user_id="hija", full_name="Lucía"),
        models.CaregiverPatientLink(caregiver_id="hija", patient_id="madrid"),
        models.MedicationReminder(id=1, user_id="madrid", medication_name="Betaloc", time_of_day="08:00", created_at=CREATED),
        models.MedicationReminder(id=2, user_id="bogota", medication_name="Betaloc", time_of_day="08:00", created_at=CREATED),
    ])
    await db.commit()
    return db


@pytest.mark.asyncio
async def test_same_instant_different_local_time(two_patients):
    instant = datetime(2026, 9, 30, 6, 30, tzinfo=timezone.utc)  # 08:30 en Madrid, 01:30 en Bogotá
    assert (await now_for(two_patients, "madrid", instant)).strftime("%H:%M") == "08:30"
    assert (await now_for(two_patients, "bogota", instant)).strftime("%H:%M") == "01:30"

    madrid = await device_today(two_patients, "madrid", "Carmen", now=instant)
    bogota = await device_today(two_patients, "bogota", "Henry", now=instant)
    assert madrid["due"]["time"] == "08:00"  # en Madrid ya toca
    assert bogota["due"] is None and bogota["next"]["time"] == "08:00"  # en Bogotá aún es de madrugada


@pytest.mark.asyncio
async def test_midnight_uses_the_patient_day(two_patients):
    instant = datetime(2026, 9, 30, 22, 30, tzinfo=timezone.utc)  # 00:30 del 1-oct en Madrid, 17:30 del 30-sep en Bogotá
    await set_taken(two_patients, "madrid", 1, True, now=instant)
    await set_taken(two_patients, "bogota", 2, True, now=instant)
    logs = {log.user_id: log for log in (await two_patients.execute(select(models.MedicationLog))).scalars().all()}
    assert (logs["madrid"].taken_date, logs["madrid"].taken_time) == ("2026-10-01", "00:30")
    assert (logs["bogota"].taken_date, logs["bogota"].taken_time) == ("2026-09-30", "17:30")


@pytest.mark.asyncio
async def test_overdue_alerts_in_each_patient_zone(two_patients):
    instant = datetime(2026, 9, 30, 8, 0, tzinfo=timezone.utc)  # 10:00 en Madrid, 03:00 en Bogotá
    late_madrid = await pending_medications(two_patients, "madrid", instant)
    assert [p["minutes_late"] for p in late_madrid] == [120]
    assert await pending_medications(two_patients, "bogota", instant) == []


@pytest_asyncio.fixture
async def api(session_maker, two_patients):
    from main import app
    from database import get_db
    from security import get_authenticated_user_id, get_current_user_id

    state = {"real": "madrid", "acting": "madrid"}

    async def _db():
        async with session_maker() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: state["acting"]
    app.dependency_overrides[get_authenticated_user_id] = lambda: state["real"]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        c.state = state
        yield c
    app.dependency_overrides.clear()


async def _zone(db_maker, user_id):
    async with db_maker() as s:
        p = (await s.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == user_id))).scalars().first()
        return p.timezone, bool(p.timezone_manual)


@pytest.mark.asyncio
async def test_auto_manual_and_kiosk(api, session_maker):
    # El móvil del propio paciente actualiza su zona
    r = await api.post("/api/patient/timezone", json={"timezone": "Atlantic/Canary", "source": "auto"})
    assert r.json()["timezone"] == "Atlantic/Canary"
    # Zona inexistente: se ignora
    await api.post("/api/patient/timezone", json={"timezone": "Marte/Base", "source": "auto"})
    assert await _zone(session_maker, "madrid") == ("Atlantic/Canary", False)

    # La hija, viendo el perfil de su madre desde Bogotá: su detección automática no cambia la de la madre
    api.state.update(real="hija", acting="madrid")
    await api.post("/api/patient/timezone", json={"timezone": "America/Bogota", "source": "auto"})
    assert (await _zone(session_maker, "madrid"))[0] == "Atlantic/Canary"

    # La hija la fija a mano: queda bloqueada para las detecciones automáticas
    r = await api.post("/api/patient/timezone", json={"timezone": "Europe/Madrid", "source": "manual"})
    assert r.json() == {"status": "ok", "timezone": "Europe/Madrid", "manual": True}
    assert (await api.post("/api/patient/timezone", json={"timezone": "Nowhere", "source": "manual"})).status_code == 400
    api.state.update(real="madrid", acting="madrid")
    await api.post("/api/patient/timezone", json={"timezone": "Atlantic/Canary", "source": "auto"})
    assert await _zone(session_maker, "madrid") == ("Europe/Madrid", True)
    got = (await api.get("/api/patient/timezone")).json()
    assert got == {"timezone": "Europe/Madrid", "manual": True, "effective": "Europe/Madrid"}

    # El kiosko envía su zona en cada petición; con la zona fijada a mano no la cambia
    code = (await api.post("/api/devices/pairing-code")).json()["code"]
    token = (await api.post("/api/devices/pair", json={"code": code})).json()["device_token"]
    await api.get("/api/device/today", headers={"X-Device-Token": token, "X-Timezone": "America/Lima"})
    assert await _zone(session_maker, "madrid") == ("Europe/Madrid", True)

    # Vuelta a automático: ahora sí la toma del kiosko
    await api.post("/api/patient/timezone", json={"timezone": "auto", "source": "manual"})
    await api.get("/api/device/today", headers={"X-Device-Token": token, "X-Timezone": "America/Lima"})
    assert await _zone(session_maker, "madrid") == ("America/Lima", False)
