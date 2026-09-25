"""Modelos de petición compartidos por varios routers."""
from typing import List, Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: str = 'patient'


class StandardChatMessage(BaseModel):
    role: str
    content: str


class StandardChatRequest(BaseModel):
    messages: List[StandardChatMessage]
    language: Optional[str] = 'es'
    country: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class TriageRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = 'es'
    country: Optional[str] = None
    session_id: Optional[str] = None


class PatientProfileSchema(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    blood_type: str
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    emergency_contact: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    organ_donor: Optional[str] = "No especificado"
    medical_notes: Optional[str] = None
    insurance_provider: Optional[str] = None
    preferred_language: Optional[str] = 'es'


class DoctorQueryRequest(BaseModel):
    query: str
    patient_id: str
    text_model: str = 'llama3.1'
    language: Optional[str] = 'es'
    country: Optional[str] = None


class MedicationReminderCreate(BaseModel):
    medication_name: str
    dosage: str = None
    frequency: str = None
    time_of_day: str = None
