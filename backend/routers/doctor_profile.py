from datetime import datetime
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from database import get_db
from security import get_current_user, get_password_hash, require_role
from models import (
    User,
    Doctor,
    DoctorEducation,
    DoctorMedia,
    Specialty,
    DoctorSpecialty,
    SpecialistProfile,
)
from schemas.doctor_profile import (
    DoctorProfileResponse,
    DoctorProfileUpdate,
    DoctorEducationCreate,
    DoctorEducationUpdate,
    DoctorEducationResponse,
    DoctorMediaResponse,
    DoctorCreateRequest,
)
from services.media_service import media_service

router = APIRouter(
    prefix="/doctor-profile",
    tags=["Doctor Profile"]
)


# ==========================================================
# REGISTER NEW DOCTOR
# ==========================================================

@router.post(
    "/register",
    response_model=DoctorProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_doctor(
    data: DoctorCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Registra un nuevo médico en la plataforma.
    Crea el usuario, perfil de doctor, especialidad y sincroniza con el directorio.
    """
    # 1. Validar si el usuario ya existe
    stmt_user = select(User).where(User.username == data.email.strip().lower())
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electrónico",
        )

    # 2. Validar si la licencia médica ya existe
    stmt_lic = select(Doctor).where(Doctor.medical_license == data.medical_license.strip())
    res_lic = await db.execute(stmt_lic)
    if res_lic.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un médico registrado con esta licencia médica",
        )

    # 3. Crear usuario
    password = data.password or "MivorPass2026!"
    hashed_pwd = get_password_hash(password)
    new_user = User(
        username=data.email.strip().lower(),
        hashed_password=hashed_pwd,
        role="doctor",
    )
    db.add(new_user)
    await db.flush() # Obtiene new_user.id

    # 4. Crear doctor
    dob_str = str(data.date_of_birth) if data.date_of_birth else None
    new_doctor = Doctor(
        user_id=new_user.id,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        date_of_birth=dob_str,
        residence_country=data.residence_country,
        medical_license=data.medical_license.strip(),
        professional_registration_number=data.professional_registration_number,
        professional_college=data.professional_college,
        college_country=data.college_country,
        specialty=data.specialty.strip(),
        subspecialties=data.subspecialties,
        phone=data.phone,
        years_of_experience=data.years_of_experience,
        address=data.address,
        city=data.city,
        country=data.country,
        postal_code=data.postal_code,
        latitude=data.latitude,
        longitude=data.longitude,
        website=data.website,
        professional_description=data.professional_description or data.bio,
        experience=data.experience or data.bio,
        consultation_phone=data.consultation_phone,
        language=data.language or "es",
        data_policy_accepted=True,
        data_policy_accepted_at=datetime.utcnow(),
        is_active=True,
        verification_status="pending",
    )
    db.add(new_doctor)
    await db.flush()

    # 5. Asociar o crear Especialidad
    try:
        stmt_spec = select(Specialty).where(Specialty.name.ilike(data.specialty.strip()))
        res_spec = await db.execute(stmt_spec)
        specialty_record = res_spec.scalar_one_or_none()

        if not specialty_record:
            specialty_record = Specialty(
                name=data.specialty.strip(),
                description=f"Especialidad médica: {data.specialty.strip()}"
            )
            db.add(specialty_record)
            await db.flush()

        doctor_spec = DoctorSpecialty(
            doctor_id=new_doctor.id,
            specialty_id=specialty_record.id,
            is_primary=True
        )
        db.add(doctor_spec)
    except Exception:
        pass

    # 6. Sincronizar con SpecialistProfile existente para el directorio
    try:
        stmt_sp = select(SpecialistProfile).where(SpecialistProfile.user_id == new_user.id)
        res_sp = await db.execute(stmt_sp)
        sp_record = res_sp.scalar_one_or_none()
        if not sp_record:
            sp_record = SpecialistProfile(
                user_id=new_user.id,
                full_name=f"{data.first_name.strip()} {data.last_name.strip()}",
                specialty=data.specialty.strip(),
                license_number=data.medical_license.strip(),
                experience_years=data.years_of_experience or 0,
                city=data.city or "Bogotá",
                location=f"{data.city or 'Bogotá'}, {data.country or 'Colombia'}",
                languages=data.language or "Español",
                bio=data.bio or data.professional_description or "",
                verified=False,
                is_verified=False,
            )
            db.add(sp_record)
    except Exception:
        pass

    await db.commit()

    return DoctorProfileResponse(
        user_id=new_user.id,
        email=new_user.username,
        role=new_user.role,
        first_name=new_doctor.first_name,
        last_name=new_doctor.last_name,
        date_of_birth=new_doctor.date_of_birth,
        residence_country=new_doctor.residence_country,
        phone=new_doctor.phone,
        medical_license=new_doctor.medical_license,
        identity_document_url=new_doctor.identity_document_url,
        professional_registration_number=new_doctor.professional_registration_number,
        professional_college=new_doctor.professional_college,
        college_country=new_doctor.college_country,
        professional_registration_certificate_url=new_doctor.professional_registration_certificate_url,
        specialty=new_doctor.specialty,
        subspecialties=new_doctor.subspecialties,
        bio=new_doctor.professional_description,
        experience=new_doctor.experience,
        years_of_experience=new_doctor.years_of_experience,
        professional_description=new_doctor.professional_description,
        language=new_doctor.language,
        address=new_doctor.address,
        country=new_doctor.country,
        city=new_doctor.city,
        postal_code=new_doctor.postal_code,
        latitude=new_doctor.latitude,
        longitude=new_doctor.longitude,
        consultation_phone=new_doctor.consultation_phone,
        website=new_doctor.website,
        verification_status=new_doctor.verification_status,
        data_policy_accepted=new_doctor.data_policy_accepted,
        data_policy_accepted_at=new_doctor.data_policy_accepted_at,
        educations=[],
        media=[],
    )


# ==========================================================
# GET CURRENT DOCTOR PROFILE
# ==========================================================

@router.get(
    "",
    response_model=DoctorProfileResponse,
)
async def get_doctor_profile(
    user_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene el perfil completo del doctor con educaciones y medios asociados.
    """
    target_user_id = current_user.id
    if user_id and current_user.role in ["admin", "verifier"]:
        target_user_id = user_id
    elif user_id and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este perfil.")

    stmt = (
        select(Doctor)
        .where(Doctor.user_id == target_user_id)
        .options(selectinload(Doctor.educations), selectinload(Doctor.media))
    )
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de médico no encontrado",
        )

    # Obtener el usuario
    stmt_u = select(User).where(User.id == target_user_id)
    res_u = await db.execute(stmt_u)
    user_obj = res_u.scalar_one_or_none() or current_user

    educations = [
        DoctorEducationResponse(
            id=edu.id,
            doctor_id=edu.doctor_id,
            institution=edu.institution,
            degree=edu.degree,
            field_of_study=edu.field_of_study,
            education_type=edu.education_type,
            start_year=edu.start_year,
            end_year=edu.end_year,
            description=edu.description,
            created_at=edu.created_at,
            updated_at=edu.updated_at,
        )
        for edu in (doctor.educations or [])
    ]

    media_items = [
        DoctorMediaResponse(
            id=m.id,
            doctor_id=m.doctor_id,
            media_type=m.media_type,
            file_url=m.file_url,
            file_name=m.file_name,
            mime_type=m.mime_type,
            is_active=m.is_active,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
        for m in (doctor.media or [])
        if m.is_active
    ]

    return DoctorProfileResponse(
        user_id=user_obj.id,
        email=user_obj.username,
        role=user_obj.role,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        date_of_birth=doctor.date_of_birth,
        residence_country=doctor.residence_country,
        phone=doctor.phone,
        medical_license=doctor.medical_license,
        identity_document_url=doctor.identity_document_url,
        professional_registration_number=doctor.professional_registration_number,
        professional_college=doctor.professional_college,
        college_country=doctor.college_country,
        professional_registration_certificate_url=doctor.professional_registration_certificate_url,
        specialty=doctor.specialty,
        subspecialties=doctor.subspecialties,
        bio=doctor.professional_description,
        experience=doctor.experience,
        years_of_experience=doctor.years_of_experience,
        professional_description=doctor.professional_description,
        language=doctor.language,
        address=doctor.address,
        country=doctor.country,
        city=doctor.city,
        postal_code=doctor.postal_code,
        latitude=doctor.latitude,
        longitude=doctor.longitude,
        consultation_phone=doctor.consultation_phone,
        website=doctor.website,
        verification_status=doctor.verification_status,
        data_policy_accepted=doctor.data_policy_accepted,
        data_policy_accepted_at=doctor.data_policy_accepted_at,
        educations=educations,
        media=media_items,
    )


# ==========================================================
# UPDATE DOCTOR PROFILE
# ==========================================================

@router.put(
    "",
    response_model=DoctorProfileResponse,
)
async def update_doctor_profile(
    data: DoctorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Actualiza la información personal y profesional del doctor.
    """
    stmt = (
        select(Doctor)
        .where(Doctor.user_id == current_user.id)
        .options(selectinload(Doctor.educations), selectinload(Doctor.media))
    )
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de médico no encontrado",
        )

    # Actualizar campos no nulos
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "date_of_birth" and val is not None:
            val = str(val)
        if hasattr(doctor, field):
            setattr(doctor, field, val)

    doctor.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(doctor)

    return await get_doctor_profile(current_user=current_user, db=db)


# ==========================================================
# EDUCATION CRUD
# ==========================================================

@router.post(
    "/education",
    response_model=DoctorEducationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_education(
    data: DoctorEducationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de doctor no encontrado")

    edu = DoctorEducation(
        doctor_id=doctor.id,
        institution=data.institution,
        degree=data.degree,
        field_of_study=data.field_of_study,
        education_type=data.education_type,
        start_year=data.start_year,
        end_year=data.end_year,
        description=data.description,
    )
    db.add(edu)
    await db.commit()
    await db.refresh(edu)
    return edu


@router.put(
    "/education/{education_id}",
    response_model=DoctorEducationResponse,
)
async def update_education(
    education_id: int,
    data: DoctorEducationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de doctor no encontrado")

    stmt_edu = select(DoctorEducation).where(
        DoctorEducation.id == education_id,
        DoctorEducation.doctor_id == doctor.id
    )
    res_edu = await db.execute(stmt_edu)
    edu = res_edu.scalar_one_or_none()
    if not edu:
        raise HTTPException(status_code=404, detail="Registro de formación no encontrado")

    for field, val in data.model_dump(exclude_unset=True).items():
        if hasattr(edu, field) and val is not None:
            setattr(edu, field, val)

    edu.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(edu)
    return edu


@router.delete(
    "/education/{education_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de doctor no encontrado")

    stmt_del = delete(DoctorEducation).where(
        DoctorEducation.id == education_id,
        DoctorEducation.doctor_id == doctor.id
    )
    await db.execute(stmt_del)
    await db.commit()
    return None


# ==========================================================
# MEDIA CRUD (CERTIFICADOS, FOTOS, GALERÍA)
# ==========================================================

@router.post(
    "/media",
    response_model=DoctorMediaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_doctor_media(
    file: UploadFile = File(...),
    media_type: str = Form("gallery"),
    user_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sube archivos asociados al doctor (foto de perfil, diploma, identidad, galería o video).
    """
    target_user_id = user_id or (current_user.id if current_user else None)
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Identificador de usuario no proporcionado")

    stmt = select(Doctor).where(Doctor.user_id == target_user_id)
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de médico no encontrado")

    # Subir mediante el servicio unificado
    upload_result = await media_service.upload_file(
        file=file,
        folder=f"doctors/{doctor.id}",
        media_type=media_type
    )

    file_url = upload_result.get("file_url")

    # Registrar en doctor_media
    media_item = DoctorMedia(
        doctor_id=doctor.id,
        media_type=media_type,
        file_url=file_url,
        file_name=upload_result.get("file_name"),
        mime_type=upload_result.get("mime_type"),
        is_active=True,
    )
    db.add(media_item)

    # Actualizar campos rápidos en Doctor si corresponde
    if media_type in ["profile_picture", "photo"]:
        doctor.profile_picture_url = file_url
    elif media_type in ["identity_document", "additional_document"]:
        doctor.identity_document_url = file_url
    elif media_type in ["certificate", "diploma"]:
        doctor.professional_registration_certificate_url = file_url
    elif media_type == "video":
        doctor.presentation_video_url = file_url

    await db.commit()
    await db.refresh(media_item)
    return media_item


@router.delete(
    "/media/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_doctor_media(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de doctor no encontrado")

    stmt_media = select(DoctorMedia).where(
        DoctorMedia.id == media_id,
        DoctorMedia.doctor_id == doctor.id
    )
    res_media = await db.execute(stmt_media)
    media_item = res_media.scalar_one_or_none()
    if not media_item:
        raise HTTPException(status_code=404, detail="Archivo multimedia no encontrado")

    media_item.is_active = False
    await db.commit()
    return None
