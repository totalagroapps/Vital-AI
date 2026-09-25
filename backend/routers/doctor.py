
import os
import io
import re
import json
import logging
import uuid
from typing import Optional, List
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy.future import select
from sqlalchemy import text, or_
from sqlalchemy.ext.asyncio import AsyncSession

import database
import models
import security
from services.language_service import language_directive, language_label
from database import get_db
from security import get_current_user, require_role, get_current_user_id

from main import (
    RegisterRequest, StandardChatMessage, StandardChatRequest, ChatMessage, 
    TriageRequest, PatientProfileSchema, DoctorQueryRequest, MedicationReminderCreate,
    s3_client, R2_BUCKET_NAME, logger
)
from services import appointment_service, doctor_service
from services.matching_service import match_specialty_from_clinical_data, get_recommended_specialists

router = APIRouter()



@router.get('/api/doctor/me')
async def get_current_doctor_profile(db: AsyncSession=Depends(get_db), current_user: models.User=Depends(require_role("doctor", "admin"))):
    """
    Recupera el perfil del médico autenticado (Fila 20 / Fila 26).
    """
    from sqlalchemy.future import select
    current_user_id = current_user.id
    result = await db.execute(select(models.SpecialistProfile).where(models.SpecialistProfile.user_id == current_user_id))
    profile = result.scalars().first()

    if not profile:
        # Sin perfil aún: se devuelve un perfil mínimo y honesto (nunca datos inventados ni "verificado").
        raw_name = current_user.username or ""
        clean_name = raw_name if raw_name.lower().startswith("dr") else f"Dr. {raw_name.capitalize()}"
        return {
            "user_id": current_user_id,
            "full_name": clean_name,
            "specialty": "",
            "license_number": "",
            "city": "",
            "location": "",
            "photo_url": None,
            "is_verified": False,
            "experience_years": 0,
            "bio": ""
        }

    photo = profile.photo_url or profile.profile_pic_url
    if photo and s3_client and not photo.startswith('http'):
        try:
            photo = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': R2_BUCKET_NAME, 'Key': photo},
                ExpiresIn=86400
            )
        except Exception as err:
            logger.warning(f"Error generating presigned url for doctor profile: {err}")

    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name or "Dr. Alejandro Ruiz",
        "specialty": profile.specialty or "Médico",
        "license_number": profile.license_number or "",
        "city": profile.city or profile.location or "",
        "location": profile.location or profile.city or "",
        "photo_url": photo or None,
        "is_verified": bool(profile.is_verified or profile.verified),
        "experience_years": profile.experience_years or 0,
        "bio": profile.bio or ""
    }


@router.get('/api/doctor/patients')
async def get_all_patients(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(security.require_verified_doctor)
):
    """
    Lista los pacientes del médico (con al menos una cita con él) y su triaje más reciente.
    Los administradores ven todos. Solución a N+1 mediante consulta agrupada.
    """
    stmt = select(models.PatientProfile)
    if current_user.role != "admin":
        stmt = stmt.where(models.PatientProfile.user_id.in_(await security.get_doctor_patient_ids(db, current_user)))
    result = await db.execute(stmt)
    patients = result.scalars().all()
    if not patients:
        return []

    user_ids = [p.user_id for p in patients if p.user_id]
    
    # Solución al N+1: Consulta única de triajes para todos los pacientes
    all_triages = []
    if user_ids:
        triage_stmt = select(models.TriageSession).where(
            models.TriageSession.user_id.in_(user_ids)
        ).order_by(models.TriageSession.created_at.desc())
        triage_res = await db.execute(triage_stmt)
        all_triages = triage_res.scalars().all()

    # Mapeo en memoria del triaje más reciente por user_id
    latest_triages = {}
    for t in all_triages:
        if t.user_id not in latest_triages:
            latest_triages[t.user_id] = t

    response = []
    for p in patients:
        latest_triage = latest_triages.get(p.user_id)
        category = 'Ninguno'
        if latest_triage and latest_triage.category:
            cat = latest_triage.category.lower()
            if any(w in cat for w in ('rojo', 'emergencia', 'resucitacion', '1', '2')):
                category = 'Rojo'
            elif any(w in cat for w in ('amarillo', 'urgencia', '3')):
                category = 'Amarillo'
            elif any(w in cat for w in ('verde', 'azul', '4', '5')):
                category = 'Verde'
            else:
                category = 'Amarillo'
        response.append({
            'user_id': p.user_id,
            'full_name': p.full_name,
            'date_of_birth': p.date_of_birth,
            'gender': p.gender,
            'triage_category': category,
            'triage_status': latest_triage.status if latest_triage else 'Ninguno'
        })

    def sort_key(p):
        cat = p['triage_category']
        if cat == 'Rojo': return 0
        if cat == 'Amarillo': return 1
        if cat == 'Verde': return 2
        return 3
    response.sort(key=sort_key)
    return response


