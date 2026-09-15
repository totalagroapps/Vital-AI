import asyncio
import math
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import HealthPlaceKind, ExternalHealthPlace

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
_HEADERS = {"User-Agent": "mivor-backend/1.0 (info@mivor.ai)"}

_AMENITY_TO_KIND = {
    "hospital": HealthPlaceKind.hospital,
    "clinic": HealthPlaceKind.clinic,
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


async def _fetch_overpass(query: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        tasks = {
            asyncio.create_task(client.post(url, data={"data": query}, headers=_HEADERS)): url
            for url in OVERPASS_ENDPOINTS
        }
        last_error: Exception | None = None
        pending = set(tasks)
        try:
            while pending:
                done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
                for task in done:
                    try:
                        resp = task.result()
                        resp.raise_for_status()
                        return resp.json()
                    except Exception as exc:
                        last_error = exc
            if last_error:
                raise last_error
            return {"elements": []}
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()


async def get_cached_health_places(
    db: AsyncSession, lat: float, lng: float, radius_km: float
) -> list[ExternalHealthPlace]:
    """Fast path: ONLY what's already in the DB, never hits Overpass."""
    delta_lat = radius_km / 111.0
    cos_lat = max(0.1, math.cos(math.radians(lat)))
    delta_lng = radius_km / (111.0 * cos_lat)

    stmt = select(ExternalHealthPlace).where(
        ExternalHealthPlace.lat.between(lat - delta_lat, lat + delta_lat),
        ExternalHealthPlace.lng.between(lng - delta_lng, lng + delta_lng),
    )
    rows = await db.scalars(stmt)
    results: list[ExternalHealthPlace] = []
    for place in rows.all():
        if _haversine_km(lat, lng, place.lat, place.lng) <= radius_km:
            results.append(place)
    return results


async def refresh_health_places_from_overpass(
    db: AsyncSession, lat: float, lng: float, radius_km: float
) -> list[ExternalHealthPlace]:
    """Slow path: Hits Overpass, saves new places, and returns everything within radius."""
    cached = await get_cached_health_places(db, lat, lng, radius_km)
    known_ids = {(p.source, p.external_id) for p in cached}

    amenity_pattern = "|".join(_AMENITY_TO_KIND)
    radius_m = round(radius_km * 1000)
    query = (
        "[out:json][timeout:25];"
        f'(node["amenity"~"^({amenity_pattern})$"](around:{radius_m},{lat},{lng});'
        f'way["amenity"~"^({amenity_pattern})$"](around:{radius_m},{lat},{lng}););'
        "out center 60;"
    )

    try:
        data = await _fetch_overpass(query)
    except Exception:
        return cached

    new_places: list[ExternalHealthPlace] = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        amenity = tags.get("amenity")
        kind = _AMENITY_TO_KIND.get(amenity)
        if kind is None:
            continue

        el_lat = el.get("lat") or el.get("center", {}).get("lat")
        el_lng = el.get("lon") or el.get("center", {}).get("lon")
        if el_lat is None or el_lng is None:
            continue

        ext_id = f"{el.get('type')}/{el.get('id')}"
        if ("osm", ext_id) in known_ids:
            continue

        name = tags.get("name")
        address_parts = [tags.get("addr:street"), tags.get("addr:housenumber"), tags.get("addr:city")]
        address = ", ".join(p for p in address_parts if p) or None

        place = ExternalHealthPlace(
            source="osm",
            external_id=ext_id,
            name=name,
            kind=kind,
            lat=float(el_lat),
            lng=float(el_lng),
            address=address,
        )
        db.add(place)
        new_places.append(place)
        known_ids.add(("osm", ext_id))

    if new_places:
        try:
            await db.commit()
        except Exception:
            await db.rollback()

    return await get_cached_health_places(db, lat, lng, radius_km)
