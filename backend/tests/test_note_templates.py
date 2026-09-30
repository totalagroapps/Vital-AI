"""
Plantillas de informe del médico (estilo MedAlly): sintaxis, relleno con IA y CRUD por médico.
"""
import json
from types import SimpleNamespace

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import models
import security
from services import note_templates
from services.note_templates import parse_fields


BODY = (
    "TA [TA] mmHg. Auscultación {rítmica|arrítmica}. ((recordar SCORE2))\n"
    "AINE: {no|sí, [AINE] cada [frecuencia]}.{| Con edemas.} Control en [tiempo]."
)


def test_parse_fields_order_and_nested():
    fields = parse_fields(BODY)
    assert [(f["id"], f["type"]) for f in fields] == [
        ("1", "field"), ("2", "choice"), ("3", "choice"), ("4", "field"), ("5", "field"), ("6", "choice"), ("7", "field"),
    ]
    assert fields[0]["label"] == "TA"
    assert fields[1]["options"] == ["rítmica", "arrítmica"]
    assert fields[3] == {"id": "4", "type": "field", "label": "AINE", "context": "AINE:", "only_if": {"choice": "3", "option": 1}}
    assert fields[5]["options"] == ["", "Con edemas."]
    assert fields[6]["label"] == "tiempo"


def test_braces_without_pipe_are_text():
    assert parse_fields("Dosis {sin barra} y [campo]") == [
        {"id": "1", "type": "field", "label": "campo", "context": "Dosis {sin barra} y"},
    ]


@pytest.mark.parametrize("value,context,expected", [
    ("en un mes", "Dieta baja en sal. Control en", "un mes"),
    ("un mes", "Control en", "un mes"),
    ("TA 150/90", "EXPLORACIÓN: TA", "150/90"),
    ("enalapril 20 mg", "Tratamiento actual:", "enalapril 20 mg"),
    ("8 días", "", "8 días"),
])
def test_strip_repeated_context(value, context, expected):
    assert note_templates._strip_repeated_context(value, context) == expected


@pytest.mark.asyncio
async def test_fill_without_openai_key_returns_nothing(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert await note_templates.fill_template_with_llm(BODY, "TA 140/90") == {}


@pytest.mark.asyncio
async def test_fill_validates_llm_output(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    llm_values = {
        "1": "140/90",
        "2": "Arrítmica",          # se normaliza a la opción → índice 1
        "3": "sí, [AINE] cada [frecuencia]",
        "4": "ibuprofeno 600 mg",
        "5": "",                   # vacío: se deja para el médico
        "6": "inventada",          # no es una opción: se ignora
        "7": None,
    }

    class FakeCompletions:
        async def create(self, **kwargs):
            content = json.dumps({"values": llm_values})
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    class FakeClient:
        def __init__(self, api_key):
            self.chat = SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setattr(note_templates, "AsyncOpenAI", FakeClient)
    values = await note_templates.fill_template_with_llm(BODY, "TA 140/90, arrítmica, toma ibuprofeno 600")
    assert values == {"1": "140/90", "2": "1", "3": "1", "4": "ibuprofeno 600 mg"}


@pytest_asyncio.fixture
async def client(session_maker, db):
    import database
    from main import app

    db.add_all([
        models.User(id="doc-a", username="a@test", role="doctor"),
        models.User(id="doc-b", username="b@test", role="doctor"),
        models.User(id="pat-a", username="p@test", role="patient"),
    ])
    await db.commit()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[database.get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def auth(uid):
    return {"Authorization": f"Bearer {security.create_access_token({'sub': uid})}"}


@pytest.mark.asyncio
async def test_template_crud_is_per_doctor(client):
    res = await client.post("/api/scribe/my-templates", headers=auth("doc-a"), json={"name": "HTA", "shortcut": " /HTA ", "body": BODY})
    assert res.status_code == 200
    tpl = res.json()
    assert tpl["shortcut"] == "hta"

    # Atajo repetido para el mismo médico → 409; otro médico sí puede usarlo
    res = await client.post("/api/scribe/my-templates", headers=auth("doc-a"), json={"name": "Otra", "shortcut": "hta", "body": "x"})
    assert res.status_code == 409
    res = await client.post("/api/scribe/my-templates", headers=auth("doc-b"), json={"name": "HTA B", "shortcut": "hta", "body": "x"})
    assert res.status_code == 200

    res = await client.get("/api/scribe/my-templates", headers=auth("doc-a"))
    assert [t["name"] for t in res.json()] == ["HTA"]

    # Otro médico no puede editar ni borrar la plantilla
    assert (await client.put(f"/api/scribe/my-templates/{tpl['id']}", headers=auth("doc-b"), json={"name": "x", "body": "x"})).status_code == 404
    assert (await client.delete(f"/api/scribe/my-templates/{tpl['id']}", headers=auth("doc-b"))).status_code == 404

    res = await client.put(f"/api/scribe/my-templates/{tpl['id']}", headers=auth("doc-a"), json={"name": "HTA v2", "shortcut": "hta", "body": BODY})
    assert res.json()["name"] == "HTA v2"
    assert (await client.delete(f"/api/scribe/my-templates/{tpl['id']}", headers=auth("doc-a"))).status_code == 200
    assert (await client.get("/api/scribe/my-templates", headers=auth("doc-a"))).json() == []


@pytest.mark.asyncio
async def test_patients_cannot_use_templates(client):
    assert (await client.get("/api/scribe/my-templates", headers=auth("pat-a"))).status_code == 403
    res = await client.post("/api/scribe/fill_template", headers=auth("pat-a"), json={"template_body": BODY, "consultation_text": "texto de prueba"})
    assert res.status_code == 403
    # Nota SOAP, transcripción y receta son exclusivas del lado médico (MDR / SaMD)
    res = await client.post("/api/scribe/generate_soap", headers=auth("pat-a"), json={"consultation_text": "texto de prueba"})
    assert res.status_code == 403
    res = await client.post("/api/scribe/generate_prescription", headers=auth("pat-a"), json={"plan": "paracetamol"})
    assert res.status_code == 403
    res = await client.post("/api/scribe/transcribe_audio", headers=auth("pat-a"), files={"file": ("a.ogg", b"x", "audio/ogg")})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_fill_endpoint_reports_ai_availability(client, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    res = await client.post("/api/scribe/fill_template", headers=auth("doc-a"), json={"template_body": BODY, "consultation_text": "TA 140/90"})
    assert res.status_code == 200
    assert res.json() == {"values": {}, "field_count": 7, "ai_available": False}
