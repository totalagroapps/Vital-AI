import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
@app.get("/api/documents/{document_id}/summary")
async def get_document_summary(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    stmt = select(models.MedicalDocument).where(
        models.MedicalDocument.id == document_id, 
        models.MedicalDocument.is_deleted == False
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    import json
    payload_data = {}
    if doc.extracted_text:
        try:
            payload_data = json.loads(doc.extracted_text)
        except:
            payload_data = {"resumen": doc.extracted_text}
            
    return {
        "id": doc.id,
        "type": doc.document_type.value if doc.document_type else "otro",
        "filename": doc.original_filename,
        "date": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "summary": payload_data
    }
'''

if '@app.get("/api/documents/{document_id}/summary")' not in content:
    content += new_endpoint
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added /api/documents/{id}/summary")
