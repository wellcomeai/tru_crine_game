import json
import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    GameSession, GameState, Character, Evidence,
    InterrogationLog, User,
)
from app.schemas.interrogation import MessageRequest, ShowEvidenceRequest
from app.services.auth_service import get_current_user
from app.services.ai_service import ai_service
from app.services.game_engine import game_engine

logger = logging.getLogger(__name__)
router = APIRouter()


async def verify_session_owner(session_id: UUID, user: User, db: AsyncSession) -> GameSession:
    session = await db.get(GameSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session


async def get_or_create_log(
    session_id: UUID, character_slug: str, db: AsyncSession,
) -> InterrogationLog:
    result = await db.execute(
        select(InterrogationLog).where(
            InterrogationLog.session_id == session_id,
            InterrogationLog.character_slug == character_slug,
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        log = InterrogationLog(
            session_id=session_id,
            character_slug=character_slug,
            messages=[],
            revealed_info=[],
            message_count=0,
        )
        db.add(log)
        await db.flush()
    return log


@router.post("/{session_id}/interrogation/{character_slug}/start")
async def start_interrogation(
    session_id: UUID,
    character_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)

    # Get character
    char_result = await db.execute(
        select(Character).where(
            Character.case_id == session.case_id,
            Character.slug == character_slug,
        )
    )
    character = char_result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Check if unlocked
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()
    if character_slug not in (state.unlocked_characters or []):
        raise HTTPException(status_code=403, detail="Character is locked")

    # Get or create log
    log = await get_or_create_log(session_id, character_slug, db)

    # If already has messages, return existing
    if log.messages:
        return {
            "character_slug": character_slug,
            "greeting": log.messages[0]["content"] if log.messages else "",
            "messages": log.messages,
        }

    # Generate greeting
    char_data = {
        "name": character.name,
        "age": character.age,
        "occupation": character.occupation,
        "role": character.role,
        "personality": character.personality,
        "backstory": character.backstory,
        "secrets": character.secrets or [],
        "alibi": character.alibi,
        "emotional_reactions": character.emotional_reactions or {},
        "ai_system_prompt": character.ai_system_prompt,
    }

    greeting = await ai_service.generate_greeting(char_data)

    # Save greeting
    msg = {
        "role": "assistant",
        "content": greeting,
        "timestamp": datetime.utcnow().isoformat(),
        "evidence_shown": None,
    }
    log.messages = [msg]
    log.message_count = 1
    await db.commit()

    return {
        "character_slug": character_slug,
        "greeting": greeting,
        "messages": [msg],
    }


@router.get("/{session_id}/interrogation/{character_slug}/history")
async def get_interrogation_history(
    session_id: UUID,
    character_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_session_owner(session_id, current_user, db)

    result = await db.execute(
        select(InterrogationLog).where(
            InterrogationLog.session_id == session_id,
            InterrogationLog.character_slug == character_slug,
        )
    )
    log = result.scalar_one_or_none()

    if not log:
        return {"character_slug": character_slug, "messages": [], "message_count": 0}

    return {
        "character_slug": character_slug,
        "messages": log.messages or [],
        "message_count": log.message_count or 0,
    }


@router.post("/{session_id}/interrogation/{character_slug}/message")
async def send_message(
    session_id: UUID,
    character_slug: str,
    data: MessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)

    # Load character
    char_result = await db.execute(
        select(Character).where(
            Character.case_id == session.case_id,
            Character.slug == character_slug,
        )
    )
    character = char_result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Load state and log
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()
    log = await get_or_create_log(session_id, character_slug, db)

    # Add user message
    user_msg = {
        "role": "user",
        "content": data.content,
        "timestamp": datetime.utcnow().isoformat(),
        "evidence_shown": None,
    }
    messages = (log.messages or []) + [user_msg]

    # Build AI messages
    char_data = {
        "name": character.name, "age": character.age,
        "occupation": character.occupation, "role": character.role,
        "personality": character.personality, "backstory": character.backstory,
        "secrets": character.secrets or [], "alibi": character.alibi,
        "emotional_reactions": character.emotional_reactions or {},
        "ai_system_prompt": character.ai_system_prompt,
    }

    system_prompt = ai_service.build_system_prompt(
        char_data, game_engine._snapshot_state(state),
        messages, state.collected_evidence or [],
    )

    ai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        if msg["role"] in ("user", "assistant"):
            ai_messages.append({"role": msg["role"], "content": msg["content"]})

    # Stream response
    async def event_stream():
        full_response = ""
        try:
            async for chunk in ai_service.chat_stream(ai_messages):
                full_response += chunk
                event = json.dumps({"type": "stream", "content": chunk}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            # Save to log after streaming
            assistant_msg = {
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.utcnow().isoformat(),
                "evidence_shown": None,
            }
            log.messages = messages + [assistant_msg]
            log.message_count = (log.message_count or 0) + 2
            await db.commit()

            # Check unlocks
            unlocks = await game_engine.check_unlocks(session_id, state, db)
            if any(unlocks[k] for k in unlocks if k != "notifications"):
                event = json.dumps({"type": "unlock", "items": unlocks}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            done_event = json.dumps(
                {"type": "done", "full_response": full_response}, ensure_ascii=False
            )
            yield f"data: {done_event}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            error_event = json.dumps(
                {"type": "error", "message": str(e)}, ensure_ascii=False
            )
            yield f"data: {error_event}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{session_id}/interrogation/{character_slug}/show-evidence")
async def show_evidence(
    session_id: UUID,
    character_slug: str,
    data: ShowEvidenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await verify_session_owner(session_id, current_user, db)

    # Load character
    char_result = await db.execute(
        select(Character).where(
            Character.case_id == session.case_id,
            Character.slug == character_slug,
        )
    )
    character = char_result.scalar_one_or_none()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Load evidence
    ev_result = await db.execute(
        select(Evidence).where(
            Evidence.case_id == session.case_id,
            Evidence.slug == data.evidence_slug,
        )
    )
    evidence = ev_result.scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    # Load state and log
    state_result = await db.execute(
        select(GameState).where(GameState.session_id == session_id)
    )
    state = state_result.scalar_one()
    log = await get_or_create_log(session_id, character_slug, db)

    # Create system message for evidence presentation
    system_msg = {
        "role": "user",
        "content": f"[Следователь предъявляет улику: {evidence.name}. {evidence.description}]",
        "timestamp": datetime.utcnow().isoformat(),
        "evidence_shown": data.evidence_slug,
    }
    messages = (log.messages or []) + [system_msg]

    # Build AI messages
    char_data = {
        "name": character.name, "age": character.age,
        "occupation": character.occupation, "role": character.role,
        "personality": character.personality, "backstory": character.backstory,
        "secrets": character.secrets or [], "alibi": character.alibi,
        "emotional_reactions": character.emotional_reactions or {},
        "ai_system_prompt": character.ai_system_prompt,
    }

    system_prompt = ai_service.build_system_prompt(
        char_data, game_engine._snapshot_state(state),
        messages, state.collected_evidence or [],
    )

    ai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        if msg["role"] in ("user", "assistant"):
            ai_messages.append({"role": msg["role"], "content": msg["content"]})

    # Check emotional reaction
    emotional_reactions = character.emotional_reactions or {}
    emotion = "calm"
    if data.evidence_slug in emotional_reactions:
        reaction = emotional_reactions[data.evidence_slug]
        emotion = reaction.get("reaction", "calm")
        if reaction.get("instruction"):
            ai_messages.append({
                "role": "system",
                "content": f"ИНСТРУКЦИЯ РЕАКЦИИ: {reaction['instruction']}",
            })

    async def event_stream():
        full_response = ""
        try:
            # Send emotion event first
            if emotion != "calm":
                event = json.dumps({"type": "emotion", "emotion": emotion}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            async for chunk in ai_service.chat_stream(ai_messages):
                full_response += chunk
                event = json.dumps({"type": "stream", "content": chunk}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            # Save
            assistant_msg = {
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.utcnow().isoformat(),
                "evidence_shown": None,
            }
            log.messages = messages + [assistant_msg]
            log.message_count = (log.message_count or 0) + 2
            await db.commit()

            # Check unlocks
            unlocks = await game_engine.check_unlocks(session_id, state, db)
            if any(unlocks[k] for k in unlocks if k != "notifications"):
                event = json.dumps({"type": "unlock", "items": unlocks}, ensure_ascii=False)
                yield f"data: {event}\n\n"

            done_event = json.dumps(
                {"type": "done", "full_response": full_response}, ensure_ascii=False
            )
            yield f"data: {done_event}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            error_event = json.dumps(
                {"type": "error", "message": str(e)}, ensure_ascii=False
            )
            yield f"data: {error_event}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
