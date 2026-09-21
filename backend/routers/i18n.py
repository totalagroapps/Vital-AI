"""Traducción de la interfaz a cualquier idioma con IA, con caché compartida en base de datos.

GET /api/i18n/{lang}
  - 200 {"status": "static"}   idioma con diccionario manual en el frontend (es, en, fr, ar)
  - 200 {"status": "ready", "strings": {...}}   traducción disponible (puede ser parcial: el frontend rellena con inglés)
  - 202 {"status": "pending"}  se está generando; el frontend vuelve a consultar
  - 404 idioma no soportado / 429 límite diario de idiomas nuevos / 503 sin clave de IA
"""
import asyncio
import json
import logging
import os
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from sqlalchemy import func, select

import database
import models
from services.language_service import (
    LANGUAGES, STATIC_UI_LANGUAGES, language_label, normalize_language,
)

logger = logging.getLogger("media_v2.i18n")
router = APIRouter()

SOURCE_PATH = Path(__file__).resolve().parent.parent / "data" / "ui_source_en.json"
MAX_NEW_LANGUAGES_PER_DAY = int(os.getenv("MAX_NEW_UI_LANGUAGES_PER_DAY", "8"))
CHUNK_SIZE = 70
CONCURRENCY = 4
TRANSLATION_MODEL = os.getenv("UI_TRANSLATION_MODEL", "gpt-4o-mini")

_tasks: Dict[str, asyncio.Task] = {}
_last_attempt: Dict[str, float] = {}
_PLACEHOLDER_RE = re.compile(r"\{[^{}]*\}")


def _load_source() -> Dict[str, str]:
    try:
        return json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.error("No se pudo leer %s: %s", SOURCE_PATH, exc)
        return {}


def _valid(source: str, translated) -> bool:
    """Acepta la traducción solo si conserva exactamente los marcadores {0}, {nombre}…"""
    return (
        isinstance(translated, str)
        and translated.strip() != ""
        and sorted(_PLACEHOLDER_RE.findall(source)) == sorted(_PLACEHOLDER_RE.findall(translated))
    )


async def _translate_chunk(client: AsyncOpenAI, lang: str, chunk: Dict[str, str]) -> Dict[str, str]:
    label = language_label(lang)
    system = (
        f"You are a professional localizer for a telemedicine app (MIVOR.ai). Translate the UI strings from English "
        f"into {label}. Rules: keep every placeholder such as {{0}}, {{1}} or {{name}} exactly as written; keep "
        f"emojis, markdown, line breaks and the brand name MIVOR.ai unchanged; keep UPPERCASE strings in uppercase "
        f"when the script has case; use natural, concise, friendly wording suited to buttons and short labels; use "
        f"standard medical terminology of that language. Reply with ONLY a JSON object with exactly the same keys "
        f"as the input and the translated strings as values."
    )
    for attempt in range(2):
        try:
            resp = await client.chat.completions.create(
                model=TRANSLATION_MODEL,
                messages=[{"role": "system", "content": system},
                          {"role": "user", "content": json.dumps(chunk, ensure_ascii=False)}],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            data = json.loads(resp.choices[0].message.content)
            return {k: data[k] for k in chunk if k in data and _valid(chunk[k], data[k])}
        except Exception as exc:
            logger.warning("Traducción %s (intento %d) falló: %s", lang, attempt + 1, exc)
    return {}


async def _generate(lang: str, keys: Dict[str, str]) -> None:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    items = list(keys.items())
    chunks = [dict(items[i:i + CHUNK_SIZE]) for i in range(0, len(items), CHUNK_SIZE)]
    sem = asyncio.Semaphore(CONCURRENCY)

    async def run(chunk):
        async with sem:
            return await _translate_chunk(client, lang, chunk)

    results = await asyncio.gather(*(run(c) for c in chunks), return_exceptions=True)
    merged: Dict[str, str] = {}
    for r in results:
        if isinstance(r, dict):
            merged.update(r)
    if not merged:
        logger.error("Traducción de %s sin resultados", lang)
        return

    async with database.AsyncSessionLocal() as session:
        row = await session.get(models.UITranslation, lang)
        if row:
            row.strings = {**(row.strings or {}), **merged}
        else:
            session.add(models.UITranslation(lang=lang, strings=merged))
        await session.commit()
    logger.info("Interfaz traducida a %s: %d/%d cadenas", lang, len(merged), len(items))


def _start(lang: str, keys: Dict[str, str]) -> None:
    task = _tasks.get(lang)
    if task and not task.done():
        return
    _last_attempt[lang] = time.time()
    _tasks[lang] = asyncio.create_task(_generate(lang, keys))


@router.get("/api/i18n/{lang}")
async def get_ui_translation(lang: str):
    primary = normalize_language(lang, "")
    if primary in STATIC_UI_LANGUAGES:
        return {"status": "static", "lang": primary}
    if primary not in LANGUAGES:
        raise HTTPException(status_code=404, detail="Idioma no soportado")

    source = _load_source()
    if not source:
        raise HTTPException(status_code=503, detail="Diccionario base no disponible")

    async with database.AsyncSessionLocal() as session:
        row = await session.get(models.UITranslation, primary)
        strings = dict(row.strings or {}) if row else {}
        missing = {k: v for k, v in source.items() if k not in strings}

        running = primary in _tasks and not _tasks[primary].done()

        cooldown = 3600 if strings else 300  # no reintentar en bucle cadenas que la IA no traduce bien
        recently_tried = (time.time() - _last_attempt.get(primary, 0)) < cooldown

        if missing and not running and not recently_tried:
            if not os.getenv("OPENAI_API_KEY"):
                if strings:
                    return {"status": "ready", "lang": primary, "strings": strings}
                raise HTTPException(status_code=503, detail="Traducción automática no disponible")
            if not row:
                since = datetime.now(timezone.utc) - timedelta(days=1)
                created_today = await session.scalar(
                    select(func.count()).select_from(models.UITranslation).where(models.UITranslation.created_at >= since)
                )
                in_flight = len([t for t in _tasks.values() if not t.done()])
                if (created_today or 0) + in_flight >= MAX_NEW_LANGUAGES_PER_DAY:
                    return JSONResponse({"status": "unavailable"}, status_code=429)
            _start(primary, missing)
            running = True

    if not strings:
        if running:
            return JSONResponse({"status": "pending", "lang": primary}, status_code=202)
        return JSONResponse({"status": "failed", "lang": primary}, status_code=503)
    return {"status": "ready", "lang": primary, "strings": strings, "complete": not missing, "pending": running}
