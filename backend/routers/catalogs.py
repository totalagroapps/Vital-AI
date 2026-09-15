from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.specialty import SpecialtyRead
from schemas.language import LanguageRead
from schemas.insurance_company import InsuranceCompanyRead
from services.catalog_service import get_specialties, get_languages, search_insurance_companies

router = APIRouter(tags=["catalogs"])

@router.get("/api/specialties", response_model=list[SpecialtyRead])
async def list_specialties(db: AsyncSession = Depends(get_db)):
    return await get_specialties(db)

@router.get("/api/languages", response_model=list[LanguageRead])
async def list_languages(db: AsyncSession = Depends(get_db)):
    return await get_languages(db)

@router.get("/api/insurance-companies", response_model=list[InsuranceCompanyRead])
async def list_insurance_companies(q: str | None = None, db: AsyncSession = Depends(get_db)):
    return await search_insurance_companies(db, q)
