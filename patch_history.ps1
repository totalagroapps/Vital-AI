import re
import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add schemas
schemas = '''
class PatientProfileBase(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: str
    qr_code_base64: Optional[str] = None
'''

if 'class PatientProfileBase' not in content:
    content = content.replace('class DocumentResponse(BaseModel):', schemas + '\nclass DocumentResponse(BaseModel):')

endpoints = '''
import qrcode
import base64
from io import BytesIO

def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

@app.get("/api/patient/profile")
async def get_patient_profile(db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        return {}
        
    profile_dict = {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact
    }
    
    # Generate QR pointing to a public emergency URL
    emergency_url = f"https://vitalia.up.railway.app/emergency/{profile.user_id}"
    profile_dict["qr_code_base64"] = generate_qr_base64(emergency_url)
    
    return profile_dict

@app.post("/api/patient/profile")
async def save_patient_profile(profile_data: PatientProfileBase, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if profile:
        # Update
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
        # Create
        profile = models.PatientProfile(
            user_id=current_user_id,
            **profile_data.dict(exclude_unset=True)
        )
        db.add(profile)
        
    await db.commit()
    await db.refresh(profile)
    
    emergency_url = f"https://vitalia.up.railway.app/emergency/{profile.user_id}"
    qr_b64 = generate_qr_base64(emergency_url)
    
    return {"status": "success", "qr_code_base64": qr_b64}

from fastapi.responses import HTMLResponse

@app.get("/emergency/{user_id}", response_class=HTMLResponse)
async def get_emergency_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == user_id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de emergencia no encontrado")
        
    html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Ficha de Emergencia - {{profile.full_name}}</title>
        <style>
            body {{ font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; max-width: 600px; margin: 0 auto; }}
            .card {{ background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-top: 6px solid #ef4444; }}
            h1 {{ color: #ef4444; margin-top: 0; font-size: 24px; }}
            h2 {{ font-size: 18px; margin-bottom: 4px; }}
            .field {{ margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }}
            .label {{ font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }}
            .value {{ font-size: 16px; font-weight: 500; }}
            .alert {{ color: #ef4444; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>⚕️ PASAPORTE MEDICO DE EMERGENCIA</h1>
            <h2>{{profile.full_name}}</h2>
            <p style="color: #64748b; margin-top: 0;">ID: {{profile.user_id}}</p>
            
            <div class="field"><div class="label">Grupo Sanguíneo</div><div class="value alert">{{profile.blood_type or 'No especificado'}}</div></div>
            <div class="field"><div class="label">Alergias Conocidas</div><div class="value alert">{{profile.allergies or 'Ninguna registrada'}}</div></div>
            <div class="field"><div class="label">Enfermedades Crónicas</div><div class="value">{{profile.chronic_conditions or 'Ninguna registrada'}}</div></div>
            <div class="field"><div class="label">Medicación Actual</div><div class="value">{{profile.current_medications or 'Ninguna registrada'}}</div></div>
            <div class="field"><div class="label">Contacto de Emergencia</div><div class="value">{{profile.emergency_contact or 'No especificado'}}</div></div>
            
            <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
                Información médica provista por MedIA Hub.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Simple replace to prevent f-string bracket issues with CSS
    html = html.replace('{{profile.full_name}}', str(profile.full_name or 'Anónimo'))
    html = html.replace('{{profile.user_id}}', str(profile.user_id))
    html = html.replace('{{profile.blood_type or \\'No especificado\\'}}', str(profile.blood_type or 'No especificado'))
    html = html.replace('{{profile.allergies or \\'Ninguna registrada\\'}}', str(profile.allergies or 'Ninguna registrada'))
    html = html.replace('{{profile.chronic_conditions or \\'Ninguna registrada\\'}}', str(profile.chronic_conditions or 'Ninguna registrada'))
    html = html.replace('{{profile.current_medications or \\'Ninguna registrada\\'}}', str(profile.current_medications or 'Ninguna registrada'))
    html = html.replace('{{profile.emergency_contact or \\'No especificado\\'}}', str(profile.emergency_contact or 'No especificado'))
    
    return HTMLResponse(content=html)
'''

if '@app.get("/api/patient/profile")' not in content:
    content = content + '\n\n' + endpoints

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
