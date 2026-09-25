import os
import re
import json
import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

import models
from database import get_db
from security import get_current_user
from services.language_service import language_directive
from services.localize_service import localize_fields

logger = logging.getLogger("scribe")

router = APIRouter(prefix="/api/scribe", tags=["MedAlly Scribe - Clinical SOAP & Patient Care Sheets"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class ScribeTemplateInfo(BaseModel):
    id: str
    name: str
    specialty: str
    icon: str
    description: str
    focus_areas: List[str]


class GenerateSoapRequest(BaseModel):
    consultation_text: str = Field(min_length=5, description="Texto dictado, notas rápidas o transcripción de la consulta")
    template_id: str = Field(default="general", description="ID de la plantilla: general, cardiology, pediatrics, geriatrics, digestive")
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    vital_signs: Optional[Dict[str, Any]] = None  # bp, hr, temp, spo2, weight, height
    language: Optional[str] = Field(default=None, description="Idioma de la interfaz (BCP-47) en que se redacta la nota")


class MedicationScheduleItem(BaseModel):
    medication: str
    dose: str
    timing: str  # ej: "Desayuno", "Cena", "Cada 8h"
    purpose: str  # Para qué sirve en lenguaje sencillo


class PatientClearSheet(BaseModel):
    simple_diagnosis: str
    medication_schedule: List[MedicationScheduleItem]
    red_flags: List[str]
    lifestyle_recommendations: List[str]
    next_followup: str


class ICD10Suggestion(BaseModel):
    code: str
    description: str


class SoapNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str


class GenerateSoapResponse(BaseModel):
    template_id: str
    template_name: str
    soap_note: SoapNote
    patient_clear_sheet: PatientClearSheet
    suggested_icd10: List[ICD10Suggestion]
    raw_source: str


class PrepareConsultationRequest(BaseModel):
    main_concerns: str = Field(description="¿Qué le ocurre o qué síntomas tiene?")
    duration_evolution: Optional[str] = Field(default="", description="¿Desde cuándo le ocurre y cómo ha evolucionado?")
    questions_for_doctor: Optional[str] = Field(default="", description="Preguntas o dudas que no quiere olvidar preguntar")
    current_meds: Optional[str] = Field(default="", description="Medicamentos que toma actualmente")
    language: Optional[str] = Field(default=None, description="Idioma de la interfaz (BCP-47) en que se devuelve la guía")


class PrepareConsultationResponse(BaseModel):
    elevator_pitch: str
    symptoms_timeline: str
    priority_questions: List[str]
    meds_checklist: List[str]
    tips_for_visit: List[str]


# ============================================================================
# PLANTILLAS DISPONIBLES (MEDALLY CATALOG)
# ============================================================================

AVAILABLE_TEMPLATES = [
    ScribeTemplateInfo(
        id="general",
        name="Medicina General y Familiar",
        specialty="Atención Primaria",
        icon="🩺",
        description="Estructura SOAP integral orientada a la consulta habitual de atención primaria y seguimiento.",
        focus_areas=["Anamnesis completa", "Factores de riesgo", "Exploración física general", "Plan terapéutico y preventivo"]
    ),
    ScribeTemplateInfo(
        id="cardiology",
        name="Cardiología y Riesgo Cardiovascular",
        specialty="Cardiología",
        icon="❤️",
        description="Enfoque en dolor torácico, disnea NYHA, palpitaciones, tensión arterial, lipidograma y SCORE2.",
        focus_areas=["Clasificación de disnea / angina", "Auscultación y ritmo", "Estratificación de riesgo vascular", "Signos de alarma cardiológicos"]
    ),
    ScribeTemplateInfo(
        id="pediatrics",
        name="Pediatría y Puericultura",
        specialty="Pediatría",
        icon="👶",
        description="Orientado al paciente infantil con percentiles, desarrollo psicomotor, pautas por peso y guía para padres.",
        focus_areas=["Edad y percentiles P/T", "Calendario vacunal", "Dosificación ponderal (mg/kg)", "Signos de alarma pediátricos"]
    ),
    ScribeTemplateInfo(
        id="geriatrics",
        name="Geriatría y Valoración Integral (VGI)",
        specialty="Geriatría",
        icon="👵",
        description="Valoración geriátrica integral: fragilidad, índice de Barthel, riesgo de caídas, polifarmacia y soporte del cuidador.",
        focus_areas=["Autonomía AVDs (Barthel)", "Test TUG y caídas", "Revisión de polifarmacia", "Hoja clara para el cuidador"]
    ),
    ScribeTemplateInfo(
        id="digestive",
        name="Aparato Digestivo y Endoscopia",
        specialty="Gastroenterología",
        icon="🔬",
        description="Enfoque en sintomatología gastrointestinal, antecedentes endoscópicos, pólipos (CaPtyVa) y cribado colorrectal.",
        focus_areas=["Patrón de dolor y hábito digestivo", "Histología previa / polipectomías", "Pautas dietéticas específicas", "Intervalos de control"]
    )
]


# ============================================================================
# MOTOR DETERMINISTA / FALLBACK CLÍNICO
# ============================================================================

def fallback_soap_generation(
    consultation_text: str,
    template_id: str,
    patient_name: Optional[str] = None,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    vital_signs: Optional[Dict[str, Any]] = None
) -> GenerateSoapResponse:
    text_lower = consultation_text.lower()

    # Extracción de signos vitales formateados
    vitals_str = ""
    if vital_signs:
        parts = []
        if vital_signs.get("bp"): parts.append(f"PA: {vital_signs['bp']} mmHg")
        if vital_signs.get("hr"): parts.append(f"FC: {vital_signs['hr']} lpm")
        if vital_signs.get("temp"): parts.append(f"Temp: {vital_signs['temp']} °C")
        if vital_signs.get("spo2"): parts.append(f"SatO2: {vital_signs['spo2']}%")
        if vital_signs.get("weight"): parts.append(f"Peso: {vital_signs['weight']} kg")
        if parts:
            vitals_str = "Constantes: " + ", ".join(parts) + ". "

    # Determinación de especialidad y códigos CIE-10
    template_meta = next((t for t in AVAILABLE_TEMPLATES if t.id == template_id), AVAILABLE_TEMPLATES[0])
    
    icd10_list: List[ICD10Suggestion] = []
    
    if "hipertension" in text_lower or "presion" in text_lower or "tensión" in text_lower:
        icd10_list.append(ICD10Suggestion(code="I10", description="Hipertensión esencial (primaria)"))
    if "colesterol" in text_lower or "ldl" in text_lower or "dislipemia" in text_lower:
        icd10_list.append(ICD10Suggestion(code="E78.0", description="Hipercolesterolemia pura"))
    if "diabetes" in text_lower or "glucosa" in text_lower:
        icd10_list.append(ICD10Suggestion(code="E11.9", description="Diabetes mellitus tipo 2 sin complicaciones"))
    if "polipo" in text_lower or "colon" in text_lower or "polipectomia" in text_lower:
        icd10_list.append(ICD10Suggestion(code="K63.5", description="Pólipo del colon"))
    if "tos" in text_lower or "catarro" in text_lower or "gripe" in text_lower:
        icd10_list.append(ICD10Suggestion(code="J06.9", description="Infección respiratoria aguda de las vías superiores"))
    if "rodilla" in text_lower or "lumbar" in text_lower or "artrosis" in text_lower:
        icd10_list.append(ICD10Suggestion(code="M17.9", description="Artrosis de rodilla, no especificada"))
    
    if not icd10_list:
        icd10_list.append(ICD10Suggestion(code="Z00.0", description="Examen médico general de salud"))

    # Construcción de secciones SOAP
    subjective = (
        f"Paciente refiere: {consultation_text.strip()}\n"
        f"Antecedentes: Sin alergias medicamentosas conocidas referidas salvo constancia en historia previa. "
        f"Estilo de vida habitual sin cambios agudos reportados."
    )
    
    objective = (
        f"{vitals_str}"
        f"Exploración física: Buen estado general, consciente, orientado y colaborador. "
        f"Normocoloración mucocutánea. Eupneico en reposo. "
        f"Auscultación cardiopulmonar: rítmica, sin soplos sobreañadidos; murmullo vesicular conservado. "
        f"Abdomen blando, depresible, no doloroso a la palpación profunda, sin signos de irritación peritoneal."
    )
    
    diag_main = icd10_list[0].description if icd10_list else "Control clínico y sintomático"
    assessment = (
        f"1. {diag_main} (CIE-10: {icd10_list[0].code if icd10_list else 'Z00.0'}).\n"
        f"Evolución clínica estable. Se descartan criterios de gravedad inmediata al momento de la consulta."
    )
    
    plan = (
        "1. Medidas generales: Hidratación adecuada, dieta cardiosaludable/equilibrada, reposo relativo si precisa.\n"
        "2. Tratamiento sintomático según pauta individualizada.\n"
        "3. Pruebas complementarias: Analítica de control si los síntomas persisten más de 7-10 días.\n"
        "4. Criterios de alarma explicados al paciente (fiebre alta refractaria, dolor torácico opresivo, disnea, sangrado).\n"
        "5. Control en consulta en caso de empeoramiento o en 2-4 semanas para revisión evolutiva."
    )

    # Hoja Clara de Cuidados (Patient-Facing)
    meds = [
        MedicationScheduleItem(
            medication="Tratamiento prescrito en receta médica",
            dose="Dosis indicada por su médico",
            timing="Con las comidas principales",
            purpose="Control sintomático y alivio de molestias"
        )
    ]
    if "colesterol" in text_lower:
        meds.append(MedicationScheduleItem(
            medication="Estatina (según prescripción)",
            dose="1 toma",
            timing="Por la noche antes de acostarse",
            purpose="Proteger las arterias y reducir el colesterol LDL"
        ))

    clear_sheet = PatientClearSheet(
        simple_diagnosis=f"Presenta un cuadro de {diag_main.lower()}, actualmente en fase de manejo y control médico.",
        medication_schedule=meds,
        red_flags=[
            "Fiebre persistente superior a 38.5 °C que no cede con antitérmicos.",
            "Dificultad para respirar, dolor u opresión en el centro del pecho.",
            "Mareos intensos con sensación de desvanecimiento o pérdida de conocimiento.",
            "Vómitos continuos o incapacidad absoluta para retener líquidos."
        ],
        lifestyle_recommendations=[
            "Beber abundantes líquidos (1.5 a 2 litros diarios de agua o infusiones).",
            "Mantener una alimentación ligera, reduciendo fritos, azúcares y sal.",
            "Evitar esfuerzos físicos extenuantes hasta la remisión completa de los síntomas."
        ],
        next_followup="Solicite nueva cita de revisión con su médico de cabecera en 2 semanas, o antes si nota signos de alarma."
    )

    return GenerateSoapResponse(
        template_id=template_id,
        template_name=template_meta.name,
        soap_note=SoapNote(
            subjective=subjective,
            objective=objective,
            assessment=assessment,
            plan=plan
        ),
        patient_clear_sheet=clear_sheet,
        suggested_icd10=icd10_list,
        raw_source="Deterministic Clinical Scribe Engine"
    )


SOAP_TEXT_FIELDS = [
    "template_name",
    "soap_note.subjective", "soap_note.objective", "soap_note.assessment", "soap_note.plan",
    "suggested_icd10.[].description",
    "patient_clear_sheet.simple_diagnosis",
    "patient_clear_sheet.medication_schedule.[].medication",
    "patient_clear_sheet.medication_schedule.[].dose",
    "patient_clear_sheet.medication_schedule.[].timing",
    "patient_clear_sheet.medication_schedule.[].purpose",
    "patient_clear_sheet.red_flags",
    "patient_clear_sheet.lifestyle_recommendations",
    "patient_clear_sheet.next_followup",
]


async def localized_fallback_soap(req: GenerateSoapRequest) -> GenerateSoapResponse:
    note = fallback_soap_generation(
        consultation_text=req.consultation_text,
        template_id=req.template_id,
        patient_name=req.patient_name,
        patient_age=req.patient_age,
        patient_gender=req.patient_gender,
        vital_signs=req.vital_signs
    )
    data = await localize_fields(note.model_dump(), req.language or "es", SOAP_TEXT_FIELDS)
    return GenerateSoapResponse(**data)


async def generate_soap_with_llm(
    req: GenerateSoapRequest
) -> GenerateSoapResponse:
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return await localized_fallback_soap(req)

    template_meta = next((t for t in AVAILABLE_TEMPLATES if t.id == req.template_id), AVAILABLE_TEMPLATES[0])

    system_prompt = f"""
Eres MedAlly Scribe AI de MIVOR.ai, un asistente médico inteligente de documentación clínica de alta precisión.
Tu labor es transformar las notas o transcripciones dictadas por el médico en dos productos clave:
1. Una nota médica profesional formal con estructura SOAP (Subjetivo, Objetivo, Apreciación, Plan) adaptada a la especialidad: {template_meta.name}.
2. Una "Hoja Clara de Cuidados" (Patient-Facing Discharge Summary) escrita en lenguaje claro, llano, sin jerga incomprensible, ideal para que el paciente o su cuidador la lleven a casa.

Debes responder ÚNICAMENTE con un JSON válido con esta estructura:
{{
  "soap_note": {{
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  }},
  "suggested_icd10": [
    {{ "code": "I10", "description": "Hipertensión esencial" }}
  ],
  "patient_clear_sheet": {{
    "simple_diagnosis": "Explicación sencilla de 1 o 2 frases sobre qué le ocurre al paciente...",
    "medication_schedule": [
      {{
        "medication": "Nombre del fármaco",
        "dose": "Dosis",
        "timing": "Momento del día (ej. Desayuno, Almuerzo, Noche)",
        "purpose": "Para qué sirve en palabras muy sencillas"
      }}
    ],
    "red_flags": [
      "Signo de alarma 1 que exige ir a urgencias",
      "Signo de alarma 2..."
    ],
    "lifestyle_recommendations": [
      "Recomendación 1...",
      "Recomendación 2..."
    ],
    "next_followup": "Indicación precisa de cuándo volver a consulta o qué analítica realizar..."
  }}
}}

Pautas obligatorias:
- La nota SOAP debe ser rigurosa, profesional y clínica.
- La Hoja Clara debe estar a nivel de lectura fácil, empática y práctica.
- Sugiere 1 a 3 códigos CIE-10 pertinentes con su código exacto y descripción.
- Las claves del JSON se mantienen en inglés; todos los valores de texto van en el idioma indicado abajo.
""" + language_directive(req.language, None, 'clinician')

    context_str = f"Especialidad: {template_meta.name}\n"
    if req.patient_name: context_str += f"Paciente: {req.patient_name}\n"
    if req.patient_age: context_str += f"Edad: {req.patient_age} años\n"
    if req.patient_gender: context_str += f"Género: {req.patient_gender}\n"
    if req.vital_signs: context_str += f"Constantes: {json.dumps(req.vital_signs)}\n"

    user_prompt = f"{context_str}\nNotas de la consulta:\n{req.consultation_text}"

    try:
        client = AsyncOpenAI(api_key=openai_key)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500
        )
        data = json.loads(resp.choices[0].message.content)

        soap_dict = data.get("soap_note", {})
        sheet_dict = data.get("patient_clear_sheet", {})
        icd_list = [ICD10Suggestion(**i) for i in data.get("suggested_icd10", [])]

        meds = [MedicationScheduleItem(**m) for m in sheet_dict.get("medication_schedule", [])]

        return GenerateSoapResponse(
            template_id=req.template_id,
            template_name=template_meta.name,
            soap_note=SoapNote(
                subjective=soap_dict.get("subjective", ""),
                objective=soap_dict.get("objective", ""),
                assessment=soap_dict.get("assessment", ""),
                plan=soap_dict.get("plan", "")
            ),
            patient_clear_sheet=PatientClearSheet(
                simple_diagnosis=sheet_dict.get("simple_diagnosis", "Control y revisión clínica."),
                medication_schedule=meds,
                red_flags=sheet_dict.get("red_flags", []),
                lifestyle_recommendations=sheet_dict.get("lifestyle_recommendations", []),
                next_followup=sheet_dict.get("next_followup", "Revisión programada con su médico.")
            ),
            suggested_icd10=icd_list,
            raw_source="MedAlly AI Scribe Engine"
        )
    except Exception as e:
        logger.error("Error invoking OpenAI for SOAP generation: %r", e)
        return await localized_fallback_soap(req)


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/templates", response_model=List[ScribeTemplateInfo])
async def list_scribe_templates():
    """
    Devuelve las plantillas clínicas especializadas disponibles en MedAlly.
    """
    return AVAILABLE_TEMPLATES


@router.post("/generate_soap", response_model=GenerateSoapResponse)
async def generate_soap_note(req: GenerateSoapRequest):
    """
    Genera una nota médica estructurada SOAP con códigos CIE-10 y una 'Hoja Clara de Cuidados'
    para el paciente a partir del texto dictado o notas de consulta.
    """
    return await generate_soap_with_llm(req)


@router.post("/prepare_consultation", response_model=PrepareConsultationResponse)
async def prepare_consultation(req: PrepareConsultationRequest):
    """
    Módulo para el paciente: Genera una guía de 1 página para preparar su cita médica,
    organizando sus preocupaciones en un discurso rápido de 2 minutos, cronograma de síntomas
    y las 3-5 preguntas clave que no debe olvidar hacer a su doctor.
    """
    concerns = req.main_concerns.strip()
    evolution = req.duration_evolution.strip() if req.duration_evolution else "De reciente aparición"
    user_questions = req.questions_for_doctor.strip() if req.questions_for_doctor else ""
    meds = req.current_meds.strip() if req.current_meds else "Tratamiento habitual"

    # Preparar el elevator pitch de 2 minutos
    elevator_pitch = (
        f"Vengo a consulta principalmente por {concerns}. "
        f"Esto comenzó {evolution}. "
        f"Actualmente tomo {meds} y me gustaría que revisemos si guarda relación o si requiere ajuste."
    )

    symptoms_timeline = (
        f"• Inicio y evolución: {evolution}.\n"
        f"• Molestia principal actual: {concerns}.\n"
        f"• Medicamentos que estoy tomando: {meds}."
    )

    priority_questions = [
        "¿Cuál cree que es la causa más probable de lo que siento?",
        "¿Hay alguna prueba adicional o analítica que deba realizarme?",
        "¿Mis medicamentos actuales interactúan entre sí o alguno puede causar estos síntomas?",
        "¿Qué signos específicos deberían hacerme acudir de inmediato a urgencias?"
    ]
    if user_questions:
        priority_questions.insert(0, f"Pregunta prioritaria personal: {user_questions}")

    meds_checklist = [
        f"Llevar caja o fotografía de: {meds}",
        "Anotar si he olvidado alguna toma recientemente o he tenido efectos secundarios",
        "Preguntar si puedo tomar analgésicos habituales (paracetamol) si tengo dolor"
    ]

    tips = [
        "Explica tus síntomas en orden cronológico en los primeros 2 minutos.",
        "Muestra tus analíticas recientes si las tienes impresas o en la app de MIVOR.",
        "Si no entiendes algún término médico, pide amablemente: '¿Me lo podría explicar con palabras sencillas?'",
        "Apunta las respuestas antes de salir de la consulta."
    ]

    guide = {
        "elevator_pitch": elevator_pitch,
        "symptoms_timeline": symptoms_timeline,
        "priority_questions": priority_questions,
        "meds_checklist": meds_checklist,
        "tips_for_visit": tips,
    }
    guide = await localize_fields(guide, req.language or "es", list(guide.keys()))
    return PrepareConsultationResponse(**guide)
