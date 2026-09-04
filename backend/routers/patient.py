
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


@router.get('/api/patient/profile')
async def get_patient_profile(db: AsyncSession=Depends(get_db), user_id: str=Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == user_id))))
    profile = result.scalars().first()
    if (not profile):
        return {}
    qr_data = f'''FICHA MEDICA DE EMERGENCIA
Nombre: {profile.full_name}
Sangre: {profile.blood_type}
Altura: {(profile.height or 'N/D')} | Peso: {(profile.weight or 'N/D')}
Alergias: {(profile.allergies or 'Ninguna')}
Condiciones: {(profile.chronic_conditions or 'Ninguna')}
Contacto: {(profile.emergency_contact or 'No especificado')}'''
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    buffered = BytesIO()
    img.save(buffered, format='PNG')
    qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    triage_res = (await db.execute(select(models.TriageSession).where((models.TriageSession.user_id == user_id)).order_by(models.TriageSession.created_at.desc())))
    triages = triage_res.scalars().all()
    triage_list = []
    for t in triages:
        if t.final_report:
            triage_list.append({'id': t.id, 'category': t.category, 'status': t.status, 'final_report': t.final_report, 'recommended_specialty': t.recommended_specialty, 'created_at': (t.created_at.isoformat() if t.created_at else None)})
    return {'full_name': profile.full_name, 'date_of_birth': profile.date_of_birth, 'gender': profile.gender, 'blood_type': profile.blood_type, 'allergies': profile.allergies, 'chronic_conditions': profile.chronic_conditions, 'current_medications': profile.current_medications, 'emergency_contact': profile.emergency_contact, 'height': profile.height, 'weight': profile.weight, 'qr_code_base64': qr_base64, 'triages': triage_list}



@router.post('/api/patient/profile')
async def update_patient_profile(profile_data: PatientProfileSchema, db: AsyncSession=Depends(get_db), user_id: str=Depends(get_current_user_id)):
    from sqlalchemy.future import select
    result = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == user_id))))
    profile = result.scalars().first()
    if (not profile):
        profile = models.PatientProfile(user_id=user_id)
        db.add(profile)
    profile.full_name = profile_data.full_name
    profile.date_of_birth = profile_data.date_of_birth
    profile.gender = profile_data.gender
    profile.blood_type = profile_data.blood_type
    profile.allergies = profile_data.allergies
    profile.chronic_conditions = profile_data.chronic_conditions
    profile.current_medications = profile_data.current_medications
    profile.emergency_contact = profile_data.emergency_contact
    profile.height = profile_data.height
    profile.weight = profile_data.weight
    (await db.commit())
    return {'status': 'success'}



