import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    slug = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50))
    age = Column(Integer)
    occupation = Column(String(255))
    avatar = Column(String(500))
    interrogation_image = Column(String(500), default="")
    personality = Column(Text)
    backstory = Column(Text)
    secrets = Column(JSONB, default=list)
    alibi = Column(Text)
    is_guilty = Column(Boolean, default=False)
    is_available_initially = Column(Boolean, default=False)
    unlock_conditions = Column(JSONB, nullable=True)
    emotional_reactions = Column(JSONB, default=dict)
    ai_system_prompt = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)
