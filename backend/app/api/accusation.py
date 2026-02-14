from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import GameSession, Accusation, User
from app.schemas.evidence import AccusationRequest
from app.services.auth_service import get_current_user
from app.services.game_engine import game_engine

router = APIRouter()


@router.post("/{session_id}/accuse")
async def make_accusation(
    session_id: UUID,
    data: AccusationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    result = await game_engine.evaluate_accusation(
        session_id,
        {
            "accused_slug": data.accused_slug,
            "motive": data.motive,
            "method": data.method,
            "supporting_evidence": data.supporting_evidence,
        },
        db,
    )
    return result


@router.get("/{session_id}/result")
async def get_result(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")

    result = await db.execute(
        select(Accusation)
        .where(Accusation.session_id == session_id)
        .order_by(Accusation.created_at.desc())
        .limit(1)
    )
    accusation = result.scalar_one_or_none()
    if not accusation:
        raise HTTPException(status_code=404, detail="No accusation found")

    feedback = accusation.feedback or {}
    return {
        "is_correct": accusation.is_correct,
        "total_score": accusation.score,
        "max_score": 1050,
        "breakdown": feedback.get("breakdown", {}),
        "story_summary": feedback.get("story_summary", ""),
    }
