from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from database import get_db
from security import get_current_user, get_optional_current_user, require_role
from models import User, Doctor, MedicalVerification, SpecialistProfile
from schemas.doctor_profile import (
    VerificationStatusUpdate,
    DoctorVerificationDetailResponse,
)

router = APIRouter(
    prefix="/doctor-verification",
    tags=["Doctor Verification"]
)


@router.get("/doctors", response_model=List[DoctorVerificationDetailResponse])
async def get_all_doctors_for_verification(
    include_all: bool = False,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene la lista de médicos para el panel de verificación.
    Por defecto trae los que están pendientes, no verificados o en revisión.
    Si include_all=True, trae todos los médicos.
    """
    stmt = select(Doctor).options(selectinload(Doctor.user))
    if not include_all:
        stmt = stmt.where(
            or_(
                Doctor.verification_status.is_(None),
                Doctor.verification_status == "",
                Doctor.verification_status == "pending",
                Doctor.verification_status.notin_(["verified", "rejected"]),
            )
        )
    res = await db.execute(stmt)
    doctors = res.scalars().all()

    results = []
    existing_user_ids = set()
    for doc in doctors:
        existing_user_ids.add(doc.user_id)
        email = doc.user.username if doc.user else ""
        results.append(
            DoctorVerificationDetailResponse(
                id=doc.id,
                user_id=doc.user_id,
                first_name=doc.first_name,
                last_name=doc.last_name,
                email=email,
                phone=doc.phone,
                residence_country=doc.residence_country,
                medical_license=doc.medical_license,
                professional_registration_number=doc.professional_registration_number,
                professional_college=doc.professional_college,
                college_country=doc.college_country,
                specialty=doc.specialty,
                years_of_experience=doc.years_of_experience,
                professional_description=doc.professional_description,
                address=doc.address,
                city=doc.city,
                country=doc.country,
                verification_status=doc.verification_status or "pending",
                is_active=doc.is_active,
                created_at=doc.created_at,
                identity_document_url=doc.identity_document_url,
                professional_registration_certificate_url=doc.professional_registration_certificate_url,
            )
        )

    # También incluir médicos registrados en SpecialistProfile
    stmt_sp = select(SpecialistProfile)
    if not include_all:
        stmt_sp = stmt_sp.where(
            or_(
                SpecialistProfile.is_verified == False,
                SpecialistProfile.verified == False,
                SpecialistProfile.is_verified.is_(None),
            )
        )
    res_sp = await db.execute(stmt_sp)
    specialists = res_sp.scalars().all()
    for sp in specialists:
        if sp.user_id in existing_user_ids:
            continue
        user_res = await db.execute(select(User).where(User.id == sp.user_id))
        user_obj = user_res.scalars().first()
        email = user_obj.username if user_obj else ""
        name_parts = (sp.full_name or "Doctor").strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        results.append(
            DoctorVerificationDetailResponse(
                id=sp.id,
                user_id=sp.user_id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone="",
                residence_country=sp.location or "España",
                medical_license=sp.license_number or f"COL-{sp.id:04d}",
                professional_registration_number=sp.license_number,
                professional_college="Colegio Oficial de Médicos",
                college_country=sp.location or "España",
                specialty=sp.specialty or "Medicina General",
                years_of_experience=sp.experience_years or 0,
                professional_description=sp.bio or "",
                address="",
                city=sp.city or sp.location or "",
                country=sp.location or "España",
                verification_status="verified" if (sp.is_verified or sp.verified) else "pending",
                is_active=True,
                created_at=sp.created_at,
                identity_document_url=sp.id_doc_url,
                professional_registration_certificate_url=sp.diploma_url,
            )
        )
    return results


@router.patch("/doctors/{doctor_id}/status", response_model=DoctorVerificationDetailResponse)
async def update_doctor_verification_status(
    doctor_id: int,
    data: VerificationStatusUpdate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Actualiza el estado de verificación de un médico (verified, rejected, pending).
    Registra el evento en la tabla medical_verifications.
    """
    stmt = select(Doctor).where(Doctor.id == doctor_id).options(selectinload(Doctor.user))
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()

    if not doctor:
        stmt_sp = select(SpecialistProfile).where(SpecialistProfile.id == doctor_id)
        res_sp = await db.execute(stmt_sp)
        sp = res_sp.scalar_one_or_none()
        if not sp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Médico no encontrado",
            )
        new_status = data.verification_status.lower().strip()
        if new_status not in ["verified", "rejected", "pending"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estado inválido. Debe ser 'verified', 'rejected' o 'pending'",
            )
        sp.is_verified = (new_status == "verified")
        sp.verified = (new_status == "verified")
        await db.commit()
        name_parts = (sp.full_name or "Doctor").strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        user_res = await db.execute(select(User).where(User.id == sp.user_id))
        user_obj = user_res.scalars().first()
        email = user_obj.username if user_obj else ""
        return DoctorVerificationDetailResponse(
            id=sp.id,
            user_id=sp.user_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone="",
            residence_country=sp.location or "España",
            medical_license=sp.license_number or f"COL-{sp.id:04d}",
            professional_registration_number=sp.license_number,
            professional_college="Colegio Oficial de Médicos",
            college_country=sp.location or "España",
            specialty=sp.specialty or "Medicina General",
            years_of_experience=sp.experience_years or 0,
            professional_description=sp.bio or "",
            address="",
            city=sp.city or sp.location or "",
            country=sp.location or "España",
            verification_status=new_status,
            is_active=True,
            created_at=sp.created_at,
            identity_document_url=sp.id_doc_url,
            professional_registration_certificate_url=sp.diploma_url,
        )

    new_status = data.verification_status.lower().strip()
    if new_status not in ["verified", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado inválido. Debe ser 'verified', 'rejected' o 'pending'",
        )

    doctor.verification_status = new_status
    doctor.updated_at = datetime.utcnow()

    # Sincronizar SpecialistProfile si existe
    try:
        stmt_sp = select(SpecialistProfile).where(SpecialistProfile.user_id == doctor.user_id)
        res_sp = await db.execute(stmt_sp)
        sp = res_sp.scalar_one_or_none()
        if sp:
            sp.is_verified = (new_status == "verified")
            sp.verified = (new_status == "verified")
    except Exception:
        pass

    # Registrar en medical_verifications
    verification_record = MedicalVerification(
        doctor_id=doctor.id,
        verifier_id=current_user.id if current_user else None,
        notes=data.notes or f"Estado actualizado a {new_status}",
        status=new_status,
    )
    db.add(verification_record)

    await db.commit()
    await db.refresh(doctor)

    email = doctor.user.username if doctor.user else ""
    return DoctorVerificationDetailResponse(
        id=doctor.id,
        user_id=doctor.user_id,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        email=email,
        phone=doctor.phone,
        residence_country=doctor.residence_country,
        medical_license=doctor.medical_license,
        professional_registration_number=doctor.professional_registration_number,
        professional_college=doctor.professional_college,
        college_country=doctor.college_country,
        specialty=doctor.specialty,
        years_of_experience=doctor.years_of_experience,
        professional_description=doctor.professional_description,
        address=doctor.address,
        city=doctor.city,
        country=doctor.country,
        verification_status=doctor.verification_status,
        is_active=doctor.is_active,
        created_at=doctor.created_at,
        identity_document_url=doctor.identity_document_url,
        professional_registration_certificate_url=doctor.professional_registration_certificate_url,
    )


@router.get("/doctors/{doctor_id}", response_model=DoctorVerificationDetailResponse)
async def get_doctor_verification_detail(
    doctor_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.id == doctor_id).options(selectinload(Doctor.user))
    res = await db.execute(stmt)
    doctor = res.scalar_one_or_none()

    if not doctor:
        raise HTTPException(status_code=404, detail="Médico no encontrado")

    email = doctor.user.username if doctor.user else ""
    return DoctorVerificationDetailResponse(
        id=doctor.id,
        user_id=doctor.user_id,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        email=email,
        phone=doctor.phone,
        residence_country=doctor.residence_country,
        medical_license=doctor.medical_license,
        professional_registration_number=doctor.professional_registration_number,
        professional_college=doctor.professional_college,
        college_country=doctor.college_country,
        specialty=doctor.specialty,
        years_of_experience=doctor.years_of_experience,
        professional_description=doctor.professional_description,
        address=doctor.address,
        city=doctor.city,
        country=doctor.country,
        verification_status=doctor.verification_status or "pending",
        is_active=doctor.is_active,
        created_at=doctor.created_at,
        identity_document_url=doctor.identity_document_url,
        professional_registration_certificate_url=doctor.professional_registration_certificate_url,
    )
