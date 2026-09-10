import os
import re
import time
import uuid
import logging
from collections import defaultdict
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import database
import models
from database import get_db
from security import verify_password, get_password_hash, create_access_token, get_current_user_id
from main import RegisterRequest, s3_client, R2_BUCKET_NAME, logger

router = APIRouter()

# Rate limit de fuerza bruta para login (Punto 6 Auditoría R3)
_login_ip_rate_limit_store = defaultdict(list)
LOGIN_IP_WINDOW = 60
LOGIN_IP_MAX = 10


def apply_login_rate_limit(client_ip: str):
    now = time.time()
    _login_ip_rate_limit_store[client_ip] = [
        t for t in _login_ip_rate_limit_store[client_ip] if now - t < LOGIN_IP_WINDOW
    ]
    if len(_login_ip_rate_limit_store[client_ip]) >= LOGIN_IP_MAX:
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos de inicio de sesión. Por favor, espere un minuto antes de reintentar.",
            headers={"Retry-After": str(LOGIN_IP_WINDOW)}
        )
    _login_ip_rate_limit_store[client_ip].append(now)


@router.post('/api/auth/register')
async def register(request: RegisterRequest, db: AsyncSession=Depends(get_db)):
    result = (await db.execute(select(models.User).where((models.User.username == request.username))))
    if result.scalars().first():
        # Mitigación de enumeración de usuarios (Punto 16 Auditoría R3)
        raise HTTPException(status_code=400, detail='No fue posible completar el registro. Verifique los datos ingresados o inicie sesión si ya dispone de una cuenta.')
    hashed_pwd = get_password_hash(request.password)
    new_user = models.User(username=request.username, hashed_password=hashed_pwd, role=request.role)
    db.add(new_user)
    (await db.commit())
    (await db.refresh(new_user))
    if (new_user.role == 'patient'):
        new_profile = models.PatientProfile(user_id=new_user.id, full_name=new_user.username)
        db.add(new_profile)
        (await db.commit())
    return {'message': 'Usuario registrado exitosamente'}



