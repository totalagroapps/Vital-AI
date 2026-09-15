from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.health_place import HealthPlaceRead
from services.health_place_service import (
    get_cached_health_places,
    refresh_health_places_from_overpass,
)

router = APIRouter(prefix="/api", tags=["health-places"])


@router.get("/health-places", response_model=list[HealthPlaceRead])
async def list_cached_health_places(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(..., gt=0, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Fast path: only what's already cached in the DB, never waits on Overpass."""
    return await get_cached_health_places(db, lat, lng, radius_km)


@router.get("/health-places/refresh", response_model=list[HealthPlaceRead])
async def refresh_health_places(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(..., gt=0, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Slow path: hits Overpass, persists new results, and returns the full set."""
    return await refresh_health_places_from_overpass(db, lat, lng, radius_km)
