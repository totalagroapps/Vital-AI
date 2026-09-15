from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from security import require_doctor
from models import DoctorProfile, Modality, User
from schemas.availability import (
    AvailabilityExceptionCreate,
    AvailabilityExceptionRead,
    AvailabilityExceptionUpdate,
    AvailabilityScheduleCreate,
    AvailabilityScheduleRead,
    AvailabilityScheduleUpdate,
    SlotRead,
)
from services import availability_service, doctor_service

router = APIRouter(prefix="/api/doctors", tags=["availability"])


async def _my_profile(
    current: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
) -> DoctorProfile:
    profile = await doctor_service.get_my_profile(db, current.id)
    if profile is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Todavía no tienes perfil de médico especialista; créalo con POST /api/doctors/me",
        )
    return profile


# ───────────────────────────── schedules ─────────────────────────────

@router.get("/me/schedule", response_model=list[AvailabilityScheduleRead])
async def list_my_schedule(
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    return await availability_service.list_schedules(db, profile.id)


@router.post(
    "/me/schedule",
    response_model=AvailabilityScheduleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_schedule(
    payload: AvailabilityScheduleCreate,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    return await availability_service.create_schedule(db, profile.id, payload)


@router.patch("/me/schedule/{schedule_id}", response_model=AvailabilityScheduleRead)
async def update_my_schedule(
    schedule_id: UUID,
    payload: AvailabilityScheduleUpdate,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    row = await availability_service.get_schedule(db, profile.id, schedule_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regla de horario no encontrada")
    try:
        return await availability_service.update_schedule(db, row, payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))


@router.delete("/me/schedule/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_schedule(
    schedule_id: UUID,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    row = await availability_service.get_schedule(db, profile.id, schedule_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regla de horario no encontrada")
    await availability_service.delete_schedule(db, row)


# ──────────────────────────── exceptions ────────────────────────────

@router.get("/me/exceptions", response_model=list[AvailabilityExceptionRead])
async def list_my_exceptions(
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    return await availability_service.list_exceptions(db, profile.id)


@router.post(
    "/me/exceptions",
    response_model=AvailabilityExceptionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_exception(
    payload: AvailabilityExceptionCreate,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    return await availability_service.create_exception(db, profile.id, payload)


@router.patch("/me/exceptions/{exception_id}", response_model=AvailabilityExceptionRead)
async def update_my_exception(
    exception_id: UUID,
    payload: AvailabilityExceptionUpdate,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    row = await availability_service.get_exception(db, profile.id, exception_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Excepción no encontrada")
    try:
        return await availability_service.update_exception(db, row, payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))


@router.delete("/me/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_exception(
    exception_id: UUID,
    profile: DoctorProfile = Depends(_my_profile),
    db: AsyncSession = Depends(get_db),
):
    row = await availability_service.get_exception(db, profile.id, exception_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Excepción no encontrada")
    await availability_service.delete_exception(db, row)


# ────────────────────────── public: free slots ──────────────────────────

@router.get("/{doctor_id}/slots", response_model=list[SlotRead])
async def get_doctor_slots(
    doctor_id: UUID,
    from_date: date | None = Query(None, alias="from"),
    days: int = Query(14, ge=1, le=60),
    modality: Modality | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    doctor = await doctor_service.get_doctor(db, doctor_id)
    if doctor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Médico especialista no encontrado")
    return await availability_service.compute_slots(
        db, doctor, from_date or date.today(), days, modality
    )
