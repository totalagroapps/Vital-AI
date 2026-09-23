from database import Base
from sqlalchemy import Column, Boolean, Integer, String, DateTime, func, ForeignKey, Enum, Text, Float, UniqueConstraint, CheckConstraint, Time, Date, Uuid
import enum
import uuid
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from services.encryption import EncryptedString, EncryptedText

class DocumentMetadata(Base):
    """
    Placeholder table for Document OCR metadata.
    Danna will handle full migrations, but this serves as our testing schema.
    """
    __tablename__ = "document_metadata"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)  # links doc to authenticated user
    filename = Column(String, index=True)
    extracted_text = Column(String)
    document_type = Column(String) # e.g. 'radiografia', 'analitica'
    analysis_result = Column(String, nullable=True) # JSON stored as string for the AI report
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True) # or email
    hashed_password = Column(String)
    role = Column(String, default="patient") # patient, doctor, admin, verifier
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scheduled_appointments = relationship("ScheduledAppointment", back_populates="patient", cascade="all, delete-orphan")
    patient_profile = relationship("PatientProfile", primaryjoin="PatientProfile.user_id == foreign(User.id)", uselist=False)

    @property
    def full_name(self) -> str | None:
        return self.patient_profile.full_name if self.patient_profile else None

    @property
    def email(self) -> str | None:
        return self.username

    @property
    def appointments(self):
        return self.scheduled_appointments


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
    organ_donor = Column(String, nullable=True, default="No especificado")
    medical_notes = Column(String, nullable=True)
    insurance_provider = Column(String, nullable=True)
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
    session_id = Column(String, ForeignKey("chat_sessions.id"), index=True)
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

class CognitiveGameSession(Base):
    """
    Registros de sesiones de juegos de estimulación cognitiva (Mente Activa).
    Permite seguir la agilidad mental, memoria y velocidad de reacción en el tiempo.
    """
    __tablename__ = "cognitive_game_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    game_type = Column(String, index=True) # "memory_digits", "speed_math", "pattern_match"
    score = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=100.0)
    duration_seconds = Column(Float, default=0.0)
    difficulty_level = Column(String, default="normal") # "easy", "normal", "challenge"
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpecialistProfile(Base):
    """
    Perfil público y profesional del médico especialista.
    """
    __tablename__ = "specialist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # refers to users.id
    full_name = Column(String)
    specialty = Column(String, index=True)
    license_number = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    city = Column(String, nullable=True)
    location = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    availability_schedule = Column(JSON, nullable=True)
    photo_url = Column(String, nullable=True)
    diploma_url = Column(String, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    id_doc_url = Column(String, nullable=True)
    presentation_video_url = Column(String, nullable=True)
    clinic_video_url = Column(String, nullable=True)
    professional_college = Column(String, nullable=True)
    education = Column(JSON, nullable=True)
    clinic_photos = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MedicationReminder(Base):
    __tablename__ = "medication_reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    medication_name = Column(String)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    time_of_day = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class MedicationLog(Base):
    __tablename__ = "medication_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    medication_id = Column(Integer, ForeignKey("medication_reminders.id"))
    taken_date = Column(String, index=True) # YYYY-MM-DD
    taken_time = Column(String) # HH:MM
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Appointment(Base):
    """
    Citas médicas y agenda del profesional de salud.
    """
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, index=True) # ID o username del doctor (ej. doctor@mivor.ai)
    patient_id = Column(String, index=True) # ID o username del paciente
    patient_name = Column(String)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String, nullable=True)
    blood_type = Column(String, nullable=True)
    appointment_date = Column(String, index=True) # Formato YYYY-MM-DD
    appointment_time = Column(String) # Formato HH:MM (ej. 09:30)
    duration_minutes = Column(Integer, default=30)
    reason = Column(String) # Motivo de consulta
    appointment_type = Column(String, default="presencial") # presencial | teleconsulta
    status = Column(String, default="confirmada") # confirmada | en_espera | completada | cancelada
    triage_category = Column(String, default="Verde") # Rojo | Amarillo | Verde
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================================================
# MÓDULOS DE DOCTOR Y VERIFICACIÓN (DAHIANA INTEGRATION)
# ==========================================================

class Specialty(Base):
    __tablename__ = "specialties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor_specialties = relationship("DoctorSpecialty", back_populates="specialty", cascade="all, delete-orphan")
    doctor_profile_specialties = relationship("DoctorProfileSpecialty", back_populates="specialty", cascade="all, delete-orphan")

    @property
    def doctors(self):
        return self.doctor_profile_specialties


