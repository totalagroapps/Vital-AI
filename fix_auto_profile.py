import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'def upload_document\(\s*file:\s*UploadFile\s*=\s*File\(\.\.\.\),\s*db:\s*AsyncSession\s*=\s*Depends\(get_db\)\s*\):'
repl = r'def upload_document(\n    file: UploadFile = File(...),\n    db: AsyncSession = Depends(get_db),\n    current_user_id: str = Depends(get_current_user_id)\n):'
content = re.sub(pattern, repl, content)

inject_point = r'response_data\["extracted_text"\]\s*=\s*response_data\["extracted_text"\]\s*if\s*"extracted_text"\s*in\s*response_data\s*else\s*response_data.get\("extracted_text", ""\)' # not using regex, will do string replace

inject_str = """        # Auto-profiling
        if response_data["extracted_text"]:
            import json
            import os
            from openai import AsyncOpenAI
            
            try:
                openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                prompt = f\"\"\"Extrae los siguientes datos m\u00e9dicos del siguiente reporte y devuelve un JSON estricto:
{{
  "allergies": "lista separada por comas, o vac\u00edo si no hay",
  "chronic_conditions": "lista separada por comas, o vac\u00edo si no hay",
  "current_medications": "lista separada por comas, o vac\u00edo si no hay"
}}
Si no encuentras nada para un campo, d\u00e9jalo vac\u00edo. S\u00f3lo devuelve el JSON.
Texto: {response_data['extracted_text']}
\"\"\"
                resp = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                
                try:
                    extracted_json = json.loads(resp.choices[0].message.content)
                    # Update DB
                    from sqlalchemy import select
                    result = await db.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == current_user_id))
                    profile = result.scalars().first()
                    if profile:
                        if extracted_json.get("allergies"):
                            profile.allergies = f"{profile.allergies}, {extracted_json['allergies']}" if profile.allergies and profile.allergies != "Ninguna registrada" else extracted_json['allergies']
                        if extracted_json.get("chronic_conditions"):
                            profile.chronic_conditions = f"{profile.chronic_conditions}, {extracted_json['chronic_conditions']}" if profile.chronic_conditions and profile.chronic_conditions != "Ninguna registrada" else extracted_json['chronic_conditions']
                        if extracted_json.get("current_medications"):
                            profile.current_medications = f"{profile.current_medications}, {extracted_json['current_medications']}" if profile.current_medications and profile.current_medications != "Ninguna registrada" else extracted_json['current_medications']
                        await db.commit()
                except Exception as json_e:
                    logger.error(f"Error parsing auto-profiling JSON: {json_e}")
                    
            except Exception as e:
                logger.error(f"Error in auto-profiling: {e}")
                
        # Guardar en base de datos PostgreSQL de forma as\u00edncrona"""

# Inject before: # Guardar en base de datos PostgreSQL
content = content.replace("# Guardar en base de datos PostgreSQL de forma as\u00edncrona", inject_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched main.py")
