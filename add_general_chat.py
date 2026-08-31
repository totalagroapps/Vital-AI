import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_general_chat = '''
# 5. Endpoint: Chat General (Buscador)
@app.post("/api/chat/general")
async def general_chat(
    request: TriageRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Chat general libre de contexto mdico histrico. 
    Ideal para consultas rpidas de nutricin, fitness, dudas generales de salud.
    """
    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # 1. Intent Classification (Simple Rule/Regex or Mini-Prompt)
    last_msg = request.messages[-1].content.lower() if request.messages else ""
    symptom_keywords = ["me duele", "siento", "tengo fiebre", "urgencia", "sangre", "mareo", "vomito", "dolor"]
    
    # Si detecta sntomas, inyecta un disclaimer fuerte al inicio
    is_symptom = any(k in last_msg for k in symptom_keywords)
    
    SYSTEM_PROMPT = """Eres Vital IA, un asistente general de salud y bienestar. 
Responde de forma concisa, educada y profesional.
REGLA CRITICA: NO TIENES ACCESO AL HISTORIAL MEDICO DEL PACIENTE AQUI. 
Si el usuario pregunta por sus sntomas, dile educadamente que para hacer un pre-diagnstico preciso debe usar el mdulo 'Entiende tus sntomas' (Triaje)."""

    if is_symptom:
        SYSTEM_PROMPT += "\n\\nATENCION: El usuario parece estar describiendo un sntoma activo. Sugiere amablemente usar la seccin de Triaje para un anlisis formal."
        
    messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

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
            logger.error(f"Error en General Chat Stream: {str(e)}")
            yield f"\\n\\n[Error de conexin: {str(e)}]"

    return StreamingResponse(generate_chat(), media_type="text/plain")
'''

if '@app.post("/api/chat/general")' not in content:
    content += new_general_chat
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added /api/chat/general")