class Doctor(Base):
    __tablename__ = "doctors"

    __table_args__ = (
        CheckConstraint("latitude IS NULL OR (latitude >= -90 AND latitude <= 90)", name="ck_doctors_latitude_range"),
        CheckConstraint("longitude IS NULL OR (longitude >= -180 AND longitude <= 180)", name="ck_doctors_longitude_range"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Datos personales (Cifrados con AES-256)
    first_name = Column(EncryptedString(100), nullable=False)
    last_name = Column(EncryptedString(100), nullable=False)
    date_of_birth = Column(String, nullable=True)
    residence_country = Column(String(100), nullable=True)
    phone = Column(EncryptedString(30), nullable=True)

    # Estado de la cuenta y verificación
    is_active = Column(Boolean, default=True, nullable=False)
    verification_status = Column(String(20), default="pending", nullable=False, index=True)

    # Información y licencias profesionales
    medical_license = Column(String(100), unique=True, nullable=False, index=True)
    professional_registration_number = Column(String(100), nullable=True)
    professional_college = Column(String(150), nullable=True)
    college_country = Column(String(100), nullable=True)
    specialty = Column(String(150), nullable=False, index=True)
    subspecialties = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    professional_description = Column(EncryptedText, nullable=True)
    experience = Column(EncryptedText, nullable=True)
    language = Column(String(10), default="es", nullable=False)

    # Ubicación y contacto
    consultation_phone = Column(EncryptedString(30), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(EncryptedString(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # URLs de documentos e identidad
    identity_document_url = Column(EncryptedString(500), nullable=True)
    professional_registration_certificate_url = Column(EncryptedString(500), nullable=True)
    profile_picture_url = Column(EncryptedString(500), nullable=True)
    presentation_video_url = Column(EncryptedString(500), nullable=True)
    clinic_video_url = Column(EncryptedString(500), nullable=True)

    # Términos y políticas
    data_policy_accepted = Column(Boolean, default=False, nullable=False)
    data_policy_accepted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    user = relationship("User", back_populates="doctor")
    educations = relationship("DoctorEducation", back_populates="doctor", cascade="all, delete-orphan")
    media = relationship("DoctorMedia", back_populates="doctor", cascade="all, delete-orphan")
    doctor_specialties = relationship("DoctorSpecialty", back_populates="doctor", cascade="all, delete-orphan")
    medical_verifications = relationship("MedicalVerification", back_populates="doctor", cascade="all, delete-orphan")


class DoctorSpecialty(Base):
    __tablename__ = "doctor_specialties"

    __table_args__ = (
        UniqueConstraint("doctor_id", "specialty_id", name="uq_doctor_specialty"),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    specialty_id = Column(Integer, ForeignKey("specialties.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="doctor_specialties")
    specialty = relationship("Specialty", back_populates="doctor_specialties")


class DoctorEducation(Base):
    __tablename__ = "doctor_educations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    institution = Column(EncryptedString(255), nullable=False)
    degree = Column(EncryptedString(150), nullable=False)
    field_of_study = Column(EncryptedString(150), nullable=True)
    education_type = Column(String(50), nullable=True)
    start_year = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    description = Column(EncryptedText, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="educations")


class DoctorMedia(Base):
    __tablename__ = "doctor_media"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type = Column(String(50), nullable=False) # profile_picture, certificate, additional_document, gallery, video
    file_url = Column(EncryptedString(500), nullable=False)
    file_name = Column(EncryptedString(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="media")


class MedicalVerification(Base):
    __tablename__ = "medical_verifications"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    verifier_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False, index=True) # pending, verified, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="medical_verifications")
    verifier = relationship("User", foreign_keys=[verifier_id])


# ==========================================================
# MÓDULOS DE CITAS, AGENDAMIENTO Y BÚSQUEDA DE ESPECIALISTAS (FACUNDO INTEGRATION)
# ==========================================================

class Modality(str, enum.Enum):
    in_person = "in_person"
    video = "video"
    both = "both"


class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    no_show = "no_show"
    cancelled = "cancelled"


class AvailabilityExceptionKind(str, enum.Enum):
    unavailable = "unavailable"
    extra = "extra"


class HealthPlaceKind(str, enum.Enum):
    hospital = "hospital"
    clinic = "clinic"


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, nullable=False)  # ISO 639-1, e.g. "es", "en"
    name = Column(String, nullable=False)  # e.g. "Español", "English"

    doctor = relationship("DoctorLanguage", back_populates="language", cascade="all, delete-orphan")


class InsuranceCompany(Base):
    __tablename__ = "insurance_companies"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    doctors = relationship("DoctorInsuranceCompany", back_populates="insurance_company", cascade="all, delete-orphan")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    __table_args__ = (
        CheckConstraint("lat IS NULL OR (lat >= -90 AND lat <= 90)", name="ck_doctor_profiles_lat_range"),
        CheckConstraint("lng IS NULL OR (lng >= -180 AND lng <= 180)", name="ck_doctor_profiles_lng_range"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name = Column(String)
    avatar_url = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    modality = Column(Enum(Modality), nullable=True, default=Modality.both)

    # Calendar settings
    timezone = Column(String, nullable=False, server_default="Europe/Madrid")
    appointment_duration_minutes = Column(Integer, nullable=False, server_default="30")
    appointment_buffer_minutes = Column(Integer, nullable=False, server_default="0")

    clinic_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    years_experience = Column(Integer, nullable=True)
    education = Column(String, nullable=True)

    user = relationship("User", back_populates="doctor_profile")
    insurance_companies = relationship("DoctorInsuranceCompany", back_populates="doctor", cascade="all, delete-orphan")
    languages = relationship("DoctorLanguage", back_populates="doctor", cascade="all, delete-orphan")
    specialties = relationship("DoctorProfileSpecialty", back_populates="doctor", cascade="all, delete-orphan")
    availability_schedules = relationship(
        "AvailabilitySchedule", back_populates="doctor", cascade="all, delete-orphan"
    )
    availability_exceptions = relationship(
        "AvailabilityException", back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorLanguage(Base):
    __tablename__ = "doctor_languages"

    doctor_id = Column(Uuid(as_uuid=True), ForeignKey("doctor_profiles.id", ondelete="CASCADE"), primary_key=True)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), primary_key=True)

    doctor = relationship("DoctorProfile", back_populates="languages")
    language = relationship("Language", back_populates="doctor")


class DoctorInsuranceCompany(Base):
    __tablename__ = "doctor_insurance_companies"

    doctor_id = Column(Uuid(as_uuid=True), ForeignKey("doctor_profiles.id", ondelete="CASCADE"), primary_key=True)
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.id", ondelete="CASCADE"), primary_key=True)

    doctor = relationship("DoctorProfile", back_populates="insurance_companies")
    insurance_company = relationship("InsuranceCompany", back_populates="doctors")


class DoctorProfileSpecialty(Base):
    __tablename__ = "doctor_profile_specialties"

    doctor_id = Column(Uuid(as_uuid=True), ForeignKey("doctor_profiles.id", ondelete="CASCADE"), primary_key=True)
    specialty_id = Column(Integer, ForeignKey("specialties.id", ondelete="CASCADE"), primary_key=True)

    doctor = relationship("DoctorProfile", back_populates="specialties")
    specialty = relationship("Specialty", back_populates="doctor_profile_specialties")


class AvailabilitySchedule(Base):
    """Recurring weekly working block. Times are in the doctor's local timezone."""
    __tablename__ = "availability_schedules"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_availability_weekday"),
        CheckConstraint("start_time < end_time", name="ck_availability_time_order"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    weekday = Column(Integer, nullable=False)  # Monday=0 .. Sunday=6
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    modality = Column(Enum(Modality), nullable=False)
    valid_from = Column(Date, nullable=True)
    valid_until = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("DoctorProfile", back_populates="availability_schedules")


class AvailabilityException(Base):
    """One-off change to a doctor's availability: block time or open an extra slot."""
    __tablename__ = "availability_exceptions"
    __table_args__ = (
        CheckConstraint("start_at < end_at", name="ck_availability_exception_time_order"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    kind = Column(Enum(AvailabilityExceptionKind), nullable=False)
    modality = Column(Enum(Modality), nullable=True)  # only meaningful for `extra`
    reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("DoctorProfile", back_populates="availability_exceptions")


class ExternalHealthPlace(Base):
    """Hospital/clinic NOT affiliated with Vital IA, cached from external sources."""
    __tablename__ = "external_health_places"
    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_external_health_places_source_id"),
        CheckConstraint("lat >= -90 AND lat <= 90", name="ck_external_health_places_lat_range"),
        CheckConstraint("lng >= -180 AND lng <= 180", name="ck_external_health_places_lng_range"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String, nullable=False, server_default="osm")
    external_id = Column(String, nullable=False)  # id within `source`, e.g. "node/12345"
    name = Column(String, nullable=True)
    kind = Column(Enum(HealthPlaceKind), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ScheduledAppointment(Base):
    """
    Citas médicas agendadas en tiempo real para pacientes y especialistas MIVOR.
    """
    __tablename__ = "scheduled_appointments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    doctor_id = Column(Uuid(as_uuid=True), ForeignKey("doctor_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=30)
    modality = Column(Enum(Modality), nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.pending)
    reason = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    payment_token = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User", back_populates="scheduled_appointments")
    doctor = relationship("DoctorProfile")



class UITranslation(Base):
    """Traducción de la interfaz generada con IA para un idioma sin diccionario manual (caché compartida)."""
    __tablename__ = "ui_translations"

    lang = Column(String(8), primary_key=True)
    strings = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
