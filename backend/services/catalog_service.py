from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Specialty, Language, InsuranceCompany


async def get_specialties(db: AsyncSession) -> list[Specialty]:
    rows = await db.execute(
        select(Specialty).order_by(Specialty.name)
    )
    return list(rows.scalars().all())


async def get_languages(db: AsyncSession) -> list[Language]:
    rows = await db.execute(
        select(Language).order_by(Language.name)
    )
    return list(rows.scalars().all())


async def search_insurance_companies(db: AsyncSession, query_text: str | None = None) -> list[InsuranceCompany]:
    stmt = select(InsuranceCompany).order_by(InsuranceCompany.name)
    if query_text:
        stmt = stmt.where(InsuranceCompany.name.ilike(f"%{query_text}%"))
    rows = await db.execute(stmt)
    return list(rows.scalars().all())
