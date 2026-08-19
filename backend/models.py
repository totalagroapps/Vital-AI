from database import Base
from sqlalchemy import Column, Integer, String, DateTime, func

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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
    preferred_language = Column(String, default="es")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
