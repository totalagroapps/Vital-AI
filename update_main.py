import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_get_sessions = '''@app.get("/api/sessions")
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    return []'''

new_endpoints = '''@app.get("/api/sessions")
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

class StandardChatRequest(BaseModel):
    messages: List[ChatMessage]
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
    
    system_prompt = "Eres VitalIA, un asistente clínico experto en analizar documentos médicos, radiografías y consultas de salud generales. Responde siempre con amabilidad y precisión."
    lang_map = {"es": "Spanish (Español)", "en": "English", "fr": "French", "ar": "Arabic"}
    target_lang = lang_map.get(request.language, "Spanish (Español)")
    lang_instruction = f"\\n\\nCRITICAL INSTRUCTION: You MUST communicate with the patient EXCLUSIVELY in {target_lang}."
    
    messages_payload = [{"role": "system", "content": system_prompt + lang_instruction}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

    ollama_host = os.getenv("OLLAMA_HOST", "https://desktops-days-wav-happened.trycloudflare.com")
    client = ollama.AsyncClient(host=ollama_host, timeout=60.0)

    async def generate_chat():
        full_response = ""
        try:
            response_stream = await client.chat(
                model="llama3.1",
                messages=messages_payload,
                stream=True
            )
            async for chunk in response_stream:
                if "message" in chunk and "content" in chunk["message"]:
                    token = chunk["message"]["content"]
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
            yield f"\\n\\n[Error de conexión: {str(e)}]"
            await db.commit()

    return StreamingResponse(generate_chat(), media_type="text/plain")'''

content = content.replace(old_get_sessions, new_endpoints)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated main.py with standard chat endpoints")
