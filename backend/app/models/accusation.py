import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Accusation(Base):
    __tablename__ = "accusations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False)
    accused_slug = Column(String(100), nullable=False)
    motive = Column(Text)
    method = Column(Text)
    supporting_evidence = Column(JSONB, default=list)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
