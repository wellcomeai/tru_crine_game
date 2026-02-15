import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(String(20), default="medium")
    estimated_time_min = Column(Integer, default=60)
    cover_image = Column(String(500))
    is_published = Column(Boolean, default=True)
    solution = Column(JSONB, nullable=False)
    phases = Column(JSONB, default=list)
    price = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
