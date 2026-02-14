from pydantic import BaseModel
from typing import Optional, List


class PhaseSchema(BaseModel):
    id: str
    name: str
    description: str
    is_completed: bool = False
    is_current: bool = False


class CaseListItem(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    difficulty: str
    estimated_time_min: int
    cover_image: Optional[str] = None
    is_published: bool

    class Config:
        from_attributes = True


class CaseDetail(CaseListItem):
    phases: List[PhaseSchema] = []


class StartCaseResponse(BaseModel):
    session_id: str
    is_new: bool
