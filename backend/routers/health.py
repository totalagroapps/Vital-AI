"""
Controles de salud (tensión, glucosa, peso) desde la app MIVOR.

El paciente los apunta él mismo o su familia desde el perfil familiar (get_current_user_id
resuelve el perfil seleccionado). El kiosko usa /api/device/readings (routers/devices.py).
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from security import get_authenticated_user_id, get_current_user_id
from services.health_readings import InvalidReading, add_reading, delete_reading, list_readings
from services.push_service import send_push_notification

router = APIRouter(tags=["Controles de salud"])


class ReadingCreate(BaseModel):
    kind: Literal['blood_pressure', 'glucose', 'weight']
    value1: float
    value2: Optional[float] = None


@router.get('/api/health/readings')
async def get_readings(days: int = Query(30, ge=1, le=365), db: AsyncSession = Depends(get_db),
                       patient_id: str = Depends(get_current_user_id)):
    return await list_readings(db, patient_id, days)


@router.post('/api/health/readings')
async def create_reading(payload: ReadingCreate, db: AsyncSession = Depends(get_db),
                         patient_id: str = Depends(get_current_user_id),
                         requester_id: str = Depends(get_authenticated_user_id)):
    try:
        return await add_reading(db, patient_id, payload.kind, payload.value1, payload.value2,
                                 source='app', created_by=requester_id, notify=send_push_notification)
    except InvalidReading as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete('/api/health/readings/{reading_id}')
async def remove_reading(reading_id: int, db: AsyncSession = Depends(get_db),
                         patient_id: str = Depends(get_current_user_id)):
    if not await delete_reading(db, patient_id, reading_id):
        raise HTTPException(status_code=404, detail='Control no encontrado.')
    return {'status': 'deleted', 'id': reading_id}
