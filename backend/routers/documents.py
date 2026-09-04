
from main import RegisterRequest, StandardChatMessage, StandardChatRequest, ChatMessage, TriageRequest, PatientProfileSchema, DoctorQueryRequest, MedicationReminderCreate
from main import s3_client, R2_BUCKET_NAME, logger, resize_image_to_base64, extract_text_from_pdf, scrub_phi


from schemas_medical import MedicalSearchRequest, MedicalSearchResponse


from services.medical_search_service import MedicalSearchService


from services.pubmed_service import PubMedService


from services.clinical_trials_service import ClinicalTrialsService


from services.cochrane_service import CochraneService


import base64
import json
import io


import logging


import os


import re


import traceback


from typing import Optional, List


import asyncio


from openai import AsyncOpenAI


from PIL import Image


import PyPDF2


from fastapi import FastAPI, UploadFile, File, HTTPException, Depends


from fastapi.responses import StreamingResponse


from fastapi.middleware.cors import CORSMiddleware


from pydantic import BaseModel


import ollama


from sqlalchemy import text


import database


import models


import boto3


from botocore.config import Config


from botocore.exceptions import ClientError


import uuid


from sqlalchemy import select, update


from fastapi import Form


from database import get_db


from sqlalchemy.ext.asyncio import AsyncSession


from fastapi.security import OAuth2PasswordRequestForm


from security import verify_password, get_password_hash, create_access_token, get_current_user_id


from sqlalchemy.future import select


from sqlalchemy.ext.asyncio import AsyncSession


from database import get_db


from sqlalchemy.future import select


import qrcode


import base64


from io import BytesIO


from pydantic import BaseModel


from sqlalchemy.future import select


from datetime import datetime


from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from typing import List, Optional
import os
import base64
import uuid

import database
import models
import security
from database import get_db

router = APIRouter()


