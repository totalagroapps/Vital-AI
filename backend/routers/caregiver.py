import os
import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

import models
from database import get_db
from security import get_current_user, resolve_target_patient_id

logger = logging.getLogger("caregiver")

router = APIRouter(prefix="/api/caregiver", tags=["Caregiver Mode & Senior Kiosk Launcher"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class QuickContact(BaseModel):
    id: str
    name: str
    relationship: str
    phone: str
    photo_url: Optional[str] = None
    is_emergency: bool = False
    whatsapp_enabled: bool = True


class QuickContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    relationship: str = Field(min_length=2, max_length=50)
    phone: str = Field(min_length=6, max_length=25)
    photo_url: Optional[str] = None
    is_emergency: bool = False
    whatsapp_enabled: bool = True


class CaregiverConfig(BaseModel):
    whatsapp_group_url: Optional[str] = None
    emergency_number: str = "112"
    welcome_greeting: Optional[str] = None
    contacts: List[QuickContact] = []


class SosTriggerRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    battery_level: Optional[int] = None


class SosTriggerResponse(BaseModel):
    alert_id: str
    status: str
    timestamp: str
    emergency_call_url: str
    whatsapp_alert_url: Optional[str] = None
    location_maps_url: Optional[str] = None
    message: str


class FamilyPhotoItem(BaseModel):
    id: str
    url: str
    caption: str
    sender_name: str
    uploaded_at: str


# ============================================================================
# IN-MEMORY / EXTENSIBLE STORE PARA CONFIGURACIÓN KIOSKO POR USUARIO
# (Con defaults amigables si no están configurados todavía)
# ============================================================================

# Mapeo en memoria user_id -> config
_caregiver_store: Dict[str, Dict[str, Any]] = {}
_family_photos_store: Dict[str, List[Dict[str, Any]]] = {}

def _get_user_caregiver_data(user_id: str) -> Dict[str, Any]:
    if user_id not in _caregiver_store:
        _caregiver_store[user_id] = {
            "whatsapp_group_url": "https://chat.whatsapp.com/",
            "emergency_number": "112",
            "welcome_greeting": "¡Hola! Te deseamos un día tranquilo y lleno de salud.",
            "contacts": [
                {
                    "id": "c1",
                    "name": "Hijo Carlos",
                    "relationship": "Hijo (Cuidador principal)",
                    "phone": "+34612345678",
                    "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                    "is_emergency": True,
                    "whatsapp_enabled": True
                },
                {
                    "id": "c2",
                    "name": "Hija Laura",
                    "relationship": "Hija",
                    "phone": "+34687654321",
                    "photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                    "is_emergency": True,
                    "whatsapp_enabled": True
                },
                {
                    "id": "c3",
                    "name": "Dra. Carmen (Centro de Salud)",
                    "relationship": "Médico de cabecera",
                    "phone": "+34912345678",
                    "photo_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
                    "is_emergency": False,
                    "whatsapp_enabled": False
                }
            ]
        }
    return _caregiver_store[user_id]


def _get_user_photos(user_id: str) -> List[Dict[str, Any]]:
    if user_id not in _family_photos_store:
        _family_photos_store[user_id] = [
            {
                "id": "p1",
                "url": "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80",
                "caption": "¡Paseando por el parque con los nietos! Te queremos mucho.",
                "sender_name": "Laura",
                "uploaded_at": datetime.now().strftime("%d/%m/%Y")
            },
            {
                "id": "p2",
                "url": "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop&q=80",
                "caption": "Celebrando el domingo en familia. ¡Un abrazo enorme!",
                "sender_name": "Carlos",
                "uploaded_at": datetime.now().strftime("%d/%m/%Y")
            }
        ]
    return _family_photos_store[user_id]


# ============================================================================
# ENDPOINTS FASTAPI
# ============================================================================

@router.get("/config", response_model=CaregiverConfig)
async def get_caregiver_config(
    patient_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene la configuración de contactos rápidos, grupo familiar de WhatsApp y modo kiosko.
    """
    target_id = await resolve_target_patient_id(db, current_user, patient_id)
    data = _get_user_caregiver_data(target_id)
    return CaregiverConfig(
        whatsapp_group_url=data.get("whatsapp_group_url"),
        emergency_number=data.get("emergency_number", "112"),
        welcome_greeting=data.get("welcome_greeting"),
        contacts=[QuickContact(**c) for c in data.get("contacts", [])]
    )


@router.post("/contacts", response_model=QuickContact)
async def add_quick_contact(
    payload: QuickContactCreate,
    current_user: models.User = Depends(get_current_user)
):
    """
    Añade un contacto rápido con foto para el lanzador sénior / modo kiosko.
    """
    data = _get_user_caregiver_data(current_user.id)
    new_contact = {
        "id": f"c_{uuid.uuid4().hex[:8]}",
        "name": payload.name,
        "relationship": payload.relationship,
        "phone": payload.phone,
        "photo_url": payload.photo_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        "is_emergency": payload.is_emergency,
        "whatsapp_enabled": payload.whatsapp_enabled
    }
    data["contacts"].append(new_contact)
    return QuickContact(**new_contact)


@router.delete("/contacts/{contact_id}")
async def delete_quick_contact(
    contact_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina un contacto del modo kiosko.
    """
    data = _get_user_caregiver_data(current_user.id)
    data["contacts"] = [c for c in data["contacts"] if c["id"] != contact_id]
    return {"status": "success", "message": "Contacto eliminado correctamente."}


@router.post("/sos", response_model=SosTriggerResponse)
async def trigger_sos_alert(
    payload: SosTriggerRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Dispara una alerta SOS de emergencia en el Modo Kiosko / Cuidador:
    - Genera el enlace de llamada directa al servicio de urgencias (112/911).
    - Genera el enlace para enviar aviso inmediato con ubicación GPS al grupo de WhatsApp familiar.
    """
    alert_id = f"SOS-{uuid.uuid4().hex[:6].upper()}"
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    data = _get_user_caregiver_data(current_user.id)
    emergency_num = data.get("emergency_number", "112")

    maps_url = None
    location_text = ""
    if payload.latitude and payload.longitude:
        maps_url = f"https://www.google.com/maps?q={payload.latitude},{payload.longitude}"
        location_text = f"📍 Ubicación GPS: {maps_url}\n"
    elif payload.address:
        location_text = f"📍 Dirección estimada: {payload.address}\n"

    # Mensaje formateado para el grupo de WhatsApp o contactos
    user_name = current_user.username or "Familiar"
    wa_message = (
        f"🚨 *ALERTA SOS MIVOR*: {user_name} ha pulsado el botón de asistencia de emergencia.\n"
        f"⏰ Fecha: {now_str}\n"
        f"{location_text}"
        f"Por favor, revisad o llamad de inmediato."
    )

    import urllib.parse
    encoded_msg = urllib.parse.quote(wa_message)
    whatsapp_url = f"https://api.whatsapp.com/send?text={encoded_msg}"

    logger.warning(f"🚨 ALERTA SOS REGISTRADA: {alert_id} para usuario {current_user.id}")

    return SosTriggerResponse(
        alert_id=alert_id,
        status="triggered",
        timestamp=now_str,
        emergency_call_url=f"tel:{emergency_num}",
        whatsapp_alert_url=whatsapp_url,
        location_maps_url=maps_url,
        message="Alerta de emergencia activada correctamente. Puedes llamar a urgencias o avisar a la familia con un toque."
    )


@router.get("/photos", response_model=List[FamilyPhotoItem])
async def get_family_photos(
    patient_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene las fotos familiares para mostrar en el Modo Kiosko sénior.
    """
    target_id = await resolve_target_patient_id(db, current_user, patient_id)
    photos = _get_user_photos(target_id)
    return [FamilyPhotoItem(**p) for p in photos]


@router.post("/photos/upload")
async def upload_family_photo(
    caption: str = Form("¡Un abrazo para ti!"),
    sender_name: str = Form("Familia"),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Sube una foto familiar para que el adulto mayor la vea en el Modo Kiosko.
    """
    # Guardar en static o en base64 para visualización inmediata
    file_bytes = await file.read()
    import base64
    b64 = base64.b64encode(file_bytes).decode("utf-8")
    content_type = file.content_type or "image/jpeg"
    data_url = f"data:{content_type};base64,{b64}"

    new_photo = {
        "id": f"p_{uuid.uuid4().hex[:8]}",
        "url": data_url,
        "caption": caption,
        "sender_name": sender_name,
        "uploaded_at": datetime.now().strftime("%d/%m/%Y")
    }

    photos = _get_user_photos(current_user.id)
    photos.insert(0, new_photo)

    return {
        "status": "success",
        "message": "Foto familiar compartida con éxito.",
        "photo": new_photo
    }
