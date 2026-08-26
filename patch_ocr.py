import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

extraction_logic = '''
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
                raw_text += page_text + "\\n"
        
        if raw_text.strip():
            ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
            client = ollama.AsyncClient(host=ollama_host, timeout=60.0)
            
            prompt = f\"\"\"Eres un asistente médico experto. A continuación tienes el texto extraído de un documento clínico de un paciente.
Tu tarea es hacer un resumen clínico conciso destacando:
1. Diagnósticos principales.
2. Valores de laboratorio fuera de rango o anormales (si los hay).
3. Medicamentos mencionados.
OMITE estrictamente cualquier dato personal identificable (Nombres completos, DNI, dirección).
Si el texto es ininteligible o no es médico, indícalo.

Texto:
{raw_text[:4000]}
\"\"\"
            resp = await client.chat(
                model="llama3.1",
                messages=[{"role": "user", "content": prompt}]
            )
            extracted_insights = resp.get("message", {}).get("content", "")
    except Exception as e:
        print(f"Ollama OCR Error: {e}")
        extracted_insights = f"Error extrayendo datos con IA: {str(e)}"
    
    # 3. Upload to R2
'''

content = content.replace(
    "# 3. Upload to R2",
    extraction_logic
)

content = content.replace(
    '''new_doc = models.MedicalDocument(
        patient_id=patient.id,
        document_type=document_type,
        file_url=object_key,
        original_filename=file.filename,
        notes=notes
    )''',
    '''new_doc = models.MedicalDocument(
        patient_id=patient.id,
        document_type=document_type,
        file_url=object_key,
        original_filename=file.filename,
        notes=notes,
        extracted_text=extracted_insights
    )'''
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
