import json
import logging
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI
from pydantic import BaseModel

import database
import models
import security

router = APIRouter()
logger = logging.getLogger("nutrition")

class NutritionRequest(BaseModel):
    profile_id: Optional[int] = None

@router.post('/api/patient/nutrition/generate')
async def generate_nutrition_plan(
    request: NutritionRequest,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Fetch patient profile
    query = select(models.PatientProfile)
    if request.profile_id:
        query = query.where(models.PatientProfile.id == request.profile_id)
    else:
        query = query.where(models.PatientProfile.user_id == current_user.id)
        
    profile_res = await db.execute(query)
    profile = profile_res.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de paciente no encontrado")

    conditions = profile.chronic_conditions or "Ninguna registrada"
    allergies = profile.allergies or "Ninguna alergia conocida"

    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    system_prompt = f"""
Eres un Nutricionista Clínico de élite. Tu tarea es diseñar un plan de alimentación de 7 días y una lista de compras para un paciente.
Condiciones médicas crónicas del paciente: {conditions}
Alergias: {allergies}

CRÍTICO: Adapta estrictamente la dieta a las patologías. Por ejemplo, si hay diabetes, dieta de bajo índice glucémico. Si hay hipertensión, dieta DASH baja en sodio.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta:
{{
  "patient_context": "Breve explicación motivacional y clínica de por qué esta dieta le ayudará con sus condiciones.",
  "shopping_list": [
    {{ "category": "Categoría (ej. Proteínas, Vegetales)", "items": ["Item 1", "Item 2"] }}
  ],
  "weekly_plan": [
    {{
      "day": "Lunes",
      "meals": {{
        "breakfast": "Descripción del desayuno",
        "lunch": "Descripción del almuerzo",
        "dinner": "Descripción de la cena",
        "snack": "Descripción del snack"
      }}
    }}
    // ... repetir para los 7 días (Lunes a Domingo)
  ]
}}
"""

    try:
        response = await openai_client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'system', 'content': system_prompt}],
            response_format={ "type": "json_object" },
            temperature=0.7
        )
        content = response.choices[0].message.content
        diet_plan = json.loads(content)
        return diet_plan
    except Exception as e:
        logger.error(f"Error generando dieta: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el plan nutricional.")
