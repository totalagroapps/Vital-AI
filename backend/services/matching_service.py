"""
Servicio de Derivación Inteligente de Paciente a Especialista (Fila 14 del Roadmap)
Matching algorítmico por tipo de análisis, valores alterados y especialidad médica.
"""
from typing import List, Dict, Any, Optional
import re
import logging
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
import models

logger = logging.getLogger(__name__)

# Matriz de reglas clínicas: Asociación de biomarcadores, términos y anomalías con especialidades
SPECIALTY_RULES = [
    {
        "specialty": "Traumatología",
        "full_name": "Traumatología y Cirugía Ortopédica",
        "keywords": [
            "fractur", "rotura", "luxaci", "fisura", "esguince", "menisco", "tendon", "tendón",
            "ligamento", "óseo", "oseo", "hueso", "diáfisis", "diafisis", "fémur", "femur",
            "tibia", "peroné", "perone", "radio", "cúbito", "cubito", "húmero", "humero",
            "clavícula", "clavicula", "desplazad", "desplazamiento", "cabalgamiento",
            "articular", "artrosis", "politraumatismo", "traumatismo", "antebrazo", "cadera",
            "columna", "cervical", "lumbar", "hernia discal", "desgarro"
        ],
        "default_urgency": "alta",
        "reason_template": "Se detectaron lesiones óseas, daño articular o traumatismos agudos que precisan valoración inmediata por Traumatología."
    },
    {
        "specialty": "Cardiología",
        "full_name": "Cardiología",
        "keywords": [
            "troponina", "infarto", "angina", "cardiopat", "coronari", "isquemi",
            "electrocardiograma", "ecg", "arritmia", "fibrilaci", "taquicardia", "bradicardia",
            "soplo", "insuficiencia cardíaca", "insuficiencia cardiaca", "hipertensión", "hipertension",
            "presión arterial alta", "presion arterial alta", "colesterol total", "ldl", "c-ldl",
            "triglicéridos", "trigliceridos", "dislipidemia", "dolor torácico", "dolor toracico",
            "ecocardiograma", "fracción de eyección", "fraccion de eyeccion", "estenosis aortica"
        ],
        "default_urgency": "alta",
        "reason_template": "Se identificaron biomarcadores cardíacos alterados o riesgo cardiovascular elevado que sugieren estudio prioritario por Cardiología."
    },
    {
        "specialty": "Endocrinología",
        "full_name": "Endocrinología y Nutrición",
        "keywords": [
            "glucosa", "glucemia", "hba1c", "hemoglobina glicosilada", "diabetes", "prediabetes",
            "resistencia a la insulina", "insulina", "tsh", "t3", "t4", "tiroides", "hipotiroidismo",
            "hipertiroidismo", "tiroiditis", "cortisol", "prolactina", "obesidad mórbida", "metabólic", "metabolic",
            "microalbuminuria", "perfil tiroideo"
        ],
        "default_urgency": "media",
        "reason_template": "Se evidencian parámetros glucémicos, metabólicos o tiroideos fuera de rango recomendados para seguimiento por Endocrinología."
    },
    {
        "specialty": "Nefrología",
        "full_name": "Nefrología",
        "keywords": [
            "creatinina", "filtrado glomerular", "tfg", "urea", "ácido úrico", "acido urico",
            "proteinuria", "albuminuria", "insuficiencia renal", "aclaramiento de creatinina",
            "sedimento urinario", "hematuria", "cilindros urinarios", "electrolitos urinarios"
        ],
        "default_urgency": "media",
        "reason_template": "Alteración en la función renal o marcadores de depuración que justifican estudio especializado en Nefrología."
    },
    {
        "specialty": "Gastroenterología",
        "full_name": "Gastroenterología y Hepatología",
        "keywords": [
            "transaminasas", "got", "gpt", "alt", "ast", "ggt", "gamma glutamil", "bilirrubina",
            "fosfatasa alcalina", "hígado graso", "higado graso", "esteatosis", "hepatitis", "cirrosis",
            "helicobacter", "gastritis", "úlcera", "ulcera", "sangrado digestivo", "amilasa", "lipasa",
            "reflujo", "colonoscopia", "endoscopia"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros hepáticos, enzimáticos o gastrointestinales alterados que requieren diagnóstico y seguimiento digestivo."
    },
    {
        "specialty": "Hematología",
        "full_name": "Hematología y Hemoterapia",
        "keywords": [
            "hemoglobina", "anemia", "hematocrito", "plaquetopenia", "trombocitopenia",
            "trombocitosis", "leucocitosis", "leucopenia", "neutrofilia", "linfocitosis",
            "coagulación", "inr", "tiempo de protrombina", "ferritina", "hierro sérico", "vcm",
            "transferrina", "plaquetas"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros hematológicos anormales (serie roja, blanca o plaquetaria) que precisan valoración por Hematología."
    },
    {
        "specialty": "Neumología",
        "full_name": "Neumología",
        "keywords": [
            "espirometría", "espirometria", "derrame pleural", "infiltrado pulmonar", "consolidación pulmonar",
            "atelectasia", "nódulo pulmonar", "nodulo pulmonar", "epoc", "asma", "enfisema",
            "saturación baja", "saturacion baja", "hipoxemia", "disnea", "tórax", "torax", "neumonía"
        ],
        "default_urgency": "media",
        "reason_template": "Hallazgos en vías respiratorias, parénquima pulmonar o saturación de oxígeno que ameritan consulta con Neumología."
    },
    {
        "specialty": "Dermatología",
        "full_name": "Dermatología",
        "keywords": [
            "melanoma", "carcinoma basocelular", "lesión pigmentada", "lunar atípico", "lunar atipico",
            "biopsia cutánea", "biopsia cutanea", "psoriasis", "dermatitis", "eccema", "alopecia",
            "erupción cutánea", "nevus", "urticaria", "dermatoscopia"
        ],
        "default_urgency": "baja",
        "reason_template": "Lesiones cutáneas o dermatoscópicas que precisan revisión especializada por Dermatología."
    },
    {
        "specialty": "Neurología",
        "full_name": "Neurología",
        "keywords": [
            "cefalea", "migraña", "ictus", "acv", "isquemia cerebral", "convulsión", "convulsion",
            "epilepsia", "parestesia", "pérdida de fuerza", "perdida de fuerza", "temblor", "parkinson",
            "neuropatía", "neuropatia", "resonancia cerebral", "mareo recurrente", "vértigo central"
        ],
        "default_urgency": "alta",
        "reason_template": "Sintomatología o hallazgos neurológicos que justifican valoración por especialista en Neurología."
    },
    {
        "specialty": "Urología",
        "full_name": "Urología",
        "keywords": [
            "próstata", "prostata", "psa", "antígeno prostático", "antigeno prostatico", "litiasis renal",
            "cálculo renal", "calculo renal", "cólico nefrítico", "colico nefritico", "incontinencia",
            "infección urinaria recurrente", "cistitis", "disuria severa"
        ],
        "default_urgency": "media",
        "reason_template": "Valores urológicos o alteraciones de vías urinarias que justifican consulta con Urología."
    },
    {
        "specialty": "Reumatología",
        "full_name": "Reumatología",
        "keywords": [
            "factor reumatoide", "anticuerpos ana", "anti-dna", "artritis", "artritis reumatoide",
            "lupus", "espondilitis", "fibromialgia", "pcr elevada", "vsg elevada", "dolor articular crónico"
        ],
        "default_urgency": "media",
        "reason_template": "Marcadores autoinmunes o inflamatorios articulares que ameritan evaluación por Reumatología."
    },
    {
        "specialty": "Ginecología",
        "full_name": "Ginecología y Obstetricia",
        "keywords": [
            "papanicolaou", "citología cervicovaginal", "citologia", "vph", "embarazo", "gestación",
            "ecografía obstétrica", "beta-hcg", "quiste ovárico", "mioma", "endometriosis", "menopausia"
        ],
        "default_urgency": "baja",
        "reason_template": "Hallazgos ginecológicos o de salud femenina que requieren revisión por Ginecología y Obstetricia."
    },
    {
        "specialty": "Pediatría",
        "full_name": "Pediatría",
        "keywords": [
            "lactante", "percentil", "desarrollo infantil", "vacunación infantil", "pediátrico", "pediatrico",
            "fiebre pediátrica", "bronquiolitis", "crecimiento infantil"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros de salud y desarrollo infantil recomendados para valoración por Pediatría."
    },
    {
        "specialty": "Oftalmología",
        "full_name": "Oftalmología",
        "keywords": [
            "agudeza visual", "presión intraocular", "glaucoma", "cataratas", "fondo de ojo",
            "retinopatía", "retinopatia", "desprendimiento de retina", "astigmatismo", "miopía severa"
        ],
        "default_urgency": "media",
        "reason_template": "Parámetros de agudeza visual, fondo de ojo o presión ocular recomendados para Oftalmología."
    }
]

# Directorio de respaldo con especialistas verificados de referencia
FALLBACK_SPECIALISTS = [
    {
        "id": 103,
        "user_id": "doc-dr-javier-torres",
        "full_name": "Dr. Javier Torres",
        "specialty": "Traumatología",
        "license_number": "COL-330192",
        "experience_years": 15,
        "city": "Valencia, España",
        "location": "Hospital Quirón / Consulta Traumatológica",
        "photo_url": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 101,
        "user_id": "doc-dr-carlos-mendoza",
        "full_name": "Dr. Carlos Mendoza",
        "specialty": "Cardiología",
        "license_number": "COL-284910",
        "experience_years": 12,
        "city": "Madrid, España",
        "location": "Centro Sanitas / Consulta Online",
        "photo_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 107,
        "user_id": "doc-dra-carmen-delvalle",
        "full_name": "Dra. Carmen Del Valle",
        "specialty": "Endocrinología",
        "license_number": "COL-419203",
        "experience_years": 11,
        "city": "Madrid, España",
        "location": "Clínica de Nutrición & Diabetes MIVOR",
        "photo_url": "https://images.unsplash.com/photo-1594824813629-9e793ac3d3e6?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 108,
        "user_id": "doc-dr-fernando-gil",
        "full_name": "Dr. Fernando Gil",
        "specialty": "Nefrología",
        "license_number": "COL-501832",
        "experience_years": 13,
        "city": "Barcelona, España",
        "location": "Unidad Renal MIVOR / Telemedicina",
        "photo_url": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 109,
        "user_id": "doc-dra-mariana-solis",
        "full_name": "Dra. Mariana Solís",
        "specialty": "Gastroenterología",
        "license_number": "COL-382910",
        "experience_years": 10,
        "city": "Madrid, España",
        "location": "Centro Digestivo y Endoscopia",
        "photo_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 110,
        "user_id": "doc-dr-roberto-blanco",
        "full_name": "Dr. Roberto Blanco",
        "specialty": "Hematología",
        "license_number": "COL-492019",
        "experience_years": 14,
        "city": "Sevilla, España",
        "location": "Hospital Universitario / Hematología",
        "photo_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 104,
        "user_id": "doc-dra-sofia-valencia",
        "full_name": "Dra. Sofía Valencia",
        "specialty": "Dermatología",
        "license_number": "COL-419082",
        "experience_years": 8,
        "city": "Sevilla, España",
        "location": "Instituto Dermatológico Avanzado",
        "photo_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 105,
        "user_id": "doc-dr-mateo-herrera",
        "full_name": "Dr. Mateo Herrera",
        "specialty": "Neurología",
        "license_number": "COL-482918",
        "experience_years": 14,
        "city": "Bilbao, España",
        "location": "Hospital Clínico / Consulta Online",
        "photo_url": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 106,
        "user_id": "doc-dra-lucia-martinez",
        "full_name": "Dra. Lucía Martínez",
        "specialty": "Pediatría",
        "license_number": "COL-391024",
        "experience_years": 11,
        "city": "Málaga, España",
        "location": "Policlínica Materno-Infantil",
        "photo_url": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    },
    {
        "id": 102,
        "user_id": "doc-dra-elena-rodriguez",
        "full_name": "Dra. Elena Rodríguez",
        "specialty": "Medicina General",
        "license_number": "COL-382901",
        "experience_years": 9,
        "city": "Barcelona, España",
        "location": "Clínica Quirón / Telemedicina",
        "photo_url": "https://images.unsplash.com/photo-1594824813629-9e793ac3d3e6?auto=format&fit=crop&q=80&w=400",
        "is_verified": True
    }
]

def match_specialty_from_clinical_data(
    diagnostics: Optional[List[str]] = None,
    anomalies: Optional[List[str]] = None,
    summary_text: Optional[str] = None,
    biomarkers: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Motor de matching algorítmico que analiza diagnósticos, anomalías, biomarcadores alterados
    y texto clínico para determinar la especialidad médica óptima, el nivel de urgencia y
    la justificación médica para el paciente.
    """
    diagnostics = diagnostics or []
    anomalies = anomalies or []
    summary_text = summary_text or ""
    biomarkers = biomarkers or []

    # Extraer biomarcadores alterados
    altered_biomarkers = []
    biomarker_text_items = []
    for bm in biomarkers:
        st = str(bm.get("estado", "")).strip().lower()
        param = str(bm.get("parametro", "")).strip()
        val = bm.get("valor")
        unit = bm.get("unidad", "")
        if st in ["elevado", "bajo", "alterado", "alto", "crítico", "critico"]:
            altered_biomarkers.append({
                "parametro": param,
                "valor": val,
                "unidad": unit,
                "estado": st,
                "rango_referencia": bm.get("rango_referencia", "")
            })
            biomarker_text_items.append(f"{param} {st}")

    text_corpus = f"{' '.join(diagnostics)} {' '.join(anomalies)} {' '.join(biomarker_text_items)} {summary_text}".lower()

    if not text_corpus.strip() and not altered_biomarkers:
        return {
            "matched": False,
            "specialty": "Medicina General",
            "short_specialty": "Medicina General",
            "urgency": "baja",
            "reason": "Control y valoración clínica de rutina para seguimiento preventivo.",
            "matched_keywords": [],
            "altered_biomarkers": []
        }

    best_match = None
    highest_score = 0

    for rule in SPECIALTY_RULES:
        score = 0
        matched_kws = []
        for kw in rule["keywords"]:
            if re.search(r'\b' + re.escape(kw), text_corpus):
                # Ponderación reforzada si la palabra coincide directamente con un diagnóstico o biomarcador alterado
                is_direct_finding = any(kw in str(item).lower() for item in (diagnostics + anomalies + biomarker_text_items))
                weight = 4 if is_direct_finding else 1
                score += weight
                matched_kws.append(kw)

        if score > highest_score:
            highest_score = score
            best_match = {
                "matched": True,
                "specialty": rule["specialty"],
                "short_specialty": rule["specialty"].split()[0],
                "urgency": rule["default_urgency"],
                "reason": rule["reason_template"],
                "matched_keywords": matched_kws,
                "score": score
            }

    if best_match and highest_score >= 1:
        # Elevación de urgencia basada en criterios clínicos de alerta roja
        critical_alerts = [
            "fractur", "rotura", "luxaci", "infarto", "hemorragia", "troponina",
            "ictus", "acv", "isquemia", "desplazad", "conminuta"
        ]
        if any(term in text_corpus for term in critical_alerts):
            best_match["urgency"] = "alta"

        best_match["altered_biomarkers"] = altered_biomarkers
        return best_match

    # Fallback si no hubo coincidencia unívoca pero hay datos alterados
    has_abnormal = bool(altered_biomarkers) or ("alterad" in text_corpus or "anormal" in text_corpus)
    return {
        "matched": False,
        "specialty": "Medicina General",
        "short_specialty": "Medicina General",
        "urgency": "media" if has_abnormal else "baja",
        "reason": "Se sugiere consulta con Medicina General para una evaluación integral y derivación dirigida.",
        "matched_keywords": [],
        "altered_biomarkers": altered_biomarkers
    }


async def get_recommended_specialists(
    db: Optional[AsyncSession],
    specialty: str,
    limit: int = 4
) -> List[Dict[str, Any]]:
    """
    Busca en el directorio de especialistas aquellos que coincidan con la especialidad recomendada.
    Incluye fallback a especialistas certificados verificados en caso de que la BD no cuente con registros.
    """
    specialists = []
    first_token = specialty.split()[0].lower().replace("ía", "").replace("ia", "")

    if db is not None:
        try:
            stmt = select(models.SpecialistProfile).where(
                models.SpecialistProfile.specialty.ilike(f"%{first_token}%")
            ).limit(limit)
            result = await db.execute(stmt)
            db_specialists = result.scalars().all()
            for s in db_specialists:
                specialists.append({
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
                })
        except Exception as e:
            logger.warning(f"Advertencia consultando SpecialistProfile en BD: {e}")

    # Si faltan especialistas para cubrir el límite, complementar con el directorio de referencia
    if len(specialists) < limit:
        # Primero intentar coincidentes por especialidad
        matching_fallbacks = [
            fb for fb in FALLBACK_SPECIALISTS 
            if first_token in fb["specialty"].lower() and fb["id"] not in [s["id"] for s in specialists]
        ]
        specialists.extend(matching_fallbacks)

    if len(specialists) < limit:
        # Completar con médicos generales o afines si todavía faltan
        general_fallbacks = [
            fb for fb in FALLBACK_SPECIALISTS 
            if fb["id"] not in [s["id"] for s in specialists]
        ]
        specialists.extend(general_fallbacks[:limit - len(specialists)])

    return specialists[:limit]

