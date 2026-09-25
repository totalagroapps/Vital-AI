"""
Control de acceso a datos clínicos: un médico solo puede ver pacientes
con los que tiene una cita; el paciente solo se ve a sí mismo; el admin ve todo.
"""
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

import models
import security


@pytest_asyncio.fixture
async def world(db):
    doctor = models.User(id="doc-1", username="doc1@test", role="doctor")
    other_doctor = models.User(id="doc-2", username="doc2@test", role="doctor")
    pending_doctor = models.User(id="doc-3", username="doc3@test", role="doctor")
    admin = models.User(id="admin-1", username="admin@test", role="admin")
    verifier = models.User(id="ver-1", username="ver@test", role="verifier")
    patients = [models.User(id=f"pat-{i}", username=f"pat{i}@test", role="patient") for i in range(1, 5)]
    db.add_all([doctor, other_doctor, pending_doctor, admin, verifier, *patients])
    db.add_all([
        models.SpecialistProfile(user_id="doc-1", is_verified=True),
        models.SpecialistProfile(user_id="doc-2", is_verified=True),
        models.SpecialistProfile(user_id="doc-3", is_verified=False),
    ])
    db.add_all([models.PatientProfile(user_id=p.id, full_name=f"Paciente {p.id}") for p in patients])
    # pat-1: cita de la agenda del médico guardada con su id
    # pat-2: cita guardada con el username del paciente y el username del médico
    db.add_all([
        models.Appointment(doctor_id="doc-1", patient_id="pat-1", patient_name="P1",
                           appointment_date="2026-10-01", appointment_time="10:00", reason="control"),
        models.Appointment(doctor_id="doc1@test", patient_id="pat2@test", patient_name="P2",
                           appointment_date="2026-10-01", appointment_time="11:00", reason="control"),
        # la cita con pending_doctor no debe darle acceso mientras no esté verificado
        models.Appointment(doctor_id="doc-3", patient_id="pat-1", patient_name="P1",
                           appointment_date="2026-10-02", appointment_time="10:00", reason="control"),
    ])
    # pat-3: reserva hecha por el paciente desde "Especialistas"
    profile = models.DoctorProfile(user_id="doc-1", full_name="Dr. Uno")
    db.add(profile)
    await db.flush()
    start = datetime(2026, 10, 3, 9, 0, tzinfo=timezone.utc)
    db.add(models.ScheduledAppointment(patient_id="pat-3", doctor_id=profile.id, scheduled_at=start,
                                       scheduled_end=start + timedelta(minutes=30),
                                       modality=models.Modality.video))
    # pat-4: sin relación con ningún médico
    await db.commit()
    return {u.id: u for u in [doctor, other_doctor, pending_doctor, admin, verifier, *patients]}


@pytest.mark.asyncio
async def test_doctor_patient_ids(db, world):
    assert await security.get_doctor_patient_ids(db, world["doc-1"]) >= {"pat-1", "pat-2", "pat-3"}
    assert "pat-4" not in await security.get_doctor_patient_ids(db, world["doc-1"])
    assert not await security.get_doctor_patient_ids(db, world["doc-2"])


@pytest.mark.asyncio
@pytest.mark.parametrize("user_id, patient_id, expected", [
    ("doc-1", "pat-1", True),    # cita por id
    ("doc-1", "pat-2", True),    # cita por username
    ("doc-1", "pat-3", True),    # reserva del paciente
    ("doc-1", "pat-4", False),   # sin relación
    ("doc-2", "pat-1", False),   # médico verificado pero ajeno
    ("doc-3", "pat-1", False),   # médico con cita pero sin verificar
    ("admin-1", "pat-4", True),
    ("ver-1", "pat-1", False),
    ("pat-1", "pat-1", True),    # el propio paciente
    ("pat-1", "pat-2", False),
    ("doc-1", None, False),
])
async def test_can_access_patient_data(db, world, user_id, patient_id, expected):
    assert await security.can_access_patient_data(db, world[user_id], patient_id) is expected


@pytest.mark.asyncio
async def test_resolve_target_patient_id(db, world):
    assert await security.resolve_target_patient_id(db, world["doc-1"], "pat-1") == "pat-1"
    assert await security.resolve_target_patient_id(db, world["doc-1"], None) == "doc-1"
    # un paciente que pasa otro patient_id sigue operando sobre sí mismo
    assert await security.resolve_target_patient_id(db, world["pat-1"], "pat-2") == "pat-1"
    with pytest.raises(HTTPException) as exc:
        await security.resolve_target_patient_id(db, world["doc-1"], "pat-4")
    assert exc.value.status_code == 403


@pytest_asyncio.fixture
async def client(session_maker, world):
    import database
    from main import app

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[database.get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def auth(user_id):
    return {"Authorization": f"Bearer {security.create_access_token({'sub': user_id})}"}


@pytest.mark.asyncio
async def test_doctor_patient_list_only_shows_own_patients(client):
    res = await client.get("/api/doctor/patients", headers=auth("doc-1"))
    assert res.status_code == 200
    assert {p["user_id"] for p in res.json()} == {"pat-1", "pat-2", "pat-3"}

    res = await client.get("/api/doctor/patients", headers=auth("admin-1"))
    assert {p["user_id"] for p in res.json()} == {"pat-1", "pat-2", "pat-3", "pat-4"}


@pytest.mark.asyncio
@pytest.mark.parametrize("path", [
    "/api/doctor/patients/{pid}",
    "/api/patients/{pid}/history",
    "/api/surveillance/calendar?patient_id={pid}",
    "/api/caregiver/config?patient_id={pid}",
])
async def test_patient_endpoints_enforce_relationship(client, path):
    ok = await client.get(path.format(pid="pat-1"), headers=auth("doc-1"))
    assert ok.status_code == 200, ok.text
    denied = await client.get(path.format(pid="pat-4"), headers=auth("doc-1"))
    assert denied.status_code == 403, denied.text


@pytest.mark.asyncio
async def test_doctor_cannot_lookup_patient_by_name(client):
    res = await client.get("/api/doctor/patients/Paciente pat-4", headers=auth("doc-1"))
    assert res.status_code == 403
