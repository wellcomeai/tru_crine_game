import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class ActionHistory(Base):
    __tablename__ = "action_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    action_data = Column(JSONB, nullable=False)
    state_before = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
