
from main import RegisterRequest, StandardChatMessage, StandardChatRequest, ChatMessage, TriageRequest, PatientProfileSchema, DoctorQueryRequest, MedicationReminderCreate
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

router = APIRouter()


@router.get('/api/medications')
async def get_medications(date: str=None, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from models import MedicationReminder, MedicationLog
    if (not date):
        date = datetime.now().strftime('%Y-%m-%d')
    q = (await db.execute(select(MedicationReminder).where((MedicationReminder.user_id == current_user_id), (MedicationReminder.is_active == True))))
    reminders = q.scalars().all()
    q_logs = (await db.execute(select(MedicationLog).where((MedicationLog.user_id == current_user_id), (MedicationLog.taken_date == date))))
    logs = q_logs.scalars().all()
    logged_med_ids = [log.medication_id for log in logs]
    return {'reminders': [{'id': r.id, 'medication_name': r.medication_name, 'dosage': r.dosage, 'frequency': r.frequency, 'time_of_day': r.time_of_day, 'taken_today': (r.id in logged_med_ids)} for r in reminders], 'date': date}



@router.post('/api/medications')
async def create_medication(req: MedicationReminderCreate, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from models import MedicationReminder
    new_med = MedicationReminder(user_id=current_user_id, medication_name=req.medication_name, dosage=req.dosage, frequency=req.frequency, time_of_day=req.time_of_day)
    db.add(new_med)
    (await db.commit())
    (await db.refresh(new_med))
    return {'status': 'ok', 'id': new_med.id}



@router.post('/api/medications/{med_id}/log')
async def log_medication(med_id: int, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from models import MedicationLog
    date = datetime.now().strftime('%Y-%m-%d')
    time_str = datetime.now().strftime('%H:%M')
    q = (await db.execute(select(MedicationLog).where((MedicationLog.medication_id == med_id), (MedicationLog.taken_date == date))))
    existing = q.scalars().first()
    if existing:
        return {'status': 'already_logged'}
    log = MedicationLog(user_id=current_user_id, medication_id=med_id, taken_date=date, taken_time=time_str)
    db.add(log)
    (await db.commit())
    return {'status': 'ok'}



@router.delete('/api/medications/{med_id}/log')
async def unlog_medication(med_id: int, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from models import MedicationLog
    date = datetime.now().strftime('%Y-%m-%d')
    q = (await db.execute(select(MedicationLog).where((MedicationLog.medication_id == med_id), (MedicationLog.taken_date == date))))
    existing = q.scalars().first()
    if existing:
        (await db.delete(existing))
        (await db.commit())
    return {'status': 'ok'}



@router.delete('/api/medications/{med_id}')
async def delete_medication(med_id: int, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    from models import MedicationReminder
    q = (await db.execute(select(MedicationReminder).where((MedicationReminder.id == med_id), (MedicationReminder.user_id == current_user_id))))
    med = q.scalars().first()
    if med:
        med.is_active = False
        (await db.commit())
    return {'status': 'ok'}

