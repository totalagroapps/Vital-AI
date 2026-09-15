import io
import uuid
from pathlib import Path
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from PIL import Image
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from security import require_doctor
from models import User, DoctorProfile, Modality
from schemas.doctor import (
    DoctorCard,
    DoctorDetail,
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorSearchFilters,
    DoctorSearchPage,
)
from services import doctor_service

router = APIRouter(prefix="/api/doctors", tags=["doctors"])

_AVATARS_DIR = Path(__file__).resolve().parents[1] / "static" / "avatars"
_AVATAR_EXT_BY_CONTENT_TYPE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
_MAX_AVATAR_BYTES = 3 * 1024 * 1024  # 3 MB


def _card(d: DoctorProfile, distance_km: float | None = None) -> DoctorCard:
    return DoctorCard(
        id=d.id,
        full_name=d.full_name,
        avatar_url=d.avatar_url,
        rating=d.rating,
        modality=d.modality,
        specialties=[ds.specialty for ds in d.specialties],
        languages=[dl.language for dl in d.languages],
        distance_km=distance_km,
        address=d.address,
        lat=d.lat,
        lng=d.lng,
        insurance_companies=[di.insurance_company for di in d.insurance_companies],
    )


@router.get("", response_model=DoctorSearchPage)
async def search_doctors(
    specialty_ids: list[int] | None = Query(None),
    language_id: int | None = Query(None),
    insurance_company_id: int | None = Query(None),
    name: str | None = Query(None),
    modality: Modality | None = Query(None),
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    radius_km: float | None = Query(None, gt=0, le=500),
    sort: Literal["distance", "rating"] | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    try:
        filters = DoctorSearchFilters(
            specialty_ids=specialty_ids,
            language_id=language_id,
            insurance_company_id=insurance_company_id,
            name=name,
            modality=modality,
            lat=lat,
            lng=lng,
            radius_km=radius_km,
        )
    except ValidationError as e:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "; ".join(err["msg"] for err in e.errors()),
        )

    items, total = await doctor_service.search_doctors(db, filters, limit, offset, sort)
    return DoctorSearchPage(
        items=[_card(d, dist) for d, dist in items],
        total=total,
        limit=limit,
        offset=offset,
    )


def _detail(d: DoctorProfile) -> DoctorDetail:
    return DoctorDetail(
        id=d.id,
        user_id=d.user_id,
        full_name=d.full_name,
        avatar_url=d.avatar_url,
        rating=d.rating,
        modality=d.modality,
        address=d.address,
        lat=d.lat,
        lng=d.lng,
        timezone=d.timezone,
        appointment_duration_minutes=d.appointment_duration_minutes,
        appointment_buffer_minutes=d.appointment_buffer_minutes,
        clinic_name=d.clinic_name,
        phone=d.phone,
        email=d.email,
        website=d.website,
        years_experience=d.years_experience,
        education=d.education,
        specialties=[ds.specialty for ds in d.specialties],
        languages=[dl.language for dl in d.languages],
        insurance_companies=[di.insurance_company for di in d.insurance_companies],
        availability_schedules=list(d.availability_schedules),
    )


@router.post("/me", response_model=DoctorDetail, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    payload: DoctorProfileCreate,
    current: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    if await doctor_service.get_my_profile(db, current.id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Ya tienes un perfil de médico especialista; utiliza PATCH para actualizarlo",
        )
    try:
        profile = await doctor_service.create_my_profile(db, current.id, payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    return _detail(profile)


@router.get("/me", response_model=DoctorDetail)
async def read_my_profile(
    current: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    profile = await doctor_service.get_my_profile(db, current.id)
    if profile is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Todavía no tienes perfil de médico especialista configurado"
        )
    return _detail(profile)


@router.patch("/me", response_model=DoctorDetail)
async def update_my_profile(
    payload: DoctorProfileUpdate,
    current: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    profile = await doctor_service.get_my_profile(db, current.id)
    if profile is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Todavía no tienes perfil de médico; créalo primero con POST /api/doctors/me",
        )
    try:
        profile = await doctor_service.update_my_profile(db, profile, payload)
    except ValueError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))
    return _detail(profile)


@router.post("/me/avatar", response_model=DoctorDetail)
async def upload_my_avatar(
    request: Request,
    file: UploadFile = File(...),
    current: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    profile = await doctor_service.get_my_profile(db, current.id)
    if profile is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Todavía no tienes perfil de médico; créalo primero con POST",
        )

    ext = _AVATAR_EXT_BY_CONTENT_TYPE.get(file.content_type)
    if ext is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Formato de imagen no soportado (solo JPEG, PNG o WEBP)",
        )

    raw = await file.read()
    if len(raw) > _MAX_AVATAR_BYTES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "La imagen no puede pesar más de 3 MB")

    try:
        Image.open(io.BytesIO(raw)).verify()
    except Exception:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El archivo no es una imagen válida")

    _AVATARS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{profile.id}_{uuid.uuid4().hex[:8]}.{ext}"
    (_AVATARS_DIR / filename).write_bytes(raw)

    avatar_url = f"{str(request.base_url).rstrip('/')}/static/avatars/{filename}"
    profile = await doctor_service.set_avatar_url(db, profile, avatar_url)
    return _detail(profile)


@router.get("/{doctor_id}", response_model=DoctorDetail)
async def get_doctor(doctor_id: UUID, db: AsyncSession = Depends(get_db)):
    d = await doctor_service.get_doctor(db, doctor_id)
    if d is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Médico especialista no encontrado")
    return _detail(d)
