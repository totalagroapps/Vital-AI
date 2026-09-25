import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

import database
import models

load_dotenv()
logger = logging.getLogger(__name__)

# Constants and Fail-Fast for JWT_SECRET_KEY in production
ENVIRONMENT = os.environ.get("ENVIRONMENT", os.environ.get("RAILWAY_ENVIRONMENT", "development")).lower()
ENV_JWT_SECRET = os.environ.get("JWT_SECRET_KEY")

DEFAULT_DEV_SECRET = "mivor-platform-jwt-secret-key-production-2026"

if ENVIRONMENT in ("production", "prod"):
    if not ENV_JWT_SECRET or ENV_JWT_SECRET == DEFAULT_DEV_SECRET:
        raise RuntimeError("FATAL SECURITY ERROR: JWT_SECRET_KEY must be explicitly set to a strong secret in production environment!")
    SECRET_KEY = ENV_JWT_SECRET
else:
    if not ENV_JWT_SECRET:
        logger.warning("SECURITY WARNING: JWT_SECRET_KEY is not set. Using development default fallback.")
    SECRET_KEY = ENV_JWT_SECRET or DEFAULT_DEV_SECRET

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt strictly requires max 72 bytes.
    plain_password_bytes = plain_password.encode('utf-8')[:72]
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    return user_id

async def get_optional_current_user_id(token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[str]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(database.get_db)
) -> models.User:
    """
    Recupera el usuario autenticado desde la base de datos validando identidad y rol.
    """
    user_id = await get_current_user_id(token)
    result = await db.execute(
        select(models.User).where((models.User.id == user_id) | (models.User.username == user_id))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o sesión revocada.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(database.get_db)
) -> Optional[models.User]:
    """
    Recupera el usuario si el token está presente y es válido, o None si no se proporcionó token.
    """
    if not token:
        return None
    try:
        user_id = await get_optional_current_user_id(token)
        if not user_id:
            return None
        result = await db.execute(
            select(models.User).where((models.User.id == user_id) | (models.User.username == user_id))
        )
        return result.scalars().first()
    except Exception:
        return None

def require_role(*allowed_roles: str):
    """
    Dependencia reutilizable para control de acceso basado en roles (RBAC).
    Permite el acceso si el rol del usuario autenticado está en allowed_roles.
    """
    async def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

async def _doctor_is_verified(db: AsyncSession, user_id: str) -> bool:
    sp = (await db.execute(
        select(models.SpecialistProfile).where(models.SpecialistProfile.user_id == user_id)
    )).scalars().first()
    if sp and (sp.is_verified or sp.verified):
        return True
    doc = (await db.execute(
        select(models.Doctor).where(models.Doctor.user_id == user_id)
    )).scalars().first()
    return bool(doc and doc.verification_status == "verified")


# Identificadores heredados del médico demo (ver scripts/seed_demo_doctor.py)
_DEMO_DOCTOR_USERNAMES = ("doctor@mivor.ai", "dr.mivor")
_DEMO_DOCTOR_IDS = ("doc-alejandro-ruiz", "doc-alejandro-alias")
_DEMO_DOCTOR_ALIASES = ("doc-alejandro-ruiz", "doc-alejandro-alias", "doctor@mivor.ai", "all")


def doctor_identifiers(user: models.User) -> List[str]:
    """Valores con los que un médico puede figurar en Appointment.doctor_id (id o username)."""
    ids = [user.id, user.username]
    if user.username in _DEMO_DOCTOR_USERNAMES or user.id in _DEMO_DOCTOR_IDS:
        ids.extend(_DEMO_DOCTOR_ALIASES)
    return ids


async def get_doctor_patient_ids(db: AsyncSession, user: models.User) -> set:
    """
    user_ids de los pacientes con los que el médico tiene relación asistencial,
    es decir, al menos una cita (agenda del médico o reserva hecha por el paciente).
    """
    refs = set((await db.execute(
        select(models.Appointment.patient_id).where(models.Appointment.doctor_id.in_(doctor_identifiers(user)))
    )).scalars().all())
    refs.discard(None)

    # Appointment.patient_id puede guardar el username del paciente en lugar de su id
    if refs:
        refs.update((await db.execute(
            select(models.User.id).where(models.User.username.in_(refs))
        )).scalars().all())

    doctor_profile_ids = select(models.DoctorProfile.id).where(models.DoctorProfile.user_id == str(user.id))
    refs.update((await db.execute(
        select(models.ScheduledAppointment.patient_id).where(
            models.ScheduledAppointment.doctor_id.in_(doctor_profile_ids)
        )
    )).scalars().all())
    return refs


async def can_access_patient_data(db: AsyncSession, user: models.User, patient_user_id: Optional[str]) -> bool:
    """
    True si el usuario puede ver los datos clínicos del paciente indicado:
    el propio paciente, un admin, o un médico verificado con una cita con ese paciente.
    """
    if patient_user_id is not None and str(patient_user_id) == str(user.id):
        return True
    if user.role == "admin":
        return True
    if user.role != "doctor" or patient_user_id is None:
        return False
    if not await _doctor_is_verified(db, user.id):
        return False
    return str(patient_user_id) in await get_doctor_patient_ids(db, user)


async def assert_patient_access(db: AsyncSession, user: models.User, patient_user_id: Optional[str]) -> None:
    if not await can_access_patient_data(db, user, patient_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: no tienes una relación asistencial con este paciente.",
        )


async def resolve_target_patient_id(db: AsyncSession, user: models.User, patient_id: Optional[str]) -> str:
    """
    Para endpoints con ?patient_id= opcional: un médico/admin solo puede consultar a un
    paciente al que tenga acceso; cualquier otro usuario siempre opera sobre sí mismo.
    """
    if not patient_id or user.role not in ("doctor", "admin"):
        return user.id
    await assert_patient_access(db, user, patient_id)
    return patient_id


async def require_verified_doctor(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db),
) -> models.User:
    """
    Acceso a datos clínicos de pacientes: solo médicos con credenciales verificadas
    (o administradores). Un registro de médico recién creado queda en 'pending'.
    """
    if current_user.role == "admin":
        return current_user
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requiere rol de médico verificado.",
        )
    if not await _doctor_is_verified(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta médica está pendiente de verificación. Podrás acceder a los datos de pacientes cuando sea aprobada.",
        )
    return current_user


require_doctor = require_role("doctor", "admin")
require_verifier = require_role("admin", "verifier")
require_patient = require_role("patient", "admin")
require_admin = require_role("admin")
