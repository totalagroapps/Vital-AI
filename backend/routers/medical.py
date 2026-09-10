import time
import logging
from collections import defaultdict
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas_medical import MedicalSearchRequest, MedicalSearchResponse
from services.medical_search_service import MedicalSearchService
from services.pubmed_service import PubMedService
from services.clinical_trials_service import ClinicalTrialsService
from services.cochrane_service import CochraneService

router = APIRouter()

# Rate limiting en memoria por IP para búsquedas médicas públicas (Punto 10)
_search_ip_rate_limit_store = defaultdict(list)
SEARCH_IP_WINDOW = 60
SEARCH_IP_MAX = 15

def apply_medical_search_rate_limit(ip: str):
    now = time.time()
    _search_ip_rate_limit_store[ip] = [
        t for t in _search_ip_rate_limit_store[ip] if now - t < SEARCH_IP_WINDOW
    ]
    if len(_search_ip_rate_limit_store[ip]) >= SEARCH_IP_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Límite de búsquedas médicas alcanzado (máximo 15 por minuto). Por favor, espere 60 segundos.",
            headers={"Retry-After": str(SEARCH_IP_WINDOW)}
        )
    _search_ip_rate_limit_store[ip].append(now)


def get_medical_search_service() -> MedicalSearchService:
    return MedicalSearchService(
        pubmed_service=PubMedService(),
        clinical_trials_service=ClinicalTrialsService(),
        cochrane_service=CochraneService()
    )


@router.post('/api/medical/search', response_model=MedicalSearchResponse)
async def medical_search(
    request: MedicalSearchRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Búsqueda federada de evidencia médica (PubMed, Cochrane, ClinicalTrials).
    Protegido contra abuso con rate limiting por IP (máx 15/min) (Punto 10).
    """
    client_ip = req.client.host if req.client else "unknown"
    apply_medical_search_rate_limit(client_ip)

    query = (request.query or "").strip()
    if not query:
        return {'results': []}

    try:
        service = get_medical_search_service()
        result = await service.search(query=query, max_results=request.max_results)
        if isinstance(result, list):
            return {'results': result}
        return result
    except Exception as e:
        logging.error(f'Error en búsqueda médica: {e}')
        raise HTTPException(status_code=500, detail=f'No fue posible realizar la búsqueda médica: {str(e)}')
