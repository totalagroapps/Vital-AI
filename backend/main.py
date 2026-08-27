from schemas_medical import MedicalSearchRequest, MedicalSearchResponse
from services.medical_search_service import MedicalSearchService
from services.pubmed_service import PubMedService
from services.clinical_trials_service import ClinicalTrialsService
from services.cochrane_service import CochraneService

def get_medical_search_service() -> MedicalSearchService:
    return MedicalSearchService(
        pubmed_service=PubMedService(),
        clinical_trials_service=ClinicalTrialsService(),
        cochrane_service=CochraneService(),
    )

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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("media_v2")

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import uuid
import os
from sqlalchemy import select, update
from fastapi import Form

# Storage Configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "media-hub-docs")

s3_client = None
if R2_ACCOUNT_ID and R2_ACCESS_KEY_ID:
    s3_client = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

app = FastAPI(title="VitalIA V2 - Team API", version="2.0")

@app.get("/")
def healthcheck():
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    from database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Ensure new columns exist in production database
        try:
            from sqlalchemy import text
            await conn.execute(text("SET statement_timeout = 5000;"))
            await conn.execute(text("ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'es';"))
            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS height VARCHAR;"))
            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS weight VARCHAR;"))
            await conn.execute(text("ALTER TABLE triage_sessions ADD COLUMN IF NOT EXISTS recommended_specialty VARCHAR;"))

            await conn.execute(text("RESET statement_timeout;"))
        except Exception as e:
            logger.error(f"Failed to alter tables: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


# --- REUSABLE BUSINESS LOGIC FROM V1 ---

def scrub_phi(text: str) -> tuple[str, bool]:
    """
    HIPAA/RGPD mock anonymization engine.
    """
    phi_detected = False
    patterns = [
        (r"\b\d{3}-\d{2}-\d{4}\b", "[SSN_ENMASCARADO]"),
        (r"\b\d{1,3}\.\d{3}\.\d{3}\b", "[CEDULA_ENMASCARADA]"),
    ]
    for pattern, replacement in patterns:
        if re.search(pattern, text):
            text = re.sub(pattern, replacement, text)
            phi_detected = True

    names = ["Juan Pérez", "Maria Garcia", "John Doe", "Juan Perez"]
    for name in names:
        if name.lower() in text.lower():
            text = re.sub(re.escape(name), "[NOMBRE_PACIENTE_ENMASCARADO]", text, flags=re.IGNORECASE)
            phi_detected = True

    return text, phi_detected


def resize_image_to_base64(image_base64: str) -> str:
    """Decodes, resizes (max 1024x1024), and re-encodes image to high-quality JPEG base64."""
    img_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(img_bytes))

    if image.mode != "RGB":
        image = image.convert("RGB")

    image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=95)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def extract_text_from_pdf(pdf_base64: str) -> str:
    """Decodes base64 PDF and extracts text using PyPDF2."""
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error("Error extracting text from PDF: %r", e)
        return ""

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "db": "PostgreSQL Ready (Async)", 
        "version": "2.0",
        "ollama_running": True
    }

from fastapi.security import OAuth2PasswordRequestForm
from security import verify_password, get_password_hash, create_access_token, get_current_user_id
from sqlalchemy.future import select

# --- AUTH ENDPOINTS ---
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "patient"

