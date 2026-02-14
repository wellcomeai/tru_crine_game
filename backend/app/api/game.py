from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    GameSession, GameState, Case, Location, Character, InterrogationLog, User,
)
from app.schemas.game import (
    GameStateResponse, LocationSchema, CharacterSchema,
    VisitRequest, ExamineRequest, PlayerStateSchema,
    PlayerConnectionSchema, HypothesisSchema, PointOfInterestSchema,
    NotesRequest, HypothesisRequest,
)
from app.schemas.case import PhaseSchema
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


@router.get("/{session_id}/state")
async def get_game_state(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)
    case = await db.get(Case, session.case_id)

    result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Game state not found")

    return {
        "session_id": str(session.id),
        "case": {
            "id": str(case.id),
            "slug": case.slug,
            "title": case.title,
            "description": case.description,
            "difficulty": case.difficulty,
            "cover_image": case.cover_image,
        },
        "state": {
            "visited_locations": state.visited_locations or [],
            "collected_evidence": state.collected_evidence or [],
            "unlocked_characters": state.unlocked_characters or [],
            "examined_pois": state.examined_pois or [],
            "player_connections": state.player_connections or [],
            "player_notes": state.player_notes or "",
            "player_hypotheses": state.player_hypotheses or [],
        },
        "current_phase": session.current_phase,
        "status": session.status,
    }


@router.get("/{session_id}/locations")
async def get_locations(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)

    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    locations_result = await db.execute(
        select(Location)
        .where(Location.case_id == session.case_id)
        .order_by(Location.sort_order)
    )
    locations = locations_result.scalars().all()

    result = []
    for loc in locations:
        is_visited = loc.slug in (state.visited_locations or [])

        # Determine if locked
        is_locked = False
        if not loc.is_initial and loc.unlock_conditions:
            is_locked = not await game_engine.evaluate_conditions(
                loc.unlock_conditions, state, db, session_id
            )

        # Build POIs with examined status
        pois = []
        for poi in (loc.points_of_interest or []):
            poi_key = f"{loc.slug}:{poi['id']}"
            pois.append(
                PointOfInterestSchema(
                    id=poi["id"],
                    x_percent=poi.get("x_percent", 50),
                    y_percent=poi.get("y_percent", 50),
                    width_percent=poi.get("width_percent", 10),
                    height_percent=poi.get("height_percent", 10),
                    label=poi.get("label", ""),
                    description=poi.get("description", ""),
                    is_examined=poi_key in (state.examined_pois or []),
                    has_evidence=bool(poi.get("evidence_slug")),
                )
            )

        result.append(
            LocationSchema(
                id=str(loc.id),
                slug=loc.slug,
                name=loc.name,
                description=loc.description,
                image=loc.image,
                is_visited=is_visited,
                is_locked=is_locked,
                points_of_interest=pois,
            )
        )

    return result


@router.post("/{session_id}/visit")
async def visit_location(
    session_id: UUID,
    data: VisitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    try:
        result = await game_engine.process_visit(session_id, data.location_slug, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{session_id}/examine")
async def examine_poi(
    session_id: UUID,
    data: ExamineRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    try:
        result = await game_engine.process_examine(
            session_id, data.location_slug, data.poi_id, db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{session_id}/undo")
async def undo_action(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    try:
        result = await game_engine.process_undo(session_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{session_id}/characters")
async def get_characters(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)

    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    chars_result = await db.execute(
        select(Character)
        .where(Character.case_id == session.case_id, Character.role != "victim")
        .order_by(Character.sort_order)
    )
    characters = chars_result.scalars().all()

    result = []
    for char in characters:
        is_locked = char.slug not in (state.unlocked_characters or [])

        # Check if interrogated
        interr_result = await db.execute(
            select(InterrogationLog).where(
                InterrogationLog.session_id == session_id,
                InterrogationLog.character_slug == char.slug,
                InterrogationLog.message_count > 0,
            )
        )
        is_interrogated = interr_result.scalar_one_or_none() is not None

        result.append(
            CharacterSchema(
                id=str(char.id),
                slug=char.slug,
                name=char.name,
                role=char.role,
                age=char.age,
                occupation=char.occupation,
                avatar=char.avatar,
                is_interrogated=is_interrogated,
                is_locked=is_locked,
                current_emotion="calm",
            )
        )

    return result


@router.get("/{session_id}/phases")
async def get_phases(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)
    case = await db.get(Case, session.case_id)

    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    phases = []
    for p in (case.phases or []):
        phase_id = p["id"]
        is_completed = phase_id in (state.unlocked_phases or [])
        phases.append(
            PhaseSchema(
                id=phase_id,
                name=p["name"],
                description=p.get("description", ""),
                is_completed=is_completed,
                is_current=session.current_phase == phase_id,
            )
        )
    return phases


@router.post("/{session_id}/notes")
async def save_notes(
    session_id: UUID,
    data: NotesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()
    state.player_notes = data.text
    await db.commit()
    return {"status": "ok"}


@router.post("/{session_id}/hypothesis")
async def add_hypothesis(
    session_id: UUID,
    data: HypothesisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()

    from datetime import datetime
    hypothesis = {"text": data.text, "created_at": datetime.utcnow().isoformat()}
    state.player_hypotheses = (state.player_hypotheses or []) + [hypothesis]
    await db.commit()
    return {"status": "ok", "hypothesis": hypothesis}