@router.post('/api/documents/upload')
async def upload_document(file: UploadFile=File(...), language: Optional[str]=Form(None), db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    '''
    Recibe un documento clínico (PDF, JPG, PNG), extrae sus datos mediante
    PyPDF2 o Visión por Computador (GPT-4o-mini) y genera análisis clínico estructurado.
    '''
    content = (await file.read())
    file_extension = (file.filename.split('.')[(- 1)].lower() if file.filename else '')
    response_data = {'filename': file.filename, 'document_type': 'unknown', 'extracted_text': '', 'phi_detected': False, 'is_image': False}

    lang_map = {'es': 'Español', 'en': 'English', 'fr': 'Français', 'ar': 'العربية'}
    target_lang = (lang_map.get(language, 'Español') if language else 'Español')
    lang_directive = f'DIRECTIVA DE IDIOMA: Todo el contenido textual del JSON (resumen, hallazgos, diagnosticos, recomendacion) DEBE generarse obligatoriamente en {target_lang}.'

    summary_data_json = None

    try:
        if ((file.content_type == 'application/pdf') or (file_extension == 'pdf')):
            response_data['document_type'] = 'pdf_report'
            pdf_b64 = base64.b64encode(content).decode('utf-8')
            raw_text = extract_text_from_pdf(pdf_b64)
            if ((not raw_text) or (len(raw_text.strip()) < 30)):
                logger.info('PDF text extraction returned empty/short. Attempting direct page rendering...')
                try:
                    import fitz
                    pdf_doc = fitz.open(stream=content, filetype='pdf')
                    page_texts = []
                    openai_client2 = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                    for page_num in range(min(len(pdf_doc), 4)):
                        page = pdf_doc.load_page(page_num)
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                        img_b64 = base64.b64encode(pix.tobytes('jpeg')).decode('utf-8')
                        vr = (await openai_client2.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': [{'type': 'text', 'text': f'Transcribe con fidelidad todo el texto de esta página de documento médico. {lang_directive}'}, {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{img_b64}'}}]}], max_tokens=2000, temperature=0.0))
                        page_texts.append(vr.choices[0].message.content)
                    raw_text = '\n\n'.join(page_texts)
                    pdf_doc.close()
                except Exception as e2:
                    logger.error(f'PyMuPDF fallback failed: {e2}')
                    raw_text = 'Documento PDF recibido. No contiene texto seleccionable directo.'
            (scrubbed_text, phi_detected) = scrub_phi(raw_text)
            response_data['extracted_text'] = scrubbed_text
            response_data['phi_detected'] = phi_detected
        elif (file.content_type.startswith('image/') or (file_extension in ['jpg', 'jpeg', 'png', 'webp', 'heic', 'bmp', 'gif', 'avif'])):
            response_data['document_type'] = 'medical_image'
            response_data['is_image'] = True
            img_b64_raw = base64.b64encode(content).decode('utf-8')
            img_b64_optimized = resize_image_to_base64(img_b64_raw)
            logger.info('Analizando imagen médica directamente con GPT-4o-mini Vision...')
            vision_system_prompt = f'''Eres VitalAI, un sistema médico de élite especialista en radiología clínica, diagnóstico por imagen, traumatología y análisis de documentos clínicos.
Tu objetivo es analizar con la máxima rigurosidad y precisión diagnóstica la imagen médica o documento que te proporciona el usuario.

{lang_directive}

INSTRUCCIONES CLÍNICAS FUNDAMENTALES:
1. SI ES UNA RADIOGRAFÍA, TOMOGRAFÍA (TAC), RESONANCIA (RM), ECOGRAFÍA O ESTUDIO DE IMAGEN:
   - Identifica con precisión la región anatómica y hueso/órgano evaluado (ej. Fémur, cadera, pelvis, rodilla, tórax, extremidad, etc.).
   - Examina con extremo cuidado la cortical, diafisis, metáfisis y epífisis ósea: busca activamente roturas, fracturas (completas, desplazadas, conminutas, cabalgadas, espiroideas, transversas), fisuras, luxaciones o desalineaciones óseas.
   - Observa marcadores radiológicos (letras 'L' o 'R', objetos externos o suturas).
   - REGLA DE URGENCIA CRÍTICA: Si detectas una FRACTURA ósea, desplazamiento de fragmentos, rotura o lesión traumática aguda, es una EMERGENCIA CLÍNICA y la severidad DEBE ser obligatoriamente "rojo" (urgente).
   - NUNCA digas que "no hay contenido relevante" ni que "no proporciona información médica" si estás ante una imagen radiológica: describe siempre en detalle la anatomía ósea y las lesiones visibles.

2. SI ES UNA RECETA MÉDICA, INFORME EN PAPEL O ANÁLISIS DE LABORATORIO:
   - Transcribe y analiza con fidelidad los diagnósticos, medicamentos con sus dosis/instrucciones y parámetros analíticos fuera de rango.

3. DEBES RESPONDER ÚNICAMENTE UN OBJETO JSON con esta estructura exacta:
{{
  "resumen": "Resumen claro, comprensible y empático para el paciente que explique exactamente lo que se aprecia en la imagen (ej. si hay una fractura ósea desplazada, explicar la localización y severidad).",
  "hallazgos": ["Hallazgo detallado 1 (ej. Fractura completa y desplazada en la diáfisis del fémur)", "Hallazgo 2 (ej. Desplazamiento y cabalgamiento de fragmentos óseos)", "Hallazgo 3..."],
  "medicamentos": ["Medicamentos identificados con dosis, si aplica (vacío si es una radiografía sin fármacos)"],
  "diagnosticos": ["Diagnóstico presuntivo o conclusión clínica clara (ej. Fractura diafisaria de fémur izquierdo desplazada)"],
  "severidad": "verde" | "amarillo" | "rojo",
  "recomendacion": "Recomendaciones médicas claras y paso a paso para el paciente (ej. Acudir inmediatamente a urgencias hospitalarias/traumatología, inmovilizar la extremidad, bajo ninguna circunstancia apoyar peso corporal)."
}}

Criterios de severidad:
- "rojo": Fracturas óseas (desplazadas o no), luxaciones, emergencias o lesiones agudas que requieren atención hospitalaria/traumatológica inmediata.
- "amarillo": Alteraciones o síntomas que requieren consulta médica prioritaria sin ser una urgencia vital.
- "verde": Estudios normales, controles de rutina o sin anomalías evidentes.
'''
            openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            openai_messages = [{'role': 'system', 'content': vision_system_prompt}, {'role': 'user', 'content': [{'type': 'text', 'text': 'Analiza visualmente esta imagen médica con criterio radiológico y clínico experto. Inspecciona con detalle la continuidad de las estructuras óseas y describe cualquier fractura o desplazamiento. Devuelve el JSON estructurado.'}, {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{img_b64_optimized}'}}]}]
            resp = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=openai_messages, response_format={'type': 'json_object'}, max_tokens=1500, temperature=0.1))
            try:
                img_data = json.loads(resp.choices[0].message.content)
            except Exception as parse_err:
                logger.error(f'Error parseando JSON de visión médica: {parse_err}')
                img_data = {}
            summary = img_data.get('resumen', '')
            hallazgos = img_data.get('hallazgos', [])
            medicamentos = img_data.get('medicamentos', [])
            diagnosticos = img_data.get('diagnosticos', [])
            severidad = img_data.get('severidad', 'verde')
            recomendacion = img_data.get('recomendacion', '')
            all_text_combined = f"{summary} {' '.join(hallazgos)} {' '.join(diagnosticos)}".lower()
            if any((term in all_text_combined) for term in ['fractur', 'rotura', 'desplazad', 'luxaci', 'discontinuidad', 'quebradura']):
                severidad = 'rojo'
            response_data['summary'] = summary
            response_data['hallazgos'] = hallazgos
            response_data['medicamentos'] = medicamentos
            response_data['diagnosticos'] = diagnosticos
            response_data['severidad'] = severidad
            response_data['recomendacion'] = recomendacion
            report_lines = []
            if diagnosticos:
                report_lines.append(f"Diagnóstico: {', '.join(diagnosticos)}")
            if hallazgos:
                report_lines.append(f"Hallazgos Radiológicos: {'; '.join(hallazgos)}")
            if summary:
                report_lines.append(f'Resumen Clínico: {summary}')
            if recomendacion:
                report_lines.append(f'Recomendación: {recomendacion}')
            extracted_text = (('\n\n'.join(report_lines) or summary) or 'Imagen médica analizada con éxito.')
            (scrubbed_text, phi_detected) = scrub_phi(extracted_text)
            response_data['extracted_text'] = scrubbed_text
            response_data['phi_detected'] = phi_detected
            summary_data_json = json.dumps({'resumen': summary, 'hallazgos': hallazgos, 'medicamentos': medicamentos, 'diagnosticos': diagnosticos, 'severidad': severidad, 'recomendacion': recomendacion})
        else:
            raise HTTPException(status_code=400, detail='Formato de archivo no soportado. Usa PDF, JPG o PNG.')
        if response_data['extracted_text']:
            try:
                openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                prompt = f'''Extrae los siguientes datos médicos del siguiente reporte y devuelve un JSON estricto:
{{
  "allergies": "lista separada por comas, o vacío si no hay",
  "chronic_conditions": "lista separada por comas, o vacío si no hay",
  "current_medications": "lista separada por comas, o vacío si no hay"
}}
Si no encuentras nada para un campo, déjalo vacío. Sólo devuelve el JSON.
Texto: {response_data['extracted_text']}
'''
                resp = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': prompt}], response_format={'type': 'json_object'}))
                try:
                    extracted_json = json.loads(resp.choices[0].message.content)
                    from sqlalchemy import select
                    result = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == current_user_id))))
                    profile = result.scalars().first()
                    if profile:
                        if extracted_json.get('allergies'):
                            profile.allergies = (f"{profile.allergies}, {extracted_json['allergies']}" if (profile.allergies and (profile.allergies != 'Ninguna registrada')) else extracted_json['allergies'])
                        if extracted_json.get('chronic_conditions'):
                            profile.chronic_conditions = (f"{profile.chronic_conditions}, {extracted_json['chronic_conditions']}" if (profile.chronic_conditions and (profile.chronic_conditions != 'Ninguna registrada')) else extracted_json['chronic_conditions'])
                        if extracted_json.get('current_medications'):
                            profile.current_medications = (f"{profile.current_medications}, {extracted_json['current_medications']}" if (profile.current_medications and (profile.current_medications != 'Ninguna registrada')) else extracted_json['current_medications'])
                        (await db.commit())
                except Exception as json_e:
                    logger.error(f'Error parsing auto-profiling JSON: {json_e}')
            except Exception as e:
                logger.error(f'Error in auto-profiling: {e}')
        if ((summary_data_json is None) and response_data.get('extracted_text') and (len(response_data['extracted_text'].strip()) > 20)):
            try:
                summary_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                summary_prompt = f'''Eres VitalAI, un asistente médico experto. Analiza el siguiente texto extraído de un documento médico y devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{lang_directive}

{{
  "resumen": "Resumen MUY DETALLADO y completo del documento en lenguaje claro para el paciente.",
  "hallazgos": ["hallazgo detallado 1", "hallazgo detallado 2"],
  "medicamentos": ["medicamento con dosis e instrucciones si aplica"],
  "diagnosticos": ["diagnóstico médico explicado claramente"],
  "severidad": "verde",
  "recomendacion": "Recomendaciones paso a paso."
}}
Donde severidad es: "verde" (normal/rutina), "amarillo" (requiere atención médica pronto), "rojo" (urgente).
Si el campo no aplica, usa lista vacía [].

TEXTO DEL DOCUMENTO:
{response_data['extracted_text'][:3000]}'''
                summary_resp = (await summary_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': summary_prompt}], response_format={'type': 'json_object'}, max_tokens=800, temperature=0.1))
                summary_data = json.loads(summary_resp.choices[0].message.content)
                summary_data_json = json.dumps(summary_data)
                response_data['summary'] = summary_data.get('resumen', '')
                response_data['hallazgos'] = summary_data.get('hallazgos', [])
                response_data['medicamentos'] = summary_data.get('medicamentos', [])
                response_data['diagnosticos'] = summary_data.get('diagnosticos', [])
                response_data['severidad'] = summary_data.get('severidad', 'verde')
                response_data['recomendacion'] = summary_data.get('recomendacion', '')
            except Exception as summ_e:
                logger.error(f'Error generating AI summary: {summ_e}')
                response_data['summary'] = 'El documento fue procesado correctamente.'
                response_data['severidad'] = 'verde'
                response_data['hallazgos'] = []
                response_data['medicamentos'] = []
                response_data['diagnosticos'] = []
                response_data['recomendacion'] = ''
        try:
            new_doc = models.DocumentMetadata(user_id=current_user_id, filename=response_data['filename'], extracted_text=response_data['extracted_text'], document_type=response_data['document_type'], analysis_result=summary_data_json)
            db.add(new_doc)
            (await db.commit())
            (await db.refresh(new_doc))
            response_data['id'] = new_doc.id
        except Exception as db_err:
            logger.warning(f'No se pudo guardar en la BD (¿Postgres apagado?): {str(db_err)}')
            (await db.rollback())
            response_data['id'] = None
            response_data['db_warning'] = 'DB connection failed, but OCR succeeded.'
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f'Error procesando documento: {repr(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Error interno procesando el documento: {repr(e)}')
    return response_data



