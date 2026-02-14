import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    slug = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    description = Column(Text)
    detailed_description = Column(Text)
    image = Column(String(500))
    location_slug = Column(String(100))
    found_at_poi = Column(String(100))
    found_conditions = Column(JSONB, nullable=True)
    importance = Column(Integer, default=1)
    tags = Column(JSONB, default=list)
    is_key_evidence = Column(Boolean, default=False)
