"""
Controles de salud (tensión, glucosa, peso): validación, valoración en palabras sencillas,
aviso a la familia con valores muy fuera de rango, órdenes de voz y endpoints.
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models
from services.health_readings import InvalidReading, add_reading, assess, parse_voice_reading, validate
from services.voice_commands import handle_voice_command, normalize


@pytest_asyncio.fixture
async def patient(db):
    db.add(models.User(id="papa", username="papa@test", role="patient"))
    db.add(models.User(id="hija", username="hija@test", role="patient"))
    db.add(models.PatientProfile(user_id="papa", full_name="Henry López"))
    db.add(models.CaregiverPatientLink(caregiver_id="hija", patient_id="papa"))
    await db.commit()
    return db


def test_assessment_levels():
    assert assess('blood_pressure', 120, 80) == 'normal'
    assert assess('blood_pressure', 145, 85) == 'high'
    assert assess('blood_pressure', 85, 55) == 'low'
    assert assess('blood_pressure', 185, 100) == 'urgent_high'
    assert assess('glucose', 100, None) == 'normal'
    assert assess('glucose', 200, None) == 'high'
    assert assess('glucose', 60, None) == 'low'
    assert assess('glucose', 40, None) == 'urgent_low'
    assert assess('weight', 72, None) is None


def test_validation_rejects_typos():
    assert validate('blood_pressure', 130.4, 85.2) == (130, 85)
    assert validate('weight', 72.46, None) == (72.5, None)
    with pytest.raises(InvalidReading):
        validate('blood_pressure', 80, 120)  # al revés
    with pytest.raises(InvalidReading):
        validate('blood_pressure', 130, None)
    with pytest.raises(InvalidReading):
        validate('glucose', 2000, None)
    with pytest.raises(InvalidReading):
        validate('temperature', 37, None)


def test_voice_parsing():
    assert parse_voice_reading(normalize("Tengo la tensión 130 85")) == ('blood_pressure', [130, 85])
    assert parse_voice_reading(normalize("la presión 13 8")) == ('blood_pressure', [130, 80])
    assert parse_voice_reading(normalize("glucosa 110")) == ('glucose', [110])
    assert parse_voice_reading(normalize("tengo el azúcar en 95")) == ('glucose', [95])
    assert parse_voice_reading(normalize("peso 72,5 kilos")) == ('weight', [72.5])
    assert parse_voice_reading(normalize("ya me tomé la pastilla")) is None


@pytest.mark.asyncio
async def test_urgent_value_alerts_the_family(patient):
    sent = []

    async def notify(db, user_id, title, body):
        sent.append((user_id, title, body))

    data = await add_reading(patient, "papa", "blood_pressure", 190, 110, notify=notify)
    assert data['level'] == 'urgent_high' and 'emergencias' in data['message']
    assert sent and sent[0][0] == "hija" and "190/110" in sent[0][2]

    assert data['message'].endswith('Hemos avisado a tu familia.')

    sent.clear()
    await add_reading(patient, "papa", "glucose", 120, None, notify=notify)
    assert sent == []  # un valor normal no avisa a nadie

    # Sin familiares vinculados no se promete un aviso que no se ha enviado
    patient.add(models.User(id="solo", username="solo@test", role="patient"))
    await patient.commit()
    alone = await add_reading(patient, "solo", "glucose", 320, None, notify=notify)
    assert alone['level'] == 'urgent_high' and 'familia' not in alone['message']


@pytest.mark.asyncio
async def test_voice_reading_and_medication_do_not_collide(patient, monkeypatch):
    async def fake_push(*args, **kwargs):
        return None
    monkeypatch.setattr("services.push_service.send_push_notification", fake_push)

    r = await handle_voice_command(patient, "papa", "Tengo la tensión 130 85")
    assert r['intent'] == 'reading_saved'
    assert r['speech'].startswith('Anotado: tensión 130 sobre 85. Dentro de lo habitual')

    r = await handle_voice_command(patient, "papa", "la tensión")
    assert r['intent'] == 'reading_ask'

    # "Me tomé la pastilla de la tensión" es una toma, no un control sin números
    r = await handle_voice_command(patient, "papa", "me tomé la pastilla de la tensión")
    assert r['intent'] != 'reading_ask'

    rows = (await patient.execute(select(models.HealthReading))).scalars().all()
    assert [(x.kind, x.value1, x.value2, x.source) for x in rows] == [('blood_pressure', 130, 85, 'voice')]


@pytest_asyncio.fixture
async def api(session_maker, patient):
    from main import app
    from database import get_db
    from security import get_authenticated_user_id, get_current_user_id

    async def _db():
        async with session_maker() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: "papa"
    app.dependency_overrides[get_authenticated_user_id] = lambda: "papa"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_readings_endpoints(api):
    ok = await api.post("/api/health/readings", json={"kind": "glucose", "value1": 110})
    assert ok.status_code == 200 and ok.json()['display'] == '110 mg/dL' and ok.json()['level'] == 'normal'
    await api.post("/api/health/readings", json={"kind": "weight", "value1": 72.5})
    bad = await api.post("/api/health/readings", json={"kind": "blood_pressure", "value1": 130})
    assert bad.status_code == 400

    listing = (await api.get("/api/health/readings")).json()
    assert set(listing['latest']) == {'glucose', 'weight'} and len(listing['items']) == 2
    assert listing['latest']['weight']['display'] == '72.5 kg'

    rid = listing['latest']['glucose']['id']
    assert (await api.delete(f"/api/health/readings/{rid}")).status_code == 200
    assert (await api.delete(f"/api/health/readings/{rid}")).status_code == 404


@pytest.mark.asyncio
async def test_device_readings_need_the_device_key(api):
    code = (await api.post("/api/devices/pairing-code")).json()["code"]
    token = (await api.post("/api/devices/pair", json={"code": code})).json()["device_token"]
    h = {"X-Device-Token": token}
    assert (await api.post("/api/device/readings", json={"kind": "glucose", "value1": 100})).status_code == 401
    saved = await api.post("/api/device/readings", headers=h, json={"kind": "glucose", "value1": 100})
    assert saved.status_code == 200 and saved.json()['source'] == 'kiosk'
    assert (await api.get("/api/device/readings", headers=h)).json()['latest']['glucose']['value1'] == 100
