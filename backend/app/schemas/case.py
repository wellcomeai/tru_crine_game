from pydantic import BaseModel
from typing import Optional, List


class PhaseSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    sort_order: int = 0
    is_completed: bool = False
    is_current: bool = False
    is_locked: bool = False


class UserSessionInfo(BaseModel):
    session_id: str
    status: str
    score: Optional[int] = None


class CaseListItem(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    difficulty: str
    estimated_time_min: int
    cover_image: Optional[str] = None
    is_published: bool
    user_session: Optional[UserSessionInfo] = None
    price: float = 0
    is_free: bool = True
    is_purchased: bool = False

    class Config:
        from_attributes = True


class CaseCharacterPreview(BaseModel):
    name: str
    slug: str
    occupation: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    age: Optional[int] = None


class CaseDetail(CaseListItem):
    phases: List[PhaseSchema] = []
    characters: List[CaseCharacterPreview] = []


class StartCaseResponse(BaseModel):
    session_id: str
    is_new: bool
