
from main import s3_client, R2_BUCKET_NAME, logger


from schemas_medical import MedicalSearchRequest, MedicalSearchResponse


from services.medical_search_service import MedicalSearchService


from services.pubmed_service import PubMedService


from services.clinical_trials_service import ClinicalTrialsService


from services.cochrane_service import CochraneService


import base64


import io


import logging


import os


import re


import traceback


from typing import Optional, List


import asyncio


from openai import AsyncOpenAI


from PIL import Image


import PyPDF2


from fastapi import FastAPI, UploadFile, File, HTTPException, Depends


from fastapi.responses import StreamingResponse


from fastapi.middleware.cors import CORSMiddleware


from pydantic import BaseModel


import ollama


from sqlalchemy import text


import database


import models


import boto3


from botocore.config import Config


from botocore.exceptions import ClientError


import uuid


from sqlalchemy import select, update


from fastapi import Form


from database import get_db


from sqlalchemy.ext.asyncio import AsyncSession


from fastapi.security import OAuth2PasswordRequestForm


from security import verify_password, get_password_hash, create_access_token, get_current_user_id


from sqlalchemy.future import select


from sqlalchemy.ext.asyncio import AsyncSession


from database import get_db


from sqlalchemy.future import select


import qrcode


import base64


from io import BytesIO


from pydantic import BaseModel


from sqlalchemy.future import select


from datetime import datetime


from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from typing import List, Optional
import os
import base64
import uuid

import database
import models
import security
from database import get_db
from security import authenticate_token

router = APIRouter()


@router.post('/api/auth/register')
async def register(request: RegisterRequest, db: AsyncSession=Depends(get_db)):
    result = (await db.execute(select(models.User).where((models.User.username == request.username))))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail='El nombre de usuario ya está registrado')
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
async def register_doctor(username: str=Form(...), password: str=Form(...), full_name: str=Form(...), specialty: str=Form(...), license_number: str=Form(...), experience_years: int=Form(...), location: str=Form(...), languages: str=Form(...), bio: str=Form(None), diploma_file: UploadFile=File(None), profile_pic_file: UploadFile=File(None), db: AsyncSession=Depends(get_db)):
    result = (await db.execute(select(models.User).where((models.User.username == username))))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail='El usuario/correo ya está registrado')
    diploma_url = None
    profile_pic_url = None
    if (diploma_file and s3_client):
        diploma_bytes = (await diploma_file.read())
        diploma_key = f'doctors/diplomas/{uuid.uuid4()}_{diploma_file.filename}'
        try:
            s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=diploma_key, Body=diploma_bytes, ContentType=diploma_file.content_type)
            diploma_url = diploma_key
        except ClientError as e:
            logging.error(f'S3 Upload Error: {e}')
            raise HTTPException(status_code=500, detail='Error subiendo el diploma.')
    if (profile_pic_file and s3_client):
        pic_bytes = (await profile_pic_file.read())
        pic_key = f'doctors/profiles/{uuid.uuid4()}_{profile_pic_file.filename}'
        try:
            s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=pic_key, Body=pic_bytes, ContentType=profile_pic_file.content_type)
            profile_pic_url = pic_key
        except ClientError as e:
            logging.error(f'S3 Upload Error: {e}')
            raise HTTPException(status_code=500, detail='Error subiendo la foto de perfil.')
    new_user = models.User(username=username, hashed_password=get_password_hash(password), role='doctor')
    db.add(new_user)
    (await db.flush())
    new_profile = models.SpecialistProfile(user_id=new_user.id, full_name=full_name, specialty=specialty, license_number=license_number, experience_years=experience_years, location=location, languages=languages, bio=bio, diploma_url=diploma_url, profile_pic_url=profile_pic_url, is_verified=False)
    db.add(new_profile)
    (await db.commit())
    access_token = create_access_token(data={'sub': new_user.id})
    return {'access_token': access_token, 'token_type': 'bearer', 'role': new_user.role}



@router.post('/api/auth/login')
async def login(form_data: OAuth2PasswordRequestForm=Depends(), db: AsyncSession=Depends(get_db)):
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

