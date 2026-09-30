"""
Categoría de documentos en "Mis documentos": ya no depende de la extensión del archivo.
"""
import json

import pytest
from httpx import ASGITransport, AsyncClient

import models
from services.document_category import document_category


@pytest.mark.parametrize("analysis,is_image,filename,expected", [
    # La IA indica el tipo: manda sobre todo lo demás
    ({"tipo_documento": "receta"}, True, "IMG_2031.jpg", "receta"),
    ({"tipo_documento": "Foto clínica"}, True, "foto.png", "foto_clinica"),
    ({"tipo_documento": "inventado"}, False, "x.pdf", "informe"),
    # Documentos antiguos sin tipo: se deduce del análisis guardado
    ({"medicamentos": ["Betaloc 100 mg"], "hallazgos": ["Letra manuscrita legible"]}, True, "IMG_2031.jpg", "receta"),
    ({"hallazgos": ["Discontinuidad en la cortical del fémur"], "resumen": "Radiografía de cadera"}, True, "scan.jpg", "radiografia"),
    ({"resumen": "Mancha rojiza en el antebrazo"}, True, "piel.jpg", "foto_clinica"),
    ({"biomarcadores": [{"parametro": "Glucosa"}]}, False, "doc.pdf", "analitica"),
    ({}, False, "receta_octubre.pdf", "receta"),
    ({"resumen": "Informe de alta hospitalaria"}, False, "alta.pdf", "informe"),
    # "tac" no debe coincidir dentro de "contacto"
    ({"resumen": "Evitar el contacto con el sol"}, True, "piel.jpg", "foto_clinica"),
    # Caso real de producción: el resumen niega ("no hay hallazgos relacionados con fracturas")
    ({"resumen": "Se presenta una receta médica con varios medicamentos. No se observan imágenes radiológicas, "
                 "por lo que no hay hallazgos relacionados con fracturas o lesiones óseas.",
      "medicamentos": ["Betaloc 100 mg - 1 tab BID"], "hallazgos": []}, True, "prescripcion.webp", "receta"),
    # Radiografía cuyo análisis no dejó hallazgos: se usa el resumen
    ({"resumen": "Radiografía de fémur en proyección lateral"}, True, "Medical_X-Ray.jpg", "radiografia"),
    ({}, False, "269-551858-Laboratorios.pdf", "analitica"),
    # Análisis sin contenido: decide el nombre del archivo
    ({"resumen": "El documento no proporciona información médica específica."}, True, "Medical_X-Ray_imaging.jpg", "radiografia"),
    ({"resumen": "El documento no proporciona información médica específica."}, True, "completada-prescripción-médica.webp", "receta"),
    # Un informe PDF que menciona una fractura sigue siendo un informe
    ({"hallazgos": ["Fractura en la vértebra C4."]}, False, "20262100018792842.pdf", "informe"),
])
def test_document_category(analysis, is_image, filename, expected):
    assert document_category(analysis, is_image, filename) == expected


@pytest.mark.asyncio
async def test_my_documents_returns_category(session_maker, db):
    from main import app
    from database import get_db
    from security import get_current_user_id

    db.add(models.DocumentMetadata(
        user_id="u-docs", filename="IMG_2031.jpg", document_type="medical_image", extracted_text="",
        analysis_result=json.dumps({"medicamentos": ["Betaloc 100 mg"], "hallazgos": ["Receta manuscrita"], "smart_referral": {"matched": False}}),
    ))
    await db.commit()

    async def _db():
        async with session_maker() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: "u-docs"
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            docs = (await client.get("/api/me/documents")).json()
    finally:
        app.dependency_overrides.clear()

    assert [d["category"] for d in docs] == ["receta"]
