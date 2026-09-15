from uuid import UUID
from pydantic import BaseModel, ConfigDict
from models import HealthPlaceKind

class HealthPlaceRead(BaseModel):
    """GET /api/health-places — unaffiliated hospitals/clinics near a point."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str | None = None
    kind: HealthPlaceKind
    lat: float
    lng: float
