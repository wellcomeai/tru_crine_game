from pydantic import BaseModel
from typing import Optional, List, Any


class PointOfInterestSchema(BaseModel):
    id: str
    x_percent: float
    y_percent: float
    width_percent: float = 10
    height_percent: float = 10
    label: str
    description: str = ""
    is_examined: bool = False
    has_evidence: bool = False


class LocationSchema(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_visited: bool = False
    is_locked: bool = False
    lock_reason: Optional[str] = None
    points_of_interest: List[PointOfInterestSchema] = []


class CharacterSchema(BaseModel):
    id: str
    slug: str
    name: str
    role: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    avatar: Optional[str] = None
    is_interrogated: bool = False
    is_locked: bool = False
    current_emotion: str = "calm"


class PlayerConnectionSchema(BaseModel):
    a: str
    b: str
    note: str = ""
    is_confirmed: bool = False
    confirmation_text: Optional[str] = None


class HypothesisSchema(BaseModel):
    text: str
    created_at: str


class PlayerStateSchema(BaseModel):
    visited_locations: List[str] = []
    collected_evidence: List[str] = []
    unlocked_characters: List[str] = []
    examined_pois: List[str] = []
    player_connections: List[PlayerConnectionSchema] = []
    player_notes: str = ""
    player_hypotheses: List[HypothesisSchema] = []


class GameStateResponse(BaseModel):
    session_id: str
    case: Any
    state: PlayerStateSchema
    current_phase: str


class VisitRequest(BaseModel):
    location_slug: str


class ExamineRequest(BaseModel):
    location_slug: str
    poi_id: str


class ConnectRequest(BaseModel):
    evidence_a_slug: str
    evidence_b_slug: str
    note: Optional[str] = ""


class DisconnectRequest(BaseModel):
    evidence_a_slug: str
    evidence_b_slug: str


class NotesRequest(BaseModel):
    text: str


class HypothesisRequest(BaseModel):
    text: str


class UnlockResult(BaseModel):
    new_locations: List[dict] = []
    new_characters: List[dict] = []
    new_evidence: List[dict] = []
    new_phases: List[dict] = []
    notifications: List[str] = []
