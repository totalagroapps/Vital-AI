import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'@app\.get\("/api/doctor/patients"\)\s*async def get_all_patients\(db: AsyncSession = Depends\(get_db\)\):',
    '@app.get("/api/doctor/patients")\nasync def get_all_patients(db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

content = re.sub(
    r'@app\.get\("/api/doctor/patients/\{patient_id\}"\)\s*async def get_patient_detail\(patient_id: str, db: AsyncSession = Depends\(get_db\)\):',
    '@app.get("/api/doctor/patients/{patient_id}")\nasync def get_patient_detail(patient_id: str, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

content = re.sub(
    r'@app\.post\("/api/doctor/ask"\)\s*async def ask_doctor_copilot\(request: DoctorAskRequest, db: AsyncSession = Depends\(get_db\)\):',
    '@app.post("/api/doctor/ask")\nasync def ask_doctor_copilot(request: DoctorAskRequest, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):',
    content
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
