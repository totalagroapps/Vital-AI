"""Traducción al idioma del usuario de los textos que el backend redacta en español.

Las calculadoras clínicas, los cribados, el preparador de consulta y otros módulos generan sus textos con
reglas deterministas en español. Este servicio los traduce con IA al idioma de la interfaz:

  - Solo toca los campos de texto que se indiquen (nunca códigos que el frontend compara, como `status`).
  - En español no hace nada. Sin clave de IA, o si la IA falla, devuelve el texto original.
  - Guarda en memoria cada traducción (idioma, texto): los mensajes se repiten mucho entre pacientes.
"""
import json
import logging
import os
from collections import OrderedDict
from typing import Any, Dict, Iterable, List, Optional

from fastapi import Header, Query
from openai import AsyncOpenAI

from services.language_service import language_label, normalize_language

logger = logging.getLogger("media_v2.localize")

SOURCE_LANGUAGE = "es"
MODEL = os.getenv("CONTENT_TRANSLATION_MODEL", os.getenv("UI_TRANSLATION_MODEL", "gpt-4o-mini"))
TIMEOUT_SECONDS = float(os.getenv("CONTENT_TRANSLATION_TIMEOUT", "25"))
CACHE_MAX = int(os.getenv("CONTENT_TRANSLATION_CACHE", "5000"))

_cache: "OrderedDict[tuple, str]" = OrderedDict()


def ui_language(
    lang: Optional[str] = Query(None, description="Idioma de la interfaz (BCP-47). Por defecto, Accept-Language"),
    accept_language: Optional[str] = Header(None),
) -> str:
    """Dependencia FastAPI: idioma en que se deben devolver los textos."""
    raw = lang or (accept_language.split(",")[0].split(";")[0].strip() if accept_language else None)
    return normalize_language(raw, SOURCE_LANGUAGE)


def _cache_get(lang: str, text: str) -> Optional[str]:
    key = (lang, text)
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    return None


def _cache_put(lang: str, text: str, translated: str) -> None:
    _cache[(lang, text)] = translated
    _cache.move_to_end((lang, text))
    while len(_cache) > CACHE_MAX:
        _cache.popitem(last=False)


def _looks_translatable(text: Any) -> bool:
    return isinstance(text, str) and any(ch.isalpha() for ch in text)


async def translate_texts(texts: Iterable[str], lang: str) -> Dict[str, str]:
    """Devuelve {texto_original: traducción}. Lo que no se pueda traducir se devuelve igual."""
    unique = [t for t in dict.fromkeys(texts) if _looks_translatable(t)]
    result: Dict[str, str] = {t: t for t in unique}
    lang = normalize_language(lang, SOURCE_LANGUAGE)
    if lang == SOURCE_LANGUAGE or not unique:
        return result

    missing = []
    for t in unique:
        cached = _cache_get(lang, t)
        if cached is not None:
            result[t] = cached
        else:
            missing.append(t)
    if not missing or not os.getenv("OPENAI_API_KEY"):
        return result

    payload = {str(i): t for i, t in enumerate(missing)}
    system = (
        f"You are a professional medical translator for the health app MIVOR.ai. Translate each JSON value from "
        f"Spanish into {language_label(lang)}. Keep numbers, units (mg/dL, mmHg, mL/min/1.73 m²), percentages, "
        f"dates, drug names, guideline names (ESC, ESGE, KDIGO, SCORE2, CKD-EPI, TUG, Barthel), emojis and the brand "
        f"MIVOR.ai unchanged. Use standard medical terminology of the target language and a clear, patient-friendly "
        f"tone. Reply with ONLY a JSON object with exactly the same keys."
    )
    try:
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=TIMEOUT_SECONDS)
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        data = json.loads(resp.choices[0].message.content)
        for i, original in enumerate(missing):
            translated = data.get(str(i))
            if isinstance(translated, str) and translated.strip():
                result[original] = translated
                _cache_put(lang, original, translated)
    except Exception as exc:  # la respuesta clínica nunca debe fallar por la traducción
        logger.warning("No se pudieron traducir %d textos a %s: %s", len(missing), lang, exc)
    return result


def _collect(obj: Any, path: List[str], out: List[str]) -> None:
    if obj is None:
        return
    if not path:
        if isinstance(obj, list):
            out.extend(x for x in obj if _looks_translatable(x))
        elif _looks_translatable(obj):
            out.append(obj)
        return
    head, rest = path[0], path[1:]
    if head == "[]":
        for item in obj if isinstance(obj, list) else []:
            _collect(item, rest, out)
    elif isinstance(obj, dict):
        _collect(obj.get(head), rest, out)


def _apply(obj: Any, path: List[str], mapping: Dict[str, str]) -> Any:
    if obj is None:
        return obj
    if not path:
        if isinstance(obj, list):
            return [mapping.get(x, x) if isinstance(x, str) else x for x in obj]
        return mapping.get(obj, obj) if isinstance(obj, str) else obj
    head, rest = path[0], path[1:]
    if head == "[]":
        return [_apply(item, rest, mapping) for item in obj] if isinstance(obj, list) else obj
    if isinstance(obj, dict) and head in obj:
        obj[head] = _apply(obj[head], rest, mapping)
    return obj


async def localize_fields(data: Dict[str, Any], lang: str, fields: Iterable[str]) -> Dict[str, Any]:
    """Traduce en `data` los campos indicados. Rutas con puntos; `[]` recorre listas.

    Ejemplo: localize_fields(resp, "en", ["interpretation", "clinical_guidance", "screenings.[].title"])
    Un campo que es una lista de textos se traduce entero (no hace falta `[]` al final).
    """
    if normalize_language(lang, SOURCE_LANGUAGE) == SOURCE_LANGUAGE:
        return data
    paths = [f.split(".") for f in fields]
    texts: List[str] = []
    for p in paths:
        _collect(data, p, texts)
    mapping = await translate_texts(texts, lang)
    for p in paths:
        _apply(data, p, mapping)
    return data
