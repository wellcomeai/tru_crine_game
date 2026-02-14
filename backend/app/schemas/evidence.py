from pydantic import BaseModel
from typing import Optional, List


class EvidenceSchema(BaseModel):
    id: str
    slug: str
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    detailed_description: Optional[str] = None
    image: Optional[str] = None
    importance: int = 1
    tags: List[str] = []
    is_key_evidence: bool = False

    class Config:
        from_attributes = True


class AccusationRequest(BaseModel):
    accused_slug: str
    motive: str
    method: str
    supporting_evidence: List[str] = []


class AccusationBreakdown(BaseModel):
    suspect: dict
    motive: dict
    method: dict
    evidence: dict
    bonus: dict


class AccusationResult(BaseModel):
    is_correct: bool
    total_score: int
    max_score: int = 1050
    breakdown: AccusationBreakdown
    story_summary: str
