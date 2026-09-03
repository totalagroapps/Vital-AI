import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

injection = '''
                # NEW CODE: Save HealthEvent if closed
                if t_session.status.startswith("closed_"):
                    try:
                        import json
                        payload_data = {
                            "title": "Sesin de Triaje",
                            "severity": t_session.status.replace("closed_", "").upper(),
                            "report": t_session.final_report,
                            "questions_asked": t_session.questions_asked
                        }
                        # We need the patient profile ID
                        p_stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == current_user_id)
                        p_res = await db.execute(p_stmt)
                        profile = p_res.scalars().first()
                        if profile:
                            new_event = models.HealthEvent(
                                patient_id=profile.id,
                                type=models.HealthEventType.triage,
                                payload=payload_data,
                                source_ref_id=str(t_session.id)
                            )
                            db.add(new_event)
                    except Exception as he_err:
                        logger.error(f"Error creating HealthEvent for triage: {he_err}")
                
                # Guardar el estado actualizado en la Base de Datos
                db.add(t_session)
'''

# Find the exact lines to replace
target = '''            # Guardar el estado actualizado en la Base de Datos
            db.add(t_session)'''

if target in content:
    content = content.replace(target, injection)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected HealthEvent into Triage!")
else:
    print("Target not found for triage injection!")
