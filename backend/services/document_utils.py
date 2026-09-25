"""Utilidades de procesado de documentos: imágenes, PDF y enmascarado de PHI."""
import base64
import io
import logging
import re

import PyPDF2
from PIL import Image

logger = logging.getLogger('media_v2')


def scrub_phi(text: str) -> tuple[(str, bool)]:
    """
    Motor DEMO/MOCK de enmascaramiento básico de PHI (Protected Health Information).

    ADVERTENCIA DE SEGURIDAD / COMPLIANCE (Punto 14 Auditoría R3):
    Esta función utiliza únicamente expresiones regulares rudimentarias (SSN/cédula)
    y una lista fija de nombres simulados. NO constituye una anonimización completa,
    ni cumple con los estándares Safe Harbor de HIPAA ni con los requisitos de
    seudonimización/de-identificación médica de RGPD/GDPR para datos clínicos reales.
    Para despliegues productivos con historiales clínicos confidenciales, debe reemplazarse
    por una solución de de-identificación biomédica basada en NER/NLP clínico certificado
    (ej. AWS Comprehend Medical, GCP Healthcare De-identification API, o modelos spaCy clínicos).
    """
    phi_detected = False
    patterns = [('\\b\\d{3}-\\d{2}-\\d{4}\\b', '[SSN_ENMASCARADO]'), ('\\b\\d{1,3}\\.\\d{3}\\.\\d{3}\\b', '[CEDULA_ENMASCARADA]')]
    for (pattern, replacement) in patterns:
        if re.search(pattern, text):
            text = re.sub(pattern, replacement, text)
            phi_detected = True
    names = ['Juan Pérez', 'Maria Garcia', 'John Doe', 'Juan Perez']
    for name in names:
        if (name.lower() in text.lower()):
            text = re.sub(re.escape(name), '[NOMBRE_PACIENTE_ENMASCARADO]', text, flags=re.IGNORECASE)
            phi_detected = True
    return (text, phi_detected)


def resize_image_to_base64(image_base64: str) -> str:
    'Decodes, resizes (max 1024x1024), and re-encodes image to high-quality JPEG base64.'
    img_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(img_bytes))
    if (image.mode != 'RGB'):
        image = image.convert('RGB')
    image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    buffered = io.BytesIO()
    image.save(buffered, format='JPEG', quality=95)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


def extract_text_from_pdf(pdf_base64: str) -> str:
    'Decodes base64 PDF and extracts text using PyPDF2.'
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ''
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += (page_text + '\n')
        return text.strip()
    except Exception as e:
        logger.error('Error extracting text from PDF: %r', e)
        return ''
