from database import Base
from sqlalchemy import Column, Boolean, Integer, String, DateTime, func, ForeignKey, Enum, Text
import enum
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON

class DocumentMetadata(Base):
    """
    Placeholder table for Document OCR metadata.
    Danna will handle full migrations, but this serves as our testing schema.
    """
    __tablename__ = "document_metadata"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    extracted_text = Column(String)
    document_type = Column(String) # e.g. 'radiografia', 'analitica'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True) # or email
    hashed_password = Column(String)
    role = Column(String, default="patient") # patient, doctor, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TriageSession(Base):
    """
    Guarda el estado de una sesión de triaje estructurada.
    """
    __tablename__ = "triage_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # mock_user for now
    category = Column(String, nullable=True) # 1 of 7 categories
    questions_asked = Column(Integer, default=0)
    status = Column(String, default="in_progress") # in_progress, closed_green, closed_yellow, closed_red
    final_report = Column(String, nullable=True)
    recommended_specialty = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



class DocumentType(str, enum.Enum):
    informe_medico = "informe_medico"
    medicacion = "medicacion"
    analitica = "analitica"
    otro = "otro"

class MedicalDocument(Base):
    __tablename__ = "medical_documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), index=True)
    document_type = Column(Enum(DocumentType))
    file_url = Column(String)
    original_filename = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    extracted_text = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)

    patient = relationship("PatientProfile", back_populates="medical_documents")

class PatientProfile(Base):
    """
    Historial Médico Digital básico del paciente.
    """
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # mock_user for now or real user_id
    full_name = Column(String)
    date_of_birth = Column(String)
    gender = Column(String)
    blood_type = Column(String)
    allergies = Column(String, nullable=True)
    chronic_conditions = Column(String, nullable=True)
    current_medications = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    preferred_language = Column(String, default="es")
    medical_documents = relationship("MedicalDocument", back_populates="patient")
    health_events = relationship("HealthEvent", back_populates="patient", cascade="all, delete-orphan")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    title = Column(String, default="Nueva Consulta")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String)
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HealthEventType(str, enum.Enum):
    triage = "triage"
    document = "document"
    medication = "medication"
    allergy = "allergy"
    note = "note"

class HealthEvent(Base):
    __tablename__ = "health_events"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), index=True)
    type = Column(Enum(HealthEventType))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSON, nullable=True) # Usamos JSONB para almacenar datos estructurados variables
    source_ref_id = Column(String, nullable=True) # ID de referencia (ej. el ID del triage o del documento)

    patient = relationship("PatientProfile", back_populates="health_events")

class SpecialistProfile(Base):
    """
    Perfil pblico y profesional del mdico especialista.
    """
    __tablename__ = "specialist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # refers to users.id
    full_name = Column(String)
    specialty = Column(String, index=True)
    city = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    availability_schedule = Column(JSON, nullable=True)
    photo_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SpecialistProfile(Base):
    __tablename__ = "specialist_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    full_name = Column(String)
    specialty = Column(String)
    license_number = Column(String)
    experience_years = Column(Integer, default=0)
    location = Column(String)
    languages = Column(String)
    bio = Column(Text, nullable=True)
    diploma_url = Column(String, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
