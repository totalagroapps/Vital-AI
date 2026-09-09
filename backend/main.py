
from schemas_medical import MedicalSearchRequest, MedicalSearchResponse


from services.medical_search_service import MedicalSearchService


from services.pubmed_service import PubMedService


from services.clinical_trials_service import ClinicalTrialsService


from services.cochrane_service import CochraneService



def get_medical_search_service() -> MedicalSearchService:
    return MedicalSearchService(pubmed_service=PubMedService(), clinical_trials_service=ClinicalTrialsService(), cochrane_service=CochraneService())


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


from fastapi.responses import StreamingResponse, FileResponse, RedirectResponse


from fastapi.middleware.cors import CORSMiddleware


from pydantic import BaseModel


import ollama


from sqlalchemy import text


import database


import models


logging.basicConfig(level=logging.INFO)


logger = logging.getLogger('media_v2')


import boto3


from botocore.config import Config


from botocore.exceptions import ClientError


import uuid


from sqlalchemy import select, update


from fastapi import Form


R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')


R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')


R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')


R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'media-hub-docs')


s3_client = None


if (R2_ACCOUNT_ID and R2_ACCESS_KEY_ID):
    s3_client = boto3.client('s3', endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com', aws_access_key_id=R2_ACCESS_KEY_ID, aws_secret_access_key=R2_SECRET_ACCESS_KEY, config=Config(signature_version='s3v4'), region_name='auto')


app = FastAPI(title='MIVOR.ai - Team API', version='2.0')

@app.on_event('startup')
async def on_startup():
    try:
        async with database.engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)

            # Auto-migración de columnas para PostgreSQL en producción (Railway)
            needed_cols = [
                ("license_number", "VARCHAR"),
                ("experience_years", "INTEGER DEFAULT 0"),
                ("city", "VARCHAR"),
                ("location", "VARCHAR"),
                ("languages", "VARCHAR"),
                ("bio", "TEXT"),
                ("verified", "BOOLEAN DEFAULT FALSE"),
                ("is_verified", "BOOLEAN DEFAULT FALSE"),
                ("availability_schedule", "JSON"),
                ("photo_url", "VARCHAR"),
                ("diploma_url", "VARCHAR"),
                ("profile_pic_url", "VARCHAR"),
                ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
                ("updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            ]
            is_sqlite = "sqlite" in str(database.POSTGRES_URL).lower()
            for col_name, col_type in needed_cols:
                try:
                    sql = f"ALTER TABLE specialist_profiles ADD COLUMN {col_name} {col_type};" if is_sqlite else f"ALTER TABLE specialist_profiles ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    await conn.execute(text(sql))
                except Exception as col_err:
                    logger.debug(f"Col {col_name} migration note: {col_err}")

            # Auto-migración para patient_profiles (Fila 3: Donante de órganos, notas críticas y seguro)
            patient_cols = [
                ("organ_donor", "VARCHAR DEFAULT 'No especificado'"),
                ("medical_notes", "TEXT"),
                ("insurance_provider", "VARCHAR")
            ]
            for col_name, col_type in patient_cols:
                try:
                    sql = f"ALTER TABLE patient_profiles ADD COLUMN {col_name} {col_type};" if is_sqlite else f"ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    await conn.execute(text(sql))
                except Exception as col_err:
                    logger.debug(f"Col {col_name} migration note: {col_err}")

        logger.info("Base metadata and tables verified.")
    except Exception as e:
        logger.warning(f"Error initializing DB tables on startup: {e}")

    try:
        from scripts.seed_demo_doctor import seed_data
        async with database.AsyncSessionLocal() as session:
            check_doc = await session.execute(select(models.User).where(models.User.username == 'doctor@mivor.ai'))
            has_doc = check_doc.scalars().first() is not None

            check_appts = await session.execute(select(models.Appointment))
            appts_count = len(check_appts.scalars().all())

            check_patients = await session.execute(select(models.PatientProfile))
            patients_count = len(check_patients.scalars().all())

            logger.info(f"Startup DB state: doctor_exists={has_doc}, appointments={appts_count}, patient_profiles={patients_count}")

            if not has_doc or appts_count < 5 or patients_count < 15:
                logger.info("Demo data missing or incomplete, seeding demo doctor, patients and calendar...")
                await seed_data()
    except Exception as e:
        logger.warning(f"Error seeding demo data on startup: {e}")

@app.get('/health')
def health_check():
    return {'status': 'healthy'}


@app.get('/api/version')
def get_version():
    return {
        "version": os.getenv("APP_LATEST_VERSION", "1.0.1"),
        "apkUrl": os.getenv("APP_APK_URL", "https://vitalai.up.railway.app/download/mivor-latest.apk"),
        "notes": os.getenv("APP_UPDATE_NOTES", "Nuevas mejoras en el portal de médicos y correcciones."),
        "forceUpdate": os.getenv("APP_FORCE_UPDATE", "false").lower() in ("true", "1")
    }


DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)


@app.get('/download/{filename}')
async def download_apk_file(filename: str):
    file_path = os.path.join(DOWNLOADS_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename, media_type="application/vnd.android.package-archive")
    github_release_url = "https://github.com/totalagroapps/Vital-AI/releases/latest/download/app-release.apk"
    return RedirectResponse(url=github_release_url, status_code=302)



app.add_middleware(CORSMiddleware, allow_origins=(os.getenv('ALLOWED_ORIGINS', '').split(',') if os.getenv('ALLOWED_ORIGINS') else ['*']), allow_credentials=False, allow_methods=['*'], allow_headers=['*'])


from database import get_db


from sqlalchemy.ext.asyncio import AsyncSession



def scrub_phi(text: str) -> tuple[(str, bool)]:
    '\n    HIPAA/RGPD mock anonymization engine.\n    '
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


from fastapi.security import OAuth2PasswordRequestForm


from security import verify_password, get_password_hash, create_access_token, get_current_user_id


from sqlalchemy.future import select



class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = 'patient'



class StandardChatMessage(BaseModel):
    role: str
    content: str



class StandardChatRequest(BaseModel):
    messages: List[StandardChatMessage]
    language: Optional[str] = 'es'


from sqlalchemy.ext.asyncio import AsyncSession


from database import get_db



class ChatMessage(BaseModel):
    role: str
    content: str



class TriageRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = 'es'
    session_id: Optional[str] = None


TRIAGE_SYSTEM_PROMPT = '\nEres un Asistente Médico Inteligente diseñado para responder preguntas generales de salud y bienestar.\nTus REGLAS ESTRICTAS son:\n1. NUNCA des un diagnóstico médico definitivo ni recetes medicamentos. Siempre sugiere consultar a un profesional real.\n2. Puedes responder preguntas sobre enfermedades, síntomas generales, prevención, nutrición y bienestar.\n3. Sé empático, profesional, claro y conciso.\n4. Si el usuario describe una emergencia vital (dolor en el pecho fuerte, dificultad para respirar severa, pérdida de conciencia), dile inmediatamente que llame a emergencias.\n5. Adapta tu lenguaje para que sea fácil de entender por un paciente sin conocimientos médicos.\n'


from sqlalchemy.future import select


TRIAGE_SYSTEM_PROMPT_V2 = '\nActúas como un médico de familia empático y experto en triaje clínico de la clínica MIVOR.ai.\nTu objetivo es orientar al paciente sobre su síntoma, determinar el nivel de urgencia y derivarlo adecuadamente, pero haciéndolo a través de una conversación natural, fluida y distendida.\n\nREGLAS DE INTERACCIÓN:\n1. Sé conversacional y empático. No suenes como un robot leyendo un cuestionario.\n2. Permite contrapreguntas. Si el paciente tiene dudas sobre lo que le estás preguntando, respóndelas amablemente.\n3. Haz las preguntas médicas necesarias (sobre dolor, duración, síntomas acompañantes, etc.) pero intégralas en la conversación de forma natural, de a una o dos a la vez. No sigas un árbol de decisiones rígido.\n4. Adapta tu lenguaje para que sea fácil de entender.\n5. NO des diagnósticos definitivos ni recetes medicamentos. Tu propósito es el triaje y la orientación.\n\nCIERRE DEL TRIAJE:\nUna vez que tengas suficiente información para hacer una recomendación segura (normalmente después de 3 a 5 intercambios), despídete y genera el reporte final.\nPara generar el reporte, DEBES incluir OBLIGATORIAMENTE la frase exacta: "📝 Informe de Prediagnóstico y Triaje" seguida de:\n- Nivel de urgencia sugerido (Alta, Media, Baja).\n- Especialidad a la que debería acudir.\n- Resumen clínico breve.\n'


import qrcode


import base64


from io import BytesIO



class PatientProfileSchema(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    blood_type: str
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    emergency_contact: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    organ_donor: Optional[str] = "No especificado"
    medical_notes: Optional[str] = None
    insurance_provider: Optional[str] = None
    preferred_language: Optional[str] = 'es'



class DoctorQueryRequest(BaseModel):
    query: str
    patient_id: str
    text_model: str = 'llama3.1'
    language: Optional[str] = 'es'


from pydantic import BaseModel


from sqlalchemy.future import select


from datetime import datetime



class MedicationReminderCreate(BaseModel):
    medication_name: str
    dosage: str = None
    frequency: str = None
    time_of_day: str = None


# --- ROUTERS ---
from routers.auth import router as auth_router
app.include_router(auth_router)
from routers.chat import router as chat_router
app.include_router(chat_router)
from routers.documents import router as documents_router
app.include_router(documents_router)
from routers.triage import router as triage_router
app.include_router(triage_router)
from routers.patient import router as patient_router
app.include_router(patient_router)
from routers.doctor import router as doctor_router
app.include_router(doctor_router)
from routers.medications import router as medications_router
app.include_router(medications_router)
from routers.medical import router as medical_router
app.include_router(medical_router)