class AppointmentCreate(BaseModel):
    patient_id: str
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    blood_type: Optional[str] = None
    appointment_date: str # YYYY-MM-DD
    appointment_time: str # HH:MM
    duration_minutes: Optional[int] = 30
    reason: str
    appointment_type: Optional[str] = "presencial"
    status: Optional[str] = "confirmada"
    triage_category: Optional[str] = "Verde"
    notes: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str

@router.api_route('/api/doctor/seed-demo', methods=['GET', 'POST'])
async def trigger_seed_demo(current_user: models.User = Depends(require_role("admin"))):
    """
    Endpoint de administración para poblar la base de datos con datos demo.
    Restringido estrictamente a administradores autenticados.
    """
    try:
        from scripts.seed_demo_doctor import seed_data
        await seed_data()
        return {"status": "ok", "message": "Demo doctor, 15 pacientes y agenda médica poblados con éxito."}
    except Exception as e:
        logger.error(f"Error al ejecutar seed_demo: {e}")
        return {"status": "error", "message": str(e)}


_SCHEDULED_TO_LEGACY_STATUS = {
    "pending": "confirmada",
    "confirmed": "confirmada",
    "completed": "completada",
    "no_show": "cancelada",
    "cancelled": "cancelada",
}
_LEGACY_TO_SCHEDULED_STATUS = {
    "confirmada": models.AppointmentStatus.confirmed,
    "en_espera": models.AppointmentStatus.confirmed,
    "completada": models.AppointmentStatus.completed,
    "cancelada": models.AppointmentStatus.cancelled,
}


