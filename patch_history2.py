import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = '''
import qrcode
import base64
from io import BytesIO
from fastapi.responses import HTMLResponse

def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

@app.get("/api/patient/profile", response_model=dict)
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
    
    emergency_url = f"https://vitalia.up.railway.app/emergency/{profile.user_id}"
    profile_dict["qr_code_base64"] = generate_qr_base64(emergency_url)
    
    return profile_dict

@app.post("/api/patient/profile", response_model=dict)
async def save_patient_profile(profile_data: PatientProfileSchema, db: AsyncSession = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if profile:
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
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

@app.get("/emergency/{user_id}", response_class=HTMLResponse)
async def get_emergency_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == user_id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de emergencia no encontrado")
        
    name = str(profile.full_name or 'Anónimo')
    uid = str(profile.user_id)
    blood = str(profile.blood_type or 'No especificado')
    allergies = str(profile.allergies or 'Ninguna registrada')
    chronic = str(profile.chronic_conditions or 'Ninguna registrada')
    meds = str(profile.current_medications or 'Ninguna registrada')
    contact = str(profile.emergency_contact or 'No especificado')
    
    html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Ficha de Emergencia - {name}</title>
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
            <h2>{name}</h2>
            <p style="color: #64748b; margin-top: 0;">ID: {uid}</p>
            
            <div class="field"><div class="label">Grupo Sanguíneo</div><div class="value alert">{blood}</div></div>
            <div class="field"><div class="label">Alergias Conocidas</div><div class="value alert">{allergies}</div></div>
            <div class="field"><div class="label">Enfermedades Crónicas</div><div class="value">{chronic}</div></div>
            <div class="field"><div class="label">Medicación Actual</div><div class="value">{meds}</div></div>
            <div class="field"><div class="label">Contacto de Emergencia</div><div class="value">{contact}</div></div>
            
            <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
                Información médica provista por VitalIA.
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)
'''

if '/api/patient/profile' not in content:
    with open('backend/main.py', 'a', encoding='utf-8') as f:
        f.write('\n\n' + endpoints)
    print("Endpoints added successfully.")
else:
    print("Endpoints already exist.")
