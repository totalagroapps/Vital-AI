
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


@router.post('/api/triage/chat')
async def triage_chat(request: TriageRequest):
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French (Français)', 'ar': 'Arabic (العربية)'}
    target_lang = lang_map.get(request.language, 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate with the patient EXCLUSIVELY and ENTIRELY in {target_lang}.
DO NOT respond in English or Spanish if {target_lang} is French or Arabic.
Formulate all medical responses, questions, and guidance directly in {target_lang}.'''
    messages_payload = [{'role': 'system', 'content': TRIAGE_SYSTEM_PROMPT + lang_instruction}]
    for msg in request.messages:
        messages_payload.append({'role': msg.role, 'content': msg.content})
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    async def generate_chat():
        try:
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=messages_payload, stream=True))
            async for chunk in response_stream:
                if ((len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    (yield chunk.choices[0].delta.content)
        except Exception as e:
            logger.error(f'OpenAI stream failed: {str(e)}')
            (yield '\n\n[Error de conexión: El asistente no está disponible en este momento, intenta más tarde.]')
    return StreamingResponse(generate_chat(), media_type='text/plain')



@router.post('/api/triage/start')
async def start_triage_session(db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    '\n    Crea una nueva sesión de triaje en la base de datos asociada al usuario.\n    '
    new_session = models.TriageSession(user_id=current_user_id, status='in_progress')
    db.add(new_session)
    (await db.commit())
    (await db.refresh(new_session))
    return {'session_id': new_session.id, 'status': new_session.status}



@router.get('/api/triage/{session_id}')
async def get_triage_session(session_id: int, db: AsyncSession=Depends(get_db)):
    '\n    Recupera el estado actual de un triaje (ej: si el paciente recarga la página).\n    '
    result = (await db.execute(select(models.TriageSession).where((models.TriageSession.id == session_id))))
    session = result.scalars().first()
    if (not session):
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    return {'session_id': session.id, 'status': session.status, 'questions_asked': session.questions_asked, 'final_report': session.final_report}



@router.post('/api/triage/{session_id}/message')
async def send_triage_message(session_id: int, request: TriageRequest, db: AsyncSession=Depends(get_db)):
    '\n    Aplica PHI scrubbing, interactúa con el modelo y monitorea si emite el informe final.\n    '
    result = (await db.execute(select(models.TriageSession).where((models.TriageSession.id == session_id))))
    t_session = result.scalars().first()
    if (not t_session):
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    if (t_session.status != 'in_progress'):
        raise HTTPException(status_code=400, detail='Esta sesión de triaje ya está cerrada.')
    sanitized_messages = []
    for msg in request.messages:
        if (msg.role == 'user'):
            (scrubbed_text, _) = scrub_phi(msg.content)
            sanitized_messages.append({'role': 'user', 'content': scrubbed_text})
        else:
            sanitized_messages.append({'role': msg.role, 'content': msg.content})
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French (Français)', 'ar': 'Arabic (العربية)'}
    target_lang = (lang_map.get(request.language, request.language) if request.language else 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate with the patient EXCLUSIVELY and ENTIRELY in {target_lang}.
DO NOT respond in English or Spanish if {target_lang} is French or Arabic.
Formulate all medical responses, questions, and guidance directly in {target_lang}.'''
    messages_payload = ([{'role': 'system', 'content': (TRIAGE_SYSTEM_PROMPT_V2 + lang_instruction)}] + sanitized_messages)
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    async def generate_triage_response():
        full_response = ''
        try:
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=messages_payload, stream=True))
            async for chunk in response_stream:
                if ((len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    token = chunk.choices[0].delta.content
                    full_response += token
                    (yield token)
            if (('Informe de Prediagn' in full_response) or ('Informe de Emergencia' in full_response) or ('Nivel de Urgencia:' in full_response) or ('Especialidad M' in full_response)):
                if (('🔴 Urgencia (Rojo)' in full_response) or ('Urgencia Inmediata' in full_response) or ('🔴' in full_response)):
                    t_session.status = 'closed_red'
                elif (('🟡 Atención Temprana' in full_response) or ('🟡' in full_response)):
                    t_session.status = 'closed_yellow'
                else:
                    t_session.status = 'closed_green'
                t_session.final_report = full_response
            else:
                t_session.questions_asked += 1
                if t_session.status.startswith('closed_'):
                    try:
                        import json
                        payload_data = {'title': 'Sesin de Triaje', 'severity': t_session.status.replace('closed_', '').upper(), 'report': t_session.final_report, 'questions_asked': t_session.questions_asked}
                        p_stmt = select(models.PatientProfile).where((models.PatientProfile.user_id == t_session.user_id))
                        p_res = (await db.execute(p_stmt))
                        profile = p_res.scalars().first()
                        if profile:
                            new_event = models.HealthEvent(patient_id=profile.id, type=models.HealthEventType.triage, payload=payload_data, source_ref_id=str(t_session.id))
                            db.add(new_event)
                    except Exception as he_err:
                        logger.error(f'Error creating HealthEvent for triage: {he_err}')
                db.add(t_session)
            (await db.commit())
            return
        except Exception as e:
            logger.error(f'Error en Triaje Stream: {str(e)}')
            (yield f'''

[Error de conexión en Triaje: {str(e)}]''')
            return
    return StreamingResponse(generate_triage_response(), media_type='text/plain')

