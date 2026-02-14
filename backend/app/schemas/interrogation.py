from pydantic import BaseModel
from typing import Optional, List


class MessageRequest(BaseModel):
    content: str


class ShowEvidenceRequest(BaseModel):
    evidence_slug: str


class ChatMessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str
    evidence_shown: Optional[str] = None


class InterrogationHistoryResponse(BaseModel):
    character_slug: str
    messages: List[ChatMessageSchema] = []
    message_count: int = 0
