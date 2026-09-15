from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from security import get_current_user
from models import User
from schemas.appointment import AppointmentCancel, AppointmentCreate, AppointmentRead
from services import appointment_service, doctor_service

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: AppointmentCreate,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        appointment = await appointment_service.create_appointment(db, current.id, payload)
    except appointment_service.SlotUnavailable as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return appointment


@router.get("/me", response_model=list[AppointmentRead])
async def list_my_appointments(
    when: Literal["upcoming", "past"] | None = Query(None),
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # doctors get their own agenda here, not a patient booking view
    my_profile = await doctor_service.get_my_profile(db, current.id)
    if my_profile is not None:
        return await appointment_service.list_doctor_appointments(db, my_profile.id, when)
    return await appointment_service.list_my_appointments(db, current.id, when)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentRead)
async def cancel_appointment(
    appointment_id: UUID,
    payload: AppointmentCancel,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appointment = await appointment_service.get_appointment(db, appointment_id)
    if appointment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cita no encontrada")

    my_profile = await doctor_service.get_my_profile(db, current.id)
    is_patient = str(appointment.patient_id) == str(current.id)
    is_doctor = my_profile is not None and appointment.doctor_id == my_profile.id
    if not (is_patient or is_doctor):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes autorización para cancelar esta cita")

    try:
        return await appointment_service.cancel_appointment(
            db, appointment, payload.cancellation_reason
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))
