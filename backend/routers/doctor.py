
from main import RegisterRequest, StandardChatMessage, StandardChatRequest, ChatMessage, TriageRequest, PatientProfileSchema, DoctorQueryRequest, MedicationReminderCreate
from main import s3_client, R2_BUCKET_NAME, logger


from schemas_medical import MedicalSearchRequest, MedicalSearchResponse


from services.medical_search_service import MedicalSearchService


from services.pubmed_service import PubMedService


from services.clinical_trials_service import ClinicalTrialsService


from services.cochrane_service import CochraneService


import base64


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


@router.get('/api/doctor/patients')
async def get_all_patients(db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.PatientProfile)))
    patients = result.scalars().all()
    response = []
    for p in patients:
        triage_res = (await db.execute(select(models.TriageSession).where((models.TriageSession.user_id == p.user_id)).order_by(models.TriageSession.created_at.desc())))
        latest_triage = triage_res.scalars().first()
        category = 'Ninguno'
        if (latest_triage and latest_triage.category):
            cat = latest_triage.category.lower()
            if (('rojo' in cat) or ('emergencia' in cat) or ('resucitacion' in cat) or ('1' in cat) or ('2' in cat)):
                category = 'Rojo'
            elif (('amarillo' in cat) or ('urgencia' in cat) or ('3' in cat)):
                category = 'Amarillo'
            elif (('verde' in cat) or ('azul' in cat) or ('4' in cat) or ('5' in cat)):
                category = 'Verde'
            else:
                category = 'Amarillo'
        response.append({'user_id': p.user_id, 'full_name': p.full_name, 'date_of_birth': p.date_of_birth, 'gender': p.gender, 'triage_category': category, 'triage_status': (latest_triage.status if latest_triage else 'Ninguno')})

    def sort_key(p):
        cat = p['triage_category']
        if (cat == 'Rojo'):
            return 0
        if (cat == 'Amarillo'):
            return 1
        if (cat == 'Verde'):
            return 2
        return 3
    response.sort(key=sort_key)
    return response



