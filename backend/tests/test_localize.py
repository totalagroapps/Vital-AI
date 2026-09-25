"""Textos que redacta el backend en español: se devuelven en el idioma de la interfaz sin tocar los códigos."""
import pytest

import models
from routers import clinical_calculators, cognitive_games, scribe
from services import localize_service


@pytest.fixture
def fake_ai(monkeypatch):
    """Sustituye la llamada a la IA por un traductor determinista y cuenta las llamadas."""
    calls = []

    class FakeCompletions:
        async def create(self, **kwargs):
            import json
            payload = json.loads(kwargs["messages"][1]["content"])
            calls.append(payload)
            translated = {k: f"[EN] {v}" for k, v in payload.items()}

            class Msg:
                content = json.dumps(translated)

            class Choice:
                message = Msg()

            class Resp:
                choices = [Choice()]

            return Resp()

    class FakeClient:
        def __init__(self, *a, **kw):
            self.chat = type("Chat", (), {"completions": FakeCompletions()})()

    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(localize_service, "AsyncOpenAI", FakeClient)
    localize_service._cache.clear()
    return calls


@pytest.mark.asyncio
async def test_spanish_is_untouched(fake_ai):
    data = {"interpretation": "Riesgo bajo", "risk_category": "Bajo"}
    out = await localize_service.localize_fields(dict(data), "es", ["interpretation"])
    assert out == data
    assert fake_ai == []


@pytest.mark.asyncio
async def test_without_ai_key_returns_original(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    localize_service._cache.clear()
    out = await localize_service.localize_fields({"interpretation": "Riesgo bajo"}, "en", ["interpretation"])
    assert out == {"interpretation": "Riesgo bajo"}


@pytest.mark.asyncio
async def test_translates_only_listed_fields_and_caches(fake_ai):
    data = {
        "risk_category": "Bajo",
        "interpretation": "Riesgo bajo",
        "clinical_guidance": ["Caminar a diario", "Dieta mediterránea"],
        "screenings": [{"status": "al_dia", "title": "Mamografía"}],
    }
    fields = ["interpretation", "clinical_guidance", "screenings.[].title"]
    out = await localize_service.localize_fields(data, "en-GB", fields)
    assert out["interpretation"] == "[EN] Riesgo bajo"
    assert out["clinical_guidance"] == ["[EN] Caminar a diario", "[EN] Dieta mediterránea"]
    assert out["screenings"][0]["title"] == "[EN] Mamografía"
    assert out["risk_category"] == "Bajo" and out["screenings"][0]["status"] == "al_dia"
    assert len(fake_ai) == 1
    again = await localize_service.localize_fields({"interpretation": "Riesgo bajo"}, "en", ["interpretation"])
    assert again["interpretation"] == "[EN] Riesgo bajo"
    assert len(fake_ai) == 1  # servido desde la caché


@pytest.mark.asyncio
async def test_score2_keeps_category_code_and_adds_label(fake_ai):
    payload = clinical_calculators.Score2Request(
        age=60, gender="male", systolic_bp=140, is_smoker=True, total_cholesterol=220, hdl_cholesterol=45,
    )
    res = await clinical_calculators.calculate_score2(payload, lang="en")
    assert not res.risk_category.startswith("[EN]")  # /ldl_gap lo vuelve a recibir en español
    assert res.risk_category_label == f"[EN] {res.risk_category}"
    assert res.interpretation.startswith("[EN]")


@pytest.mark.asyncio
async def test_prepare_consultation_follows_language(fake_ai):
    req = scribe.PrepareConsultationRequest(main_concerns="dolor de cabeza", language="en")
    res = await scribe.prepare_consultation(req)
    assert res.elevator_pitch.startswith("[EN]")
    assert all(q.startswith("[EN]") for q in res.priority_questions)


@pytest.mark.asyncio
async def test_soap_fallback_follows_language(fake_ai):
    req = scribe.GenerateSoapRequest(consultation_text="Paciente con tos y catarro", template_id="general", language="en")
    res = await scribe.localized_fallback_soap(req)
    assert res.template_id == "general"
    assert res.soap_note.subjective.startswith("[EN]")
    assert all(item.description.startswith("[EN]") for item in res.suggested_icd10)
    assert all(code.code == code.code.strip() and not code.code.startswith("[EN]") for code in res.suggested_icd10)


@pytest.mark.asyncio
async def test_games_history_returns_message_code(db):
    user = models.User(id="pat-g", username="g@test", role="patient")
    db.add(user)
    await db.commit()
    res = await cognitive_games.get_game_history(db=db, current_user=user)
    assert res.cognitive_wellness_code == "welcome"


@pytest.mark.asyncio
async def test_auto_fill_never_uses_other_patients_documents(db):
    me = models.User(id="pat-a", username="a@test", role="patient")
    other = models.User(id="pat-b", username="b@test", role="patient")
    db.add_all([me, other])
    db.add(models.DocumentMetadata(user_id="pat-b", filename="analitica_b.pdf",
                                   extracted_text="Colesterol total: 240 HDL: 40 LDL: 170"))
    await db.commit()
    res = await clinical_calculators.auto_fill_from_records(patient_id=None, db=db, current_user=me, lang="es")
    assert res.total_cholesterol is None and res.current_ldl is None
    assert "analitica_b.pdf" not in res.data_sources
