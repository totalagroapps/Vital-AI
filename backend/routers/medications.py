from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import models
from database import get_db
from security import get_current_user_id

router = APIRouter()


class MedicationReminderCreate(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    time_of_day: Optional[str] = None


@router.get('/api/medications')
async def get_medications(
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    q = await db.execute(
        select(models.MedicationReminder).where(
            models.MedicationReminder.user_id == current_user_id,
            models.MedicationReminder.is_active == True
        )
    )
    reminders = q.scalars().all()
    q_logs = await db.execute(
        select(models.MedicationLog).where(
            models.MedicationLog.user_id == current_user_id,
            models.MedicationLog.taken_date == date
        )
    )
    logs = q_logs.scalars().all()
    logged_med_ids = {log.medication_id for log in logs}
    return {
        'reminders': [
            {
                'id': r.id,
                'medication_name': r.medication_name,
                'dosage': r.dosage,
                'frequency': r.frequency,
                'time_of_day': r.time_of_day,
                'taken_today': (r.id in logged_med_ids)
            }
            for r in reminders
        ],
        'date': date
    }


@router.post('/api/medications')
async def create_medication(
    req: MedicationReminderCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    new_med = models.MedicationReminder(
        user_id=current_user_id,
        medication_name=req.medication_name,
        dosage=req.dosage,
        frequency=req.frequency,
        time_of_day=req.time_of_day
    )
    db.add(new_med)
    await db.commit()
    await db.refresh(new_med)
    return {'status': 'ok', 'id': new_med.id}


@router.post('/api/medications/{med_id}/log')
async def log_medication(
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    # Validar que el recordatorio exista y pertenezca al usuario (Punto 8)
    q_med = await db.execute(
        select(models.MedicationReminder).where(
            models.MedicationReminder.id == med_id,
            models.MedicationReminder.user_id == current_user_id
        )
    )
    med = q_med.scalars().first()
    if not med:
        raise HTTPException(status_code=404, detail="Recordatorio de medicación no encontrado.")

    date = datetime.now().strftime('%Y-%m-%d')
    time_str = datetime.now().strftime('%H:%M')

    # Validar duplicado para este usuario y medicamento hoy (Punto 8)
    q = await db.execute(
        select(models.MedicationLog).where(
            models.MedicationLog.medication_id == med_id,
            models.MedicationLog.user_id == current_user_id,
            models.MedicationLog.taken_date == date
        )
    )
    existing = q.scalars().first()
    if existing:
        return {'status': 'already_logged'}

    log = models.MedicationLog(
        user_id=current_user_id,
        medication_id=med_id,
        taken_date=date,
        taken_time=time_str
    )
    db.add(log)
    await db.commit()
    return {'status': 'ok'}


@router.delete('/api/medications/{med_id}/log')
async def unlog_medication(
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    date = datetime.now().strftime('%Y-%m-%d')
    # Validar ownership y devolver 404 si no existe (Punto 7)
    q = await db.execute(
        select(models.MedicationLog).where(
            models.MedicationLog.medication_id == med_id,
            models.MedicationLog.user_id == current_user_id,
            models.MedicationLog.taken_date == date
        )
    )
    existing = q.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Registro de toma de medicación no encontrado.")

    await db.delete(existing)
    await db.commit()
    return {'status': 'ok'}


@router.delete('/api/medications/{med_id}')
async def delete_medication(
    med_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    q = await db.execute(
        select(models.MedicationReminder).where(
            models.MedicationReminder.id == med_id,
            models.MedicationReminder.user_id == current_user_id
        )
    )
    med = q.scalars().first()
    if not med:
        raise HTTPException(status_code=404, detail="Recordatorio de medicación no encontrado.")

    med.is_active = False
    await db.commit()
    return {'status': 'ok'}
