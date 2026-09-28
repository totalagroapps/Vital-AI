"""
Plantillas de informe del médico (estilo MedAlly) para MIVOR Scribe.

Sintaxis del cuerpo de la plantilla (debe coincidir con frontend/src/utils/noteTemplate.js):
  {opción A|opción B|opción C}  multi-opción: se elige una y las demás desaparecen ({|texto} = texto opcional)
  [etiqueta]                    campo a rellenar (TA, peso, plan...); también puede ir dentro de una opción
  ((texto))                     ayuda o recordatorio para el médico: no se copia al informe

Ids: cada multi-opción y cada campo recibe un número por orden de aparición desde 1. Los campos que están
dentro de una opción se numeran justo después de su multi-opción. El valor de una multi-opción es el
índice (desde 0) de la opción elegida; el de un campo, su texto.
"""
import json
import logging
import os
import re
from typing import Dict, List, Optional

from openai import AsyncOpenAI

from services.language_service import language_directive

logger = logging.getLogger("scribe")

TOKEN_RE = re.compile(r"\(\(([\s\S]*?)\)\)|\{([^{}]*\|[^{}]*)\}|\[([^\[\]\n]+)\]")
FIELD_RE = re.compile(r"\[([^\[\]\n]+)\]")

MAX_TEMPLATE_CHARS = 20000


def parse_fields(body: str) -> List[dict]:
    """Multi-opciones y campos rellenables, en orden, con el texto que los precede como contexto."""
    fields = []
    next_id = 1
    for match in TOKEN_RE.finditer(body or ""):
        hint, choice, label = match.groups()
        if hint is not None:
            continue
        line_start = body.rfind("\n", 0, match.start()) + 1
        context = TOKEN_RE.sub("…", body[line_start:match.start()]).strip()[-120:]
        if choice is not None:
            options = choice.split("|")
            choice_id = str(next_id)
            next_id += 1
            fields.append({
                "id": choice_id,
                "type": "choice",
                "options": [o.strip() for o in options],
                "context": context,
            })
            for index, option in enumerate(options):
                for nested in FIELD_RE.finditer(option):
                    fields.append({
                        "id": str(next_id),
                        "type": "field",
                        "label": nested.group(1).strip(),
                        "context": context,
                        "only_if": {"choice": choice_id, "option": index},
                    })
                    next_id += 1
        else:
            fields.append({"id": str(next_id), "type": "field", "label": label.strip(), "context": context})
            next_id += 1
    return fields


def _strip_repeated_context(value: str, context: str) -> str:
    """Quita del valor la última palabra del contexto si la IA la repitió («Control en» + «en un mes»)."""
    words = re.findall(r"\w+", context or "")
    if not words or len(words[-1]) < 2:
        return value
    last = words[-1].lower()
    parts = value.split(maxsplit=1)
    if len(parts) == 2 and parts[0].lower().rstrip(":") == last:
        return parts[1]
    return value


def _match_option(value, options: List[str]) -> Optional[int]:
    if isinstance(value, int) and 0 <= value < len(options):
        return value
    wanted = str(value or "").strip().lower()
    for index, option in enumerate(options):
        if option.lower() == wanted:
            return index
    return None


async def fill_template_with_llm(
    body: str,
    consultation_text: str,
    patient_context: str = "",
    language: Optional[str] = None,
) -> Dict[str, str]:
    """
    Devuelve {id: valor} (índice de la opción como texto para las multi-opciones). Solo rellena lo que
    aparece en el dictado; lo demás se deja para el médico. Sin OPENAI_API_KEY no rellena nada.
    """
    fields = parse_fields(body)
    openai_key = os.getenv("OPENAI_API_KEY")
    if not fields or not openai_key:
        return {}

    system_prompt = """
Eres MIVOR Scribe, asistente de documentación clínica. El médico tiene una plantilla de informe con campos
y te da el dictado o las notas de la consulta. Rellena cada campo SOLO con información presente en el dictado
o en los datos del paciente. No inventes datos, cifras ni diagnósticos.

Tipos de campo:
- "choice": devuelve EXACTAMENTE el texto de una de las opciones de "options" (puede ser "" si esa es una opción),
  o null si el dictado no permite elegir (se dejará la opción por defecto).
- "field": devuelve un valor breve y clínico para "label" (p. ej. "145/88" para TA, "8 días" para duración),
  o "" si no se menciona. El valor se inserta justo después del texto de "context": no repitas sus últimas
  palabras (si "context" termina en "Control en", responde "un mes", no "en un mes"). Si tiene "only_if", rellénalo solo cuando hayas
  elegido esa opción (índice desde 0) en esa multi-opción.

Responde ÚNICAMENTE con un JSON: {"values": {"<id>": <valor>, ...}} con todos los ids.
""" + language_directive(language, None, 'clinician')

    user_prompt = (
        f"{patient_context}\n"
        f"Campos de la plantilla:\n{json.dumps(fields, ensure_ascii=False)}\n\n"
        f"Dictado / notas de la consulta:\n{consultation_text}"
    )

    try:
        client = AsyncOpenAI(api_key=openai_key)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=2000,
        )
        raw = json.loads(resp.choices[0].message.content).get("values", {})
    except Exception as e:
        logger.error("Error invoking OpenAI for template filling: %r", e)
        return {}
    if not isinstance(raw, dict):
        return {}

    values = {}
    for field in fields:
        if field["id"] not in raw or raw[field["id"]] is None:
            continue
        value = raw[field["id"]]
        if field["type"] == "choice":
            index = _match_option(value, field["options"])
            if index is not None:
                values[field["id"]] = str(index)
        elif isinstance(value, (str, int, float)) and str(value).strip():
            values[field["id"]] = _strip_repeated_context(str(value).strip(), field["context"])
    return values
