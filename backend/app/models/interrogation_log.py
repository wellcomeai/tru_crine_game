import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class InterrogationLog(Base):
    __tablename__ = "interrogation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False)
    character_slug = Column(String(100), nullable=False)
    messages = Column(JSONB, default=list)
    revealed_info = Column(JSONB, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    message_count = Column(Integer, default=0)