@router.post('/api/documents/extract_medication')
async def extract_medication(file: UploadFile=File(...), user_id: str=Depends(get_current_user_id)):
    try:
        content_bytes = (await file.read())
        file_ext = file.filename.split('.')[(- 1)].lower()
        system_prompt = 'Extrae los medicamentos recetados o listados en la imagen/documento proporcionado y devuelve ÚNICAMENTE un JSON con esta estructura exacta:\n{\n  "medications": [\n    {\n      "medication_name": "Nombre del medicamento",\n      "dosage": "Dosis (ej. 500mg), vacío si no se especifica",\n      "frequency": "Frecuencia (ej. cada 8 horas, BID, TID, QD, etc), vacío si no se especifica",\n      "time_of_day": "Momento del día (ej. mañana y noche), vacío si no se especifica"\n    }\n  ]\n}\nSi no hay medicamentos, devuelve la lista vacía.'
        openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        if (file_ext == 'pdf'):
            import fitz
            doc = fitz.open(stream=content_bytes, filetype='pdf')
            extracted_text = ''
            for page in doc:
                extracted_text += (page.get_text('text') + '\n')
            if not extracted_text.strip() and len(doc) > 0:
                # Scanned PDF without selectable text: render first page as image for GPT-4o Vision
                import base64
                pix = doc[0].get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                resp = (await openai_client.chat.completions.create(
                    model='gpt-4o-mini',
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': [{'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{img_b64}'}}]}
                    ],
                    response_format={'type': 'json_object'},
                    max_tokens=1000
                ))
            else:
                resp = (await openai_client.chat.completions.create(
                    model='gpt-4o-mini',
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': extracted_text}
                    ],
                    response_format={'type': 'json_object'}
                ))
        elif (file_ext in ['jpg', 'jpeg', 'png', 'webp']):
            import base64
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(content_bytes))
            if (img.mode != 'RGB'):
                img = img.convert('RGB')
            img.thumbnail((1200, 1200))
            buffered = io.BytesIO()
            img.save(buffered, format='JPEG', quality=85)
            img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            resp = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': [{'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{img_b64}'}}]}], response_format={'type': 'json_object'}, max_tokens=1000))
        else:
            raise HTTPException(status_code=400, detail='Formato no soportado.')
        import json
        extracted_data = json.loads(resp.choices[0].message.content)
        return extracted_data
    except Exception as e:
        logger.error(f'Error extrayendo medicación: {e}')
        raise HTTPException(status_code=500, detail='Error interno analizando receta.')



