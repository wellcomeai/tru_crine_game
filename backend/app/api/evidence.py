from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import GameSession, GameState, Evidence, User
from app.schemas.evidence import EvidenceSchema
from app.schemas.game import ConnectRequest, DisconnectRequest
from app.services.auth_service import get_current_user
from app.services.game_engine import game_engine

router = APIRouter()


async def verify_session_owner(session_id: UUID, user: User, db: AsyncSession) -> GameSession:
    session = await db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session


@router.get("/{session_id}/evidence")
async def get_collected_evidence(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    collected_slugs = state.collected_evidence or []
    if not collected_slugs:
        return []

    evidence_result = await db.execute(
        select(Evidence).where(
            Evidence.case_id == session.case_id,
            Evidence.slug.in_(collected_slugs),
        )
    )
    evidence_list = evidence_result.scalars().all()

    return [
        EvidenceSchema(
            id=str(e.id),
            slug=e.slug,
            name=e.name,
            type=e.type,
            description=e.description,
            image=e.image,
            importance=e.importance,
            tags=e.tags or [],
            is_key_evidence=e.is_key_evidence,
        )
        for e in evidence_list
    ]


@router.get("/{session_id}/evidence/{slug}")
async def get_evidence_detail(
    session_id: UUID,
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    if slug not in (state.collected_evidence or []):
        raise HTTPException(status_code=404, detail="Evidence not collected")

    evidence_result = await db.execute(
        select(Evidence).where(
            Evidence.case_id == session.case_id,
            Evidence.slug == slug,
        )
    )
    e = evidence_result.scalar_one_or_none()
    if not e:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return EvidenceSchema(
        id=str(e.id),
        slug=e.slug,
        name=e.name,
        type=e.type,
        description=e.description,
        detailed_description=e.detailed_description,
        image=e.image,
        importance=e.importance,
        tags=e.tags or [],
        is_key_evidence=e.is_key_evidence,
    )


@router.post("/{session_id}/connect")
async def connect_evidence(
    session_id: UUID,
    data: ConnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    try:
        result = await game_engine.process_connect(
            session_id, data.evidence_a_slug, data.evidence_b_slug,
            data.note or "", db,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{session_id}/connect")
async def disconnect_evidence(
    session_id: UUID,
    data: DisconnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    await game_engine.process_disconnect(
        session_id, data.evidence_a_slug, data.evidence_b_slug, db
    )
    return {"status": "ok"}


@router.get("/{session_id}/connections")
async def get_connections(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()
    return state.player_connections or []
