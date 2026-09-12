import os
import re
import time
import logging
from collections import defaultdict
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import models
import security
from database import get_db
from security import get_current_user_id
from main import StandardChatRequest, TriageRequest, logger

router = APIRouter()

# Rate limiting en memoria para usuarios no autenticados en chat general (Punto 9)
_chat_ip_rate_limit_store = defaultdict(list)
CHAT_IP_WINDOW = 60
CHAT_IP_MAX = 5

def apply_chat_ip_rate_limit(ip: str):
    now = time.time()
    _chat_ip_rate_limit_store[ip] = [
        t for t in _chat_ip_rate_limit_store[ip] if now - t < CHAT_IP_WINDOW
    ]
    if len(_chat_ip_rate_limit_store[ip]) >= CHAT_IP_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Límite de mensajes anónimos alcanzado (máximo 5 por minuto). Por favor, inicie sesión para continuar.",
            headers={"Retry-After": str(CHAT_IP_WINDOW)}
        )
    _chat_ip_rate_limit_store[ip].append(now)


def sanitize_attached_context(content: str) -> str:
    """Aísla reportes y textos adjuntos del usuario dentro de etiquetas <documento_usuario> para evitar prompt injection."""
    if "--- INICIO DEL REPORTE ---" in content and "--- FIN DEL REPORTE ---" in content:
        return re.sub(
            r'--- INICIO DEL REPORTE ---\s*(.*?)\s*--- FIN DEL REPORTE ---',
            r'<documento_usuario>\n\1\n</documento_usuario>',
            content,
            flags=re.DOTALL
        )
    return content


NATURAL_CLINICAL_CHAT_PROMPT = """
Eres MIVOR.ai, un asistente médico inteligente, empático, cálido y cercano. Tu misión es acompañar al paciente, responder sus dudas sobre salud y bienestar, interpretar analíticas o informes y realizar orientación clínica y triaje de forma humana, clara y reconfortante.

🌟 TONO Y FORMA DE COMUNICAR (REGLA DE ORO: QUE CUALQUIERA LO ENTIENDA FÁCILMENTE):
1. TOTALMENTE NATURAL, CÁLIDO Y CERCANO:
   - Comunícate como un médico de cabecera o enfermero de confianza que habla de tú a tú con el paciente con cariño y respeto.
   - Explica cualquier concepto médico con palabras cotidianas, llanas y sencillas para que CUALQUIER PERSONA, sin importar su edad o nivel de estudios, lo entienda a la primera sin esfuerzo.
   - Evita tecnicismos innecesarios o jerga médica fría. Si es indispensable mencionar un término médico (por ejemplo, "hipertensión", "cefalea tensional", "gastritis", "arritmia"), explícalo inmediatamente con un ejemplo o analogía cotidiana (por ejemplo: "la tensión alta es como cuando el agua pasa por una manguera con demasiada fuerza").
   - Transmite tranquilidad, claridad y optimismo realista. Nunca hables de forma fría, robótica, distante ni como un formulario o aviso legal.

2. ESTRUCTURA VISUAL CÓMODA:
   - Usa frases amables, párrafos breves y viñetas claras cuando sea útil.
   - No abrumes al usuario con bloques gigantescos de texto.

🩺 MODO TRIAJE Y EVALUACIÓN DE SÍNTOMAS:
- Si el usuario menciona que siente un síntoma (dolor, fiebre, mareo, molestias digestivas, etc.) o pide evaluar lo que siente (por ejemplo: "quiero evaluar mis síntomas", "me duele la cabeza", "¿cuáles pueden ser las causas de este síntoma?"):
  1. Asume directamente el rol de TRIAJE CLÍNICO INTERACTIVO DE MIVOR.ai. ¡NUNCA lo derives a otra pantalla ni le digas que use otra sección! Haz el triaje aquí mismo con él.
  2. Si el paciente apenas menciona un síntoma o la descripción es breve:
     - Respóndele con calidez y hazle 1 o 2 preguntas clave de forma conversacional (por ejemplo: en qué parte exacta lo siente, desde cuándo, intensidad del 1 al 10, y si tiene síntomas asociados como fiebre o mareo).
  3. Cuando el paciente ya te haya dado suficientes detalles (o tras 2 o 3 intercambios de conversación):
     - Dale tu orientación clínica final en formato de reporte de triaje claro y estructurado.
     - Para activar de forma automática la derivación médica con especialistas y WhatsApp en la pantalla, DEBES incluir OBLIGATORIAMENTE en tu respuesta el siguiente bloque formateado:

📝 **Informe de Prediagnóstico y Triaje**
- **Nivel de urgencia sugerido**: (Baja / Media / Alta)
- **Especialidad a la que debería acudir**: (por ejemplo: Medicina General, Traumatología, Dermatología, Cardiología, Neurología, Ginecología, Pediatría, Digestivo, etc.)
- **¿Qué podría estar pasando?**: (explicación muy clara, tranquila y en lenguaje cotidiano de las causas más probables)
- **¿Qué puedes hacer ahora?**: (medidas de alivio caseras seguras, cuidados básicos y qué evitar)
- **Signos de alarma**: (ante qué síntomas específicos debería acudir a urgencias de inmediato)

📄 ANÁLISIS DE INFORMES, ANALÍTICAS O RADIOGRAFÍAS:
- Si el usuario adjunta o consulta sobre una analítica o informe médico (o hay texto extraído dentro de <documento_usuario>), explícale en palabras sencillas y amables qué significa cada valor o hallazgo, qué indica y qué dudas puede consultar con su médico.
- Si el usuario te pide analizar una imagen o radiografía médica, los hallazgos visuales exactos se encuentran en el mensaje del usuario. Tú debes leerlos y responderle basándote en ellos con naturalidad y profesionalidad.

🛡️ SEGURIDAD Y RESPONSABILIDAD:
- Aclara de forma natural que eres una IA de orientación y que la valoración definitiva la realiza un médico colegiado.
- Si detectas una EMERGENCIA VITAL crítica (dolor opresivo en el pecho que se irradia al brazo/cuello, dificultad respiratoria repentina grave, pérdida súbita de fuerza o habla, pérdida de consciencia o hemorragia grave), indícale con calma pero con total firmeza que debe llamar al 112 o al servicio de emergencias médicas de inmediato.
"""