@router.post('/api/patients/{patient_id}/documents')
async def upload_document(patient_id: str, current_user_id: str=Depends(get_current_user_id), file: UploadFile=File(...), document_type: str=Form(...), notes: str=Form(None), db: AsyncSession=Depends(get_db)):
    if (not s3_client):
        raise HTTPException(status_code=500, detail='Storage client is not configured (Missing R2 credentials).')
    file_bytes = (await file.read())
    if (len(file_bytes) > ((10 * 1024) * 1024)):
        raise HTTPException(status_code=400, detail='File too large. Maximum size is 10MB.')
    if (not file_bytes.startswith(b'%PDF-')):
        raise HTTPException(status_code=400, detail='Invalid file format. Only PDF files are allowed.')
    actual_patient_id = (current_user_id if ((patient_id == 'me') or (patient_id == 'mock_user')) else patient_id)
    stmt = select(models.PatientProfile).where(((models.PatientProfile.id == int(actual_patient_id)) if actual_patient_id.isdigit() else (models.PatientProfile.user_id == actual_patient_id)))
    result = (await db.execute(stmt))
    patient = result.scalar_one_or_none()
    if (not patient):
        raise HTTPException(status_code=404, detail='Patient not found.')
    extracted_insights = ''
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        raw_text = ''
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                raw_text += (page_text + '\n')
        if raw_text.strip():
            openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            prompt = f'''Eres un asistente médico experto. A continuación tienes el texto extraído de un documento clínico de un paciente.
Tu tarea es analizar el documento y devolver el resultado ESTRICTAMENTE en formato JSON, usando esta estructura exacta:
{{
  "resumen": "Explicación del resultado en lenguaje sencillo y amigable para el paciente",
  "diagnosticos": ["diag 1", "diag 2"],
  "anomalias": ["anomalía 1", "anomalía 2"],
  "medicamentos": ["med 1", "med 2"],
  "severidad": "verde", // verde (normal), amarillo (atención) o rojo (urgencia)
  "preguntas_sugeridas": ["pregunta 1", "pregunta 2"]
}}

OMITE estrictamente cualquier dato personal identificable (Nombres completos, DNI, dirección).
Si el texto es ininteligible o no es médico, devuelve un JSON con severidad "amarillo" indicando el error en el "resumen".

Texto:
{raw_text[:4000]}
'''
            resp = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'user', 'content': prompt}], response_format={'type': 'json_object'}))
            extracted_insights = resp.choices[0].message.content
    except Exception as e:
        logging.error(f'Ollama OCR Error: {e}')
        extracted_insights = f'Error extrayendo datos con IA: {str(e)}'
    file_extension = '.pdf'
    unique_filename = f'{uuid.uuid4()}{file_extension}'
    object_key = f'patients/{patient.id}/documents/{unique_filename}'
    try:
        s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=object_key, Body=file_bytes, ContentType='application/pdf')
    except ClientError as e:
        logging.error(f'S3 Upload Error: {e}')
        raise HTTPException(status_code=500, detail='Failed to upload document to storage.')
    new_doc = models.MedicalDocument(patient_id=patient.id, document_type=document_type, file_url=object_key, original_filename=file.filename, notes=notes, extracted_text=extracted_insights)
    db.add(new_doc)
    (await db.commit())
    (await db.refresh(new_doc))
    try:
        import json
        payload_data = {}
        try:
            payload_data = json.loads(extracted_insights)
        except:
            payload_data = {'raw_insights': extracted_insights}
        new_event = models.HealthEvent(patient_id=patient.id, type=models.HealthEventType.document, payload=payload_data, source_ref_id=str(new_doc.id))
        db.add(new_event)
        (await db.commit())
    except Exception as e:
        logging.error(f'Error creating HealthEvent: {e}')
    return {'id': new_doc.id, 'document_type': new_doc.document_type.value, 'original_filename': new_doc.original_filename, 'uploaded_at': new_doc.uploaded_at, 'notes': new_doc.notes}