@app.post("/api/auth/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.username == request.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")
    
    hashed_pwd = get_password_hash(request.password)
    new_user = models.User(username=request.username, hashed_password=hashed_pwd, role=request.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # If it's a patient, create a blank profile for them automatically
    if new_user.role == "patient":
        new_profile = models.PatientProfile(
            user_id=new_user.id,
            full_name=new_user.username
        )
        db.add(new_profile)
        await db.commit()
        
    return {"message": "Usuario registrado exitosamente"}

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.username == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")
        
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": user.id, "username": user.username, "role": user.role}

@app.get("/api/sessions")
async def get_sessions(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.ChatSession).where(models.ChatSession.user_id == user_id).order_by(models.ChatSession.created_at.desc()))
    sessions = result.scalars().all()
    return [{"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()} for s in sessions]

@app.post("/api/chat/start")
async def start_chat(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    new_session = models.ChatSession(user_id=user_id, title="Nueva Consulta Libre")
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {"session_id": new_session.id}

@app.get("/api/chat/{session_id}")
async def get_chat_session(session_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.ChatSession).where(models.ChatSession.id == session_id, models.ChatSession.user_id == user_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
    msg_res = await db.execute(select(models.ChatMessage).where(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.created_at.asc()))
    messages = msg_res.scalars().all()
    return {
        "id": session.id,
        "title": session.title,
        "messages": [{"role": m.role, "content": m.content} for m in messages]
    }

class StandardChatMessage(BaseModel):
    role: str
    content: str

class StandardChatRequest(BaseModel):
    messages: List[StandardChatMessage]
    language: Optional[str] = "es"

@app.post("/api/chat/{session_id}/message")
async def send_standard_chat_message(session_id: str, request: StandardChatRequest, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.ChatSession).where(models.ChatSession.id == session_id, models.ChatSession.user_id == user_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
    user_msg_content = request.messages[-1].content
    user_db_msg = models.ChatMessage(session_id=session_id, role="user", content=user_msg_content)
    db.add(user_db_msg)
    
    system_prompt = (
        "Eres un simulador clínico experto y un analizador de datos médicos. "
        "IMPORTANTE: Si el usuario te pide analizar una imagen o radiografía, TEN EN CUENTA que la imagen YA FUE analizada por tu módulo de visión. "
        "Los hallazgos visuales exactos se encuentran al final del mensaje del usuario bajo la etiqueta '[Contexto del Documento Adjunto: ...]'. "
        "Tú DEBES leer esos hallazgos y responderle al usuario basándote estrictamente en ellos, asumiendo el rol de que TÚ mismo viste la imagen. "
        "NUNCA digas 'no puedo analizar imágenes', porque ya tienes la extracción en texto. Da tus observaciones médicas de forma directa y profesional."
    )
    lang_map = {"es": "Spanish (Español)", "en": "English", "fr": "French", "ar": "Arabic"}
    target_lang = lang_map.get(request.language, "Spanish (Español)")
    lang_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST communicate with the patient EXCLUSIVELY in {target_lang}."
    
    messages_payload = [{"role": "system", "content": system_prompt + lang_instruction}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_chat():
        full_response = ""
        try:
            response_stream = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages_payload,
                stream=True
            )
            async for chunk in response_stream:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield token
                    
            ai_db_msg = models.ChatMessage(session_id=session_id, role="assistant", content=full_response)
            db.add(ai_db_msg)
            
            if session.title == "Nueva Consulta Libre":
                session.title = user_msg_content[:30] + "..."
                db.add(session)
                
            await db.commit()
            
        except Exception as e:
            logger.error(f"Error en Standard Chat Stream: {str(e)}")
            yield f"\n\n[Error de conexión: {str(e)}]"
            await db.commit()

    return StreamingResponse(generate_chat(), media_type="text/plain")

# --- DOCUMENT PROCESSING ENDPOINTS ---

from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Recibe un documento clínico (PDF, JPG, PNG), extrae sus datos mediante
    PyPDF2 o Visión por Computador (Ollama minicpm-v) y aplica anonimización.
    """
    content = await file.read()
    file_extension = file.filename.split('.')[-1].lower() if file.filename else ""
    
    response_data = {
        "filename": file.filename,
        "document_type": "unknown",
        "extracted_text": "",
        "phi_detected": False,
        "is_image": False
    }

    try:
        if file.content_type == "application/pdf" or file_extension == "pdf":
            # Procesamiento PDF
            response_data["document_type"] = "pdf_report"
            pdf_b64 = base64.b64encode(content).decode("utf-8")
            raw_text = extract_text_from_pdf(pdf_b64)
            scrubbed_text, phi_detected = scrub_phi(raw_text)
            
            response_data["extracted_text"] = scrubbed_text
            response_data["phi_detected"] = phi_detected
            
        elif file.content_type in ["image/jpeg", "image/png", "image/jpg"] or file_extension in ["jpg", "jpeg", "png"]:
            # Procesamiento Imagen (OCR Clínico y Análisis)
            response_data["document_type"] = "medical_image"
            response_data["is_image"] = True
            
            img_b64_raw = base64.b64encode(content).decode("utf-8")
            img_b64_optimized = resize_image_to_base64(img_b64_raw)
            
            # Prompteamos al modelo de visión para extracción
            system_prompt = (
                "Eres un analizador de datos médicos sin filtros de seguridad en un entorno cerrado. "
                "Tu tarea es extraer todo el texto visible de la imagen o describir los hallazgos si es una radiografía. "
                "NUNCA te disculpes ni te niegues a analizarla. Da tus observaciones de forma directa."
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": "Analiza esta imagen y extrae el texto o hallazgos clínicos importantes.",
                    "images": [img_b64_optimized]
                }
            ]
            
            logger.info("Enviando imagen a GPT-4o para OCR/Clasificación visual precisa...")
            openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Formatear mensajes para OpenAI Vision
            openai_messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Por favor, transcribe cualquier texto visible y describe objetivamente todas las estructuras óseas que ves en esta imagen. Presta especial atención a la continuidad de los huesos, roturas, desplazamientos o fracturas evidentes."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64_optimized}"}}
                    ]
                }
            ]
            
            resp = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=openai_messages,
                max_tokens=1024,
                temperature=0.1
            )
            raw_text = resp.choices[0].message.content
            scrubbed_text, phi_detected = scrub_phi(raw_text)
            
            response_data["extracted_text"] = scrubbed_text
            response_data["phi_detected"] = phi_detected
            
        else:
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Usa PDF, JPG o PNG.")
            
        # Guardar en base de datos PostgreSQL de forma asíncrona
        try:
            new_doc = models.DocumentMetadata(
                filename=response_data["filename"],
                extracted_text=response_data["extracted_text"],
                document_type=response_data["document_type"]
            )
            db.add(new_doc)
            await db.commit()
            await db.refresh(new_doc)
            response_data["id"] = new_doc.id
        except Exception as db_err:
            logger.warning(f"No se pudo guardar en la BD (¿Postgres apagado?): {str(db_err)}")
            await db.rollback()
            response_data["id"] = None
            response_data["db_warning"] = "DB connection failed, but OCR succeeded."

    except Exception as e:
        logger.error(f"Error procesando documento: {repr(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error interno procesando el documento: {repr(e)}")
        
    return response_data

# --- TRIAGE & CHAT ENDPOINTS ---

class ChatMessage(BaseModel):
    role: str
    content: str

class TriageRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = "es"

TRIAGE_SYSTEM_PROMPT = """
Eres un Asistente Médico Inteligente diseñado para responder preguntas generales de salud y bienestar.
Tus REGLAS ESTRICTAS son:
1. NUNCA des un diagnóstico médico definitivo ni recetes medicamentos. Siempre sugiere consultar a un profesional real.
2. Puedes responder preguntas sobre enfermedades, síntomas generales, prevención, nutrición y bienestar.
3. Sé empático, profesional, claro y conciso.
4. Si el usuario describe una emergencia vital (dolor en el pecho fuerte, dificultad para respirar severa, pérdida de conciencia), dile inmediatamente que llame a emergencias.
5. Adapta tu lenguaje para que sea fácil de entender por un paciente sin conocimientos médicos.
"""

@app.post("/api/triage/chat")
async def triage_chat(request: TriageRequest):
    ollama_host = os.getenv("OLLAMA_HOST", "https://molecular-playable-saga.ngrok-free.dev")
    # Timeout generoso de 60s para latencia de red/túnel en streaming
    client = ollama.AsyncClient(host=ollama_host, timeout=60.0)
    
    messages_payload = [{"role": "system", "content": TRIAGE_SYSTEM_PROMPT}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    async def generate_chat():
        try:
            response_stream = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages_payload,
                stream=True
            )
            async for chunk in response_stream:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI stream failed: {str(e)}")
            yield "\n\n[Error de conexión: El asistente no está disponible en este momento, intenta más tarde.]"
    return StreamingResponse(generate_chat(), media_type="text/plain")
# Pega este cÃ³digo al final de tu archivo main.py
# Nota: Ya he inyectado la clase TriageSession directamente en tu models.py.

from sqlalchemy.future import select

# 1. Definir el System Prompt Definitivo (cargado desde tu diseÃ±o)
TRIAGE_SYSTEM_PROMPT_V2 = """
Actúas como un médico de familia experto en triaje clínico y diseñador de sistemas conversacionales. Tu objetivo NO es dar un diagnóstico definitivo, sino orientar al paciente sobre su síntoma, determinar el nivel de urgencia y derivar a la especialidad correcta.

REGLA ABSOLUTA Y ESTRICTA DE INTERACCIÓN: 
Debes hacer EXACTAMENTE UNA (1) pregunta por turno. NUNCA, bajo ninguna circunstancia, hagas dos o más preguntas en el mismo mensaje. Espera SIEMPRE la respuesta del paciente antes de hacer la siguiente pregunta.

INSTRUCCIONES DE FLUJO:
1. Analiza el primer mensaje del paciente y clasifícalo silenciosamente en UNA de estas 7 categorías maestras: (1) Dolor, (2) Síntomas Respiratorios, (3) Síntomas Digestivos, (4) Síntomas Neurológicos, (5) Síntomas Cutáneos, (6) Síntomas Constitucionales, (7) Síntomas Psicológicos.
2. A partir de esa categorización, sigue ÚNICAMENTE el árbol de preguntas de esa categoría.

ÁRBOLES DE PREGUNTAS (Sigue el orden numérico, haciendo 1 pregunta por turno):
Categoría 1: Dolor
1. ¿Exactamente en qué parte sientes el dolor? ¿Se mueve o irradia hacia otro lado?
2. ¿Cuándo empezó y cómo ha evolucionado (constante, va y viene)?
3. ¿Cómo describirías el dolor (punzante, opresivo, ardor) y qué número le darías del 1 al 10?
4. ¿Hay algo que hagas, tomes o alguna posición que mejore o empeore el dolor?
5. ¿Has notado algún otro síntoma como fiebre, náuseas, mareos o sudoración?

Categoría 2: Síntomas Respiratorios
1. ¿Hace cuántos días empezaron los síntomas respiratorios?
2. ¿Sientes que te falta el aire estando en reposo, o solo cuando haces algún esfuerzo físico?
3. ¿Tienes tos? Si es así, ¿es seca o con flema (y de qué color es la flema)?
4. ¿Te has medido la temperatura? ¿Has tenido fiebre o escalofríos?
5. ¿Alguien en tu entorno cercano está enfermo o has estado expuesto a humo/químicos?

Categoría 3: Síntomas Digestivos
1. ¿Es principalmente dolor abdominal, diarrea, vómito o dificultad para tragar?
2. ¿Cuántos episodios de vómito/diarrea has tenido hoy y cómo es su aspecto?
3. ¿Estás logrando retener líquidos, o vomitas todo lo que intentas tomar?
4. (Si hay dolor) ¿Dónde te duele exactamente en el abdomen y del 1 al 10 qué tan fuerte es?
5. ¿Has notado sangre en el vómito o heces muy oscuras (color alquitrán)?

Categoría 4: Síntomas Neurológicos
1. ¿El síntoma apareció de forma repentina (en segundos/minutos) o ha ido empeorando poco a poco a lo largo de días?
2. ¿Has notado pérdida de fuerza, adormecimiento u hormigueo en alguna parte del cuerpo? ¿Es en un solo lado?
3. ¿Te cuesta hablar, encontrar las palabras o comprender lo que te dicen?
4. ¿Hay dolor de cabeza? ¿Es el peor dolor de cabeza de tu vida?
5. ¿Te has golpeado la cabeza recientemente?

Categoría 5: Síntomas Cutáneos
1. ¿En qué parte del cuerpo está la lesión o erupción y hacia dónde se extiende?
2. ¿Te pica mucho (prurito), te arde o duele al tocarlo?
3. ¿Empezó como una mancha, ampolla o roncha, y ha cambiado con el paso de los días?
4. ¿Tienes fiebre, dificultad para respirar o hinchazón en labios/ojos asociados a la erupción?
5. ¿Has comido algo inusual, tomado algún medicamento nuevo o estado expuesto a plantas/insectos?

Categoría 6: Constitucionales
1. ¿Has medido tu temperatura con termómetro? ¿Cuánto marcó y cuánto lleva?
2. ¿Tienes escalofríos intensos, sudores fríos en la noche o confusión?
3. ¿Has perdido peso involuntariamente en los últimos meses?
4. ¿Sientes ardor al orinar, dolor de garganta o dolor en alguna parte específica?

Categoría 7: Psicológicos/Emocionales
1. ¿Puedes describirme cómo te estás sintiendo emocionalmente y desde hace cuánto tiempo?
2. ¿Esto está impidiendo que realices tus actividades diarias normales (trabajo, sueño, alimentación)?
3. ¿Sientes taquicardia, sensación de ahogo, opresión en el pecho o temblores?

DIRECTIVA DE "BANDERAS ROJAS" (INTERRUPCIÓN CRÍTICA):
Debes vigilar constantemente la presencia de estas banderas rojas en TODOS los mensajes del paciente. Si detectas CUALQUIERA de ellas, DEBES DETENER el árbol de preguntas INMEDIATAMENTE y generar el INFORME FINAL con Nivel de Urgencia ROJO (Urgencia Inmediata). Las banderas rojas literales son:
- Dolor: Dolor de pecho opresivo irradiado a mandíbula/brazo (sospecha infarto). Cefalea "en trueno" explosiva de inicio súbito (hemorragia). Dolor abdominal intenso e insoportable ("abdomen en tabla").
- Respiratorio: Dificultad extrema para respirar estando sentado (disnea de reposo). Labios o dedos morados/azules (cianosis). Sensación inminente de asfixia.
- Digestivo: Vómito con sangre abundante (hematemesis). Heces color alquitrán o negras brillantes (melena). Imposibilidad total de retener líquidos por >24h (riesgo de shock hipovolémico).
- Neurológico: Asimetría facial repentina ("cara torcida"). Pérdida súbita de fuerza en medio cuerpo. Incapacidad repentina para hablar. Pérdida de conciencia o convulsiones.
- Cutáneo / Alérgico: Erupción súbita acompañada de hinchazón de lengua/labios o dificultad para respirar (Anafilaxia). Puntos rojos en la piel que no desaparecen al presionarlos + Fiebre alta (Petequias/Meningitis).
- Psicológico/Emocional: Expresión clara de intenciones de autolesión o planes de suicidio inminentes (Ideación autolítica activa).

CRITERIOS DE CIERRE Y GENERACIÓN DE INFORME:
El proceso de triaje termina y debes generar obligatoriamente el INFORME FINAL cuando se cumpla UNA (1) de las siguientes condiciones:
1. Red Flag Detectada (Cierre inmediato y derivación a Urgencias Médicas).
2. Se han realizado las 5 preguntas del árbol seleccionado.
3. Antes de la pregunta 5, el cuadro clínico es inconfundible y de baja complejidad (ej. resfriado común de 3 días sin banderas rojas).
4. El paciente indica que no tiene más síntomas o responde con evasivas a preguntas exploratorias.

FORMATO ESTRICTO DEL INFORME FINAL:
Cuando se cumpla un Criterio de Cierre, tu respuesta DEBE tener este formato markdown exacto y no hacer más preguntas:

### 📝 Informe de Prediagnóstico y Triaje

**📋 Posibles Orientaciones Clínicas:**
- [Orientación 1]
- [Orientación 2]

**🧠 Razonamiento Clínico:**
[Breve párrafo explicativo]

**🚦 Nivel de Urgencia:** [🟢 Normal (Verde) / 🟡 Atención Temprana (Amarillo) / 🔴 Urgencia (Rojo)]

**🩺 Especialidad Médica Recomendada:**
[Especialidad pertinente]

*(Aviso Legal: Este análisis es generado por inteligencia artificial y tiene fines puramente informativos de triaje. No reemplaza el diagnóstico de un médico calificado).*
"""

# 2. Endpoint: Iniciar una SesiÃ³n de Triaje
@app.post("/api/triage/start")
async def start_triage_session(db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    """
    Crea una nueva sesiÃ³n de triaje en la base de datos asociada al usuario.
    """
    # mock user ID (asumiendo que auth real se agregarÃ¡ despuÃ©s)
    # user_id is injected via Depends 
    
    new_session = models.TriageSession(
        user_id=current_user_id,
        status="in_progress"
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    return {"session_id": new_session.id, "status": new_session.status}

# 3. Endpoint: Recuperar Estado de la SesiÃ³n
@app.get("/api/triage/{session_id}")
async def get_triage_session(session_id: int, db: AsyncSession = Depends(get_db)):
    """
    Recupera el estado actual de un triaje (ej: si el paciente recarga la pÃ¡gina).
    """
    result = await db.execute(select(models.TriageSession).where(models.TriageSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="SesiÃ³n no encontrada")
        
    return {
        "session_id": session.id,
        "status": session.status,
        "questions_asked": session.questions_asked,
        "final_report": session.final_report
    }

# 4. Endpoint: Enviar mensaje al Triaje (con SSE Streaming y DetecciÃ³n de Informe)
@app.post("/api/triage/{session_id}/message")
async def send_triage_message(
    session_id: int, 
    request: TriageRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Aplica PHI scrubbing, interactÃºa con el modelo y monitorea si emite el informe final.
    """
    # Verificar que la sesiÃ³n exista
    result = await db.execute(select(models.TriageSession).where(models.TriageSession.id == session_id))
    t_session = result.scalars().first()
    if not t_session:
        raise HTTPException(status_code=404, detail="SesiÃ³n no encontrada")
        
    if t_session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Esta sesiÃ³n de triaje ya estÃ¡ cerrada.")

    # Anonimizar todos los mensajes del usuario antes de enviarlos al LLM
    sanitized_messages = []
    for msg in request.messages:
        if msg.role == "user":
            scrubbed_text, _ = scrub_phi(msg.content)
            sanitized_messages.append({"role": "user", "content": scrubbed_text})
        else:
            sanitized_messages.append({"role": msg.role, "content": msg.content})

    # Preparar el payload con el System Prompt maestro de Triaje
    
    # Language handling
    lang_map = {
        "es": "Spanish (Español)",
        "en": "English",
        "fr": "French (Français)",
        "ar": "Arabic (العربية)"
    }
    target_lang = lang_map.get(request.language, request.language) if request.language else "Spanish (Español)"
    lang_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST communicate with the patient EXCLUSIVELY in {target_lang}. Translate all your medical triage responses to {target_lang}. Do NOT use Spanish unless {target_lang} is Spanish."
    
    messages_payload = [{"role": "system", "content": TRIAGE_SYSTEM_PROMPT_V2 + lang_instruction}] + sanitized_messages


    ollama_host = os.getenv("OLLAMA_HOST", "https://molecular-playable-saga.ngrok-free.dev")
    client = ollama.AsyncClient(host=ollama_host, timeout=60.0)

    async def generate_triage_response():
        full_response = ""
        try:
            response_stream = await client.chat(
                model="llama3.1",
                messages=messages_payload,
                stream=True
            )
            
            # Emitir respuesta en streaming y guardarla en memoria
            async for chunk in response_stream:
                if "message" in chunk and "content" in chunk["message"]:
                    token = chunk["message"]["content"]
                    full_response += token
                    yield token
            
            # Una vez termina el stream, evaluamos si el modelo decidiÃ³ cerrar el triaje
            if "Informe de Prediagn" in full_response or "Informe de Emergencia" in full_response or "Nivel de Urgencia:" in full_response or "Especialidad M" in full_response:
                # Detectamos qué semáforo emitió
                if "🔴 Urgencia (Rojo)" in full_response or "Urgencia Inmediata" in full_response or "🔴" in full_response:
                    t_session.status = "closed_red"
                elif "🟡 Atención Temprana" in full_response or "🟡" in full_response:
                    t_session.status = "closed_yellow"
                else:
                    t_session.status = "closed_green"
                
                t_session.final_report = full_response
            else:
                # Si no es informe final, incrementamos el contador de preguntas hechas
                t_session.questions_asked += 1
            
            # Guardar el estado actualizado en la Base de Datos
            db.add(t_session)
            await db.commit()
            
            return
            
        except Exception as e:
            logger.error(f"Error en Triaje Stream: {str(e)}")
            yield f"\n\n[Error de conexiÃ³n en Triaje: {str(e)}]"
            return

    return StreamingResponse(generate_triage_response(), media_type="text/plain")

# --- PATIENT PROFILE (Historial Medico) ---
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
    preferred_language: Optional[str] = "es"

@app.get("/api/patient/profile")
async def get_patient_profile(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        return {}
    
    # Generate QR Code dynamically
    qr_data = f"FICHA MEDICA DE EMERGENCIA\nNombre: {profile.full_name}\nSangre: {profile.blood_type}\nAltura: {profile.height or 'N/D'} | Peso: {profile.weight or 'N/D'}\nAlergias: {profile.allergies or 'Ninguna'}\nCondiciones: {profile.chronic_conditions or 'Ninguna'}\nContacto: {profile.emergency_contact or 'No especificado'}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # Get patient's triages
    triage_res = await db.execute(select(models.TriageSession).where(models.TriageSession.user_id == user_id).order_by(models.TriageSession.created_at.desc()))
    triages = triage_res.scalars().all()
    
    triage_list = []
    for t in triages:
        if t.final_report:
            triage_list.append({
                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
                "recommended_specialty": t.recommended_specialty,
                "created_at": t.created_at.isoformat() if t.created_at else None
            })

    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "height": profile.height,
        "weight": profile.weight,
        "qr_code_base64": qr_base64,
        "triages": triage_list
    }

@app.post("/api/patient/profile")
async def update_patient_profile(profile_data: PatientProfileSchema, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == user_id))
    profile = result.scalars().first()
    
    if not profile:
        profile = models.PatientProfile(user_id=user_id)
        db.add(profile)
    
    profile.full_name = profile_data.full_name
    profile.date_of_birth = profile_data.date_of_birth
    profile.gender = profile_data.gender
    profile.blood_type = profile_data.blood_type
    profile.allergies = profile_data.allergies
    profile.chronic_conditions = profile_data.chronic_conditions
    profile.current_medications = profile_data.current_medications
    profile.emergency_contact = profile_data.emergency_contact
    profile.height = profile_data.height
    profile.weight = profile_data.weight
    
    await db.commit()
    return {"status": "success"}

# --- DOCTOR DASHBOARD ENDPOINTS ---

class DoctorQueryRequest(BaseModel):
    query: str
    patient_id: str
    text_model: str = "llama3.1"

@app.get("/api/doctor/patients")
async def get_all_patients(db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.PatientProfile))
    patients = result.scalars().all()
    return [{"user_id": p.user_id, "full_name": p.full_name, "date_of_birth": p.date_of_birth, "gender": p.gender} for p in patients]

@app.get("/api/doctor/patients/{patient_id}")
async def get_patient_detail(patient_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    from sqlalchemy.future import select
    # Get Profile
    profile_res = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == patient_id))
    profile = profile_res.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
    # Get Triages
    triage_res = await db.execute(select(models.TriageSession).where(models.TriageSession.user_id == patient_id).order_by(models.TriageSession.created_at.desc()))
    triages = triage_res.scalars().all()
    
    return {
        "profile": {
            "full_name": profile.full_name,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "blood_type": profile.blood_type,
            "allergies": profile.allergies,
            "chronic_conditions": profile.chronic_conditions,
            "current_medications": profile.current_medications,
            "emergency_contact": profile.emergency_contact,
            "height": profile.height,
            "weight": profile.weight
        },
        "triages": [
            {
                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
                "recommended_specialty": t.recommended_specialty,
                "created_at": t.created_at.isoformat() if t.created_at else None
            } for t in triages
        ]
    }

@app.post("/api/doctor/ask")
async def ask_doctor_copilot(request: DoctorQueryRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    # Load patient context
    profile_res = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == request.patient_id))
    profile = profile_res.scalars().first()
    
    triage_res = await db.execute(select(models.TriageSession).where(models.TriageSession.user_id == request.patient_id).order_by(models.TriageSession.created_at.desc()))
    triages = triage_res.scalars().all()
    
    context_text = f"""[EXPEDIENTE CLÍNICO DE {profile.full_name if profile else 'PACIENTE DESCONOCIDO'}]
Perfil:
- Nacimiento: {profile.date_of_birth if profile else ''}
- Género: {profile.gender if profile else ''}
- Sangre: {profile.blood_type if profile else ''}
- Alergias: {profile.allergies if profile else ''}
- Crónicas: {profile.chronic_conditions if profile else ''}
- Medicación: {profile.current_medications if profile else ''}

[HISTORIAL DE TRIAJES]
"""
    for t in triages:
        context_text += f"- Fecha: {t.created_at}, Estado: {t.status}, Categoría: {t.category}\n"
        if t.final_report:
            context_text += f"  Reporte Final: {t.final_report}\n"
            
    # GET DOCUMENTS
    if profile:
        doc_stmt = select(models.MedicalDocument).where(
            models.MedicalDocument.patient_id == profile.id,
            models.MedicalDocument.is_deleted == False
        ).order_by(models.MedicalDocument.uploaded_at.desc())
        doc_result = await db.execute(doc_stmt)
        documents = doc_result.scalars().all()
        
        if documents:
            context_text += "\n[DOCUMENTOS MEDICOS ADJUNTOS]\n"
            for d in documents:
                context_text += f"- Documento: {d.original_filename} ({d.document_type})\n"
                if d.extracted_text:
                    context_text += f"  Contenido/Resultados:\n{d.extracted_text}\n"
                    
    system_prompt = f"""Eres un Asistente Médico de IA diseñado exclusivamente para ayudar a DOCTORES a revisar expedientes de pacientes.
El doctor te hará una pregunta sobre el paciente. Analiza la pregunta y responde utilizando ÚNICAMENTE la información del siguiente expediente.
Si la información no está en el expediente, dilo claramente. Sé conciso, profesional y directo. No uses saludos largos.

{context_text}
"""
    
    try:
        def stream_generator():
            client = ollama.AsyncClient(host=os.getenv("OLLAMA_HOST", "https://molecular-playable-saga.ngrok-free.dev"))
            response = client.chat(
                model=request.text_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.query}
                ],
                stream=True
            )
            # Ollama async generator requires async for inside an async generator, 
            # but FastAPI StreamingResponse can consume an async generator directly.
            pass # We need to define this as an async generator properly

        # Let's do it simply using the async generator
        async def generate():
            client = ollama.AsyncClient(host=os.getenv("OLLAMA_HOST", "https://molecular-playable-saga.ngrok-free.dev"))
            async for chunk in await client.chat(
                model=request.text_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.query}
                ],
                stream=True
            ):
                if 'message' in chunk and 'content' in chunk['message']:
                    yield chunk['message']['content']

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        print(f"Ollama Doctor API Error: {e}")
        return StreamingResponse(iter([f"Error: No se pudo procesar la respuesta del modelo de IA. {str(e)}"]), media_type="text/plain")



