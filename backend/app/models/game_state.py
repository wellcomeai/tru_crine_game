import uuid
from datetime import datetime
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class GameState(Base):
    __tablename__ = "game_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False, unique=True)
    visited_locations = Column(JSONB, default=list)
    collected_evidence = Column(JSONB, default=list)
    unlocked_characters = Column(JSONB, default=list)
    examined_pois = Column(JSONB, default=list)
    player_connections = Column(JSONB, default=list)
    player_notes = Column(Text, default="")
    player_hypotheses = Column(JSONB, default=list)
    unlocked_phases = Column(JSONB, default=list)
    hints_used = Column(JSONB, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