@router.get('/api/doctor/patients/{patient_id}')
async def get_patient_detail(patient_id: str, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    import json
    from sqlalchemy.future import select
    from services.matching_service import match_specialty_from_clinical_data, get_recommended_specialists

    profile_res = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == patient_id))))
    profile = profile_res.scalars().first()
    if not profile:
        profile_res = (await db.execute(select(models.PatientProfile).where(
            (models.PatientProfile.id == int(patient_id)) if patient_id.isdigit() else (models.PatientProfile.full_name == patient_id)
        )))
        profile = profile_res.scalars().first()

    effective_user_id = profile.user_id if profile else patient_id

    if not profile:
        profile_dict = {
            'full_name': patient_id,
            'date_of_birth': '',
            'gender': '',
            'blood_type': 'N/A',
            'allergies': '',
            'chronic_conditions': '',
            'current_medications': '',
            'emergency_contact': '',
            'height': '',
            'weight': ''
        }
    else:
        profile_dict = {
            'full_name': profile.full_name or patient_id,
            'date_of_birth': profile.date_of_birth,
            'gender': profile.gender,
            'blood_type': profile.blood_type,
            'allergies': profile.allergies,
            'chronic_conditions': profile.chronic_conditions,
            'current_medications': profile.current_medications,
            'emergency_contact': profile.emergency_contact,
            'height': profile.height,
            'weight': profile.weight
        }

    # 1. Triajes asistidos del paciente
    triage_res = (await db.execute(
        select(models.TriageSession)
        .where((models.TriageSession.user_id == effective_user_id))
        .order_by(models.TriageSession.created_at.desc())
    ))
    triages = triage_res.scalars().all()
    triages_list = [
        {
            'id': t.id,
            'category': t.category,
            'status': t.status,
            'final_report': t.final_report,
            'recommended_specialty': t.recommended_specialty,
            'created_at': (t.created_at.isoformat() if t.created_at else None)
        } for t in triages
    ]

    # 2. Medicación activa estructurada (Fila 23)
    med_res = (await db.execute(
        select(models.MedicationReminder)
        .where((models.MedicationReminder.user_id == effective_user_id))
        .order_by(models.MedicationReminder.created_at.desc())
    ))
    medications = med_res.scalars().all()
    medications_list = [
        {
            'id': m.id,
            'medication_name': m.medication_name,
            'dosage': m.dosage or '',
            'frequency': m.frequency or '',
            'time_of_day': m.time_of_day or '',
            'is_active': getattr(m, 'is_active', True)
        } for m in medications
    ]

    # 3. Documentos y analíticas con hallazgos estructurados (Fila 23)
    documents_list = []
    all_diagnostics = []
    all_anomalies = []
    clinical_summaries = []

    if profile:
        doc_stmt = select(models.MedicalDocument).where(
            (models.MedicalDocument.patient_id == profile.id),
            (models.MedicalDocument.is_deleted == False)
        ).order_by(models.MedicalDocument.uploaded_at.desc())
        doc_result = (await db.execute(doc_stmt))
        documents = doc_result.scalars().all()

        for doc in documents:
            parsed = {}
            if doc.extracted_text:
                try:
                    parsed = json.loads(doc.extracted_text)
                except Exception:
                    parsed = {'raw': doc.extracted_text}

            # Recolectar anomalías y diagnósticos para matching
            if isinstance(parsed, dict):
                diags = parsed.get('diagnosticos', [])
                if isinstance(diags, list):
                    all_diagnostics.extend(diags)
                anom = parsed.get('anomalias') or parsed.get('hallazgos') or []
                if isinstance(anom, list):
                    all_anomalies.extend(anom)
                resumen = parsed.get('resumen') or ''
                if resumen:
                    clinical_summaries.append(resumen)

            download_url = None
            if s3_client and R2_BUCKET_NAME and doc.file_url:
                try:
                    download_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': R2_BUCKET_NAME, 'Key': doc.file_url},
                        ExpiresIn=3600
                    )
                except Exception:
                    download_url = None

            documents_list.append({
                'id': doc.id,
                'document_type': doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
                'original_filename': doc.original_filename,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None,
                'notes': doc.notes,
                'extracted_text': doc.extracted_text,
                'parsed_insights': parsed,
                'download_url': download_url
            })

    # También agregar hallazgos de triajes al matching
    for t in triages:
        if t.final_report:
            clinical_summaries.append(t.final_report)
        if t.recommended_specialty:
            all_diagnostics.append(t.recommended_specialty)

    # 4. Derivación Inteligente de Paciente a Especialista (Fila 24)
    matching_result = match_specialty_from_clinical_data(
        diagnostics=all_diagnostics,
        anomalies=all_anomalies,
        summary_text=' '.join(clinical_summaries)
    )

    recommended_specialists = []
    if matching_result.get('specialty'):
        recommended_specialists = await get_recommended_specialists(
            db=db,
            specialty=matching_result['specialty'],
            limit=4
        )

    smart_referral = {
        'matched': matching_result.get('matched', False),
        'recommended_specialty': matching_result.get('specialty', 'Medicina General'),
        'urgency': matching_result.get('urgency', 'baja'),
        'reason': matching_result.get('reason', ''),
        'matched_keywords': matching_result.get('matched_keywords', []),
        'available_specialists': recommended_specialists
    }

    return {
        'profile': profile_dict,
        'triages': triages_list,
        'medications': medications_list,
        'documents': documents_list,
        'smart_referral': smart_referral
    }




@router.get('/api/patients/{patient_id}/history')
async def get_patient_history(patient_id: str, db: AsyncSession=Depends(get_db), current_user_id: str=Depends(get_current_user_id)):
    actual_patient_id = (current_user_id if ((patient_id == 'me') or (patient_id == 'mock_user')) else patient_id)
    stmt = select(models.PatientProfile).where(((models.PatientProfile.id == int(actual_patient_id)) if actual_patient_id.isdigit() else (models.PatientProfile.user_id == actual_patient_id)))
    result = (await db.execute(stmt))
    patient = result.scalar_one_or_none()
    if (not patient):
        raise HTTPException(status_code=404, detail='Patient not found.')
    events_stmt = select(models.HealthEvent).where((models.HealthEvent.patient_id == patient.id)).order_by(models.HealthEvent.created_at.desc())
    events_result = (await db.execute(events_stmt))
    events = events_result.scalars().all()
    response = []
    for event in events:
        response.append({'id': event.id, 'type': event.type.value, 'created_at': (event.created_at.isoformat() if event.created_at else None), 'payload': (event.payload or {}), 'source_ref_id': event.source_ref_id})
    return response

