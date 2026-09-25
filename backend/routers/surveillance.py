import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import models
from database import get_db
from security import get_current_user, resolve_target_patient_id

logger = logging.getLogger("surveillance")

router = APIRouter(prefix="/api/surveillance", tags=["CaPtyVa Digestive Surveillance & Preventive Calendar"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class DigestiveSurveillanceRequest(BaseModel):
    num_adenomas: int = Field(ge=0, le=50, description="Número total de adenomas o pólipos resecados")
    max_size_mm: float = Field(ge=0.0, le=100.0, description="Tamaño del pólipo más grande en milímetros")
    has_high_grade_dysplasia: bool = Field(default=False, description="Displasia de alto grado confirmada en biopsia")
    has_serrated_ge_10mm: bool = Field(default=False, description="Pólipo serrado sésil >= 10 mm o con displasia")
    piecemeal_resection_ge_20mm: bool = Field(default=False, description="Resección fragmentada (piecemeal) de lesión >= 20 mm")
    histology_type: Optional[str] = Field(default="tubular", description="'tubular', 'tubulovelloso', 'velloso', 'serrado', 'hiperplasico'")
    exam_date: Optional[str] = Field(default=None, description="Fecha de la colonoscopia (YYYY-MM-DD)")


class DigestiveSurveillanceResponse(BaseModel):
    risk_tier: str
    risk_badge: str  # "green", "yellow", "orange", "red"
    interval_years: float
    interval_text: str
    next_recommended_date: Optional[str]
    guideline_source: str
    clinical_justification: str
    action_plan: List[str]
    warning_signs: List[str]


class ScreeningItem(BaseModel):
    id: str
    title: str
    category: str  # "oncology", "cardiovascular", "bone", "vaccine"
    recommended_frequency: str
    target_age_group: str
    status: str  # "al_dia", "pendiente", "proximo", "recomendado"
    status_badge: str  # "green", "amber", "blue"
    description: str
    last_completed_date: Optional[str] = None
    next_due_date: Optional[str] = None


class PreventiveCalendarResponse(BaseModel):
    patient_age: Optional[int]
    patient_gender: Optional[str]
    screenings: List[ScreeningItem]
    vaccines: List[ScreeningItem]
    general_recommendations: List[str]


# ============================================================================
# ALGORITMO CAPTYVA (GUÍAS ESGE 2020 / ASGE / USMSTF)
# ============================================================================

def evaluate_captyva_colonoscopy(
    num_adenomas: int,
    max_size_mm: float,
    has_high_grade_dysplasia: bool,
    has_serrated_ge_10mm: bool,
    piecemeal_resection_ge_20mm: bool,
    exam_date_str: Optional[str] = None
) -> Dict[str, Any]:
    """
    Algoritmo de vigilancia post-polipectomía de colonoscopia según Guías de la
    Sociedad Europea de Endoscopia Gastrointestinal (ESGE 2020) y ASGE/USMSTF.
    """
    exam_d = None
    if exam_date_str:
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try:
                exam_d = datetime.strptime(exam_date_str, fmt).date()
                break
            except ValueError:
                pass
    if not exam_d:
        exam_d = date.today()

    # 1. Resección en fragmentos (Piecemeal) >= 20 mm
    if piecemeal_resection_ge_20mm:
        tier = "Riesgo Especial (Resección Fragmentada)"
        badge = "orange"
        interval = 0.5
        interval_txt = "3 a 6 meses"
        next_d = exam_d + timedelta(days=150)
        justification = (
            "La resección endoscópica fragmentada (piecemeal) de pólipos grandes (>= 20 mm) "
            "conlleva un riesgo de recurrencia local o adenoma residual. Las guías ESGE 2020 "
            "exigen un control endoscópico precoz en 3 a 6 meses para inspeccionar la cicatriz."
        )
        plan = [
            "Programar colonoscopia de control de la cicatriz en 3 a 6 meses.",
            "Utilizar cromoendoscopia virtual o tinción si está disponible en el servicio de Digestivo.",
            "Si la cicatriz está limpia a los 3-6 meses, el siguiente control se realiza a los 12 meses."
        ]

    # 2. Alto riesgo de neoplasia metacrónica
    elif num_adenomas >= 5 or max_size_mm >= 10.0 or has_high_grade_dysplasia or has_serrated_ge_10mm:
        tier = "Alto Riesgo de Neoplasia Colorrectal"
        badge = "red"
        interval = 3.0
        interval_txt = "3 años"
        next_d = exam_d + timedelta(days=365 * 3)
        reasons = []
        if max_size_mm >= 10.0:
            reasons.append(f"adenoma >= 10 mm ({max_size_mm} mm)")
        if has_high_grade_dysplasia:
            reasons.append("displasia de alto grado")
        if num_adenomas >= 5:
            reasons.append(f"múltiples adenomas ({num_adenomas} pólipos)")
        if has_serrated_ge_10mm:
            reasons.append("lesión serrada sésil >= 10 mm")

        justification = (
            f"Presencia de criterios histológicos de alto riesgo según ESGE 2020: {', '.join(reasons)}. "
            f"Existe un incremento en el riesgo de lesiones metacrónicas avanzadas que justifica una "
            f"colonoscopia de vigilancia estricta a los 3 años."
        )
        plan = [
            "Colonoscopia completa de vigilancia recomendada en 3 años.",
            "Mantener preparación intestinal óptima (escala de Boston >= 6) en la próxima exploración.",
            "Si la colonoscopia a los 3 años no presenta adenomas de alto riesgo, el intervalo se amplía a 5 años.",
            "Fomentar dieta rica en fibra vegetal, legumbres y reducción de carnes procesadas."
        ]

    # 3. Bajo riesgo (1 a 4 adenomas tubulares < 10 mm con bajo grado)
    elif num_adenomas >= 1:
        tier = "Bajo Riesgo"
        badge = "green"
        interval = 10.0
        interval_txt = "10 años (o cribado poblacional)"
        next_d = exam_d + timedelta(days=365 * 10)
        justification = (
            f"Pólipos adenomatosos de bajo riesgo ({num_adenomas} adenoma(s) < 10 mm con displasia de bajo grado). "
            f"Los estudios prospectivos demuestran que el riesgo de cáncer en este grupo es similar o inferior "
            f"al de la población general sin pólipos. Las guías ESGE 2020 no recomiendan colonoscopia precoz."
        )
        plan = [
            "Retomar control preventivo o cribado a los 10 años (o test de sangre oculta en heces según programa autonómico/nacional).",
            "No se precisa colonoscopia anticipada si no surgen síntomas digestivos nuevos.",
            "Estilo de vida activo y control de peso corporal."
        ]

    # 4. Exploración sin hallazgos patológicos
    else:
        tier = "Colonoscopia Normal (Sin Pólipos)"
        badge = "green"
        interval = 10.0
        interval_txt = "10 años"
        next_d = exam_d + timedelta(days=365 * 10)
        justification = (
            "Colonoscopia completa y limpia, sin evidencia de adenomas ni lesiones mucosas. "
            "Protección cardiovascular y oncológica prolongada."
        )
        plan = [
            "Próxima revisión preventiva a los 10 años o participación en programas de sangre oculta en heces a partir de los 50 años."
        ]

    warning_signs = [
        "Rectorragia o presencia visible de sangre roja o heces negras (melenas).",
        "Cambio persistente en el ritmo intestinal (diarrea o estreñimiento nuevo de >4 semanas de evolución).",
        "Pérdida de peso involuntaria o dolor abdominal cólico persistente.",
        "Anemia ferropénica no explicada en análisis de sangre."
    ]

    return {
        "risk_tier": tier,
        "risk_badge": badge,
        "interval_years": interval,
        "interval_text": interval_txt,
        "next_recommended_date": next_d.strftime("%Y-%m-%d") if next_d else None,
        "guideline_source": "Guías ESGE 2020 (European Society of Gastrointestinal Endoscopy) / ASGE",
        "clinical_justification": justification,
        "action_plan": plan,
        "warning_signs": warning_signs
    }


# ============================================================================
# ENDPOINTS FASTAPI
# ============================================================================

@router.post("/digestive/evaluate", response_model=DigestiveSurveillanceResponse)
async def evaluate_digestive_surveillance(payload: DigestiveSurveillanceRequest):
    """
    Evalúa el intervalo de vigilancia post-polipectomía de colonoscopia (CaPtyVa)
    aplicando las guías europeas ESGE 2020.
    """
    try:
        res = evaluate_captyva_colonoscopy(
            num_adenomas=payload.num_adenomas,
            max_size_mm=payload.max_size_mm,
            has_high_grade_dysplasia=payload.has_high_grade_dysplasia,
            has_serrated_ge_10mm=payload.has_serrated_ge_10mm,
            piecemeal_resection_ge_20mm=payload.piecemeal_resection_ge_20mm,
            exam_date_str=payload.exam_date
        )
        return DigestiveSurveillanceResponse(**res)
    except Exception as e:
        logger.error(f"Error en evaluación CaPtyVa: {e}")
        raise HTTPException(status_code=500, detail=f"Error en algoritmo de vigilancia: {str(e)}")


@router.get("/calendar", response_model=PreventiveCalendarResponse)
async def get_preventive_calendar(
    patient_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Genera el calendario preventivo consolidado del paciente según su edad, sexo y antecedentes,
    incluyendo cribados oncológicos universales y vacunas recomendadas para adultos mayores.
    """
    target_id = await resolve_target_patient_id(db, current_user, patient_id)

    age = 55
    gender = "male"

    try:
        stmt = select(models.PatientProfile).where(models.PatientProfile.user_id == target_id)
        res = await db.execute(stmt)
        profile = res.scalars().first()
        if profile:
            if profile.gender:
                gender = profile.gender.lower()
            if profile.date_of_birth:
                for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
                    try:
                        dob = datetime.strptime(profile.date_of_birth, fmt)
                        now = datetime.now()
                        age = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
                        break
                    except ValueError:
                        pass
    except Exception as e:
        logger.warning(f"No se pudo cargar perfil para calendario preventivo: {e}")

    is_female = "fem" in gender or "mujer" in gender or gender == "f"

    screenings = []
    vaccines = []

    # 1. Cáncer Colorrectal (Hombres y mujeres 50-74 años)
    if age >= 50:
        screenings.append(ScreeningItem(
            id="screening_colon",
            title="Cribado de Cáncer Colorrectal (FIT / Colonoscopia)",
            category="oncology",
            recommended_frequency="Test de sangre oculta en heces (FIT) bienal o colonoscopia cada 10 años",
            target_age_group="50 a 74 años",
            status="al_dia" if age < 52 else "recomendado",
            status_badge="green" if age < 52 else "amber",
            description="Detección precoz de pólipos y lesiones premalignas en colon y recto."
        ))

    # 2. Cáncer de Mama (Mujeres 45/50 a 69 años)
    if is_female and 45 <= age <= 74:
        screenings.append(ScreeningItem(
            id="screening_breast",
            title="Mamografía Bilateral Preventiva",
            category="oncology",
            recommended_frequency="Cada 2 años",
            target_age_group="45-50 a 69-74 años",
            status="recomendado",
            status_badge="blue",
            description="Cribado poblacional de mama para detección temprana de neoplasias no palpables."
        ))

    # 3. Cáncer de Cérvix (Mujeres 25 a 65 años)
    if is_female and 25 <= age <= 65:
        freq = "Citología cada 3 años (25-34 años)" if age < 35 else "Test de VPH de alto riesgo cada 5 años (35-65 años)"
        screenings.append(ScreeningItem(
            id="screening_cervix",
            title="Cribado de Cérvix (Citología / VPH)",
            category="oncology",
            recommended_frequency=freq,
            target_age_group="25 a 65 años",
            status="al_dia",
            status_badge="green",
            description="Prevención y detección temprana de lesiones precancerosas asociadas al Virus del Papiloma Humano."
        ))

    # 4. Salud Prostática (Hombres >= 50 años)
    if not is_female and age >= 50:
        screenings.append(ScreeningItem(
            id="screening_prostate",
            title="Revisión Prostática y Antígeno PSA",
            category="oncology",
            recommended_frequency="Cada 1 a 2 años según criterio urológico y nivel basal de PSA",
            target_age_group="50 años en adelante (o 45 si antecedentes)",
            status="recomendado",
            status_badge="blue",
            description="Evaluación de sintomatología miccional y dosificación de PSA sérico total."
        ))

    # 5. Densitometría Ósea (Mujeres >= 65 años o varones >= 70)
    if (is_female and age >= 65) or (not is_female and age >= 70):
        screenings.append(ScreeningItem(
            id="screening_bone",
            title="Densitometría Ósea (DEXA) - Salud Ósea",
            category="bone",
            recommended_frequency="Cada 2 a 3 años según score T",
            target_age_group="Mujeres >= 65 años, Varones >= 70 años",
            status="pendiente",
            status_badge="amber",
            description="Evaluación de densidad mineral ósea y riesgo de fracturas por fragilidad / osteoporosis."
        ))

    # 6. Vacunación Sénior
    if age >= 60:
        vaccines.append(ScreeningItem(
            id="vac_flu",
            title="Vacunación Antigripal Estacional",
            category="vaccine",
            recommended_frequency="Anual (campaña de otoño)",
            target_age_group="Mayores de 60 años y grupos de riesgo",
            status="recomendado",
            status_badge="blue",
            description="Inmunización contra los subtipos de gripe circulantes recomendados por la OMS."
        ))

    if age >= 65:
        vaccines.append(ScreeningItem(
            id="vac_pneumo",
            title="Vacunación Antineumocócica (Neumococo)",
            category="vaccine",
            recommended_frequency="Pauta conjugada según protocolo del sistema de salud",
            target_age_group="Mayores de 65 años",
            status="al_dia",
            status_badge="green",
            description="Protección frente a neumonía bacterémica e infecciones invasivas por Streptococcus pneumoniae."
        ))

    if age >= 65:
        vaccines.append(ScreeningItem(
            id="vac_zoster",
            title="Vacuna frente al Herpes Zóster",
            category="vaccine",
            recommended_frequency="Pauta de 2 dosis (meses 0 y 2-6)",
            target_age_group="Mayores de 65 años (o 50 con inmunosupresión)",
            status="recomendado",
            status_badge="amber",
            description="Prevención de la neuralgia posherpética y reactivaciones del virus varicela-zóster."
        ))

    general_recs = [
        "Comenta con tu médico de cabecera la conveniencia de estos controles según tu historial individual.",
        "Si tienes antecedentes familiares de primer grado de cáncer de colon o mama, los cribados se inician 10 años antes.",
        "Mantén al día tu registro de vacunas y analíticas en MIVOR.ai para recibir alertas anticipadas."
    ]

    return PreventiveCalendarResponse(
        patient_age=age,
        patient_gender="Femenino" if is_female else "Masculino",
        screenings=screenings,
        vaccines=vaccines,
        general_recommendations=general_recs
    )
