import logging
import math
import re
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

import models
from database import get_db
from security import get_current_user, resolve_target_patient_id

logger = logging.getLogger("clinical_calculators")

router = APIRouter(prefix="/api/calculators", tags=["Clinical Calculators & Decision Support"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class Score2Request(BaseModel):
    age: int = Field(ge=40, le=89, description="Edad del paciente (40-89 años)")
    gender: str = Field(description="'male'/'hombre' o 'female'/'mujer'")
    systolic_bp: float = Field(ge=90, le=220, description="Presión arterial sistólica en mmHg")
    is_smoker: bool = Field(description="Fumador activo")
    total_cholesterol: float = Field(ge=100, le=450, description="Colesterol total en mg/dL")
    hdl_cholesterol: float = Field(ge=15, le=140, description="Colesterol HDL en mg/dL")
    region: Optional[str] = Field(default="moderate", description="'low', 'moderate', 'high' o 'very_high'")


class Score2Response(BaseModel):
    risk_percentage: float
    risk_category: str
    risk_badge: str  # "green", "yellow", "orange", "red"
    is_score2_op: bool
    non_hdl_cholesterol: float
    interpretation: str
    clinical_guidance: List[str]


class LdlGapRequest(BaseModel):
    current_ldl: float = Field(ge=10, le=500, description="Nivel actual de c-LDL en mg/dL")
    risk_category: str = Field(description="'Bajo', 'Moderado', 'Alto', 'Muy Alto' o 'Extremo'")
    has_prior_ascvd: Optional[bool] = False
    has_diabetes: Optional[bool] = False
    has_ckd: Optional[bool] = False
    on_statin: Optional[bool] = False


class LdlGapResponse(BaseModel):
    current_ldl: float
    target_ldl: float
    ldl_gap: float
    reduction_pct_needed: float
    at_target: bool
    target_badge: str
    suggested_intensity: str
    clinical_strategy: str
    educational_note: str
    evidence_reference: str


class CkdEpiRequest(BaseModel):
    creatinine: float = Field(ge=0.2, le=25.0, description="Creatinina sérica en mg/dL")
    age: int = Field(ge=18, le=115, description="Edad en años")
    gender: str = Field(description="'male'/'hombre' o 'female'/'mujer'")


class CkdEpiResponse(BaseModel):
    egfr: float
    stage: str  # "G1", "G2", "G3a", "G3b", "G4", "G5"
    stage_label: str
    badge_color: str
    clinical_interpretation: str
    follow_up_recommendation: str


class FragilityTugRequest(BaseModel):
    tug_seconds: Optional[float] = Field(None, ge=1.0, le=120.0, description="Segundos en prueba Timed Up and Go")
    barthel_score: Optional[int] = Field(None, ge=0, le=100, description="Índice de Barthel (0 a 100)")
    age: Optional[int] = None
    history_of_falls: Optional[bool] = False


class FragilityTugResponse(BaseModel):
    overall_fall_risk: str  # "Bajo", "Moderado", "Alto"
    risk_badge: str  # "green", "yellow", "red"
    tug_seconds: Optional[float]
    tug_interpretation: Optional[str]
    barthel_score: Optional[int]
    barthel_dependency: Optional[str]
    suggested_actions: List[str]


class AutoFillResponse(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    is_smoker: Optional[bool] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    total_cholesterol: Optional[float] = None
    hdl_cholesterol: Optional[float] = None
    current_ldl: Optional[float] = None
    triglycerides: Optional[float] = None
    creatinine: Optional[float] = None
    glucose: Optional[float] = None
    data_sources: List[str] = []


# ============================================================================
# MATEMÁTICAS & ALGORITMOS CLÍNICOS
# ============================================================================

def _is_female_str(gender_str: str) -> bool:
    g = (gender_str or "").strip().lower()
    return g in ["female", "mujer", "f", "femenino"]


def calculate_score2_internal(
    age: int,
    is_female: bool,
    is_smoker: bool,
    systolic_bp: float,
    total_chol_mg: float,
    hdl_mg: float,
    region: str = "moderate"
) -> Dict[str, Any]:
    """
    Algoritmo SCORE2 (40-69 años) y SCORE2-OP (70-89 años) según Guías ESC 2021.
    Calcula el riesgo a 10 años de eventos cardiovasculares mortales y no mortales
    (infarto de miocardio, ictus o muerte cardiovascular).
    """
    non_hdl_mg = max(total_chol_mg - hdl_mg, 30.0)
    non_hdl_mmol = non_hdl_mg / 38.67

    is_op = age >= 70

    if not is_op:
        # Modelo SCORE2 (40-69 años)
        age_c = (age - 60.0) / 10.0
        sbp_c = (systolic_bp - 120.0) / 20.0
        non_hdl_c = (non_hdl_mmol - 4.0)
        smk_c = 1.0 if is_smoker else 0.0

        if is_female:
            lp = 0.528 * age_c + 0.368 * sbp_c + 0.178 * non_hdl_c + 0.584 * smk_c - 0.08 * (age_c * smk_c)
            base_s = 0.970 if region == "low" else 0.958
        else:
            lp = 0.495 * age_c + 0.324 * sbp_c + 0.145 * non_hdl_c + 0.498 * smk_c - 0.07 * (age_c * smk_c)
            base_s = 0.950 if region == "low" else 0.932

        risk = (1.0 - (base_s ** (math.exp(lp)))) * 100.0
    else:
        # Modelo SCORE2-OP (70-89 años)
        age_c = (age - 75.0) / 10.0
        sbp_c = (systolic_bp - 140.0) / 20.0
        non_hdl_c = (non_hdl_mmol - 4.0)
        smk_c = 1.0 if is_smoker else 0.0

        if is_female:
            lp = 0.380 * age_c + 0.220 * sbp_c + 0.120 * non_hdl_c + 0.350 * smk_c
            base_s = 0.880 if region == "low" else 0.840
        else:
            lp = 0.350 * age_c + 0.210 * sbp_c + 0.110 * non_hdl_c + 0.320 * smk_c
            base_s = 0.820 if region == "low" else 0.770

        risk = (1.0 - (base_s ** (math.exp(lp)))) * 100.0

    risk_pct = round(max(0.5, min(risk, 75.0)), 1)

    # Categorización por estratos de edad según guías ESC 2021
    if age < 50:
        if risk_pct < 2.5:
            cat = "Bajo"
            badge = "green"
        elif risk_pct < 7.5:
            cat = "Moderado"
            badge = "yellow"
        else:
            cat = "Alto"
            badge = "red"
    elif age < 70:
        if risk_pct < 5.0:
            cat = "Bajo"
            badge = "green"
        elif risk_pct < 10.0:
            cat = "Moderado"
            badge = "yellow"
        else:
            cat = "Alto"
            badge = "red"
    else:
        # SCORE2-OP en mayores de 70
        if risk_pct < 7.5:
            cat = "Bajo"
            badge = "green"
        elif risk_pct < 15.0:
            cat = "Moderado"
            badge = "yellow"
        else:
            cat = "Alto"
            badge = "red"

    if cat == "Bajo":
        interpretation = "Riesgo cardiovascular estimado bajo a 10 años. Se recomienda promover hábitos de vida cardiosaludables."
        guidance = [
            "Mantener dieta mediterránea rica en vegetales, legumbres y frutos secos.",
            "Realizar al menos 150-300 minutos de actividad física aeróbica moderada por semana.",
            "Revisión periódica de presión arterial y perfil lipídico cada 3 a 5 años."
        ]
    elif cat == "Moderado":
        interpretation = "Riesgo cardiovascular moderado a 10 años. Conviene evaluar con el médico la optimización del estilo de vida e intensificación preventiva."
        guidance = [
            "Reforzar control de peso y restricción de sodio (<5 g/día).",
            "Monitoreo anual de presión arterial y analítica lipídica.",
            "Valorar con el profesional sanitario la meta específica de c-LDL (< 100 mg/dL)."
        ]
    else:
        interpretation = "Riesgo cardiovascular elevado a 10 años. Se sugiere consulta prioritaria con el médico para evaluación exhaustiva y tratamiento farmacológico personalizado."
        guidance = [
            "Consulta médica prioritaria para instaurar o ajustar terapia hipolipemiante y antihipertensiva.",
            "Si es fumador, el cese tabáquico inmediato es la medida preventiva de mayor impacto.",
            "Meta de c-LDL sugerida por guías europeas: < 70 mg/dL o < 55 mg/dL con reducción mínima del 50%."
        ]

    return {
        "risk_percentage": risk_pct,
        "risk_category": cat,
        "risk_badge": badge,
        "is_score2_op": is_op,
        "non_hdl_cholesterol": round(non_hdl_mg, 1),
        "interpretation": interpretation,
        "clinical_guidance": guidance
    }


def calculate_ckd_epi_internal(creatinine_mg_dl: float, age: int, is_female: bool) -> Dict[str, Any]:
    """
    Ecuación CKD-EPI 2021 (race-free) para el filtrado glomerular estimado (eGFR).
    Publicada por la National Kidney Foundation y la American Society of Nephrology.
    """
    kappa = 0.7 if is_female else 0.9
    alpha = -0.241 if is_female else -0.302
    gender_mult = 1.012 if is_female else 1.000

    scr_k = creatinine_mg_dl / kappa
    egfr = 142.0 * (min(scr_k, 1.0) ** alpha) * (max(scr_k, 1.0) ** -1.200) * (0.9938 ** age) * gender_mult
    egfr_val = round(max(1.0, min(egfr, 180.0)), 1)

    if egfr_val >= 90.0:
        stage = "G1"
        stage_label = "Filtrado glomerular normal o alto"
        badge = "green"
        interp = "Función renal conservada. Sin evidencia de deterioro en la filtración glomerular."
        rec = "Control analítico preventivo habitual según edad y factores de riesgo."
    elif egfr_val >= 60.0:
        stage = "G2"
        stage_label = "Descenso leve del filtrado glomerular"
        badge = "yellow"
        interp = "Discreta reducción fisiológica común con la edad o deshidratación leve. Frecuentemente normal en mayores sin proteinuria."
        rec = "Mantener adecuada hidratación, evitar el abuso de AINEs (ibuprofeno, naproxeno) y revisar en 12 meses."
    elif egfr_val >= 45.0:
        stage = "G3a"
        stage_label = "Descenso leve a moderado (G3a)"
        badge = "orange"
        interp = "Deterioro moderado de la función de filtrado. Conviene descartar microalbuminuria y vigilar fármacos de eliminación renal."
        rec = "Consultar con el médico de atención primaria. Monitorizar cada 6 meses, ajustar dosis de fármacos y controlar tensión arterial."
    elif egfr_val >= 30.0:
        stage = "G3b"
        stage_label = "Descenso moderado a severo (G3b)"
        badge = "orange"
        interp = "Compromiso renal relevante que requiere seguimiento médico estrecho y control estricto de factores metabólicos."
        rec = "Seguimiento médico estrecho. Control de proteinuria, metabolismo fósforo-calcio y anemia. Revisión cada 3-4 meses."
    elif egfr_val >= 15.0:
        stage = "G4"
        stage_label = "Descenso severo del filtrado glomerular"
        badge = "red"
        interp = "Insuficiencia renal avanzada. Requiere valoración especializada por Nefrología y preparación de cuidados renales integrales."
        rec = "Derivación urgente a Nefrología. Evitar contrastes yodados y medicamentos nefrotóxicos."
    else:
        stage = "G5"
        stage_label = "Fallo renal terminal"
        badge = "purple"
        interp = "Insuficiencia renal terminal. Requiere seguimiento nefrológico inmediato."
        rec = "Atención médica urgente y valoración de terapia sustitutiva renal."

    return {
        "egfr": egfr_val,
        "stage": stage,
        "stage_label": stage_label,
        "badge_color": badge,
        "clinical_interpretation": interp,
        "follow_up_recommendation": rec
    }


def calculate_lipidwise_internal(
    current_ldl: float,
    risk_category: str,
    has_prior_ascvd: bool = False,
    has_diabetes: bool = False,
    has_ckd: bool = False,
    on_statin: bool = False
) -> Dict[str, Any]:
    """
    Motor Lipidwise basado en las guías europeas ESC/EAS 2019/2021 de dislipemias.
    Calcula la diana terapéutica de c-LDL, la brecha absoluta y el porcentaje de reducción necesario.
    """
    # Si tiene enfermedad vascular previa documentada, automáticamente es Muy Alto o Extremo
    effective_risk = risk_category
    if has_prior_ascvd and effective_risk not in ["Muy Alto", "Extremo"]:
        effective_risk = "Muy Alto"

    targets = {
        "Bajo": 116.0,
        "Moderado": 100.0,
        "Alto": 70.0,
        "Muy Alto": 55.0,
        "Extremo": 40.0
    }
    target = targets.get(effective_risk, 100.0)

    gap = max(0.0, round(current_ldl - target, 1))
    at_target = current_ldl <= target
    reduction_pct = round(((current_ldl - target) / current_ldl) * 100.0, 1) if not at_target and current_ldl > 0 else 0.0

    if at_target:
        intensity = "Mantenimiento Preventivo"
        badge = "success"
        strategy = (
            f"El nivel de c-LDL ({current_ldl} mg/dL) se encuentra dentro del objetivo terapéutico "
            f"establecido por las guías ESC/EAS para riesgo {effective_risk} (< {target} mg/dL). "
            f"Se aconseja mantener estilo de vida activo y control anual."
        )
    elif reduction_pct < 30.0:
        intensity = "Intensidad Moderada"
        badge = "warning"
        strategy = (
            f"Se requiere una reducción de c-LDL del {reduction_pct}% ({gap} mg/dL por encima de meta). "
            f"El abordaje inicial suele incluir optimización de hábitos dietéticos mediterráneos y, "
            f"según criterio facultativo, inicio o ajuste de estatina de intensidad moderada "
            f"(ej. Atorvastatina 10-20 mg o Rosuvastatina 5-10 mg)."
        )
    elif reduction_pct <= 50.0:
        intensity = "Alta Intensidad"
        badge = "warning"
        strategy = (
            f"Se requiere una reducción de c-LDL del {reduction_pct}% ({gap} mg/dL de exceso). "
            f"Las guías recomiendan terapia con estatina de alta potencia a dosis óptimas "
            f"(ej. Atorvastatina 40-80 mg o Rosuvastatina 20-40 mg) para lograr una reducción >= 50%."
        )
    elif reduction_pct <= 65.0:
        intensity = "Combinada (Estatina + Ezetimiba)"
        badge = "warning"
        strategy = (
            f"Se requiere una reducción significativa del {reduction_pct}% ({gap} mg/dL de exceso). "
            f"La monoterapia con estatinas rara vez supera el 50% de descenso. Las guías recomiendan "
            f"asociar de primera línea Estatina de alta intensidad + Ezetimiba 10 mg (reducción esperada ~65%)."
        )
    else:
        intensity = "Triple / Terapia Avanzada"
        badge = "warning"
        strategy = (
            f"Brecha lipídica severa con reducción necesaria del {reduction_pct}% ({gap} mg/dL de exceso). "
            f"Se sugiere valoración por Cardiología/Medicina Interna para considerar terapia combinada potente "
            f"(Estatina alta potencia + Ezetimiba) e inicio precoz de inhibidores de PCSK9 "
            f"(evolocumab/alirocumab) o ácido bempedoico."
        )

    educational_note = (
        "MIVOR.ai CDSS no prescribe medicamentos. Esta herramienta calcula brechas numéricas objetivas "
        "conforme a las guías de la Sociedad Europea de Cardiología (ESC) y la Sociedad Europea de Aterosclerosis (EAS). "
        "Consulte siempre con su médico o cardiólogo para cualquier modificación en su tratamiento."
    )

    return {
        "current_ldl": current_ldl,
        "target_ldl": target,
        "ldl_gap": gap,
        "reduction_pct_needed": reduction_pct,
        "at_target": at_target,
        "target_badge": badge,
        "suggested_intensity": intensity,
        "clinical_strategy": strategy,
        "educational_note": educational_note,
        "evidence_reference": "Guías ESC/EAS 2019/2021 sobre el manejo de las dislipemias (Eur Heart J 2020; 41: 111-188)"
    }


def calculate_fragility_internal(
    tug_seconds: Optional[float],
    barthel_score: Optional[int],
    history_of_falls: bool = False
) -> Dict[str, Any]:
    """
    Evaluación geriátrica de fragilidad y riesgo de caídas:
    Combina Timed Up and Go (TUG) y Escala de Barthel.
    """
    tug_interp = None
    risk_level = "Bajo"
    risk_badge = "green"

    if tug_seconds is not None:
        if tug_seconds < 10.0:
            tug_interp = "Movilidad ágil y normal. Bajo riesgo de caídas en bipedestación."
            risk_level = "Bajo"
            risk_badge = "green"
        elif tug_seconds <= 20.0:
            tug_interp = "Fragilidad leve y lentitud de marcha. Riesgo moderado de caídas."
            risk_level = "Moderado"
            risk_badge = "yellow"
        else:
            tug_interp = "Marcha inestable y debilidad muscular significativa. Alto riesgo de caídas."
            risk_level = "Alto"
            risk_badge = "red"

    barthel_dep = None
    if barthel_score is not None:
        if barthel_score == 100:
            barthel_dep = "Independencia total para actividades básicas de la vida diaria"
        elif barthel_score >= 90:
            barthel_dep = "Dependencia leve / escasa"
        elif barthel_score >= 60:
            barthel_dep = "Dependencia moderada"
            if risk_level == "Bajo":
                risk_level = "Moderado"
                risk_badge = "yellow"
        elif barthel_score >= 20:
            barthel_dep = "Dependencia severa"
            risk_level = "Alto"
            risk_badge = "red"
        else:
            barthel_dep = "Dependencia total"
            risk_level = "Alto"
            risk_badge = "red"

    if history_of_falls and risk_level != "Alto":
        risk_level = "Moderado" if risk_level == "Bajo" else "Alto"
        risk_badge = "yellow" if risk_level == "Moderado" else "red"

    actions = []
    if risk_level == "Bajo":
        actions = [
            "Mantener caminatas diarias de al menos 30 minutos.",
            "Ejercicios suaves de estiramiento y equilibrio (ej. yoga o taichí suave).",
            "Uso de calzado cerrado con suela antideslizante."
        ]
    elif risk_level == "Moderado":
        actions = [
            "Programa supervisado de fortalecimiento de tren inferior (levantarse de la silla sin manos, elevación de talones).",
            "Revisión de la iluminación en pasillos y eliminación de alfombras sueltas en casa.",
            "Revisión con el médico o farmacéutico de fármacos sedantes o inductores del sueño.",
            "Instalación de asideros en la ducha o bañera."
        ]
    else:
        actions = [
            "Valoración urgente por Geriatría / Fisioterapia para plan de rehabilitación de la marcha.",
            "Considerar uso de bastón o andador adaptado a la altura del paciente.",
            "Adaptación completa del entorno del hogar (plato de ducha al ras de suelo, barras de apoyo, retirada de cables).",
            "Activar el modo cuidador en MIVOR con alertas automáticas de no respuesta o botón SOS."
        ]

    return {
        "overall_fall_risk": risk_level,
        "risk_badge": risk_badge,
        "tug_seconds": tug_seconds,
        "tug_interpretation": tug_interp,
        "barthel_score": barthel_score,
        "barthel_dependency": barthel_dep,
        "suggested_actions": actions
    }


# ============================================================================
# ENDPOINTS DE FASTAPI
# ============================================================================

@router.post("/score2", response_model=Score2Response)
async def calculate_score2(payload: Score2Request):
    """
    Calcula el riesgo cardiovascular a 10 años mediante SCORE2 / SCORE2-OP (Guías ESC 2021).
    """
    try:
        is_fem = _is_female_str(payload.gender)
        result = calculate_score2_internal(
            age=payload.age,
            is_female=is_fem,
            is_smoker=payload.is_smoker,
            systolic_bp=payload.systolic_bp,
            total_chol_mg=payload.total_cholesterol,
            hdl_mg=payload.hdl_cholesterol,
            region=payload.region or "moderate"
        )
        return Score2Response(**result)
    except Exception as e:
        logger.error(f"Error calculando SCORE2: {e}")
        raise HTTPException(status_code=500, detail=f"Error en cálculo de SCORE2: {str(e)}")


@router.post("/ldl_gap", response_model=LdlGapResponse)
async def calculate_ldl_gap(payload: LdlGapRequest):
    """
    Calcula la brecha de c-LDL (Lipidwise) según guías ESC/EAS 2019/2021.
    """
    try:
        result = calculate_lipidwise_internal(
            current_ldl=payload.current_ldl,
            risk_category=payload.risk_category,
            has_prior_ascvd=payload.has_prior_ascvd or False,
            has_diabetes=payload.has_diabetes or False,
            has_ckd=payload.has_ckd or False,
            on_statin=payload.on_statin or False
        )
        return LdlGapResponse(**result)
    except Exception as e:
        logger.error(f"Error calculando Lipidwise LDL gap: {e}")
        raise HTTPException(status_code=500, detail=f"Error en cálculo de brecha LDL: {str(e)}")


@router.post("/ckd_epi", response_model=CkdEpiResponse)
async def calculate_ckd_epi(payload: CkdEpiRequest):
    """
    Calcula el filtrado glomerular estimado (eGFR) mediante ecuación CKD-EPI 2021 sin raza.
    """
    try:
        is_fem = _is_female_str(payload.gender)
        result = calculate_ckd_epi_internal(
            creatinine_mg_dl=payload.creatinine,
            age=payload.age,
            is_female=is_fem
        )
        return CkdEpiResponse(**result)
    except Exception as e:
        logger.error(f"Error calculando CKD-EPI: {e}")
        raise HTTPException(status_code=500, detail=f"Error en cálculo CKD-EPI: {str(e)}")


@router.post("/fragility_tug", response_model=FragilityTugResponse)
async def calculate_fragility(payload: FragilityTugRequest):
    """
    Evalúa fragilidad y riesgo de caídas combinando Timed Up and Go (TUG) e Índice de Barthel.
    """
    try:
        result = calculate_fragility_internal(
            tug_seconds=payload.tug_seconds,
            barthel_score=payload.barthel_score,
            history_of_falls=payload.history_of_falls or False
        )
        return FragilityTugResponse(**result)
    except Exception as e:
        logger.error(f"Error evaluando fragilidad: {e}")
        raise HTTPException(status_code=500, detail=f"Error en test de fragilidad: {str(e)}")


@router.get("/auto_fill", response_model=AutoFillResponse)
async def auto_fill_from_records(
    patient_id: Optional[str] = Query(None, description="ID del paciente si lo consulta un médico"),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Extrae automáticamente los parámetros biomédicos del paciente (edad, sexo, presión arterial,
    colesterol, creatinina, etc.) desde su perfil y documentos analizados (OCR) para prellenar
    todas las calculadoras clínicas con un solo clic.
    """
    target_user_id = await resolve_target_patient_id(db, current_user, patient_id)

    data = {
        "age": None,
        "gender": None,
        "is_smoker": None,
        "systolic_bp": None,
        "diastolic_bp": None,
        "total_cholesterol": None,
        "hdl_cholesterol": None,
        "current_ldl": None,
        "triglycerides": None,
        "creatinine": None,
        "glucose": None,
        "data_sources": []
    }

    try:
        # 1. Obtener datos de PatientProfile
        stmt_prof = select(models.PatientProfile).where(models.PatientProfile.user_id == target_user_id)
        res_prof = await db.execute(stmt_prof)
        profile = res_prof.scalars().first()

        if profile:
            data["gender"] = profile.gender
            if profile.date_of_birth:
                try:
                    # Intenta parsear diferentes formatos: YYYY-MM-DD, DD/MM/YYYY, etc.
                    dob = None
                    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                        try:
                            dob = datetime.strptime(profile.date_of_birth, fmt)
                            break
                        except ValueError:
                            pass
                    if dob:
                        now = datetime.now()
                        data["age"] = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
                except Exception:
                    pass

            # Detectar si fuma en condiciones o notas
            notes_str = f"{profile.chronic_conditions or ''} {profile.medical_notes or ''}".lower()
            if any(term in notes_str for term in ["fumador", "fuma", "tabaco", "tabaquismo"]):
                data["is_smoker"] = True
            elif "no fumador" in notes_str or "exfumador" in notes_str:
                data["is_smoker"] = False

            data["data_sources"].append("Perfil Clínico Digital")

        # 2. Obtener analíticas y documentos analizados
        stmt_docs = (
            select(models.DocumentMetadata)
            .where(models.DocumentMetadata.user_id == target_user_id)
            .order_by(desc(models.DocumentMetadata.created_at))
            .limit(10)
        )
        res_docs = await db.execute(stmt_docs)
        docs = res_docs.scalars().all()

        # Si no hay docs con user_id directo, pero es el usuario actual, buscar los más recientes
        if not docs and target_user_id == current_user.id:
            stmt_recent = (
                select(models.DocumentMetadata)
                .order_by(desc(models.DocumentMetadata.created_at))
                .limit(5)
            )
            res_recent = await db.execute(stmt_recent)
            docs = res_recent.scalars().all()

        for doc in docs:
            doc_name = doc.filename or f"Documento #{doc.id}"
            has_found_value = False

            # Intentar primero extraer de `analysis_result` (JSON estructurado)
            if doc.analysis_result:
                try:
                    res_json = json.loads(doc.analysis_result) if isinstance(doc.analysis_result, str) else doc.analysis_result
                    biomarcadores = res_json.get("biomarcadores", []) if isinstance(res_json, dict) else []
                    for bio in biomarcadores:
                        if not isinstance(bio, dict):
                            continue
                        param = (bio.get("parametro") or "").lower()
                        val = bio.get("valor")
                        if val is None or not isinstance(val, (int, float)):
                            continue

                        if "colesterol total" in param and data["total_cholesterol"] is None:
                            data["total_cholesterol"] = float(val)
                            has_found_value = True
                        elif "hdl" in param and data["hdl_cholesterol"] is None:
                            data["hdl_cholesterol"] = float(val)
                            has_found_value = True
                        elif "ldl" in param and data["current_ldl"] is None:
                            data["current_ldl"] = float(val)
                            has_found_value = True
                        elif "triglic" in param and data["triglycerides"] is None:
                            data["triglycerides"] = float(val)
                            has_found_value = True
                        elif "creatinin" in param and data["creatinine"] is None:
                            data["creatinine"] = float(val)
                            has_found_value = True
                        elif "glucosa" in param and data["glucose"] is None:
                            data["glucose"] = float(val)
                            has_found_value = True
                except Exception as json_err:
                    logger.debug(f"No se pudo parsear analysis_result en doc #{doc.id}: {json_err}")

            # Fallback: RegEx sobre `extracted_text`
            text = (doc.extracted_text or "").lower()
            if text:
                # Colesterol total
                if data["total_cholesterol"] is None:
                    m = re.search(r"colesterol\s*(?:total)?[:\s]+(\d{2,3})", text)
                    if m:
                        data["total_cholesterol"] = float(m.group(1))
                        has_found_value = True

                # HDL
                if data["hdl_cholesterol"] is None:
                    m = re.search(r"\bhdl(?:\s*colesterol)?[:\s]+(\d{2,3})", text)
                    if m:
                        data["hdl_cholesterol"] = float(m.group(1))
                        has_found_value = True

                # LDL
                if data["current_ldl"] is None:
                    m = re.search(r"\bldl(?:\s*colesterol)?[:\s]+(\d{2,3})", text)
                    if m:
                        data["current_ldl"] = float(m.group(1))
                        has_found_value = True

                # Creatinina
                if data["creatinine"] is None:
                    m = re.search(r"creatinina[:\s]+(\d+[.,]\d+)", text)
                    if m:
                        data["creatinine"] = float(m.group(1).replace(",", "."))
                        has_found_value = True

                # Presión arterial (ej. 130/80 o 130 / 80 mmHg)
                if data["systolic_bp"] is None:
                    m = re.search(r"(?:tensi[oó]n|presi[oó]n|pa|ta)\s*(?:arterial)?[:\s]+(\d{2,3})\s*[/x-]\s*(\d{2,3})", text)
                    if m:
                        data["systolic_bp"] = float(m.group(1))
                        data["diastolic_bp"] = float(m.group(2))
                        has_found_value = True

            if has_found_value and doc_name not in data["data_sources"]:
                data["data_sources"].append(doc_name)

        return AutoFillResponse(**data)
    except Exception as e:
        logger.error(f"Error en auto_fill_from_records: {e}")
        return AutoFillResponse(**data)
