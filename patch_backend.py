import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix get_patient_profile
content = re.sub(
    r'@app\.get\("/api/patient/profile"\)\s*async def get_patient_profile\(db: AsyncSession = Depends\(get_db\)\):\s*from sqlalchemy\.future import select\s*user_id = "mock_user"',
    '@app.get("/api/patient/profile")\nasync def get_patient_profile(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):\n    from sqlalchemy.future import select',
    content
)

# Fix update_patient_profile
content = re.sub(
    r'@app\.post\("/api/patient/profile"\)\s*async def update_patient_profile\(profile_data: PatientProfileSchema, db: AsyncSession = Depends\(get_db\)\):\s*from sqlalchemy\.future import select\s*user_id = "mock_user"',
    '@app.post("/api/patient/profile")\nasync def update_patient_profile(profile_data: PatientProfileSchema, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):\n    from sqlalchemy.future import select',
    content
)

# Fix triage/start
content = re.sub(
    r'current_user_id = "user_123"',
    '# user_id is injected via Depends',
    content
)
content = re.sub(
    r'@app\.post\("/api/triage/start"\)\s*async def start_triage_session\(db: AsyncSession = Depends\(get_db\)\):',
    '@app.post("/api/triage/start")\nasync def start_triage_session(db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

# Fix document endpoints to take current_user_id
content = re.sub(
    r'@app\.post\("/api/patients/\{patient_id\}/documents"\)\s*async def upload_document\(',
    '@app.post("/api/patients/{patient_id}/documents")\nasync def upload_document(\n    current_user_id: str = Depends(get_current_user_id),',
    content
)

content = re.sub(
    r'@app\.get\("/api/patients/\{patient_id\}/documents"\)\s*async def list_documents\(patient_id: str, db: AsyncSession = Depends\(get_db\)\):',
    '@app.get("/api/patients/{patient_id}/documents")\nasync def list_documents(patient_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

content = re.sub(
    r'@app\.delete\("/api/patients/\{patient_id\}/documents/\{document_id\}"\)\s*async def delete_document\(patient_id: str, document_id: str, db: AsyncSession = Depends\(get_db\)\):',
    '@app.delete("/api/patients/{patient_id}/documents/{document_id}")\nasync def delete_document(patient_id: str, document_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

# Fix patient_id resolution logic in list_documents
content = content.replace(
    '''stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(patient_id) if patient_id.isdigit() else models.PatientProfile.user_id == patient_id)''',
    '''actual_patient_id = current_user_id if patient_id == "me" or patient_id == "mock_user" else patient_id\n    stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id)'''
)

# Write it back
with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
