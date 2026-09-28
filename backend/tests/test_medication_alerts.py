"""
Avisos de medicación al cuidador: una toma vencida (hora + margen) y sin registrar hoy
genera aviso solo para los cuidadores vinculados al paciente.
"""
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import models
import security
from services import medication_alerts
from services.medication_alerts import parse_times, pending_medications, app_tz


@pytest.mark.parametrize("text,expected", [
    ("08:00", [(8, 0)]),
    ("Ej: 08:00 y 20:00", [(8, 0), (20, 0)]),
    ("8:30", [(8, 30)]),
    ("8.30", [(8, 30)]),
    ("8 am", [(8, 0)]),
    ("8:15 p.m.", [(20, 15)]),
    ("12 am", [(0, 0)]),
    ("cada 8 horas", []),
    ("después del desayuno", []),
    ("", []),
    (None, []),
    ("25:00", []),
])
def test_parse_times(text, expected):
    assert parse_times(text) == expected


NOW = datetime(2026, 9, 28, 12, 0, tzinfo=app_tz())
CREATED = datetime(2026, 9, 1, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def world(db):
    db.add_all([
        models.User(id="hijo", username="hijo@test", role="patient"),
        models.User(id="papa", username="papa@test", role="patient"),
        models.User(id="otro", username="otro@test", role="patient"),
    ])
    db.add(models.PatientProfile(user_id="papa", full_name="Henry López"))
    db.add(models.CaregiverPatientLink(caregiver_id="hijo", patient_id="papa", relationship="Padre"))
    db.add_all([
        # 08:00 sin tomar → pendiente
        models.MedicationReminder(id=1, user_id="papa", medication_name="Losartán", dosage="50 mg", time_of_day="08:00", created_at=CREATED),
        # 08:00 ya tomado hoy → no
        models.MedicationReminder(id=2, user_id="papa", medication_name="Metformina", time_of_day="08:00", created_at=CREATED),
        # 11:30: dentro del margen de 60 min → todavía no
        models.MedicationReminder(id=3, user_id="papa", medication_name="Aspirina", time_of_day="11:30", created_at=CREATED),
        # sin hora reconocible → no
        models.MedicationReminder(id=4, user_id="papa", medication_name="Vitamina D", time_of_day="con el almuerzo", created_at=CREATED),
        # inactivo → no
        models.MedicationReminder(id=5, user_id="papa", medication_name="Antiguo", time_of_day="07:00", is_active=False, created_at=CREATED),
        # dado de alta hoy después de su hora → no
        models.MedicationReminder(id=6, user_id="papa", medication_name="Nuevo", time_of_day="07:00",
                                  # 10:00 en Bogotá = 15:00 UTC (SQLite guarda sin zona; se interpreta como UTC)
                                  created_at=datetime(2026, 9, 28, 15, 0)),
        # tomado ayer pero no hoy → pendiente
        models.MedicationReminder(id=7, user_id="papa", medication_name="Atorvastatina", time_of_day="7 am", created_at=CREATED),
        # de otro paciente → nunca aparece para el hijo
        models.MedicationReminder(id=8, user_id="otro", medication_name="Ajena", time_of_day="06:00", created_at=CREATED),
    ])
    db.add_all([
        models.MedicationLog(user_id="papa", medication_id=2, taken_date="2026-09-28", taken_time="08:05"),
        models.MedicationLog(user_id="papa", medication_id=7, taken_date="2026-09-27", taken_time="07:10"),
    ])
    await db.commit()


@pytest.mark.asyncio
async def test_pending_medications(db, world):
    pending = await pending_medications(db, "papa", NOW)
    assert [(p["medication_name"], p["scheduled_time"], p["minutes_late"]) for p in pending] == [
        ("Atorvastatina", "07:00", 300),
        ("Losartán", "08:00", 240),
    ]


@pytest.mark.asyncio
async def test_alerts_endpoint_only_linked_patients(session_maker, world, monkeypatch):
    import database
    from main import app

    async def override_get_db():
        async with session_maker() as session:
            yield session

    monkeypatch.setattr("routers.caregiver.now_local", lambda: NOW)
    monkeypatch.setattr(medication_alerts, "now_local", lambda: NOW)
    app.dependency_overrides[database.get_db] = override_get_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            def auth(uid, target=None):
                h = {"Authorization": f"Bearer {security.create_access_token({'sub': uid})}"}
                if target:
                    h["X-Target-Patient-Id"] = target
                return h

            res = await c.get("/api/caregiver/medication-alerts", headers=auth("hijo"))
            assert res.status_code == 200
            alerts = res.json()["alerts"]
            assert [a["medication_name"] for a in alerts] == ["Atorvastatina", "Losartán"]
            assert {a["patient_name"] for a in alerts} == {"Henry López"}
            assert {a["relationship"] for a in alerts} == {"Padre"}

            # Viendo el perfil del padre sigue recibiendo sus propios avisos de cuidador
            res = await c.get("/api/caregiver/medication-alerts", headers=auth("hijo", "papa"))
            assert len(res.json()["alerts"]) == 2

            # Sin vínculos no hay avisos (el padre no ve los de nadie)
            res = await c.get("/api/caregiver/medication-alerts", headers=auth("papa"))
            assert res.json()["alerts"] == []

            # El selector de perfiles muestra cuántas tomas tiene pendientes cada familiar
            res = await c.get("/api/auth/profiles", headers=auth("hijo"))
            family = [p for p in res.json()["profiles"] if not p["is_self"]]
            assert family[0]["pending_medications"] == 2
    finally:
        app.dependency_overrides.clear()