def _scheduled_to_legacy(a: "models.ScheduledAppointment", tz_name: Optional[str]) -> dict:
    """Adapta una cita reservada por un paciente (ScheduledAppointment) al formato de la agenda del médico."""
    try:
        tz = ZoneInfo(tz_name or "Europe/Madrid")
    except Exception:
        tz = ZoneInfo("Europe/Madrid")
    start = a.scheduled_at if a.scheduled_at.tzinfo else a.scheduled_at.replace(tzinfo=timezone.utc)
    local = start.astimezone(tz)
    profile = a.patient.patient_profile if a.patient else None
    modality = a.modality.value if hasattr(a.modality, "value") else str(a.modality)
    status_value = a.status.value if hasattr(a.status, "value") else str(a.status)
    return {
        "id": f"s:{a.id}",
        "doctor_id": str(a.doctor_id),
        "patient_id": a.patient_id,
        "patient_name": (profile.full_name if profile and profile.full_name else (a.patient.username if a.patient else "Paciente")),
        "patient_age": None,
        "patient_gender": profile.gender if profile else None,
        "blood_type": profile.blood_type if profile else None,
        "appointment_date": local.strftime("%Y-%m-%d"),
        "appointment_time": local.strftime("%H:%M"),
        "duration_minutes": a.duration_minutes,
        "reason": a.reason or "",
        "appointment_type": "teleconsulta" if modality == "video" else "presencial",
        "status": _SCHEDULED_TO_LEGACY_STATUS.get(status_value, "confirmada"),
        "triage_category": "Verde",
        "notes": a.cancellation_reason,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get('/api/doctor/appointments')
async def get_doctor_appointments(
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_role("doctor", "admin"))
):
    """
    Lista las citas médicas. Los administradores pueden ver todas las citas;
    los médicos únicamente ven las citas asignadas a su identificador o username.
    """
    stmt = select(models.Appointment)
    if current_user.role != "admin":
        allowed_doc_ids = security.doctor_identifiers(current_user)
        stmt = stmt.where(models.Appointment.doctor_id.in_(allowed_doc_ids))

    if date:
        stmt = stmt.where(models.Appointment.appointment_date == date)
    stmt = stmt.order_by(models.Appointment.appointment_date.asc(), models.Appointment.appointment_time.asc())

    result = await db.execute(stmt)
    appointments = result.scalars().all()

    response = [
        {
            "id": a.id,
            "doctor_id": a.doctor_id,
            "patient_id": a.patient_id,
            "patient_name": a.patient_name,
            "patient_age": a.patient_age,
            "patient_gender": a.patient_gender,
            "blood_type": a.blood_type,
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
            "duration_minutes": a.duration_minutes,
            "reason": a.reason,
            "appointment_type": a.appointment_type,
            "status": a.status,
            "triage_category": a.triage_category,
            "notes": a.notes,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in appointments
    ]

    # Citas que los pacientes reservan desde "Especialistas" (tabla ScheduledAppointment)
    if current_user.role != "admin":
        my_profile = await doctor_service.get_my_profile(db, current_user.id)
        if my_profile is not None:
            scheduled = await appointment_service.list_doctor_appointments(db, my_profile.id)
            for sa in scheduled:
                item = _scheduled_to_legacy(sa, my_profile.timezone)
                if date and item["appointment_date"] != date:
                    continue
                response.append(item)
            response.sort(key=lambda x: (x["appointment_date"] or "", x["appointment_time"] or ""))
    return response

@router.post('/api/doctor/appointments')
async def create_doctor_appointment(
    req: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_role("doctor", "admin"))
):
    appt = models.Appointment(
        doctor_id=current_user.id,
        patient_id=req.patient_id,
        patient_name=req.patient_name,
        patient_age=req.patient_age,
        patient_gender=req.patient_gender,
        blood_type=req.blood_type,
        appointment_date=req.appointment_date,
        appointment_time=req.appointment_time,
        duration_minutes=req.duration_minutes or 30,
        reason=req.reason,
        appointment_type=req.appointment_type or "presencial",
        status=req.status or "confirmada",
        triage_category=req.triage_category or "Verde",
        notes=req.notes
    )
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return {
        "id": appt.id,
        "doctor_id": appt.doctor_id,
        "patient_id": appt.patient_id,
        "patient_name": appt.patient_name,
        "appointment_date": appt.appointment_date,
        "appointment_time": appt.appointment_time,
        "status": appt.status,
        "message": "Cita creada con éxito"
    }

