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
from app.models import User, Case
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
