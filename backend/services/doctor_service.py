from uuid import UUID
import math
import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    DoctorProfile,
    InsuranceCompany,
    DoctorInsuranceCompany,
    Language,
    DoctorLanguage,
    Specialty,
    DoctorProfileSpecialty,
    Modality,
)
from schemas.doctor import DoctorSearchFilters, DoctorProfileUpdate, DoctorProfileCreate


_CATALOGS = (
    selectinload(DoctorProfile.specialties).selectinload(DoctorProfileSpecialty.specialty),
    selectinload(DoctorProfile.languages).selectinload(DoctorLanguage.language),
    selectinload(DoctorProfile.insurance_companies).selectinload(
        DoctorInsuranceCompany.insurance_company
    ),
)
_DETAIL_CATALOGS = (
    *_CATALOGS,
    selectinload(DoctorProfile.availability_schedules),
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def _apply_filters(stmt, filters: DoctorSearchFilters):
    if filters.specialty_ids:
        stmt = stmt.where(DoctorProfile.specialties.any(
            DoctorProfileSpecialty.specialty_id.in_(filters.specialty_ids)))
    if filters.language_id is not None:
        stmt = stmt.where(DoctorProfile.languages.any(
            DoctorLanguage.language_id == filters.language_id))
    if filters.insurance_company_id is not None:
        stmt = stmt.where(DoctorProfile.insurance_companies.any(
            DoctorInsuranceCompany.insurance_company_id == filters.insurance_company_id))
    if filters.name:
        stmt = stmt.where(DoctorProfile.full_name.ilike(f"%{filters.name}%"))
    if filters.modality is not None:
        stmt = stmt.where(DoctorProfile.modality.in_([filters.modality, Modality.both]))
    if filters.lat is not None and filters.lng is not None and filters.radius_km is not None:
        # Bounding box filter for universal compatibility (SQLite & PostgreSQL)
        delta_lat = filters.radius_km / 111.0
        cos_lat = max(0.1, math.cos(math.radians(filters.lat)))
        delta_lng = filters.radius_km / (111.0 * cos_lat)
        stmt = stmt.where(
            DoctorProfile.lat.isnot(None),
            DoctorProfile.lng.isnot(None),
            DoctorProfile.lat.between(filters.lat - delta_lat, filters.lat + delta_lat),
            DoctorProfile.lng.between(filters.lng - delta_lng, filters.lng + delta_lng),
        )
    return stmt


async def search_doctors(
    db: AsyncSession,
    filters: DoctorSearchFilters,
    limit: int,
    offset: int,
    sort: str | None = None,
) -> tuple[list[tuple[DoctorProfile, float | None]], int]:
    stmt = _apply_filters(select(DoctorProfile), filters).options(*_CATALOGS)
    rows = await db.execute(stmt)
    all_doctors = rows.scalars().all()

    geo = filters.lat is not None and filters.lng is not None and filters.radius_km is not None
    filtered_items: list[tuple[DoctorProfile, float | None]] = []

    if geo:
        for doc in all_doctors:
            if doc.lat is not None and doc.lng is not None:
                dist = _haversine_km(filters.lat, filters.lng, doc.lat, doc.lng)
                if dist <= filters.radius_km:
                    filtered_items.append((doc, round(dist, 2)))
        if sort == "rating":
            filtered_items.sort(key=lambda x: (-(x[0].rating or 0.0), x[1] if x[1] is not None else 999999.0))
        else:
            filtered_items.sort(key=lambda x: x[1] if x[1] is not None else 999999.0)
    else:
        for doc in all_doctors:
            filtered_items.append((doc, None))
        if sort == "rating":
            filtered_items.sort(key=lambda x: (-(x[0].rating or 0.0), x[0].full_name or ""))
        else:
            filtered_items.sort(key=lambda x: (-(x[0].rating or 0.0), x[0].full_name or ""))

    total = len(filtered_items)
    page_items = filtered_items[offset : offset + limit]
    return page_items, total


async def get_doctor(db: AsyncSession, doctor_id: UUID) -> DoctorProfile | None:
    rows = await db.execute(
        select(DoctorProfile)
        .where(DoctorProfile.id == doctor_id)
        .options(*_DETAIL_CATALOGS)
    )
    return rows.scalar_one_or_none()


_WHITESPACE = re.compile(r"\s+")


def _normalize_company_name(raw: str) -> str:
    return _WHITESPACE.sub(" ", raw).strip()


async def _validate_catalog_ids(db, model, ids: list[int], label: str) -> None:
    unique_ids = list(dict.fromkeys(ids))
    found = set(await db.scalars(select(model.id).where(model.id.in_(unique_ids))))
    missing = [i for i in unique_ids if i not in found]
    if missing:
        raise ValueError(f"{label} inexistentes: {missing}")


async def _resolve_insurance_companies(db, names: list[str]) -> list[InsuranceCompany]:
    companies: list[InsuranceCompany] = []
    seen: set[str] = set()
    for raw in names:
        name = _normalize_company_name(raw)
        if not name:
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        company = await db.scalar(
            select(InsuranceCompany).where(func.lower(InsuranceCompany.name) == key)
        )
        if company is None:
            company = InsuranceCompany(name=name)
            db.add(company)
            await db.flush()
        companies.append(company)
    return companies


async def _sync_specialties(db, profile: DoctorProfile, specialty_ids: list[int]) -> None:
    wanted = list(dict.fromkeys(specialty_ids))
    have = {ds.specialty_id: ds for ds in profile.specialties}
    for sid in wanted:
        if sid not in have:
            db.add(DoctorProfileSpecialty(doctor_id=profile.id, specialty_id=sid))
    for sid, ds in list(have.items()):
        if sid not in wanted:
            await db.delete(ds)


async def _sync_languages(db, profile: DoctorProfile, language_ids: list[int]) -> None:
    wanted = list(dict.fromkeys(language_ids))
    have = {dl.language_id: dl for dl in profile.languages}
    for lid in wanted:
        if lid not in have:
            db.add(DoctorLanguage(doctor_id=profile.id, language_id=lid))
    for lid, dl in list(have.items()):
        if lid not in wanted:
            await db.delete(dl)


async def _sync_insurers(db, profile: DoctorProfile, company_ids: list[int]) -> None:
    wanted = list(dict.fromkeys(company_ids))
    have = {di.insurance_company_id: di for di in profile.insurance_companies}
    for cid in wanted:
        if cid not in have:
            db.add(DoctorInsuranceCompany(
                doctor_id=profile.id, insurance_company_id=cid))
    for cid, di in list(have.items()):
        if cid not in wanted:
            await db.delete(di)


async def get_my_profile(
    db: AsyncSession, user_id: str | UUID, *, populate_existing: bool = False
) -> DoctorProfile | None:
    user_id_str = str(user_id)
    stmt = (
        select(DoctorProfile)
        .where(DoctorProfile.user_id == user_id_str)
        .options(*_DETAIL_CATALOGS)
    )
    if populate_existing:
        stmt = stmt.execution_options(populate_existing=True)
    rows = await db.execute(stmt)
    return rows.scalar_one_or_none()


async def create_my_profile(
    db: AsyncSession, user_id: str | UUID, payload: DoctorProfileCreate
) -> DoctorProfile:
    await _validate_catalog_ids(db, Specialty, payload.specialty_ids, "Specialties")
    await _validate_catalog_ids(db, Language, payload.language_ids, "Languages")
    insurers = await _resolve_insurance_companies(db, payload.insurance_companies)

    profile = DoctorProfile(
        user_id=str(user_id),
        full_name=payload.full_name,
        modality=payload.modality,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        timezone=payload.timezone,
        appointment_duration_minutes=payload.appointment_duration_minutes,
        appointment_buffer_minutes=payload.appointment_buffer_minutes,
        avatar_url=payload.avatar_url,
        clinic_name=payload.clinic_name,
        phone=payload.phone,
        email=payload.email,
        website=payload.website,
        years_experience=payload.years_experience,
        education=payload.education,
    )
    db.add(profile)
    await db.flush()

    for sid in dict.fromkeys(payload.specialty_ids):
        db.add(DoctorProfileSpecialty(doctor_id=profile.id, specialty_id=sid))
    for lid in dict.fromkeys(payload.language_ids):
        db.add(DoctorLanguage(doctor_id=profile.id, language_id=lid))
    for company in insurers:
        db.add(DoctorInsuranceCompany(
            doctor_id=profile.id, insurance_company_id=company.id))

    await db.commit()
    return await get_my_profile(db, user_id)


async def update_my_profile(
    db: AsyncSession, profile: DoctorProfile, payload: DoctorProfileUpdate
) -> DoctorProfile:
    data = payload.model_dump(exclude_unset=True)

    final_modality = data.get("modality", profile.modality)
    if final_modality in (Modality.in_person, Modality.both):
        address = data.get("address", profile.address)
        lat = data.get("lat", profile.lat)
        lng = data.get("lng", profile.lng)
        if address is None or lat is None or lng is None:
            raise ValueError(
                "Un médico presencial ('in_person'/'both') necesita address, lat y lng"
            )

    if "specialty_ids" in data:
        await _validate_catalog_ids(db, Specialty, data["specialty_ids"], "Specialties")
        await _sync_specialties(db, profile, data.pop("specialty_ids"))

    if "language_ids" in data:
        await _validate_catalog_ids(db, Language, data["language_ids"], "Languages")
        await _sync_languages(db, profile, data.pop("language_ids"))

    if "insurance_companies" in data:
        insurers = await _resolve_insurance_companies(db, data.pop("insurance_companies"))
        await _sync_insurers(db, profile, [c.id for c in insurers])

    for field, value in data.items():
        setattr(profile, field, value)

    await db.commit()
    return await get_my_profile(db, profile.user_id, populate_existing=True)


async def set_avatar_url(
    db: AsyncSession, profile: DoctorProfile, avatar_url: str
) -> DoctorProfile:
    profile.avatar_url = avatar_url
    await db.commit()
    return await get_my_profile(db, profile.user_id, populate_existing=True)
