from datetime import date, datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


# ==========================================================
# DOCTOR EDUCATION
# ==========================================================

class DoctorEducationBase(BaseModel):
    institution: str = Field(..., min_length=1, max_length=255)
    degree: str = Field(..., min_length=1, max_length=150)
    field_of_study: Optional[str] = Field(default=None, max_length=150)
    education_type: Optional[str] = Field(default=None, max_length=50)
    start_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    end_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    description: Optional[str] = None


class DoctorEducationCreate(DoctorEducationBase):
    pass


class DoctorEducationUpdate(BaseModel):
    institution: Optional[str] = Field(default=None, min_length=1, max_length=255)
    degree: Optional[str] = Field(default=None, min_length=1, max_length=150)
    field_of_study: Optional[str] = Field(default=None, max_length=150)
    education_type: Optional[str] = Field(default=None, max_length=50)
    start_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    end_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    description: Optional[str] = None


class DoctorEducationResponse(DoctorEducationBase):
    id: int
    doctor_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# DOCTOR MEDIA
# ==========================================================

class DoctorMediaResponse(BaseModel):
    id: int
    doctor_id: int
    media_type: str
    file_url: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# DOCTOR PROFILE UPDATE
# ==========================================================

class DoctorProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    date_of_birth: Optional[Union[date, str]] = None
    residence_country: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=30)
    medical_license: Optional[str] = Field(default=None, max_length=100)
    identity_document_url: Optional[str] = Field(default=None, max_length=500)
    professional_registration_number: Optional[str] = Field(default=None, max_length=100)
    professional_college: Optional[str] = Field(default=None, max_length=255)
    college_country: Optional[str] = Field(default=None, max_length=100)
    professional_registration_certificate_url: Optional[str] = Field(default=None, max_length=500)
    specialty: Optional[str] = Field(default=None, max_length=150)
    subspecialties: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    years_of_experience: Optional[int] = Field(default=None, ge=0, le=100)
    professional_description: Optional[str] = None
    address: Optional[str] = Field(default=None, max_length=255)
    country: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=150)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    consultation_phone: Optional[str] = Field(default=None, max_length=30)
    website: Optional[str] = Field(default=None, max_length=500)
    language: Optional[str] = Field(default="es", max_length=10)
    data_policy_accepted: Optional[bool] = None
    data_policy_accepted_at: Optional[datetime] = None


# ==========================================================
# DOCTOR PROFILE RESPONSE
# ==========================================================

class DoctorProfileResponse(BaseModel):
    user_id: Union[str, int]
    email: str
    role: str
    first_name: str
    last_name: str
    date_of_birth: Optional[Union[date, str]] = None
    residence_country: Optional[str] = None
    phone: Optional[str] = None
    medical_license: str
    identity_document_url: Optional[str] = None
    professional_registration_number: Optional[str] = None
    professional_college: Optional[str] = None
    college_country: Optional[str] = None
    professional_registration_certificate_url: Optional[str] = None
    specialty: str
    subspecialties: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    years_of_experience: Optional[int] = None
    professional_description: Optional[str] = None
    language: Optional[str] = "es"
    address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    consultation_phone: Optional[str] = None
    website: Optional[str] = None
    verification_status: Optional[str] = "pending"
    data_policy_accepted: bool = False
    data_policy_accepted_at: Optional[datetime] = None
    educations: List[DoctorEducationResponse] = Field(default_factory=list)
    media: List[DoctorMediaResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# DOCTOR CREATE / REGISTER
# ==========================================================

class DoctorCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    medical_license: str = Field(..., min_length=1, max_length=100)
    specialty: str = Field(..., min_length=1, max_length=150)
    subspecialties: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    years_of_experience: Optional[int] = Field(default=None, ge=0, le=100)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=150)
    country: Optional[str] = Field(default="Colombia", max_length=100)
    residence_country: Optional[str] = Field(default="Colombia", max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    consultation_phone: Optional[str] = Field(default=None, max_length=30)
    website: Optional[str] = Field(default=None, max_length=500)
    date_of_birth: Optional[Union[date, str]] = None
    professional_registration_number: Optional[str] = Field(default=None, max_length=100)
    professional_college: Optional[str] = Field(default=None, max_length=255)
    college_country: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = None
    experience: Optional[str] = None
    professional_description: Optional[str] = None
    language: Optional[str] = "es"
    password: Optional[str] = Field(default=None, min_length=6)


# ==========================================================
# VERIFICATION SCHEMAS
# ==========================================================

class VerificationStatusUpdate(BaseModel):
    verification_status: str  # "verified", "rejected", "pending"
    notes: Optional[str] = None


class DoctorVerificationDetailResponse(BaseModel):
    id: int
    user_id: Union[str, int]
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    residence_country: Optional[str] = None
    medical_license: str
    professional_registration_number: Optional[str] = None
    professional_college: Optional[str] = None
    college_country: Optional[str] = None
    specialty: str
    years_of_experience: Optional[int] = None
    professional_description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    verification_status: str
    is_active: bool
    created_at: Optional[datetime] = None
    identity_document_url: Optional[str] = None
    professional_registration_certificate_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
