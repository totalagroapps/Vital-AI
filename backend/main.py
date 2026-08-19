import base64
import io
import logging
import os
import re
import traceback
from typing import Optional, List
import asyncio

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

app = FastAPI(title="MedIA Hub V2 - Team API", version="2.0")

@app.on_event("startup")
async def startup_event():
    from database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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

# --- MOCK AUTH ENDPOINTS FOR DEMO FRONTEND ---
@app.post("/api/auth/login")
async def login():
    return {"access_token": "demo-token"}

@app.get("/api/auth/me")
async def get_me():
    return {"username": "Dr. Demo"}

@app.get("/api/sessions")
async def get_sessions():
    return []

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
            
            # Prompteamos a minicpm-v para extracción
            system_prompt = (
                "Eres un asistente médico experto. Se te ha proporcionado una imagen clínica (receta, analítica o radiografía). "
                "Tu tarea es realizar OCR (Reconocimiento Óptico de Caracteres) y extraer todo el texto visible, o describir anatómicamente los hallazgos si es una radiografía. "
                "No inventes datos. Extrae los signos vitales, medicamentos o fracturas de forma estructurada."
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": "Analiza esta imagen y extrae el texto o hallazgos clínicos importantes.",
                    "images": [img_b64_optimized]
                }
            ]
            
            ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
            client = ollama.AsyncClient(host=ollama_host, timeout=30.0)
            
            logger.info(f"Enviando imagen a minicpm-v en {ollama_host} para OCR/Clasificación...")
            resp = await client.chat(
                model="minicpm-v",
                messages=messages,
                options={"temperature": 0.1, "num_predict": 1024, "num_ctx": 4096}
            )
            
            raw_text = resp.get("message", {}).get("content", "")
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

TRIAGE_SYSTEM_PROMPT = """
Eres un asistente médico experto en triaje y prediagnóstico.
Tus REGLAS ESTRICTAS son:
1. NUNCA des un diagnóstico médico definitivo ni recetes medicamentos. Siempre sugiere consultar a un profesional real.
2. Haz preguntas de seguimiento sobre los síntomas del paciente. Haz máximo 3 a 4 preguntas en total durante la conversación, pero hazlas UNA POR UNA.
3. Sé empático, profesional, claro y conciso.
4. Cuando hayas recopilado suficiente información clínica (después de tus preguntas), genera un "INFORME DE TRIAGE" con la siguiente estructura y da por finalizada la entrevista:
   - **Síntomas Principales:**
   - **Posibles Causas (Prediagnóstico no concluyente):**
   - **Recomendaciones Generales:**
   - **Nivel de Urgencia (Bajo, Medio, Alto):**
"""

@app.post("/api/triage/chat")
async def triage_chat(request: TriageRequest):
    ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    # Timeout generoso de 60s para latencia de red/túnel en streaming
    client = ollama.AsyncClient(host=ollama_host, timeout=60.0)
    
    messages_payload = [{"role": "system", "content": TRIAGE_SYSTEM_PROMPT}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

    async def generate_chat():
        retries = 1
        for attempt in range(retries + 1):
            try:
                # Usar el modelo llama3.1 de texto designado
                response_stream = await client.chat(
                    model="llama3.1",
                    messages=messages_payload,
                    stream=True
                )
                async for chunk in response_stream:
                    if "message" in chunk and "content" in chunk["message"]:
                        yield chunk["message"]["content"]
                return # Salir exitosamente al terminar el stream
            except Exception as e:
                if attempt < retries:
                    logger.warning(f"Ollama stream dropped. Retrying... ({str(e)})")
                    await asyncio.sleep(2)
                    continue
                else:
                    logger.error(f"Ollama stream failed after retries: {str(e)}")
                    yield "\n\n[Error de conexión: El asistente no está disponible en este momento, intenta más tarde.]"
                    return

    return StreamingResponse(generate_chat(), media_type="text/plain")
# ==========================================
# ðŸš€ EXTENSIÃ“N: MODO TRIAJE ESTRUCTURADO 
# ==========================================
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
async def start_triage_session(db: AsyncSession = Depends(get_db)):
    """
    Crea una nueva sesiÃ³n de triaje en la base de datos asociada al usuario.
    """
    # mock user ID (asumiendo que auth real se agregarÃ¡ despuÃ©s)
    current_user_id = "user_123" 
    
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
    messages_payload = [{"role": "system", "content": TRIAGE_SYSTEM_PROMPT_V2}] + sanitized_messages

    ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
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
            if "📝 Informe de Prediagnóstico y Triaje" in full_response or "Informe de Prediagnóstico y Triaje" in full_response:
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

@app.get("/api/patient/profile")
async def get_patient_profile(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    user_id = "mock_user"
    result = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        return {}
    
    # Generate QR Code dynamically
    qr_data = f"FICHA MEDICA DE EMERGENCIA\nNombre: {profile.full_name}\nSangre: {profile.blood_type}\nAlergias: {profile.allergies or 'Ninguna'}\nCondiciones: {profile.chronic_conditions or 'Ninguna'}\nContacto: {profile.emergency_contact or 'No especificado'}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "qr_code_base64": qr_base64
    }

@app.post("/api/patient/profile")
async def update_patient_profile(profile_data: PatientProfileSchema, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    user_id = "mock_user"
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
    
    await db.commit()
    return {"status": "success"}

# --- DOCTOR DASHBOARD ENDPOINTS ---

class DoctorQueryRequest(BaseModel):
    query: str
    patient_id: str
    text_model: str = "llama3.1"

@app.get("/api/doctor/patients")
async def get_all_patients(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.future import select
    result = await db.execute(select(models.PatientProfile))
    patients = result.scalars().all()
    return [{"user_id": p.user_id, "full_name": p.full_name, "date_of_birth": p.date_of_birth, "gender": p.gender} for p in patients]

@app.get("/api/doctor/patients/{patient_id}")
async def get_patient_detail(patient_id: str, db: AsyncSession = Depends(get_db)):
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
            "emergency_contact": profile.emergency_contact
        },
        "triages": [
            {
                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
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
            
    system_prompt = f"""Eres un Asistente Médico de IA diseñado exclusivamente para ayudar a DOCTORES a revisar expedientes de pacientes.
El doctor te hará una pregunta sobre el paciente. Analiza la pregunta y responde utilizando ÚNICAMENTE la información del siguiente expediente.
Si la información no está en el expediente, dilo claramente. Sé conciso, profesional y directo. No uses saludos largos.

{context_text}
"""
    
    try:
        def stream_generator():
            client = ollama.AsyncClient(host=OLLAMA_URL)
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
            client = ollama.AsyncClient(host=OLLAMA_URL)
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

