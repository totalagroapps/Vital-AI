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
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o sesión revocada.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

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