@router.patch('/api/doctor/appointments/{appointment_id}/status')
async def update_appointment_status(
    appointment_id: str,
    req: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(require_role("doctor", "admin"))
):
    if appointment_id.startswith("s:"):
        try:
            sched_id = uuid.UUID(appointment_id[2:])
        except ValueError:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        sched = await appointment_service.get_appointment(db, sched_id)
        my_profile = await doctor_service.get_my_profile(db, current_user.id)
        if not sched or (current_user.role != "admin" and (my_profile is None or sched.doctor_id != my_profile.id)):
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        new_status = _LEGACY_TO_SCHEDULED_STATUS.get(req.status)
        if new_status is None:
            raise HTTPException(status_code=400, detail="Estado no válido")
        sched.status = new_status
        await db.commit()
        return {"id": appointment_id, "status": req.status, "message": f"Estado actualizado a {req.status}"}
    if not appointment_id.isdigit():
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    appointment_id = int(appointment_id)
    result = await db.execute(select(models.Appointment).where(models.Appointment.id == appointment_id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # Verificación estricta de propiedad/ownership de la cita
    if current_user.role != "admin":
        allowed_doc_ids = security.doctor_identifiers(current_user)
        if appt.doctor_id not in allowed_doc_ids:
            raise HTTPException(status_code=403, detail="No tienes autorización para modificar el estado de una cita ajena.")

    appt.status = req.status
    await db.commit()
    await db.refresh(appt)
    return {
        "id": appt.id,
        "status": appt.status,
        "message": f"Estado actualizado a {appt.status}"
    }


class SmartReferralRequest(BaseModel):
    diagnostics: Optional[List[str]] = []
    anomalies: Optional[List[str]] = []
    text_summary: Optional[str] = ""

@router.post('/api/doctor/match-referral')
async def match_referral(req: SmartReferralRequest, db: AsyncSession=Depends(get_db)):
    """
    Derivación Inteligente de Paciente a Especialista (Fila 24).
    Matching algorítmico en tiempo real según anomalías, diagnósticos o texto clínico.
    """
    from services.matching_service import match_specialty_from_clinical_data, get_recommended_specialists
    matching = match_specialty_from_clinical_data(
        diagnostics=req.diagnostics,
        anomalies=req.anomalies,
        summary_text=req.text_summary
    )
    specialists = []
    if matching.get('specialty'):
        specialists = await get_recommended_specialists(db=db, specialty=matching['specialty'], limit=4)
    return {
        "matched": matching.get("matched", False),
        "recommended_specialty": matching.get("specialty", "Medicina General"),
        "urgency": matching.get("urgency", "baja"),
        "reason": matching.get("reason", ""),
        "matched_keywords": matching.get("matched_keywords", []),
        "available_specialists": specialists
    }

@router.post('/api/doctor/ask')
async def ask_doctor_copilot(
    request: DoctorQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(security.require_verified_doctor)
):
    """
    Copiloto Clínico IA para Doctores (Fila 23).
    Responde preguntas sobre el paciente cruzando historial, triajes, medicamentos activos
    y analíticas/documentos con sus valores alterados.
    Requiere autenticación y rol médico o administrador.
    """
    import json
    from sqlalchemy.future import select

    effective_user_id = request.patient_id
    profile_res = (await db.execute(select(models.PatientProfile).where((models.PatientProfile.user_id == request.patient_id))))
    profile = profile_res.scalars().first()
    if not profile and request.patient_id.isdigit():
        profile_res = (await db.execute(select(models.PatientProfile).where(models.PatientProfile.id == int(request.patient_id))))
        profile = profile_res.scalars().first()

    if profile:
        effective_user_id = profile.user_id
    await security.assert_patient_access(db, current_user, effective_user_id)

    # 1. Triajes
    triage_res = (await db.execute(
        select(models.TriageSession)
        .where((models.TriageSession.user_id == effective_user_id))
        .order_by(models.TriageSession.created_at.desc())
    ))
    triages = triage_res.scalars().all()

    # 2. Medicación activa estructurada (Fila 23)
    med_res = (await db.execute(
        select(models.MedicationReminder)
        .where((models.MedicationReminder.user_id == effective_user_id))
        .order_by(models.MedicationReminder.created_at.desc())
    ))
    medications = med_res.scalars().all()

    context_text = f'''[EXPEDIENTE CLÍNICO DE {(profile.full_name if profile else 'PACIENTE DESCONOCIDO')}]
Perfil Demográfico y Vitales:
- Fecha de Nacimiento: {(profile.date_of_birth if profile else 'No especificada')}
- Género: {(profile.gender if profile else 'No especificado')}
- Grupo Sanguíneo: {(profile.blood_type if profile else 'N/A')}
- Altura: {(profile.height if profile else '--')} cm | Peso: {(profile.weight if profile else '--')} kg
- Alergias Registradas: {(profile.allergies if (profile and profile.allergies) else 'Ninguna alergia conocida')}
- Condiciones Crónicas: {(profile.chronic_conditions if (profile and profile.chronic_conditions) else 'Ninguna patología crónica registrada')}
- Medicación Textual en Ficha: {(profile.current_medications if (profile and profile.current_medications) else 'Sin medicación base')}
'''

    if medications:
        context_text += '\n[TRATAMIENTO FARMACOLÓGICO ACTIVO REGISTRADO]\n'
        for m in medications:
            active_str = 'Activo' if getattr(m, 'is_active', True) else 'Pausado'
            context_text += f'''- Fármaco: {m.medication_name} | Dosis: {m.dosage or 'No especificada'} | Frecuencia: {m.frequency or 'Según necesidad'} | Horarios de toma: {m.time_of_day or 'No programado'} | Estado: {active_str}
'''
    else:
        context_text += '\n[TRATAMIENTO FARMACOLÓGICO ACTIVO]: No tiene recordatorios farmacológicos activos en la plataforma.\n'

    context_text += '\n[HISTORIAL DE ORIENTACIONES DE SALUD Y CONSULTAS ASISTIDAS]\n'
    if triages:
        for t in triages:
            context_text += f'''- Fecha: {t.created_at}, Estado: {t.status}, Nivel de atención: {t.category}
'''
            if t.recommended_specialty:
                context_text += f'''  Especialidad sugerida en orientación: {t.recommended_specialty}
'''
            if t.final_report:
                context_text += f'''  Resumen de Orientación: {t.final_report}
'''
    else:
        context_text += '- Sin consultas de orientación previas registradas.\n'

    # 3. Documentos, analíticas y estudios estructurados (Fila 23)
    if profile:
        doc_stmt = select(models.MedicalDocument).where(
            (models.MedicalDocument.patient_id == profile.id),
            (models.MedicalDocument.is_deleted == False)
        ).order_by(models.MedicalDocument.uploaded_at.desc())
        doc_result = (await db.execute(doc_stmt))
        documents = doc_result.scalars().all()
        if documents:
            context_text += '\n[ESTUDIOS, ANALÍTICAS Y DOCUMENTOS CLÍNICOS ADJUNTOS]\n'
            for d in documents:
                doc_type_val = d.document_type.value if hasattr(d.document_type, 'value') else str(d.document_type)
                context_text += f'''\n* Estudio: {d.original_filename} (Tipo: {doc_type_val}, Fecha: {d.uploaded_at})
'''
                if d.extracted_text:
                    try:
                        parsed = json.loads(d.extracted_text)
                        if isinstance(parsed, dict):
                            if parsed.get('severidad'):
                                context_text += f'''  - Nivel de Severidad: {parsed['severidad'].upper()}
'''
                            if parsed.get('diagnosticos'):
                                context_text += f'''  - Diagnósticos Identificados: {', '.join(parsed['diagnosticos'])}
'''
                            anoms = parsed.get('anomalias') or parsed.get('hallazgos')
                            if anoms and isinstance(anoms, list):
                                context_text += f'''  - VALORES ALTERADOS / HALLAZGOS PATOLÓGICOS: {', '.join(anoms)}
'''
                            if parsed.get('medicamentos'):
                                context_text += f'''  - Medicamentos en el documento: {', '.join(parsed['medicamentos'])}
'''
                            if parsed.get('resumen'):
                                context_text += f'''  - Resumen clínico: {parsed['resumen']}
'''
                        else:
                            context_text += f'''  - Contenido: {d.extracted_text[:1200]}
'''
                    except Exception as err:
                        logger.warning(f"Error parsing document extracted_text JSON in copilot: {err}")
                        context_text += f'''  - Contenido: {d.extracted_text[:1200]}
'''
        else:
            context_text += '\n[ESTUDIOS Y DOCUMENTOS]: No hay documentos adjuntos en el expediente.\n'

    system_prompt = f'''Eres un Copiloto Clínico de Inteligencia Artificial de alto nivel, diseñado exclusivamente para asistir a MÉDICOS ESPECIALISTAS en la revisión del expediente de sus pacientes (Fila 23).
El médico te formulará preguntas clínicas sobre el paciente (por ejemplo: valores alterados de laboratorio, medicación pautada, antecedentes, riesgo o sugerencias de derivación).
Tu objetivo es responder con máxima precisión, rigor clínico, concisión y claridad basándote en la información del siguiente expediente.
Si la información requerida no figura en el expediente, acláralo explícitamente sin inventar datos.

{context_text}
'''
    lang_instruction = language_directive(request.language, request.country, 'doctor')

    system_prompt += lang_instruction
    try:
        openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        async def generate():
            response_stream = (await openai_client.chat.completions.create(model='gpt-4o-mini', messages=[{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': request.query}], stream=True))
            async for chunk in response_stream:
                if (chunk.choices and (len(chunk.choices) > 0) and chunk.choices[0].delta.content):
                    (yield chunk.choices[0].delta.content)
        return StreamingResponse(generate(), media_type='text/plain')
    except Exception as e:
        logging.error(f'Doctor Copilot OpenAI Error: {e}')
        return StreamingResponse(iter(['Error: No se pudo procesar la respuesta del modelo de IA. Inténtalo de nuevo en unos minutos.']), media_type='text/plain')




@router.get('/api/specialists')
async def get_specialists(specialty: str=None, city: str=None, db: AsyncSession=Depends(get_db)):
    """
    Recupera la lista de especialistas médicos con perfiles completos y fotos.
    """
    from sqlalchemy import or_
    # Solo médicos verificados aparecen en el directorio público
    stmt = select(models.SpecialistProfile).where(or_(models.SpecialistProfile.verified == True, models.SpecialistProfile.is_verified == True))
    if specialty and specialty.lower() != 'todos':
        stmt = stmt.where(models.SpecialistProfile.specialty.ilike(f'%{specialty}%'))
    if city:
        stmt = stmt.where(or_(
            models.SpecialistProfile.city.ilike(f'%{city}%'),
            models.SpecialistProfile.location.ilike(f'%{city}%')
        ))
    result = (await db.execute(stmt))
    specialists = result.scalars().all()

    output = []
    for s in specialists:
        photo = s.photo_url or s.profile_pic_url
        if photo and s3_client and not photo.startswith('http'):
            try:
                photo = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': R2_BUCKET_NAME, 'Key': photo},
                    ExpiresIn=86400
                )
            except Exception as err:
                logger.warning(f"Error generating presigned url for specialist directory: {err}")

        presentation_video = getattr(s, 'presentation_video_url', None)
        clinic_video = getattr(s, 'clinic_video_url', None)
        college = getattr(s, 'professional_college', None)
        license_no = getattr(s, 'license_number', None)
        educations_list = getattr(s, 'education', None) or []
        clinic_photos_list = getattr(s, 'clinic_photos', None) or []

        output.append({
            'id': s.id,
            'user_id': s.user_id,
            'full_name': s.full_name,
            'specialty': s.specialty,
            'city': s.city or s.location or '',
            'location': s.location or s.city or '',
            'experience_years': s.experience_years or 0,
            'languages': s.languages or '',
            'bio': s.bio or '',
            'verified': True,
            'photo_url': photo or None,
            'availability_schedule': s.availability_schedule or None,
            'presentation_video_url': presentation_video,
            'clinic_video_url': clinic_video,
            'professional_college': college or None,
            'license_number': license_no or None,
            'educations': educations_list,
            'clinic_photos': clinic_photos_list,
        })

    return output


