"""
Kiosko vinculado: código de un solo uso, llave propia del dispositivo y órdenes de voz
("ya me tomé la pastilla", "¿qué me toca?").
"""
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models
from routers import devices as devices_router
from services.medication_alerts import app_tz
from services.voice_commands import handle_voice_command

CREATED = datetime(2026, 9, 1, tzinfo=timezone.utc)
NOW = datetime(2026, 9, 30, 8, 30, tzinfo=app_tz())


@pytest_asyncio.fixture
async def meds(db):
    db.add(models.User(id="papa", username="papa@test", role="patient"))
    db.add(models.PatientProfile(user_id="papa", full_name="Henry López"))
    db.add_all([
        models.MedicationReminder(id=1, user_id="papa", medication_name="Betaloc", dosage="100 mg", time_of_day="08:00", created_at=CREATED),
        models.MedicationReminder(id=2, user_id="papa", medication_name="Omeprazol", dosage="20 mg", time_of_day="08:00", created_at=CREATED),
        models.MedicationReminder(id=3, user_id="papa", medication_name="Atorvastatina", dosage="20 mg", time_of_day="21:00", created_at=CREATED),
    ])
    await db.commit()
    return db


async def _taken(db):
    return sorted((await db.execute(select(models.MedicationLog.medication_id))).scalars().all())


# ---------------------------------------------------------------------------
# Órdenes de voz
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generic_taken_with_several_due_asks_which(meds):
    r = await handle_voice_command(meds, "papa", "Ya me tomé la pastilla", now=NOW)
    assert r["intent"] == "medication_ask"
    assert "Betaloc" in r["speech"] and "Omeprazol" in r["speech"]
    assert "Atorvastatina" not in r["speech"]  # la de la noche no toca todavía
    assert await _taken(meds) == []


@pytest.mark.asyncio
async def test_taken_by_name_logs_that_medication(meds):
    r = await handle_voice_command(meds, "papa", "ya me tomé el betaloc", now=NOW)
    assert r["intent"] == "medication_taken" and r["logged"] == ["Betaloc 100 mg"]
    assert "Omeprazol" in r["speech"]
    assert await _taken(meds) == [1]


@pytest.mark.asyncio
async def test_taken_all_logs_only_the_due_ones(meds):
    r = await handle_voice_command(meds, "papa", "Me tomé todas", now=NOW)
    assert sorted(r["logged"]) == ["Betaloc 100 mg", "Omeprazol 20 mg"]
    assert await _taken(meds) == [1, 2]


@pytest.mark.asyncio
async def test_single_due_is_logged_without_asking(meds):
    meds.add(models.MedicationLog(user_id="papa", medication_id=2, taken_date="2026-09-30", taken_time="08:05"))
    await meds.commit()
    r = await handle_voice_command(meds, "papa", "ya tomé la pastilla", now=NOW)
    assert r["logged"] == ["Betaloc 100 mg"]
    assert "Atorvastatina a las 21:00" in r["speech"]


@pytest.mark.asyncio
async def test_status_lists_what_is_left(meds):
    r = await handle_voice_command(meds, "papa", "¿Qué me toca ahora?", now=NOW)
    assert r["intent"] == "medication_status"
    assert r["speech"].startswith("Hoy te falta tomar: Betaloc 100 mg a las 8:00")


@pytest.mark.asyncio
async def test_unrelated_text_is_unknown(meds):
    r = await handle_voice_command(meds, "papa", "llama a mi hija", now=NOW)
    assert r["intent"] == "unknown"


# ---------------------------------------------------------------------------
# Vinculación y llave del dispositivo
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def api(session_maker, meds):
    from main import app
    from database import get_db
    from security import get_authenticated_user_id, get_current_user_id

    async def _db():
        async with session_maker() as s:
            yield s

    devices_router._pair_attempts.clear()
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: "papa"
    app.dependency_overrides[get_authenticated_user_id] = lambda: "papa"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_pairing_flow_and_revocation(api):
    code = (await api.post("/api/devices/pairing-code")).json()["code"]
    assert len(code) == 6 and code.isdigit()

    paired = (await api.post("/api/devices/pair", json={"code": code, "device_name": "Tablet salón"})).json()
    token = paired["device_token"]
    assert paired["patient_name"] == "Henry López"
    # El código es de un solo uso
    assert (await api.post("/api/devices/pair", json={"code": code})).status_code == 400

    h = {"X-Device-Token": token}
    assert (await api.get("/api/device/me", headers=h)).json()["device_name"] == "Tablet salón"
    meds = (await api.get("/api/device/medications", headers=h)).json()
    assert [m["name"] for m in meds] == ["Betaloc", "Omeprazol", "Atorvastatina"]
    assert (await api.post("/api/device/voice", headers=h, json={"text": "qué me toca"})).json()["intent"] == "medication_status"

    devices = (await api.get("/api/devices")).json()
    assert [d["device_name"] for d in devices] == ["Tablet salón"]
    assert (await api.delete(f"/api/devices/{devices[0]['id']}")).status_code == 200
    assert (await api.get("/api/device/me", headers=h)).status_code == 401
    assert (await api.get("/api/devices")).json() == []


@pytest.mark.asyncio
async def test_bad_missing_or_expired_codes_and_tokens(api, session_maker):
    assert (await api.post("/api/devices/pair", json={"code": "000000"})).status_code == 400
    assert (await api.get("/api/device/me")).status_code == 401
    assert (await api.get("/api/device/me", headers={"X-Device-Token": "inventado"})).status_code == 401

    code = (await api.post("/api/devices/pairing-code")).json()["code"]
    async with session_maker() as s:
        row = (await s.execute(select(models.DevicePairingCode).where(models.DevicePairingCode.used == False))).scalars().one()  # noqa: E712
        row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        await s.commit()
    assert (await api.post("/api/devices/pair", json={"code": code})).status_code == 400


@pytest.mark.asyncio
async def test_new_code_invalidates_previous_one(api):
    first = (await api.post("/api/devices/pairing-code")).json()["code"]
    second = (await api.post("/api/devices/pairing-code")).json()["code"]
    if first != second:
        assert (await api.post("/api/devices/pair", json={"code": first})).status_code == 400
    assert (await api.post("/api/devices/pair", json={"code": second})).status_code == 200


@pytest.mark.asyncio
async def test_pairing_is_rate_limited(api):
    codes = [(await api.post("/api/devices/pair", json={"code": f"{i:06d}"})).status_code for i in range(12)]
    assert codes[:10] == [400] * 10
    assert codes[10:] == [429, 429]
