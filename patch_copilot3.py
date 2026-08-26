import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_context = '''    for t in triages:
        context_text += f"- Fecha: {t.created_at}, Estado: {t.status}, Categoría: {t.category}\\n"
        if t.final_report:
            context_text += f"  Reporte Final: {t.final_report}\\n"
            
    system_prompt = f"""Eres un Asistente Médico de IA'''

new_context = '''    for t in triages:
        context_text += f"- Fecha: {t.created_at}, Estado: {t.status}, Categoría: {t.category}\\n"
        if t.final_report:
            context_text += f"  Reporte Final: {t.final_report}\\n"
            
    # GET DOCUMENTS
    if profile:
        doc_stmt = select(models.MedicalDocument).where(
            models.MedicalDocument.patient_id == profile.id,
            models.MedicalDocument.is_deleted == False
        ).order_by(models.MedicalDocument.uploaded_at.desc())
        doc_result = await db.execute(doc_stmt)
        documents = doc_result.scalars().all()
        
        if documents:
            context_text += "\\n[DOCUMENTOS MEDICOS ADJUNTOS]\\n"
            for d in documents:
                context_text += f"- Documento: {d.original_filename} ({d.document_type})\\n"
                if d.extracted_text:
                    context_text += f"  Contenido/Resultados:\\n{d.extracted_text}\\n"
                    
    system_prompt = f"""Eres un Asistente Médico de IA'''

if '[DOCUMENTOS MEDICOS ADJUNTOS]' not in content:
    content = content.replace(old_context, new_context)
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched correctly.")
else:
    print("Already patched.")
