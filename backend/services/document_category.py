"""
Categoría de un documento clínico para "Mis documentos".

Antes se decidía por la extensión del archivo: cualquier foto salía como "Radiografía" aunque
fuera una receta fotografiada o una foto de la piel. Ahora la IA indica el tipo al analizarlo
(tipo_documento) y, para documentos antiguos sin ese campo, se deduce del análisis guardado.
"""
import re
from typing import Optional

CATEGORIES = ('radiografia', 'foto_clinica', 'receta', 'analitica', 'informe')

# Texto para el prompt de análisis (imágenes y PDF)
PROMPT_FIELD = (
    '"tipo_documento": "radiografia" | "foto_clinica" | "receta" | "analitica" | "informe"'
)
PROMPT_RULES = (
    'Donde tipo_documento es: "radiografia" (radiografía, TAC, resonancia, ecografía u otra prueba de imagen diagnóstica), '
    '"foto_clinica" (foto de la piel, una herida o un síntoma visible), "receta" (receta o pauta de medicamentos), '
    '"analitica" (resultados de laboratorio con valores) o "informe" (informe médico, alta u otro documento).'
)

_IMAGING_RE = re.compile(r'\b(radiograf\w*|rx|tac|tomograf\w*|resonancia|ecograf\w*|cortical|di[aá]fisis|fractur\w*)\b')


def _normalize(value: Optional[str]) -> Optional[str]:
    v = (value or '').strip().lower().replace(' ', '_').replace('í', 'i').replace('á', 'a')
    aliases = {'foto': 'foto_clinica', 'imagen_clinica': 'foto_clinica', 'laboratorio': 'analitica', 'rx': 'radiografia'}
    v = aliases.get(v, v)
    return v if v in CATEGORIES else None


def document_category(analysis: Optional[dict], is_image: bool, filename: str = '') -> str:
    """Categoría final: la de la IA si es válida; si no, deducida del análisis o del archivo."""
    data = analysis or {}
    explicit = _normalize(data.get('tipo_documento'))
    if explicit:
        return explicit
    if data.get('biomarcadores'):
        return 'analitica'
    name = (filename or '').lower()
    text = ' '.join([str(data.get('resumen', ''))] + [str(h) for h in data.get('hallazgos', [])]).lower()
    looks_like_imaging = bool(_IMAGING_RE.search(text))
    # Una receta fotografiada también trae "hallazgos" descriptivos: manda que haya fármacos
    if 'receta' in name or (data.get('medicamentos') and not looks_like_imaging):
        return 'receta'
    if any(w in name for w in ('analisis', 'análisis', 'sangre', 'orina')):
        return 'analitica'
    if is_image:
        return 'radiografia' if looks_like_imaging else 'foto_clinica'
    return 'informe'
