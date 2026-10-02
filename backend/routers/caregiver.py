import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import database
import models
import security

router = APIRouter()
logger = logging.getLogger("caregiver")

@router.get('/api/caregiver/timeline/{profile_id}')
async def get_patient_timeline(
    profile_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Devuelve un timeline cronológico de los eventos del paciente (Triajes, Pastillas, Signos Vitales).
    """
    # 1. Verificar acceso: ¿el perfil pertenece al usuario o es cuidador?
    profile_res = await db.execute(
        select(models.PatientProfile)
        .where(models.PatientProfile.id == profile_id)
    )
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
        
    # Temporal: permitir si el user_id coincide. (En el futuro validar caregiver_patient_links si es otro usuario)
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este perfil")

    timeline = []
    
    # Signos Vitales
    readings_res = await db.execute(
        select(models.HealthReading)
        .where(models.HealthReading.patient_id == profile.user_id)
        .order_by(desc(models.HealthReading.created_at))
        .limit(20)
    )
    for r in readings_res.scalars().all():
        timeline.append({
            "type": "vital_sign",
            "title": f"Registro de {r.kind}",
            "description": f"Valor: {r.value1}" + (f"/{r.value2}" if r.value2 else ""),
            "date": r.created_at.isoformat() if r.created_at else None,
            "source": r.source,
            "timestamp": r.created_at.timestamp() if r.created_at else 0
        })
        
    # Triajes (Consultas IA)
    triage_res = await db.execute(
        select(models.TriageSession)
        .where(models.TriageSession.user_id == profile.user_id)
        .order_by(desc(models.TriageSession.created_at))
        .limit(10)
    )
    for t in triage_res.scalars().all():
        timeline.append({
            "type": "triage",
            "title": "Evaluación IA de Síntomas",
            "description": t.title or "Consulta de salud",
            "date": t.created_at.isoformat() if t.created_at else None,
            "timestamp": t.created_at.timestamp() if t.created_at else 0
        })

    # Medicamentos tomados
    # Asumimos que medication_logs apunta al medication_id
    med_logs_res = await db.execute(
        select(models.MedicationLog, models.MedicationReminder.medication_name)
        .join(models.MedicationReminder, models.MedicationLog.medication_id == models.MedicationReminder.id)
        .where(models.MedicationLog.user_id == profile.user_id)
        .order_by(desc(models.MedicationLog.created_at))
        .limit(20)
    )
    for log, med_name in med_logs_res.all():
        timeline.append({
            "type": "medication",
            "title": "Toma de Medicamento",
            "description": f"Tomó {med_name} a las {log.taken_time}",
            "date": log.created_at.isoformat() if log.created_at else None,
            "timestamp": log.created_at.timestamp() if log.created_at else 0
        })
        
    # Sort by timestamp desc
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"timeline": timeline}
