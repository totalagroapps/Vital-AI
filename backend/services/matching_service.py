"""
Servicio de Derivación Inteligente de Paciente a Especialista (Fila 24 del Plan de Trabajo)
Matching algorítmico por tipo de análisis, valores alterados y especialidad médica.
"""
from typing import List, Dict, Any, Optional
import re
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
import models

# Matriz de reglas clínicas: Asociación de biomarcadores, términos y anomalías con especialidades
SPECIALTY_RULES = [
    {
        "specialty": "Traumatología y Cirugía Ortopédica",
        "keywords": [
            "fractur", "rotura", "luxaci", "fisura", "esguince", "menisco", "tendon", "tendón",
            "ligamento", "óseo", "oseo", "hueso", "diáfisis", "diafisis", "fémur", "femur",
            "tibia", "peroné", "perone", "radio", "cúbito", "cubito", "húmero", "humero",
            "clavícula", "clavicula", "desplazad", "desplazamiento", "cabalgamiento",
            "articular", "artrosis severa", "politraumatismo", "traumatismo"
        ],
        "default_urgency": "alta",
        "reason_template": "Se detectaron lesiones traumáticas, fracturas óseas o daño musculoesquelético que requieren valoración urgente por traumatología."
    },
    {
        "specialty": "Cardiología",
        "keywords": [
            "troponina", "infarto", "angina", "cardiopat", "coronari", "isquemi",
            "electrocardiograma", "ecg", "arritmia", "fibrilaci", "taquicardia", "bradicardia",
            "soplo", "insuficiencia cardíaca", "insuficiencia cardiaca", "hipertensión", "hipertension",
            "presión arterial alta", "presion arterial alta", "colesterol total", "ldl", "c-ldl",
            "triglicéridos", "trigliceridos", "dislipidemia", "dolor torácico", "dolor toracico",
            "ecocardiograma", "fracción de eyección", "fraccion de eyeccion"
        ],
        "default_urgency": "alta",
        "reason_template": "Se identificaron biomarcadores cardíacos alterados, riesgo cardiovascular elevado o alteraciones electrocardiográficas que sugieren evaluación cardiológica."
    },
    {
        "specialty": "Endocrinología y Nutrición",
        "keywords": [
            "glucosa", "glucemia", "hba1c", "hemoglobina glicosilada", "diabetes", "prediabetes",
            "resistencia a la insulina", "insulina", "tsh", "t3", "t4", "tiroides", "hipotiroidismo",
            "hipertiroidismo", "tiroiditis", "cortisol", "prolactina", "obesidad mórbida", "metabólic", "metabolic"
        ],
        "default_urgency": "media",
        "reason_template": "Se evidencian parámetros glucémicos, metabólicos o tiroideos fuera de rango recomendados para seguimiento endocrinológico."
    },
    {
        "specialty": "Nefrología",
        "keywords": [
            "creatinina", "filtrado glomerular", "tfg", "urea", "ácido úrico", "acido urico",
            "proteinuria", "albuminuria", "microalbuminuria", "insuficiencia renal",
            "aclaramiento de creatinina", "sedimento urinario patológico", "hematuria renal"
        ],
        "default_urgency": "media",
        "reason_template": "Alteración en la función renal o marcadores de depuración que justifican estudio por especialista en nefrología."
    },
    {
        "specialty": "Gastroenterología y Hepatología",
        "keywords": [
            "transaminasas", "got", "gpt", "alt", "ast", "ggt", "gamma glutamil", "bilirrubina",
            "fosfatasa alcalina", "hígado graso", "higado graso", "esteatosis", "hepatitis", "cirrosis",
            "helicobacter", "gastritis severa", "úlcera", "ulcera", "sangrado digestivo", "amilasa", "lipasa"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros hepáticos o gastrointestinales alterados que requieren diagnóstico y seguimiento digestivo."
    },
    {
        "specialty": "Hematología",
        "keywords": [
            "hemoglobina baja", "anemia", "hematocrito", "plaquetopenia", "trombocitopenia",
            "trombocitosis", "leucocitosis", "leucopenia", "neutrofilia", "linfocitosis",
            "coagulación", "inr", "tiempo de protrombina", "ferritina", "hierro sérico", "vcm bajo"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros hematológicos anormales (serie roja, blanca o plaquetaria) que requieren estudio hematológico especializado."
    },
    {
        "specialty": "Neumología",
        "keywords": [
            "espirometría", "espirometria", "derrame pleural", "infiltrado pulmonar", "consolidación pulmonar",
            "atelectasia", "nódulo pulmonar", "nodulo pulmonar", "epoc", "asma grave", "enfisema",
            "saturación baja", "saturacion baja", "hipoxemia", "disnea progresiva"
        ],
        "default_urgency": "media",
        "reason_template": "Hallazgos en vías respiratorias, parénquima pulmonar o espirometría que precisan valoración por neumología."
    },
    {
        "specialty": "Dermatología",
        "keywords": [
            "melanoma", "carcinoma basocelular", "lesión pigmentada", "lunar atípico", "lunar atipico",
            "biopsia cutánea", "biopsia cutanea", "psoriasis extensa", "dermatitis severa", "eccema", "alopecia areata"
        ],
        "default_urgency": "baja",
        "reason_template": "Lesiones cutáneas o dermatoscópicas que precisan revisión especializada por dermatología."
    },
    {
        "specialty": "Neurología",
        "keywords": [
            "cefalea incapacitante", "migraña crónica", "migraña cronica", "ictus", "acv", "isquemia cerebral",
            "convulsión", "convulsion", "epilepsia", "parestesia persistente", "pérdida de fuerza",
            "temblor", "parkinson", "neuropatía", "neuropatia", "resonancia cerebral patológica"
        ],
        "default_urgency": "alta",
        "reason_template": "Sintomatología o hallazgos neurovasculares que justifican valoración prioritaria por neurología."
    }
]

def match_specialty_from_clinical_data(
    diagnostics: Optional[List[str]] = None,
    anomalies: Optional[List[str]] = None,
    summary_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Motor de matching algorítmico que analiza diagnósticos, anomalías y texto clínico
    para determinar la especialidad médica adecuada y la justificación del triaje.
    """
    diagnostics = diagnostics or []
    anomalies = anomalies or []
    summary_text = summary_text or ""

    text_corpus = f"{' '.join(diagnostics)} {' '.join(anomalies)} {summary_text}".lower()

    if not text_corpus.strip():
        return {
            "matched": False,
            "specialty": "Medicina General",
            "urgency": "baja",
            "reason": "Control y valoración clínica de rutina.",
            "matched_keywords": []
        }

    best_match = None
    highest_score = 0

    for rule in SPECIALTY_RULES:
        score = 0
        matched_kws = []
        for kw in rule["keywords"]:
            if re.search(r'\b' + re.escape(kw), text_corpus):
                weight = 3 if any(kw in str(item).lower() for item in (diagnostics + anomalies)) else 1
                score += weight
                matched_kws.append(kw)

        if score > highest_score:
            highest_score = score
            best_match = {
                "matched": True,
                "specialty": rule["specialty"],
                "urgency": rule["default_urgency"],
                "reason": rule["reason_template"],
                "matched_keywords": matched_kws,
                "score": score
            }

    if best_match and highest_score >= 1:
        if any(term in text_corpus for term in ["fractur", "rotura", "luxaci", "infarto", "hemorragia", "troponina"]):
            best_match["urgency"] = "alta"
        return best_match

    return {
        "matched": False,
        "specialty": "Medicina General",
        "urgency": "media" if ("alterad" in text_corpus or "anormal" in text_corpus) else "baja",
        "reason": "Se sugiere consulta inicial con Medicina General para evaluación diagnóstica integral.",
        "matched_keywords": []
    }

async def get_recommended_specialists(
    db: AsyncSession,
    specialty: str,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """
    Busca en el directorio de especialistas registrados aquellos que coincidan
    con la especialidad recomendada o especialidades afines.
    """
    try:
        first_token = specialty.split()[0].lower().replace("ía", "").replace("ia", "")

        stmt = select(models.SpecialistProfile).where(
            models.SpecialistProfile.specialty.ilike(f"%{first_token}%")
        ).limit(limit)
        result = await db.execute(stmt)
        specialists = result.scalars().all()

        if len(specialists) < limit:
            fallback_stmt = select(models.SpecialistProfile).where(
                ~models.SpecialistProfile.id.in_([s.id for s in specialists])
            ).limit(limit - len(specialists))
            fallback_res = await db.execute(fallback_stmt)
            specialists = list(specialists) + list(fallback_res.scalars().all())

        return [
            {
                "id": s.id,
                "user_id": s.user_id,
                "full_name": s.full_name,
                "specialty": s.specialty,
                "license_number": s.license_number,
                "experience_years": s.experience_years,
                "city": s.city,
                "location": s.location,
                "photo_url": s.photo_url or s.profile_pic_url,
                "is_verified": bool(s.is_verified or s.verified)
            }
            for s in specialists
        ]
    except Exception as e:
        print(f"Error fetching recommended specialists: {e}")
        return []
