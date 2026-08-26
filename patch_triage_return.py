import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the return dict of get_patient_profile
old_return = '''    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "qr_code_base64": qr_base64
    }'''

new_return = '''    # Get patient's triages
    triage_res = await db.execute(select(models.TriageSession).where(models.TriageSession.user_id == user_id).order_by(models.TriageSession.created_at.desc()))
    triages = triage_res.scalars().all()
    
    triage_list = []
    for t in triages:
        if t.final_report:
            triage_list.append({
                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
                "created_at": t.created_at.isoformat() if t.created_at else None
            })

    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions,
        "current_medications": profile.current_medications,
        "emergency_contact": profile.emergency_contact,
        "qr_code_base64": qr_base64,
        "triages": triage_list
    }'''

if 'triage_list = []' not in content:
    content = content.replace(old_return, new_return)
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched main.py to return triages")
else:
    print("Already patched")
