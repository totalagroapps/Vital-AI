"""
Consistencia de medicación: el pasaporte / QR de urgencias debe mostrar los tratamientos
de "Mi salud" aunque el campo de texto de la ficha esté vacío o diga "Ninguna".
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import models
from services.active_medications import merge_medications, get_active_medications


class R:
    def __init__(self, name, dosage=None):
        self.medication_name = name
        self.dosage = dosage


@pytest.mark.parametrize("text,reminders,expected", [
    ("Ninguna", [R("Betaloc", "100 mg")], ["Betaloc 100 mg"]),
    (None, [], []),
    ("No registrada", [], []),
    ("Ibuprofeno, Omeprazol", [], ["Ibuprofeno", "Omeprazol"]),
    ("betaloc 100 mg, Omeprazol", [R("Betaloc", "100 mg")], ["Betaloc 100 mg", "Omeprazol"]),
    ("Betaloc", [R("Betaloc 100 mg")], ["Betaloc 100 mg"]),
    ("", [R("Oxprelol 50 mg", "50 mg")], ["Oxprelol 50 mg"]),
])
def test_merge_medications(text, reminders, expected):
    assert merge_medications(text, reminders) == expected


USER = "u-meds-1"
REMINDERS = [("Betaloc", "100 mg"), ("Dorzolamidum", "10 mg"), ("Cimetidine", "50 mg"), ("Oxprelol", "50 mg")]


@pytest_asyncio.fixture
async def seeded(db):
    db.add(models.PatientProfile(user_id=USER, full_name="Test", current_medications="Ninguna"))
    for name, dose in REMINDERS:
        db.add(models.MedicationReminder(user_id=USER, medication_name=name, dosage=dose, is_active=True))
    db.add(models.MedicationReminder(user_id=USER, medication_name="Retirado", dosage="1 mg", is_active=False))
    db.add(models.MedicationReminder(user_id="otro", medication_name="Ajeno", is_active=True))
    await db.commit()
    return db


@pytest.mark.asyncio
async def test_active_medications_come_from_reminders(seeded):
    meds = await get_active_medications(seeded, USER, "Ninguna")
    assert meds == [f"{n} {d}" for n, d in REMINDERS]


@pytest.mark.asyncio
async def test_public_emergency_endpoint_matches_treatments(session_maker, seeded):
    """El QR de urgencias y /api/medications deben listar los mismos fármacos activos."""
    from main import app
    from database import get_db
    from security import get_current_user_id

    async def _db():
        async with session_maker() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: USER
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            emergency = (await client.get(f"/api/public/emergency/{USER}")).json()
            treatments = (await client.get("/api/medications")).json()
    finally:
        app.dependency_overrides.clear()

    treatment_names = {r["medication_name"] for r in treatments["reminders"]}
    assert treatment_names == {n for n, _ in REMINDERS}
    assert len(emergency["active_medications"]) == len(treatment_names)
    for name in treatment_names:
        assert any(m.startswith(name) for m in emergency["active_medications"])
    assert "Ninguna" not in emergency["current_medications"]