@router.get('/api/patients/{patient_id}/documents')
async def list_documents(patient_id: str, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    if (not s3_client):
        raise HTTPException(status_code=500, detail='Storage client is not configured.')
    actual_patient_id = (current_user_id if ((patient_id == 'me') or (patient_id == 'mock_user')) else patient_id)
    stmt = select(models.PatientProfile).where(((models.PatientProfile.id == int(actual_patient_id)) if actual_patient_id.isdigit() else (models.PatientProfile.user_id == actual_patient_id)))
    result = (await db.execute(stmt))
    patient = result.scalar_one_or_none()
    if (not patient):
        raise HTTPException(status_code=404, detail='Patient not found.')
    doc_stmt = select(models.MedicalDocument).where((models.MedicalDocument.patient_id == patient.id), (models.MedicalDocument.is_deleted == False)).order_by(models.MedicalDocument.uploaded_at.desc())
    doc_result = (await db.execute(doc_stmt))
    documents = doc_result.scalars().all()
    docs_response = []
    for doc in documents:
        try:
            presigned_url = s3_client.generate_presigned_url('get_object', Params={'Bucket': R2_BUCKET_NAME, 'Key': doc.file_url}, ExpiresIn=3600)
        except ClientError:
            presigned_url = None
        docs_response.append({'id': doc.id, 'document_type': doc.document_type.value, 'original_filename': doc.original_filename, 'uploaded_at': doc.uploaded_at, 'notes': doc.notes, 'extracted_text': doc.extracted_text, 'download_url': presigned_url})
    return docs_response



@router.delete('/api/patients/{patient_id}/documents/{document_id}')
async def delete_document(patient_id: str, document_id: str, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    stmt = select(models.MedicalDocument).where((models.MedicalDocument.id == document_id), (models.MedicalDocument.is_deleted == False))
    result = (await db.execute(stmt))
    doc = result.scalar_one_or_none()
    if (not doc):
        raise HTTPException(status_code=404, detail='Document not found.')
    actual_patient_id = (current_user_id if ((patient_id == 'me') or (patient_id == 'mock_user')) else patient_id)
    p_stmt = select(models.PatientProfile).where(((models.PatientProfile.id == int(actual_patient_id)) if actual_patient_id.isdigit() else (models.PatientProfile.user_id == actual_patient_id)))
    p_result = (await db.execute(p_stmt))
    patient = p_result.scalar_one_or_none()
    if ((not patient) or (doc.patient_id != patient.id)):
        raise HTTPException(status_code=403, detail='Not authorized to delete this document.')
    doc.is_deleted = True
    (await db.commit())
    return {'status': 'success', 'message': 'Document deleted successfully.'}



@router.get('/api/documents/{document_id}/summary')
async def get_document_summary(document_id: str, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    stmt = select(models.MedicalDocument).where((models.MedicalDocument.id == document_id), (models.MedicalDocument.is_deleted == False))
    result = (await db.execute(stmt))
    doc = result.scalar_one_or_none()
    if (not doc):
        raise HTTPException(status_code=404, detail='Document not found.')
    import json
    payload_data = {}
    if doc.extracted_text:
        try:
            payload_data = json.loads(doc.extracted_text)
        except:
            payload_data = {'resumen': doc.extracted_text}
    return {'id': doc.id, 'type': (doc.document_type.value if doc.document_type else 'otro'), 'filename': doc.original_filename, 'date': (doc.uploaded_at.isoformat() if doc.uploaded_at else None), 'summary': payload_data}



@router.get('/api/me/documents')
async def get_my_documents(db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    'Returns all documents uploaded by the current authenticated user.'
    stmt = select(models.DocumentMetadata).where((models.DocumentMetadata.user_id == current_user_id)).order_by(models.DocumentMetadata.created_at.desc())
    result = (await db.execute(stmt))
    docs = result.scalars().all()
    return [{'id': doc.id, 'filename': doc.filename, 'document_type': doc.document_type, 'extracted_text': doc.extracted_text, 'analysis_result': doc.analysis_result, 'created_at': (doc.created_at.isoformat() if doc.created_at else None)} for doc in docs]

