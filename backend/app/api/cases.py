from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Case, GameSession, GameState, Character, User
from app.schemas.case import CaseListItem, CaseDetail, StartCaseResponse, PhaseSchema, UserSessionInfo
from app.services.auth_service import get_current_user

router = APIRouter()


async def get_current_user_optional(
    request: Request, db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Try to get the current user; return None if not authenticated."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    return result.scalar_one_or_none()


@router.get("/", response_model=list[CaseListItem])
async def list_cases(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    result = await db.execute(select(Case).where(Case.is_published == True))
    cases = result.scalars().all()

    # Build user session map if authenticated
    session_map: dict[str, UserSessionInfo] = {}
    if current_user:
        sessions_result = await db.execute(
            select(GameSession)
            .where(GameSession.user_id == current_user.id)
            .order_by(GameSession.started_at.desc())
        )
        for s in sessions_result.scalars().all():
            case_id_str = str(s.case_id)
            # Keep only the first (most recent) session per case
            if case_id_str not in session_map:
                session_map[case_id_str] = UserSessionInfo(
                    session_id=str(s.id),
                    status=s.status,
                    score=s.score,
                )

    return [
        CaseListItem(
            id=str(c.id),
            slug=c.slug,
            title=c.title,
            description=c.description,
            difficulty=c.difficulty,
            estimated_time_min=c.estimated_time_min,
            cover_image=c.cover_image,
            is_published=c.is_published,
            user_session=session_map.get(str(c.id)),
        )
        for c in cases
    ]


@router.get("/{case_id}", response_model=CaseDetail)
async def get_case(case_id: UUID, db: AsyncSession = Depends(get_db)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    phases = [
        PhaseSchema(id=p["id"], name=p["name"], description=p.get("description", ""))
        for p in (case.phases or [])
    ]

    return CaseDetail(
        id=str(case.id),
        slug=case.slug,
        title=case.title,
        description=case.description,
        difficulty=case.difficulty,
        estimated_time_min=case.estimated_time_min,
        cover_image=case.cover_image,
        is_published=case.is_published,
        phases=phases,
    )


@router.post("/{case_id}/start", response_model=StartCaseResponse)
async def start_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Check for active session
    result = await db.execute(
        select(GameSession).where(
            GameSession.user_id == current_user.id,
            GameSession.case_id == case_id,
            GameSession.status == "active",
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return StartCaseResponse(session_id=str(existing.id), is_new=False)

    # Create new session
    session = GameSession(user_id=current_user.id, case_id=case_id)
    db.add(session)
    await db.flush()

    # Get initially available characters
    chars_result = await db.execute(
        select(Character).where(
            Character.case_id == case_id,
            Character.is_available_initially == True,
        )
    )
    initial_chars = [c.slug for c in chars_result.scalars().all()]

    # Create game state
    state = GameState(
        session_id=session.id,
        visited_locations=[],
        collected_evidence=[],
        unlocked_characters=initial_chars,
        examined_pois=[],
        player_connections=[],
        player_notes="",
        player_hypotheses=[],
        unlocked_phases=["phase_1"],
        hints_used=[],
    )
    db.add(state)
    await db.commit()

    return StartCaseResponse(session_id=str(session.id), is_new=True)
