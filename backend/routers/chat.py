
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


@router.get('/api/sessions')
async def get_sessions(user_id: str=Depends(get_current_user_id), db: AsyncSession=Depends(get_db)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.ChatSession).where((models.ChatSession.user_id == user_id)).order_by(models.ChatSession.created_at.desc())))
    sessions = result.scalars().all()
    return [{'id': s.id, 'title': s.title, 'created_at': s.created_at.isoformat()} for s in sessions]



@router.post('/api/chat/start')
async def start_chat(db: AsyncSession=Depends(get_db), user_id: str=Depends(get_current_user_id)):
    new_session = models.ChatSession(user_id=user_id, title='Nueva Consulta Libre')
    db.add(new_session)
    (await db.commit())
    (await db.refresh(new_session))
    return {'session_id': new_session.id}



@router.get('/api/chat/{session_id}')
async def get_chat_session(session_id: str, db: AsyncSession=Depends(get_db), user_id: str=Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.ChatSession).where((models.ChatSession.id == session_id), (models.ChatSession.user_id == user_id))))
    session = result.scalars().first()
    if (not session):
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    msg_res = (await db.execute(select(models.ChatMessage).where((models.ChatMessage.session_id == session_id)).order_by(models.ChatMessage.created_at.asc())))
    messages = msg_res.scalars().all()
    return {'id': session.id, 'title': session.title, 'messages': [{'role': m.role, 'content': m.content} for m in messages]}



@router.post('/api/chat/{session_id}/message')
async def send_standard_chat_message(session_id: str, request: StandardChatRequest, db: AsyncSession=Depends(get_db), user_id: str=Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.ChatSession).where((models.ChatSession.id == session_id), (models.ChatSession.user_id == user_id))))
    session = result.scalars().first()
    if (not session):
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    user_msg_content = request.messages[(- 1)].content
    user_db_msg = models.ChatMessage(session_id=session_id, role='user', content=user_msg_content)
    db.add(user_db_msg)
    system_prompt = "Eres un simulador clínico experto y un analizador de datos médicos. IMPORTANTE: Si el usuario te pide analizar una imagen o radiografía, TEN EN CUENTA que la imagen YA FUE analizada por tu módulo de visión. Los hallazgos visuales exactos se encuentran al final del mensaje del usuario bajo la etiqueta '[Contexto del Documento Adjunto: ...]'. Tú DEBES leer esos hallazgos y responderle al usuario basándote estrictamente en ellos, asumiendo el rol de que TÚ mismo viste la imagen. NUNCA digas 'no puedo analizar imágenes', porque ya tienes la extracción en texto. Da tus observaciones médicas de forma directa y profesional."
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French', 'ar': 'Arabic'}
    target_lang = lang_map.get(request.language, 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL INSTRUCTION: You MUST communicate with the patient EXCLUSIVELY in {target_lang}.'''
    messages_payload = [{'role': 'system', 'content': (system_prompt + lang_instruction)}]
    for msg in request.messages:
        messages_payload.append({'role': msg.role, 'content': msg.content})
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    async def generate_chat():
        full_response = ''
        try:
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=messages_payload, stream=True))
            async for chunk in response_stream:
                if ((len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    token = chunk.choices[0].delta.content
                    full_response += token
                    (yield token)
            ai_db_msg = models.ChatMessage(session_id=session_id, role='assistant', content=full_response)
            db.add(ai_db_msg)
            if (session.title == 'Nueva Consulta Libre'):
                session.title = (user_msg_content[:30] + '...')
                db.add(session)
            (await db.commit())
        except Exception as e:
            logger.error(f'Error en Standard Chat Stream: {str(e)}')
            (yield f'''

[Error de conexión: {str(e)}]''')
            (await db.commit())
    return StreamingResponse(generate_chat(), media_type='text/plain')



@router.post('/api/chat/general')
async def general_chat(request: TriageRequest, db: AsyncSession=Depends(get_db)):
    '\n    Chat general libre de contexto mdico histrico. \n    Ideal para consultas rpidas de nutricin, fitness, dudas generales de salud.\n    '
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    last_msg = (request.messages[(- 1)].content.lower() if request.messages else '')
    symptom_keywords = ['me duele', 'siento', 'tengo fiebre', 'urgencia', 'sangre', 'mareo', 'vomito', 'dolor']
    is_symptom = any(((k in last_msg) for k in symptom_keywords))
    SYSTEM_PROMPT = "Eres VitalAI, un asistente general de salud y bienestar. \nResponde de forma concisa, educada y profesional.\nREGLA CRITICA: NO TIENES ACCESO AL HISTORIAL MEDICO DEL PACIENTE AQUI. \nSi el usuario pregunta por sus sntomas, dile educadamente que para hacer un pre-diagnstico preciso debe usar el mdulo 'Entiende tus sntomas' (Triaje)."
    if is_symptom:
        SYSTEM_PROMPT += '\n\nATENCION: El usuario parece estar describiendo un sntoma activo. Sugiere amablemente usar la seccin de Triaje para un anlisis formal.'
    messages_payload = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for msg in request.messages:
        messages_payload.append({'role': msg.role, 'content': msg.content})

    async def generate_chat():
        try:
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=messages_payload, stream=True))
            async for chunk in response_stream:
                if ((len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    (yield chunk.choices[0].delta.content)
        except Exception as e:
            logger.error(f'Error en General Chat Stream: {str(e)}')
            (yield f'''

[Error de conexin: {str(e)}]''')
    return StreamingResponse(generate_chat(), media_type='text/plain')