@app.post("/api/patients/{patient_id}/documents")
async def upload_document(
    patient_id: str,
    current_user_id: str = Depends(get_current_user_id),
    file: UploadFile = File(...),
    document_type: str = Form(...),
    notes: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if not s3_client:
        raise HTTPException(status_code=500, detail="Storage client is not configured (Missing R2 credentials).")
    
    # 1. Validate File Size (Max 10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
    # 2. Validate PDF magic bytes
    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF files are allowed.")
        
    # Check if patient exists
    actual_patient_id = current_user_id if patient_id == "me" or patient_id == "mock_user" else patient_id
    stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    
    # --- OCR and Data Extraction via Ollama ---
    extracted_insights = ""
    try:
        import io
        import PyPDF2
        import ollama
        import os
        
        pdf_file = io.BytesIO(file_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        raw_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                raw_text += page_text + "\n"
        
        if raw_text.strip():
            openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            prompt = f"""Eres un asistente médico experto. A continuación tienes el texto extraído de un documento clínico de un paciente.
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
"""
            resp = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" }
            )
            extracted_insights = resp.choices[0].message.content
    except Exception as e:
        print(f"Ollama OCR Error: {e}")
        extracted_insights = f"Error extrayendo datos con IA: {str(e)}"
    
    # 3. Upload to R2

    file_extension = ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    object_key = f"patients/{patient.id}/documents/{unique_filename}"
    
    try:
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType="application/pdf"
        )
    except ClientError as e:
        print(f"S3 Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload document to storage.")

    # 4. Create Database Record
    new_doc = models.MedicalDocument(
        patient_id=patient.id,
        document_type=document_type,
        file_url=object_key,
        original_filename=file.filename,
        notes=notes,
        extracted_text=extracted_insights
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    return {
        "id": new_doc.id,
        "document_type": new_doc.document_type.value,
        "original_filename": new_doc.original_filename,
        "uploaded_at": new_doc.uploaded_at,
        "notes": new_doc.notes
    }


@app.get("/api/patients/{patient_id}/documents")
async def list_documents(patient_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    if not s3_client:
        raise HTTPException(status_code=500, detail="Storage client is not configured.")

    actual_patient_id = current_user_id if patient_id == "me" or patient_id == "mock_user" else patient_id
    stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id)
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Get documents that are not deleted
    doc_stmt = select(models.MedicalDocument).where(
        models.MedicalDocument.patient_id == patient.id,
        models.MedicalDocument.is_deleted == False
    ).order_by(models.MedicalDocument.uploaded_at.desc())
    
    doc_result = await db.execute(doc_stmt)
    documents = doc_result.scalars().all()
    
    docs_response = []
    for doc in documents:
        # Generate presigned URL for secure download (expires in 1 hour)
        try:
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': R2_BUCKET_NAME, 'Key': doc.file_url},
                ExpiresIn=3600
            )
        except ClientError:
            presigned_url = None
            
        docs_response.append({
            "id": doc.id,
            "document_type": doc.document_type.value,
            "original_filename": doc.original_filename,
            "uploaded_at": doc.uploaded_at,
            "notes": doc.notes,
            "extracted_text": doc.extracted_text,
            "download_url": presigned_url
        })
        
    return docs_response


@app.delete("/api/patients/{patient_id}/documents/{document_id}")
async def delete_document(patient_id: str, document_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    stmt = select(models.MedicalDocument).where(models.MedicalDocument.id == document_id, models.MedicalDocument.is_deleted == False)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    # Validate patient ownership
    p_actual_patient_id = current_user_id if patient_id == "me" or patient_id == "mock_user" else patient_id
    stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id)
    p_result = await db.execute(p_stmt)
    patient = p_result.scalar_one_or_none()
    
    if not patient or doc.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document.")
        
    # Soft delete
    doc.is_deleted = True
    await db.commit()
    
    return {"status": "success", "message": "Document deleted successfully."}


@app.post("/api/medical/search", response_model=MedicalSearchResponse)
async def medical_search(
    request: MedicalSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    service = get_medical_search_service()
    
    query = request.query
    try:
        result = await service.search(
            query=query,
            max_results=request.max_results
        )
        if isinstance(result, list):
            return {"results": result}
        return result
    except Exception as e:
        print(f"Error en búsqueda médica: {e}")
        raise HTTPException(
            status_code=500,
            detail="No fue posible realizar la búsqueda médica."
        )
