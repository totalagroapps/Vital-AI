import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. PatientProfileSchema
schema_old = '''    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = "es"'''
schema_new = '''    emergency_contact: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    preferred_language: Optional[str] = "es"'''
content = content.replace(schema_old, schema_new)

# 2. QR code data
qr_old = "    qr_data = f\"FICHA MEDICA DE EMERGENCIA\\nNombre: {profile.full_name}\\nSangre: {profile.blood_type}\\nAlergias: {profile.allergies or 'Ninguna'}\\nCondiciones: {profile.chronic_conditions or 'Ninguna'}\\nContacto: {profile.emergency_contact or 'No especificado'}\""
qr_new = "    qr_data = f\"FICHA MEDICA DE EMERGENCIA\\nNombre: {profile.full_name}\\nSangre: {profile.blood_type}\\nAltura: {profile.height or 'N/D'} | Peso: {profile.weight or 'N/D'}\\nAlergias: {profile.allergies or 'Ninguna'}\\nCondiciones: {profile.chronic_conditions or 'Ninguna'}\\nContacto: {profile.emergency_contact or 'No especificado'}\""
content = content.replace(qr_old, qr_new)

# 3. get_patient_profile return
ret_old = '''        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "qr_code_base64": qr_base64,'''
ret_new = '''        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "height": profile.height,
        "weight": profile.weight,
        "qr_code_base64": qr_base64,'''
content = content.replace(ret_old, ret_new)

# 4. update_patient_profile
upd_old = '''    profile.allergies = profile_data.allergies
    profile.chronic_conditions = profile_data.chronic_conditions
    profile.current_medications = profile_data.current_medications
    profile.emergency_contact = profile_data.emergency_contact
    
    await db.commit()'''
upd_new = '''    profile.allergies = profile_data.allergies
    profile.chronic_conditions = profile_data.chronic_conditions
    profile.current_medications = profile_data.current_medications
    profile.emergency_contact = profile_data.emergency_contact
    profile.height = profile_data.height
    profile.weight = profile_data.weight
    
    await db.commit()'''
content = content.replace(upd_old, upd_new)

# 5. ask_doctor_copilot context
ctx_old = '''  - Alergias: {profile.allergies if profile else ''}
  - Crónicas: {profile.chronic_conditions if profile else ''}'''
ctx_new = '''  - Altura: {profile.height if profile else ''}
  - Peso: {profile.weight if profile else ''}
  - Alergias: {profile.allergies if profile else ''}
  - Crónicas: {profile.chronic_conditions if profile else ''}'''
content = content.replace(ctx_old, ctx_new)

# 6. get_patient_detail return
det_old = '''            "allergies": profile.allergies,
            "chronic_conditions": profile.chronic_conditions,
            "current_medications": profile.current_medications,
            "emergency_contact": profile.emergency_contact
        },'''
det_new = '''            "allergies": profile.allergies,
            "chronic_conditions": profile.chronic_conditions,
            "current_medications": profile.current_medications,
            "emergency_contact": profile.emergency_contact,
            "height": profile.height,
            "weight": profile.weight
        },'''
content = content.replace(det_old, det_new)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Backend patched")
