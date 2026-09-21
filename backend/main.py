
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


from pydantic import BaseModel, Field


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

def _ensure_missing_columns(sync_conn):
    from sqlalchemy import inspect as sa_inspect
    inspector = sa_inspect(sync_conn)
    existing_tables = set(inspector.get_table_names())
    added = []
    for table in models.Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue
        present = {c['name'] for c in inspector.get_columns(table.name)}
        for col in table.columns:
            if col.name in present or col.primary_key or not col.nullable:
                continue
            col_type = col.type.compile(dialect=sync_conn.dialect)
            sync_conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {col_type}'))
            added.append(f'{table.name}.{col.name}')
    return added


@app.on_event('startup')
async def on_startup():
    try:
        async with database.engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
        logger.info("Base metadata and tables verified.")
    except Exception as e:
        logger.warning(f"Error initializing DB tables on startup: {e}")

    # create_all no añade columnas nuevas a tablas ya existentes: se completan aquí (idempotente).
    try:
        async with database.engine.begin() as conn:
            added = await conn.run_sync(_ensure_missing_columns)
        if added:
            logger.info(f"Added missing DB columns: {added}")
    except Exception as e:
        logger.warning(f"Error ensuring missing columns on startup: {e}")

    try:
        from scripts.seed_catalogs import seed_catalogs, demo_seed_enabled
        await seed_catalogs(seed_demo=demo_seed_enabled())
    except Exception as e:
        logger.warning(f"Error seeding catalogs on startup: {e}")

    # Gating del seed de demo: solo en desarrollo o con flag explícito ENABLE_DEMO_SEED=true (Punto 2 & Punto 8)
    env = os.environ.get("ENVIRONMENT", os.environ.get("RAILWAY_ENVIRONMENT", "development")).lower()
    enable_demo_seed = os.environ.get("ENABLE_DEMO_SEED", "false").lower() in ("true", "1")

    if env == "development" or enable_demo_seed:
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
    else:
        logger.info("Production environment: automatic demo seeding is disabled.")

@app.get('/health')
def health_check():
    return {'status': 'healthy'}


@app.get('/api/version')
def get_version():
    return {
        "version": os.getenv("APP_LATEST_VERSION", "1.0.2"),
        "apkUrl": os.getenv("APP_APK_URL", "https://github.com/totalagroapps/Vital-AI/releases/download/latest/mivor-latest.apk"),
        "notes": os.getenv("APP_UPDATE_NOTES", "Nueva versión con diseño optimizado 100dvh para móvil (sin scroll) y adecuación regulatoria."),
        "forceUpdate": os.getenv("APP_FORCE_UPDATE", "false").lower() in ("true", "1")
    }


DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)


@app.get('/download/{filename}')
async def download_apk_file(filename: str):
    # Prevención estricta de Path Traversal (Punto 1 Auditoría R3)
    clean_filename = os.path.basename(filename)
    if not clean_filename or clean_filename != filename or ".." in filename or "/" in filename or "\\" in filename or "\x00" in filename:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    downloads_real_dir = os.path.realpath(DOWNLOADS_DIR)
    resolved_path = os.path.realpath(os.path.join(downloads_real_dir, clean_filename))

    if not resolved_path.startswith(downloads_real_dir + os.path.sep):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if os.path.isfile(resolved_path):
        return FileResponse(resolved_path, filename=clean_filename, media_type="application/vnd.android.package-archive")

    github_release_url = "https://github.com/totalagroapps/Vital-AI/releases/latest/download/app-release.apk"
    return RedirectResponse(url=github_release_url, status_code=302)


# Lista explícita de orígenes permitidos para CORS (Punto 10)
DEFAULT_ALLOWED_ORIGINS = [
    "https://vitalai.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "capacitor://localhost",
    "https://localhost",
    "http://localhost"
]
origins_env = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env else DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*']
)


from database import get_db


from sqlalchemy.ext.asyncio import AsyncSession



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


from fastapi.security import OAuth2PasswordRequestForm


from security import verify_password, get_password_hash, create_access_token, get_current_user_id


from sqlalchemy.future import select



class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: str = 'patient'



class StandardChatMessage(BaseModel):
    role: str
    content: str