@router.post('/api/doctor/ask')
async def ask_doctor_copilot(request: DoctorQueryRequest, db: AsyncSession=Depends(get_db)):
    from sqlalchemy.future import select
    profile_res = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == request.patient_id))))
    profile = profile_res.scalars().first()
    triage_res = (await db.execute(select(models.TriageSession).where((models.TriageSession.user_id == request.patient_id)).order_by(models.TriageSession.created_at.desc())))
    triages = triage_res.scalars().all()
    context_text = f'''[EXPEDIENTE CLÍNICO DE {(profile.full_name if profile else 'PACIENTE DESCONOCIDO')}]
Perfil:
- Nacimiento: {(profile.date_of_birth if profile else '')}
- Género: {(profile.gender if profile else '')}
- Sangre: {(profile.blood_type if profile else '')}
- Alergias: {(profile.allergies if profile else '')}
- Crónicas: {(profile.chronic_conditions if profile else '')}
- Medicación: {(profile.current_medications if profile else '')}

[HISTORIAL DE TRIAJES]
'''
    for t in triages:
        context_text += f'''- Fecha: {t.created_at}, Estado: {t.status}, Categoría: {t.category}
'''
        if t.final_report:
            context_text += f'''  Reporte Final: {t.final_report}
'''
    if profile:
        doc_stmt = select(models.MedicalDocument).where((models.MedicalDocument.patient_id == profile.id), (models.MedicalDocument.is_deleted == False)).order_by(models.MedicalDocument.uploaded_at.desc())
        doc_result = (await db.execute(doc_stmt))
        documents = doc_result.scalars().all()
        if documents:
            context_text += '\n[DOCUMENTOS MEDICOS ADJUNTOS]\n'
            for d in documents:
                context_text += f'''- Documento: {d.original_filename} ({d.document_type})
'''
                if d.extracted_text:
                    context_text += f'''  Contenido/Resultados:
{d.extracted_text}
'''
    system_prompt = f'''Eres un Asistente Médico de IA diseñado exclusivamente para ayudar a DOCTORES a revisar expedientes de pacientes.
El doctor te hará una pregunta sobre el paciente. Analiza la pregunta y responde utilizando ÚNICAMENTE la información del siguiente expediente.
Si la información no está en el expediente, dilo claramente. Sé conciso, profesional y directo. No uses saludos largos.

{context_text}
'''
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French (Français)', 'ar': 'Arabic (العربية)'}
    target_lang = lang_map.get(request.language, 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate with the doctor EXCLUSIVELY and ENTIRELY in {target_lang}.
DO NOT speak or reply in English or Spanish if {target_lang} is French or Arabic.
Translate and compose your entire response strictly into {target_lang}.'''

    system_prompt += lang_instruction
    try:
        openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        async def generate():
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': request.query}], stream=True))
            async for chunk in response_stream:
                if (chunk.choices and (len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    (yield chunk.choices[0].delta.content)
        return StreamingResponse(generate(), media_type='text/plain')
    except Exception as e:
        logging.error(f'Ollama Doctor API Error: {e}')
        return StreamingResponse(iter([f'Error: No se pudo procesar la respuesta del modelo de IA. {str(e)}']), media_type='text/plain')



@router.get('/api/specialists')
async def get_specialists(specialty: str=None, city: str=None, db: AsyncSession=Depends(get_db)):
    """
    Recupera la lista de especialistas médicos con perfiles completos y fotos.
    """
    from sqlalchemy import or_
    stmt = select(models.SpecialistProfile)
    if specialty and specialty.lower() != 'todos':
        stmt = stmt.where(models.SpecialistProfile.specialty.ilike(f'%{specialty}%'))
    if city:
        stmt = stmt.where(or_(
            models.SpecialistProfile.city.ilike(f'%{city}%'),
            models.SpecialistProfile.location.ilike(f'%{city}%')
        ))
    result = (await db.execute(stmt))
    specialists = result.scalars().all()

    output = []
    for s in specialists:
        photo = s.photo_url or s.profile_pic_url
        if photo and s3_client and not photo.startswith('http'):
            try:
                photo = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': R2_BUCKET_NAME, 'Key': photo},
                    ExpiresIn=86400
                )
            except Exception:
                pass

        output.append({
            'id': s.id,
            'user_id': s.user_id,
            'full_name': s.full_name,
            'specialty': s.specialty,
            'city': s.city or s.location or 'Consulta Online / Presencial',
            'location': s.location or s.city or 'Consulta Online / Presencial',
            'experience_years': s.experience_years or 0,
            'languages': s.languages or 'Español',
            'bio': s.bio or f'Especialista en {s.specialty} con experiencia en atención clínica personalizada.',
            'verified': bool(s.verified or s.is_verified),
            'photo_url': photo or f"https://api.dicebear.com/7.x/bottts/svg?seed={s.full_name or 'Dr'}",
            'availability_schedule': (s.availability_schedule or {'dias': 'Lunes a Viernes', 'horario': '09:00 - 18:00'})
        })

    # Si aún no hay especialistas registrados en la base de datos, proveer defaults para que la plataforma sea 100% interactiva en la demo
    if not output:
        default_docs = [
            {
                'id': 101,
                'user_id': 'doc-dr-carlos-mendoza',
                'full_name': 'Dr. Carlos Mendoza',
                'specialty': 'Cardiología',
                'city': 'Madrid, España',
                'location': 'Centro Médico Sanitas / Consulta Online',
                'experience_years': 12,
                'languages': 'Español, Inglés',
                'bio': 'Cardiólogo clínico especializado en prevención cardiovascular, hipertensión y arritmias.',
                'verified': True,
                'photo_url': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
                'availability_schedule': {'dias': 'Lun, Mié, Vie', 'horario': '10:00 - 18:00'}
            },
            {
                'id': 102,
                'user_id': 'doc-dra-elena-rodriguez',
                'full_name': 'Dra. Elena Rodríguez',
                'specialty': 'Medicina General',
                'city': 'Barcelona, España',
                'location': 'Clínica Quirón / Telemedicina',
                'experience_years': 9,
                'languages': 'Español, Francés',
                'bio': 'Médica de familia con enfoque en diagnóstico integral, seguimiento crónico y prevención.',
                'verified': True,
                'photo_url': 'https://images.unsplash.com/photo-1594824813629-9e793ac3d3e6?auto=format&fit=crop&q=80&w=400',
                'availability_schedule': {'dias': 'Lun - Sáb', 'horario': '08:30 - 16:30'}
            },
            {
                'id': 103,
                'user_id': 'doc-dr-javier-torres',
                'full_name': 'Dr. Javier Torres',
                'specialty': 'Traumatología',
                'city': 'Valencia, España',
                'location': 'Hospital Universitario / Consulta Privada',
                'experience_years': 15,
                'languages': 'Español, Inglés',
                'bio': 'Especialista en lesiones articulares, columna vertebral y rehabilitación física.',
                'verified': True,
                'photo_url': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
                'availability_schedule': {'dias': 'Mar, Jue', 'horario': '11:00 - 19:00'}
            },
            {
                'id': 104,
                'user_id': 'doc-dra-sofia-valencia',
                'full_name': 'Dra. Sofía Valencia',
                'specialty': 'Dermatología',
                'city': 'Sevilla, España',
                'location': 'Instituto Dermatológico Avanzado',
                'experience_years': 8,
                'languages': 'Español, Inglés',
                'bio': 'Especialista en salud de la piel, control de lunares, alergias cutáneas y tratamientos estéticos médicos.',
                'verified': True,
                'photo_url': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
                'availability_schedule': {'dias': 'Lunes a Viernes', 'horario': '09:00 - 17:00'}
            }
        ]
        if specialty and specialty.lower() != 'todos':
            output = [d for d in default_docs if specialty.lower() in d['specialty'].lower()]
            if not output:
                output = default_docs
        else:
            output = default_docs

    return output

