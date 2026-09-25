"""Traducción automática de la interfaz: se guarda por bloques y se reanuda sin duplicar trabajo."""
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

import database
import models
from routers import i18n


@pytest.fixture
def fake_env(session_maker, monkeypatch):
    source = {f"key{i}": f"Text {i}" for i in range(10)}
    calls = []

    async def fake_translate(client, lang, chunk):
        calls.append(sorted(chunk))
        await asyncio.sleep(0.01)
        return {k: f"[{lang}] {v}" for k, v in chunk.items()}

    monkeypatch.setattr(database, "AsyncSessionLocal", session_maker)
    monkeypatch.setattr(i18n, "_load_source", lambda: source)
    monkeypatch.setattr(i18n, "_translate_chunk", fake_translate)
    monkeypatch.setattr(i18n, "CHUNK_SIZE", 3)
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    i18n._tasks.clear()
    i18n._last_attempt.clear()
    return source, calls


async def _row(session_maker, lang):
    async with session_maker() as s:
        return await s.get(models.UITranslation, lang)


@pytest.mark.asyncio
async def test_generate_saves_every_chunk(session_maker, fake_env):
    source, calls = fake_env
    await i18n._generate("eu", source)
    row = await _row(session_maker, "eu")
    assert row.strings == {k: f"[eu] {v}" for k, v in source.items()}
    assert len(calls) == 4  # 10 claves en bloques de 3


@pytest.mark.asyncio
async def test_partial_progress_survives_failed_chunks(session_maker, fake_env, monkeypatch):
    source, _ = fake_env

    async def flaky(client, lang, chunk):
        return {} if "key9" in chunk else {k: "ok" for k in chunk}

    monkeypatch.setattr(i18n, "_translate_chunk", flaky)
    await i18n._generate("eu", source)
    row = await _row(session_maker, "eu")
    assert len(row.strings) == 9 and "key9" not in row.strings


@pytest.mark.asyncio
async def test_endpoint_pending_then_ready(session_maker, fake_env):
    from main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        first = await c.get("/api/i18n/eu")
        assert first.status_code == 202
        await i18n._tasks["eu"]
        ready = await c.get("/api/i18n/eu")
    body = ready.json()
    assert body["status"] == "ready" and body["complete"] is True and len(body["strings"]) == 10


@pytest.mark.asyncio
async def test_other_worker_generating_is_not_duplicated(session_maker, fake_env):
    from main import app

    source, calls = fake_env
    # Otro worker reclamó el idioma hace un momento y lleva parte traducida
    async with session_maker() as s:
        s.add(models.UITranslation(lang="eu", strings={"key0": "[eu] Text 0"}))
        await s.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        res = await c.get("/api/i18n/eu")
    body = res.json()
    assert body["status"] == "ready" and body["pending"] is True and body["complete"] is False
    assert "eu" not in i18n._tasks and not calls
