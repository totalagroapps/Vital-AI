import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target: /api/triage/{session_id}/message migration
old_code = '''    ollama_host = os.getenv("OLLAMA_HOST", "https://molecular-playable-saga.ngrok-free.dev")
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
                    token = chunk["message"]["content"]'''

new_code = '''    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_triage_response():
        full_response = ""
        try:
            response_stream = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages_payload,
                stream=True
            )
            
            # Emitir respuesta en streaming y guardarla en memoria
            async for chunk in response_stream:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content'''

content = content.replace(old_code, new_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Triage Chat migrated to OpenAI.")
