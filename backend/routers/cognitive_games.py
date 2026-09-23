import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

import models
from database import get_db
from security import get_current_user

logger = logging.getLogger("cognitive_games")

router = APIRouter(prefix="/api/games", tags=["Cognitive Games & Mental Stimulation (Mente Activa)"])


class RecordGameSessionRequest(BaseModel):
    game_type: str = Field(description="'memory_digits', 'speed_math', o 'pattern_match'")
    score: int = Field(ge=0, description="Puntuación obtenida")
    accuracy_percentage: float = Field(ge=0.0, le=100.0, description="Porcentaje de aciertos (0-100)")
    duration_seconds: float = Field(ge=0.0, description="Duración de la partida en segundos")
    difficulty_level: Optional[str] = "normal"  # "easy", "normal", "challenge"
    details: Optional[Dict[str, Any]] = None


class GameSessionSummary(BaseModel):
    id: int
    game_type: str
    score: int
    accuracy_percentage: float
    duration_seconds: float
    difficulty_level: str
    created_at: str


class GameStatsResponse(BaseModel):
    total_sessions_played: int
    streak_days: int
    games_breakdown: Dict[str, Dict[str, Any]]
    recent_sessions: List[GameSessionSummary]
    cognitive_wellness_message: str


@router.post("/record_session")
async def record_game_session(
    payload: RecordGameSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Registra el resultado de una sesión de entrenamiento cognitivo en Mente Activa.
    """
    try:
        new_session = models.CognitiveGameSession(
            user_id=current_user.id,
            game_type=payload.game_type,
            score=payload.score,
            accuracy_percentage=payload.accuracy_percentage,
            duration_seconds=payload.duration_seconds,
            difficulty_level=payload.difficulty_level or "normal",
            details=payload.details
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)

        return {
            "status": "success",
            "message": "Sesión registrada correctamente.",
            "session_id": new_session.id,
            "score": new_session.score
        }
    except Exception as e:
        logger.error(f"Error registrando sesión de juego: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar sesión: {str(e)}")


@router.get("/history", response_model=GameStatsResponse)
async def get_game_history(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene el historial de estimulación cognitiva del usuario, récords personales,
    estadísticas por tipo de juego y racha de días activos.
    """
    try:
        stmt = (
            select(models.CognitiveGameSession)
            .where(models.CognitiveGameSession.user_id == current_user.id)
            .order_by(desc(models.CognitiveGameSession.created_at))
            .limit(50)
        )
        res = await db.execute(stmt)
        sessions = res.scalars().all()

        total = len(sessions)
        recent_summaries = []
        games_dict = {
            "memory_digits": {"name": "Memoria de Dígitos", "played": 0, "best_score": 0, "avg_accuracy": 0.0},
            "speed_math": {"name": "Cálculo Rápido", "played": 0, "best_score": 0, "avg_accuracy": 0.0},
            "pattern_match": {"name": "Emparejamiento Visual", "played": 0, "best_score": 0, "avg_accuracy": 0.0}
        }

        played_dates = set()
        acc_accum = {"memory_digits": [], "speed_math": [], "pattern_match": []}

        for s in sessions:
            g_type = s.game_type
            if g_type not in games_dict:
                games_dict[g_type] = {"name": g_type, "played": 0, "best_score": 0, "avg_accuracy": 0.0}
                acc_accum[g_type] = []

            games_dict[g_type]["played"] += 1
            if s.score > games_dict[g_type]["best_score"]:
                games_dict[g_type]["best_score"] = s.score

            acc_accum[g_type].append(s.accuracy_percentage or 100.0)

            dt = s.created_at
            if dt:
                played_dates.add(dt.strftime("%Y-%m-%d"))

            recent_summaries.append(GameSessionSummary(
                id=s.id,
                game_type=s.game_type,
                score=s.score,
                accuracy_percentage=s.accuracy_percentage or 100.0,
                duration_seconds=s.duration_seconds or 0.0,
                difficulty_level=s.difficulty_level or "normal",
                created_at=s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else ""
            ))

        for g_type, accs in acc_accum.items():
            if accs:
                games_dict[g_type]["avg_accuracy"] = round(sum(accs) / len(accs), 1)

        # Racha de días consecutivos
        streak = 0
        today = datetime.now().date()
        for i in range(30):
            d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if d_str in played_dates:
                streak += 1
            else:
                if i == 0:
                    continue  # Si hoy no ha jugado aún, comprobar si jugó ayer
                break

        # Mensaje de bienestar
        if total == 0:
            wellness = "¡Bienvenido a Mente Activa! Realizar 5 minutos diarios de estimulación cognitiva ayuda a mantener la memoria ágil y activa."
        elif streak >= 3:
            wellness = f"¡Excelente constancia! Llevas {streak} días entrenando tu mente. La regularidad es la clave para la reserva cognitiva."
        else:
            wellness = "Completar ejercicios variados de memoria y cálculo promueve la agudeza mental y la plasticidad neuronal."

        return GameStatsResponse(
            total_sessions_played=total,
            streak_days=streak,
            games_breakdown=games_dict,
            recent_sessions=recent_summaries[:15],
            cognitive_wellness_message=wellness
        )
    except Exception as e:
        logger.error(f"Error obteniendo historial de juegos: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")