@router.post('/api/auth/register-doctor')
async def register_doctor(
    username: str=Form(...),
    password: str=Form(...),
    full_name: str=Form(...),
    specialty: str=Form("Medicina General"),
    license_number: str=Form(""),
    experience_years: str=Form("0"),
    location: str=Form(""),
    languages: str=Form("Español"),
    bio: str=Form(None),
    diploma_file: UploadFile=File(None),
    profile_pic_file: UploadFile=File(None),
    id_doc_file: UploadFile=File(None),
    db: AsyncSession=Depends(get_db)
):
    clean_username = username.strip().lower()
    result = (await db.execute(select(models.User).where((models.User.username == clean_username))))
    if result.scalars().first():
        # Mitigación de enumeración de usuarios (Punto 16 Auditoría R3)
        raise HTTPException(status_code=400, detail='No fue posible completar el registro. Verifique los datos ingresados o inicie sesión si ya dispone de una cuenta.')
    
    try:
        exp_val = int(experience_years)
    except (ValueError, TypeError) as e:
        logger.warning(f"Could not convert experience_years directly to int ('{experience_years}'): {e}")
        nums = re.findall(r'\d+', str(experience_years))
        exp_val = int(nums[0]) if nums else 0

    diploma_url = None
    profile_pic_url = None
    id_doc_url = None

    if (diploma_file and diploma_file.filename):
        diploma_bytes = (await diploma_file.read())
        if len(diploma_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="El archivo del diploma excede el límite máximo de 10MB.")
        if not diploma_bytes.startswith(b'%PDF-'):
            raise HTTPException(status_code=400, detail="El diploma debe ser un archivo PDF válido.")
        if s3_client:
            try:
                diploma_key = f'doctors/diplomas/{uuid.uuid4()}_{diploma_file.filename}'
                s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=diploma_key, Body=diploma_bytes, ContentType='application/pdf')
                diploma_url = diploma_key
            except Exception as e:
                logging.error(f'S3 Upload Error for diploma: {e}')
                diploma_url = f"local_pending/{diploma_file.filename}"
        else:
            diploma_url = f"local_pending/{diploma_file.filename}"

    if (profile_pic_file and profile_pic_file.filename):
        pic_bytes = (await profile_pic_file.read())
        if len(pic_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="La foto de perfil excede el límite máximo de 10MB.")
        is_jpeg = pic_bytes.startswith(b'\xff\xd8\xff')
        is_png = pic_bytes.startswith(b'\x89PNG')
        is_webp = pic_bytes.startswith(b'RIFF') and b'WEBP' in pic_bytes[:16]
        if not (is_jpeg or is_png or is_webp):
            raise HTTPException(status_code=400, detail="La foto de perfil debe ser una imagen válida (JPEG, PNG o WEBP).")
        if s3_client:
            try:
                pic_key = f'doctors/profiles/{uuid.uuid4()}_{profile_pic_file.filename}'
                content_type = 'image/png' if is_png else ('image/webp' if is_webp else 'image/jpeg')
                s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=pic_key, Body=pic_bytes, ContentType=content_type)
                profile_pic_url = pic_key
            except Exception as e:
                logging.error(f'S3 Upload Error for profile pic: {e}')
                profile_pic_url = None

    if (id_doc_file and id_doc_file.filename):
        id_doc_bytes = (await id_doc_file.read())
        if len(id_doc_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="El documento de identidad excede el límite máximo de 10MB.")
        is_pdf = id_doc_bytes.startswith(b'%PDF-')
        is_jpeg = id_doc_bytes.startswith(b'\xff\xd8\xff')
        is_png = id_doc_bytes.startswith(b'\x89PNG')
        is_webp = id_doc_bytes.startswith(b'RIFF') and b'WEBP' in id_doc_bytes[:16]
        if not (is_pdf or is_jpeg or is_png or is_webp):
            raise HTTPException(status_code=400, detail="El documento de identidad debe ser un archivo PDF o una imagen válida (JPEG, PNG o WEBP).")
        if s3_client:
            try:
                content_type = 'application/pdf' if is_pdf else ('image/png' if is_png else ('image/webp' if is_webp else 'image/jpeg'))
                id_doc_key = f'doctors/identities/{uuid.uuid4()}_{id_doc_file.filename}'
                s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=id_doc_key, Body=id_doc_bytes, ContentType=content_type)
                id_doc_url = id_doc_key
            except Exception as e:
                logging.error(f'S3 Upload Error for id doc: {e}')
                id_doc_url = f"local_pending/{id_doc_file.filename}"
        else:
            id_doc_url = f"local_pending/{id_doc_file.filename}"

    new_user = models.User(username=clean_username, hashed_password=get_password_hash(password), role='doctor')
    db.add(new_user)
    (await db.flush())
    new_profile = models.SpecialistProfile(
        user_id=new_user.id,
        full_name=full_name,
        specialty=specialty,
        license_number=license_number,
        experience_years=exp_val,
        location=location,
        languages=languages,
        bio=bio,
        diploma_url=diploma_url,
        profile_pic_url=profile_pic_url,
        id_doc_url=id_doc_url,
        is_verified=False
    )
    db.add(new_profile)
    (await db.commit())
    access_token = create_access_token(data={'sub': new_user.id})
    return {'access_token': access_token, 'token_type': 'bearer', 'role': new_user.role}



@router.post('/api/auth/login')
async def login(request: Request, form_data: OAuth2PasswordRequestForm=Depends(), db: AsyncSession=Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    apply_login_rate_limit(client_ip)

    result = (await db.execute(select(models.User).where((models.User.username == form_data.username))))
    user = result.scalars().first()
    if ((not user) or (not verify_password(form_data.password, user.hashed_password))):
        raise HTTPException(status_code=400, detail='Usuario o contraseña incorrectos')
    access_token = create_access_token(data={'sub': user.id})
    return {'access_token': access_token, 'token_type': 'bearer', 'role': user.role}



@router.get('/api/auth/me')
async def get_me(user_id: str=Depends(get_current_user_id), db: AsyncSession=Depends(get_db)):
    result = (await db.execute(select(models.User).where((models.User.id == user_id))))
    user = result.scalars().first()
    if (not user):
        raise HTTPException(status_code=404, detail='Usuario no encontrado')
    return {'id': user.id, 'username': user.username, 'role': user.role}