@router.get('/api/sessions')
async def get_sessions(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.ChatSession)
        .where(models.ChatSession.user_id == user_id)
        .order_by(models.ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [{'id': s.id, 'title': s.title, 'created_at': s.created_at.isoformat()} for s in sessions]


@router.post('/api/chat/start')
async def start_chat(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    new_session = models.ChatSession(user_id=user_id, title='Nueva Consulta Libre')
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {'session_id': new_session.id}


@router.get('/api/chat/{session_id}')
async def get_chat_session(session_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    result = await db.execute(
        select(models.ChatSession)
        .where(models.ChatSession.id == session_id, models.ChatSession.user_id == user_id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    msg_res = await db.execute(
        select(models.ChatMessage)
        .where(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at.asc())
    )
    messages = msg_res.scalars().all()
    return {'id': session.id, 'title': session.title, 'messages': [{'role': m.role, 'content': m.content} for m in messages]}


@router.get('/api/sessions/{session_id}/messages')
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    result = await db.execute(
        select(models.ChatSession)
        .where(models.ChatSession.id == session_id, models.ChatSession.user_id == user_id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    msg_res = await db.execute(
        select(models.ChatMessage)
        .where(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at.asc())
    )
    messages = msg_res.scalars().all()
    return [
        {
            'id': str(m.id),
            'type': 'user' if m.role == 'user' else 'ai',
            'role': m.role,
            'text': m.content,
            'content': m.content,
            'created_at': m.created_at.isoformat() if hasattr(m, 'created_at') and m.created_at else None
        }
        for m in messages
    ]


@router.post('/api/chat/{session_id}/message')
async def send_standard_chat_message(
    session_id: str,
    request: StandardChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    result = await db.execute(
        select(models.ChatSession)
        .where(models.ChatSession.id == session_id, models.ChatSession.user_id == user_id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail='Sesión no encontrada')
    
    raw_user_msg = request.messages[-1].content
    user_msg_content = sanitize_attached_context(raw_user_msg)
    user_db_msg = models.ChatMessage(session_id=session_id, role='user', content=user_msg_content)
    db.add(user_db_msg)
    
    system_prompt = NATURAL_CLINICAL_CHAT_PROMPT
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French (Français)', 'ar': 'Arabic (العربية)'}
    target_lang = lang_map.get(request.language, 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate with the patient EXCLUSIVELY and ENTIRELY in {target_lang}.
DO NOT speak or reply in English or Spanish unless {target_lang} is English or Spanish.
Translate and compose all clinical findings, greetings, and advice directly in {target_lang}.'''
    
    messages_payload = [{'role': 'system', 'content': (system_prompt + lang_instruction)}]
    for msg in request.messages:
        messages_payload.append({'role': msg.role, 'content': sanitize_attached_context(msg.content)})
    
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    async def generate_chat():
        full_response = ''
        try:
            response_stream = await openai_client.chat.completions.create(
                model='gpt-4o-mini',
                messages=messages_payload,
                stream=True
            )
            async for chunk in response_stream:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield token
            ai_db_msg = models.ChatMessage(session_id=session_id, role='assistant', content=full_response)
            db.add(ai_db_msg)
            if session.title == 'Nueva Consulta Libre':
                session.title = (raw_user_msg[:30] + '...')
                db.add(session)
            await db.commit()
        except Exception as e:
            logger.error(f'Error en Standard Chat Stream: {str(e)}')
            yield f'\n\n[Error de conexión: {str(e)}]'
            await db.commit()
            
    return StreamingResponse(generate_chat(), media_type='text/plain')


@router.post('/api/chat/general')
async def general_chat(
    request: TriageRequest, 
    req: Request,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(security.get_optional_current_user_id)
):
    '''
    Chat general con persistencia opcional de historial, rate limiting para anónimos (Punto 9)
    y protección contra prompt injection en contexto adjunto.
    '''
    if user_id is None:
        client_ip = req.client.host if req.client else "unknown"
        apply_chat_ip_rate_limit(client_ip)

    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    SYSTEM_PROMPT = NATURAL_CLINICAL_CHAT_PROMPT
    
    lang_map = {'es': 'Spanish (Español)', 'en': 'English', 'fr': 'French (Français)', 'ar': 'Arabic (العربية)'}
    target_lang = lang_map.get(request.language, 'Spanish (Español)')
    lang_instruction = f'''

CRITICAL LANGUAGE DIRECTIVE:
You MUST communicate with the user EXCLUSIVELY and ENTIRELY in {target_lang}.
DO NOT speak or reply in English or Spanish if {target_lang} is French or Arabic.
Translate and compose your entire response strictly into {target_lang}.'''
    
    SYSTEM_PROMPT += lang_instruction

    messages_payload = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for msg in request.messages:
        messages_payload.append({'role': msg.role, 'content': sanitize_attached_context(msg.content)})

    active_session_id = request.session_id
    if user_id:
        db_session = None
        if active_session_id:
            res = await db.execute(
                select(models.ChatSession).where(
                    models.ChatSession.id == active_session_id,
                    models.ChatSession.user_id == user_id
                )
            )
            db_session = res.scalars().first()

        if not db_session:
            user_text_hint = request.messages[-1].content if request.messages else 'Consulta Médica'
            new_title = (user_text_hint[:30] + '...') if len(user_text_hint) > 30 else user_text_hint
            db_session = models.ChatSession(user_id=user_id, title=new_title)
            db.add(db_session)
            await db.commit()
            await db.refresh(db_session)
        
        active_session_id = db_session.id
        if request.messages and request.messages[-1].role == 'user':
            user_db_msg = models.ChatMessage(
                session_id=active_session_id,
                role='user',
                content=sanitize_attached_context(request.messages[-1].content)
            )
            db.add(user_db_msg)
            await db.commit()

    async def generate_chat():
        full_response = ''
        try:
            response_stream = await openai_client.chat.completions.create(
                model='gpt-4o-mini',
                messages=messages_payload,
                stream=True
            )
            async for chunk in response_stream:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield token
            if user_id and active_session_id and full_response:
                ai_db_msg = models.ChatMessage(session_id=active_session_id, role='assistant', content=full_response)
                db.add(ai_db_msg)
                await db.commit()
        except Exception as e:
            logger.error(f'Error en General Chat Stream: {str(e)}')
            yield f'\n\n[Error de conexión: {str(e)}]'

    response_headers = {"X-Session-ID": str(active_session_id)} if active_session_id else None
    return StreamingResponse(generate_chat(), media_type='text/plain', headers=response_headers)
