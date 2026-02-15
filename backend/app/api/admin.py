"""
Admin API for case management and AI generation.
Access restricted to ADMIN_EMAIL.
"""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Case, Location, Character, Evidence, EvidenceConnection
from app.services.auth_service import get_current_user
from app.services.case_generator import case_generator

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = "well96well@gmail.com"


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class GenerateCaseRequest(BaseModel):
    theme: str | None = None
    difficulty: str = "medium"
    num_suspects: int = 4
    num_locations: int = 5
    setting: str | None = None


@router.post("/generate-case")
async def generate_case_stream(
    req: GenerateCaseRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Generate case with SSE progress streaming."""

    async def event_stream():
        try:
            async for progress in case_generator.generate_full_case_with_progress(
                db=db,
                theme=req.theme,
                difficulty=req.difficulty,
                num_suspects=req.num_suspects,
                num_locations=req.num_locations,
                setting=req.setting,
            ):
                yield f"data: {json.dumps(progress, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/cases")
async def admin_list_cases(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Case).order_by(Case.created_at.desc())
    )
    cases = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "slug": c.slug,
            "title": c.title,
            "difficulty": c.difficulty,
            "is_published": c.is_published,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in cases
    ]


@router.post("/cases/{case_id}/publish")
async def publish_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    case.is_published = True
    await db.commit()
    return {"status": "published", "case_id": str(case_id)}


@router.post("/cases/{case_id}/unpublish")
async def unpublish_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    case.is_published = False
    await db.commit()
    return {"status": "unpublished", "case_id": str(case_id)}


@router.delete("/cases/{case_id}")
async def delete_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    if case.is_published:
        raise HTTPException(400, "Cannot delete published case. Unpublish first.")
    await db.delete(case)
    await db.commit()
    return {"status": "deleted"}


# ─────────────────────────────────────────────
# Case preview
# ─────────────────────────────────────────────

@router.get("/cases/{case_id}/preview")
async def admin_case_preview(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Full case data for admin preview."""
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    locations_result = await db.execute(
        select(Location).where(Location.case_id == case_id).order_by(Location.sort_order)
    )
    locations = locations_result.scalars().all()

    characters_result = await db.execute(
        select(Character).where(Character.case_id == case_id).order_by(Character.sort_order)
    )
    characters = characters_result.scalars().all()

    evidence_result = await db.execute(
        select(Evidence).where(Evidence.case_id == case_id)
    )
    evidence_items = evidence_result.scalars().all()

    connections_result = await db.execute(
        select(EvidenceConnection).where(EvidenceConnection.case_id == case_id)
    )
    connections = connections_result.scalars().all()

    return {
        "case": {
            "id": str(case.id),
            "slug": case.slug,
            "title": case.title,
            "description": case.description,
            "difficulty": case.difficulty,
            "estimated_time_min": case.estimated_time_min,
            "cover_image": case.cover_image,
            "is_published": case.is_published,
            "solution": case.solution,
            "phases": case.phases,
        },
        "locations": [
            {
                "id": str(loc.id),
                "slug": loc.slug,
                "name": loc.name,
                "description": loc.description,
                "image": loc.image,
                "is_initial": loc.is_initial,
                "sort_order": loc.sort_order,
                "points_of_interest": loc.points_of_interest or [],
            }
            for loc in locations
        ],
        "characters": [
            {
                "id": str(ch.id),
                "slug": ch.slug,
                "name": ch.name,
                "role": ch.role,
                "age": ch.age,
                "occupation": ch.occupation,
                "avatar": ch.avatar,
                "personality": ch.personality,
                "backstory": ch.backstory,
                "is_guilty": ch.is_guilty,
                "alibi": ch.alibi,
                "secrets": ch.secrets or [],
                "ai_system_prompt": ch.ai_system_prompt,
            }
            for ch in characters
        ],
        "evidence": [
            {
                "id": str(ev.id),
                "slug": ev.slug,
                "name": ev.name,
                "type": ev.type,
                "description": ev.description,
                "detailed_description": ev.detailed_description,
                "image": ev.image,
                "location_slug": ev.location_slug,
                "importance": ev.importance,
                "tags": ev.tags or [],
                "is_key_evidence": ev.is_key_evidence,
            }
            for ev in evidence_items
        ],
        "evidence_connections": [
            {
                "evidence_a_slug": conn.evidence_a_slug,
                "evidence_b_slug": conn.evidence_b_slug,
                "connection_type": conn.connection_type,
                "description": conn.description,
                "is_key_connection": conn.is_key_connection,
            }
            for conn in connections
        ],
    }


# ─────────────────────────────────────────────
# Image regeneration
# ─────────────────────────────────────────────

class RegenerateImageRequest(BaseModel):
    entity_type: str    # "cover" | "location" | "character" | "evidence"
    entity_slug: str    # slug of the entity (for cover: "cover" or empty)
    custom_prompt: str | None = None


@router.post("/cases/{case_id}/regenerate-image")
async def regenerate_image(
    case_id: UUID,
    req: RegenerateImageRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Regenerate a single image (cover, location, character, or evidence)."""
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    case_slug = case.slug

    if req.entity_type == "cover":
        case_info = {
            "title": case.title,
            "description": case.description,
        }
        new_url = await case_generator.regenerate_cover(case_slug, case_info)
        case.cover_image = new_url
        await db.commit()
        return {"status": "ok", "new_image_url": new_url}

    elif req.entity_type == "location":
        result = await db.execute(
            select(Location).where(
                Location.case_id == case_id,
                Location.slug == req.entity_slug,
            )
        )
        location = result.scalar_one_or_none()
        if not location:
            raise HTTPException(404, f"Location '{req.entity_slug}' not found")

        loc_data = {
            "slug": location.slug,
            "name": location.name,
            "description": location.description,
            "points_of_interest": location.points_of_interest or [],
        }
        img_path, img_bytes = await case_generator.regenerate_location_image(case_slug, loc_data)
        location.image = img_path

        # Recalibrate POIs if we got image bytes
        if img_bytes and location.points_of_interest:
            calibrated = await case_generator.recalibrate_pois(
                img_bytes,
                location.points_of_interest,
                location.name,
                location.description or "",
            )
            location.points_of_interest = calibrated

        await db.commit()
        return {"status": "ok", "new_image_url": img_path}

    elif req.entity_type == "character":
        result = await db.execute(
            select(Character).where(
                Character.case_id == case_id,
                Character.slug == req.entity_slug,
            )
        )
        character = result.scalar_one_or_none()
        if not character:
            raise HTTPException(404, f"Character '{req.entity_slug}' not found")

        char_data = {
            "slug": character.slug,
            "name": character.name,
            "occupation": character.occupation,
            "personality": character.personality,
        }
        new_url = await case_generator.regenerate_avatar(case_slug, char_data)
        character.avatar = new_url
        await db.commit()
        return {"status": "ok", "new_image_url": new_url}

    elif req.entity_type == "evidence":
        result = await db.execute(
            select(Evidence).where(
                Evidence.case_id == case_id,
                Evidence.slug == req.entity_slug,
            )
        )
        evidence = result.scalar_one_or_none()
        if not evidence:
            raise HTTPException(404, f"Evidence '{req.entity_slug}' not found")

        ev_data = {
            "slug": evidence.slug,
            "name": evidence.name,
            "type": evidence.type,
            "description": evidence.description,
            "detailed_description": evidence.detailed_description,
        }
        new_url = await case_generator.regenerate_evidence_image(case_slug, ev_data)
        evidence.image = new_url
        await db.commit()
        return {"status": "ok", "new_image_url": new_url}

    else:
        raise HTTPException(400, f"Unknown entity_type: {req.entity_type}")