class StandardChatRequest(BaseModel):
    messages: List[StandardChatMessage]
    language: Optional[str] = 'es'
    country: Optional[str] = None


from sqlalchemy.ext.asyncio import AsyncSession


from database import get_db



class ChatMessage(BaseModel):
    role: str
    content: str



class TriageRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = 'es'
    country: Optional[str] = None
    session_id: Optional[str] = None


TRIAGE_SYSTEM_PROMPT = '\nEres un Asistente Explicativo e Informativo de Salud de MIVOR.ai diseñado para responder dudas generales de salud, bienestar y hábitos saludables.\nTus REGLAS ESTRICTAS son:\n1. MIVOR.ai NO es un dispositivo médico. NUNCA des un diagnóstico clínico vinculante ni recetes medicamentos. Tu fin es pedagógico, orientativo e informativo.\n2. Puedes responder preguntas sobre hábitos saludables, síntomas generales, prevención, nutrición, bienestar y preparación de consultas médicas.\n3. Sé empático, didáctico, claro y conciso.\n4. Si el usuario describe una emergencia vital (dolor en el pecho fuerte opresivo, dificultad para respirar severa, pérdida de conciencia), dile inmediatamente que llame al 112 o servicio de emergencias.\n5. Adapta tu lenguaje para que sea fácil de entender por cualquier persona sin conocimientos técnicos.\n'


from sqlalchemy.future import select


TRIAGE_SYSTEM_PROMPT_V2 = '\nActúas como un asistente pedagógico de orientación en salud empático y cercano de MIVOR.ai.\nTu objetivo es ayudar al paciente a comprender lo que siente, orientarlo sobre posibles causas y ayudarlo a preparar su consulta con un profesional sanitario colegiado, pero haciéndolo a través de una conversación natural, fluida, humana y distendida.\n\nREGLAS DE INTERACCIÓN:\n1. Sé conversacional y empático. No suenes como un robot leyendo un cuestionario.\n2. Permite contrapreguntas. Si el paciente tiene dudas sobre lo que le estás preguntando, respóndelas amablemente.\n3. Haz las preguntas necesarias para comprender su situación (sobre localización de la molestia, duración, intensidad del 1 al 10, etc.) pero intégralas en la conversación de forma natural, de a una o dos a la vez.\n4. Adapta tu lenguaje para que cualquier persona lo entienda fácilmente sin tecnicismos complejos.\n5. Recuerda: NO emites diagnósticos médicos definitivos, ni prescripciones terapéuticas ni realizas triajes clínicos vinculantes. Tu propósito es la orientación y la facilitación del diálogo médico-paciente.\n\nCIERRE DE LA ORIENTACIÓN:\nUna vez que tengas suficiente información para ofrecer una orientación clara y segura (normalmente después de 3 a 5 intercambios), despídete cordialmente y genera el reporte final.\nPara generar el reporte, DEBES incluir OBLIGATORIAMENTE la frase exacta: "📝 Resumen Explicativo de Orientación" seguida de:\n- Nivel de atención recomendado: (General / Consulta Prioritaria / Atención Inmediata).\n- Especialidad sugerida para tu consulta médica.\n- Resumen explicativo de lo conversado.\n'


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
    country: Optional[str] = None


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
from routers.doctor_profile import router as doctor_profile_router
app.include_router(doctor_profile_router, prefix="/api")
app.include_router(doctor_profile_router)
from routers.doctor_verification import router as doctor_verification_router
app.include_router(doctor_verification_router, prefix="/api")
app.include_router(doctor_verification_router)

# --- AVATARS & STATIC ASSETS ---
from fastapi.staticfiles import StaticFiles
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(STATIC_DIR, "avatars"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- CITAS Y ESPECIALISTAS (FACUNDO MODULAR INTEGRATION) ---
from routers.catalogs import router as catalogs_router
app.include_router(catalogs_router)
from routers.availability import router as availability_router
app.include_router(availability_router)
from routers.appointments import router as appointments_router
app.include_router(appointments_router)
from routers.doctors import router as doctors_router
app.include_router(doctors_router)
from routers.health_places import router as health_places_router
app.include_router(health_places_router)

from routers.i18n import router as i18n_router
app.include_router(i18n_router)
